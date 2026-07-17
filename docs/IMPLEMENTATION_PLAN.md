# Online Photobooth Implementation Plan

## 1. Product Goal

Build a browser-based photobooth with two modes:

- **Solo mode:** One person uses one device to capture photos and generate a strip.
- **Two-person mode:** Two people on different devices join a private room, view each other's cameras, take synchronized photos, and download the same combined strip.

The MVP requires no accounts, database, permanent image storage, or paid API.

## 2. MVP Scope

### Included
- Landing page with Solo and Two Person options
- Browser camera permission and preview
- Private two-person rooms with six-character codes
- Shareable room link
- Host and guest roles
- Maximum of two participants per room
- Connection, camera, and ready indicators
- Local and remote live camera previews
- Host-controlled synchronized session
- Four capture rounds with a three-second countdown
- Captured-photo exchange
- Combined photo-strip generation
- Theme or frame selection
- PNG preview and download
- Session reset, reconnect handling, and room cleanup

### Deferred
- User accounts and saved galleries
- Permanent cloud storage
- More than two participants
- GIF and video generation
- Advanced filters and editing
- Social sharing and payments
- Native mobile applications

## 3. Recommended Architecture

Use a modular monolith with two runtime processes and a shared TypeScript package.

```text
Browser A ---- Socket.IO ---- Node.js realtime server ---- Socket.IO ---- Browser B
    |                              |
    |                              +-- Room and session coordination
    |                              +-- WebRTC signaling
    |                              +-- Temporary capture exchange
    |
    +---------------- WebRTC peer-to-peer live video ------------------+
```

### Next.js Client
Responsible for:

- Pages and UI
- Camera access
- Local and remote video previews
- WebRTC peer connection
- Countdown rendering
- Local frame capture
- Canvas-based strip generation
- Image download

### Node.js and Socket.IO Server
Responsible for:

- Room creation, joining, and expiration
- Participant membership and roles
- Ready-state tracking
- WebRTC signaling
- Authoritative session state
- Capture scheduling and validation
- Temporary image exchange
- Reconnection and cleanup

### WebRTC
WebRTC carries live video directly between the two browsers. Socket.IO only forwards offers, answers, and ICE candidates. If remote video fails, synchronized local capture can still work through Socket.IO.

### HTML Canvas
Canvas captures local frames, applies consistent crop and mirroring rules, lays out photo pairs, adds decorative elements, and exports the final PNG.

## 4. Technology Stack

- Next.js App Router with TypeScript
- React hooks and Context where appropriate
- Node.js with Express or a minimal HTTP server
- Socket.IO and `socket.io-client`
- Browser MediaDevices and WebRTC APIs
- HTML Canvas API
- Zod for runtime payload validation
- Pino for structured server logging
- Vitest and React Testing Library
- Playwright for end-to-end tests

Run Next.js and Socket.IO separately because ordinary serverless request handlers are not suitable for persistent Socket.IO connections.

```text
Development web:       http://localhost:3000
Development realtime:  http://localhost:3001
```

## 5. Main User Flows

### Solo

```text
Open app -> Choose Solo -> Allow camera -> Choose design
-> Start -> Four countdown/capture rounds -> Generate strip
-> Preview -> Download or retake
```

### Two-Person Host

```text
Choose Two Person -> Create room -> Share code/link -> Allow camera
-> Wait for guest -> Mark ready -> Start when both are ready
-> Four synchronized captures -> Generate strip -> Download
```

### Two-Person Guest

```text
Enter code/open link -> Join -> Allow camera -> Connect peer video
-> Mark ready -> Participate in captures -> Generate strip -> Download
```

## 6. Room and Session Rules

- A room contains at most two active participants.
- The creator is the host; the second participant is the guest.
- Only the host can start or reset a session.
- Both participants must be connected, camera-ready, and marked ready.
- A session contains four capture rounds.
- The server sends absolute capture timestamps.
- Each round completes after both validated captures arrive.
- Duplicate, stale, oversized, or incorrectly indexed captures are rejected.
- A timeout prevents a stalled participant from blocking the room forever.
- Room state and captures are deleted after expiration.

### Session States

```text
waiting -> ready -> countdown -> capturing -> exchanging -> complete
```

Recovery states include `participant-disconnected`, `cancelled`, and `expired`.

## 7. Synchronization Strategy

The server is authoritative. It sends a schedule instead of separate `3`, `2`, `1` messages.

```ts
interface CaptureSchedule {
  sessionId: string;
  shotIndex: number;
  countdownStartsAt: number;
  captureAt: number;
}
```

Each client estimates its offset from server time using several ping round trips. It renders the countdown and captures against adjusted server time:

```ts
const adjustedNow = Date.now() + serverOffset;
const remainingMs = captureAt - adjustedNow;
```

This provides close visual synchronization without requiring hardware-level clock precision.

## 8. Data Model

The MVP stores room state in memory.

```ts
interface Participant {
  id: string;
  socketId: string;
  role: "host" | "guest";
  connected: boolean;
  cameraReady: boolean;
  ready: boolean;
  joinedAt: number;
  disconnectedAt?: number;
}

interface Capture {
  participantId: string;
  shotIndex: number;
  mimeType: "image/jpeg";
  byteSize: number;
  image: ArrayBuffer;
  receivedAt: number;
}

interface Session {
  id: string;
  status: "ready" | "countdown" | "capturing" | "exchanging" | "complete";
  shotCount: number;
  currentShotIndex: number;
  countdownSeconds: number;
  captureAt?: number;
  startedAt?: number;
  completedAt?: number;
}

interface Room {
  code: string;
  hostParticipantId: string;
  participants: Map<string, Participant>;
  session?: Session;
  createdAt: number;
  expiresAt: number;
}
```

Suggested retention:

- Waiting room: 30 minutes
- Disconnection grace period: 30-60 seconds
- Completed room: 10 minutes
- Empty room: delete immediately or after one minute

## 9. Socket.IO Contract

All contracts belong in a shared TypeScript package and all incoming payloads require runtime validation.

### Room Events

| Event | Direction | Purpose |
|---|---|---|
| `room:create` | Client to server | Create a room |
| `room:created` | Server to client | Return code and host identity |
| `room:join` | Client to server | Join by code |
| `room:joined` | Server to client | Confirm membership |
| `room:state` | Server to room | Broadcast authoritative state |
| `room:leave` | Client to server | Leave room |
| `room:error` | Server to client | Return a typed error |
| `participant:ready` | Client to server | Change ready state |
| `participant:joined` | Server to room | Announce a participant |
| `participant:left` | Server to room | Announce a disconnection |

### WebRTC Events

| Event | Purpose |
|---|---|
| `webrtc:offer` | Forward an SDP offer |
| `webrtc:answer` | Forward an SDP answer |
| `webrtc:ice-candidate` | Forward an ICE candidate |
| `webrtc:restart` | Request connection recovery |

### Capture Events

| Event | Purpose |
|---|---|
| `session:start` | Host requests session start |
| `session:started` | Server announces the session |
| `capture:scheduled` | Server sends an absolute capture time |
| `capture:submit` | Client submits its local photo |
| `capture:received` | Server acknowledges the submission |
| `capture:pair-ready` | Server distributes an ordered pair |
| `session:complete` | Server announces completion |
| `session:cancelled` | Server cancels a failed session |
| `session:reset` | Host prepares another session |

Use typed acknowledgements:

```ts
type EventResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };
```

## 10. WebRTC Plan

1. Both participants obtain local media streams.
2. The host creates an `RTCPeerConnection` and adds local tracks.
3. The host sends an offer through Socket.IO.
4. The guest applies the offer, adds tracks, and sends an answer.
5. Both clients exchange ICE candidates.
6. Each client displays the received remote stream.
7. Failed connections offer retry and ICE restart actions.

A STUN server may work during development, but production should provide TURN because some networks cannot establish direct peer connections. Coturn can be self-hosted.

## 11. Image Capture and Strip Generation

- Capture at approximately 720p.
- Convert frames to JPEG at `0.75-0.85` quality.
- Limit each capture to approximately 1 MB.
- Keep four captures per participant.
- Send binary blobs instead of base64 strings.
- Use fixed layout and crop rules so both clients render the same strip.
- Export the final result as PNG.

Suggested two-person layout:

```text
+-------------------------------+
|       Online Photobooth       |
+---------------+---------------+
|    User A     |    User B     |
+---------------+---------------+
|    User A     |    User B     |
+---------------+---------------+
|    User A     |    User B     |
+---------------+---------------+
|    User A     |    User B     |
+-------------------------------+
|          Date / Logo          |
+-------------------------------+
```

## 12. Repository Structure

```text
online-photobooth/
|-- apps/
|   |-- web/
|   |   |-- app/
|   |   |   |-- page.tsx
|   |   |   |-- solo/page.tsx
|   |   |   |-- join/page.tsx
|   |   |   `-- room/[roomCode]/page.tsx
|   |   |-- components/
|   |   |   |-- camera/
|   |   |   |-- room/
|   |   |   |-- session/
|   |   |   `-- strip/
|   |   |-- features/
|   |   |   |-- camera/
|   |   |   |-- room/
|   |   |   |-- session/
|   |   |   |-- strip/
|   |   |   `-- webrtc/
|   |   |-- lib/
|   |   `-- public/frames/
|   `-- realtime/
|       `-- src/
|           |-- index.ts
|           |-- config/
|           |-- room/
|           |-- session/
|           |-- signaling/
|           `-- middleware/
|-- packages/
|   `-- shared/src/
|       |-- events.ts
|       |-- room.ts
|       |-- session.ts
|       |-- validation.ts
|       `-- errors.ts
|-- tests/e2e/
|-- package.json
|-- tsconfig.json
`-- README.md
```

Each file must have one responsibility and remain below the repository's 600-line hard limit.

## 13. Security and Privacy

- Require HTTPS and secure WebSockets in production.
- Use cryptographically secure, collision-checked room codes.
- Use an alphabet without ambiguous characters such as `0`, `O`, `1`, and `I`.
- Normalize codes to uppercase.
- Validate every event payload and state transition.
- Enforce room capacity, payload size, MIME type, and shot index.
- Rate-limit socket events and room-join attempts.
- Restrict CORS to the frontend origin.
- Never log captured-image contents or TURN credentials.
- Do not store images permanently.
- Remove room data automatically.
- Tell users that captured photos are shared with their room peer.

## 14. Error and Recovery States

The UI must handle:

- Camera permission denied
- No camera found or camera already in use
- Unsupported browser APIs
- Room not found, full, or expired
- Socket connection loss
- Peer video failure
- Participant disconnect during a session
- Capture upload failure or timeout
- Invalid or oversized images
- Mobile browser suspension during countdown

Every error should offer a relevant action such as retry, reconnect, re-enable the camera, return home, or create a new room.

## 15. Responsive and Accessibility Requirements

- Mobile-first responsive design
- Stacked video previews on narrow screens
- Two-column previews on larger screens
- Keyboard-accessible controls
- Visible focus states
- ARIA live announcements for connection and countdown changes
- Countdown cues that do not rely only on color
- Adequate color contrast
- Reduced-motion support
- Screen wake lock during active sessions where supported

## 16. Testing Strategy

### Unit Tests

- Room-code generation and collisions
- Room capacity and expiration
- Host permissions and state transitions
- Server clock-offset calculations
- Capture scheduling and validation
- Canvas crop and layout calculations
- Deterministic image order

### Integration Tests

Use two Socket.IO test clients to cover:

- Create, join, leave, and reconnect
- Third-user rejection
- Ready-state broadcasts
- Host-only start
- Capture scheduling and acknowledgements
- Duplicate and stale capture rejection
- Pair completion and room cleanup

### End-to-End Tests

- Complete solo capture and download
- Host creates and guest joins a room
- Both use mocked camera streams
- Both become ready and complete four rounds
- Both render the same ordered strip
- Invalid, full, and expired rooms
- Mid-session disconnect and recovery

Also manually test Chrome, Edge, Safari, Android Chrome, iPhone Safari, separate networks, and throttled connections.

## 17. Implementation Phases

### Phase 1: Foundation

- Initialize the workspace and packages.
- Configure TypeScript, linting, formatting, and tests.
- Start the Next.js and realtime processes.
- Establish typed Socket.IO contracts and environment validation.
- Add a server health endpoint.

**Done when:** The browser connects to the realtime server locally.

### Phase 2: Solo Mode

- Build camera permission and preview flows.
- Implement countdown and four local captures.
- Create the Canvas strip generator.
- Add preview, download, retake, and reset actions.

**Done when:** One user can complete and download a solo strip.

### Phase 3: Room System

- Implement room creation, joining, leaving, and expiration.
- Assign host and guest roles.
- Enforce two-person capacity.
- Broadcast authoritative participant and ready state.
- Build room entry, sharing, and status UI.

**Done when:** Two browsers enter one room and see accurate status.

### Phase 4: WebRTC Video

- Implement signaling and peer connections.
- Exchange local media tracks and ICE candidates.
- Display local and remote video.
- Add retry and recovery states.

**Done when:** Both participants see both live previews.

### Phase 5: Synchronized Capture

- Add camera-ready and participant-ready gates.
- Implement server-authoritative session transitions.
- Estimate server clock offset.
- Schedule and execute four capture rounds.
- Add countdown, flash, progress, timeout, and disconnect UI.

**Done when:** Both devices capture each round at approximately the same time.

### Phase 6: Exchange and Strip

- Compress and validate frames.
- Exchange binary images.
- Assemble ordered photo pairs.
- Render identical combined strips.
- Add theme selection, download, and new-session actions.

**Done when:** Both users can download the combined strip.

### Phase 7: Hardening

- Add payload and event rate limits.
- Complete cleanup and reconnect behavior.
- Add structured logs and automated tests.
- Verify accessibility and responsive layouts.
- Confirm no file exceeds 600 lines.

**Done when:** The MVP satisfies all acceptance criteria.

### Phase 8: Deployment

- Deploy Next.js over HTTPS.
- Deploy Socket.IO on a persistent Node.js host.
- Configure WebSocket proxying, CORS, and health checks.
- Configure production STUN/TURN.
- Run a two-network production smoke test.

**Done when:** Two remote users complete a session using the production URL.

## 18. Environment Variables

```env
NEXT_PUBLIC_REALTIME_URL=http://localhost:3001

PORT=3001
WEB_ORIGIN=http://localhost:3000
ROOM_TTL_MINUTES=30
COMPLETED_ROOM_TTL_MINUTES=10
MAX_IMAGE_BYTES=1048576
CAPTURE_COUNT=4
CAPTURE_INTERVAL_SECONDS=5

NEXT_PUBLIC_STUN_URL=stun:stun.example.com:3478
NEXT_PUBLIC_TURN_URL=turn:turn.example.com:3478
NEXT_PUBLIC_TURN_USERNAME=
NEXT_PUBLIC_TURN_CREDENTIAL=
```

The countdown is selected in the booth UI (3, 5, or 10 seconds) and synchronized by the realtime room server.

TURN credentials should not be committed. A later version should issue temporary credentials from the server.

## 19. Scaling Path

The MVP uses one realtime instance and in-memory room state. When horizontal scaling becomes necessary:

- Store transient room and session state in Redis.
- Use the Socket.IO Redis adapter.
- Configure sticky sessions where required.
- Move large image exchange to temporary object storage.
- Store only temporary object references in room state.
- Add cleanup workers and operational metrics.

Microservices are unnecessary for the first version.

## 20. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| WebRTC fails on restrictive networks | Configure a TURN relay |
| Device clocks differ | Estimate server offset and use absolute timestamps |
| Mobile browser suspends the page | Warn users and use wake lock where supported |
| Image payloads overload Socket.IO | Resize, compress, cap size, and use binary data |
| Participant disconnects | Grace period, timeout, cancellation, and retry flow |
| Camera permission is denied | Dedicated permission recovery UI |
| Room codes are guessed | Large code space, expiration, and rate limiting |
| Server restart deletes active rooms | Accept for MVP; introduce Redis later |
| Canvas output differs | Share fixed layout configuration and image order |

## 21. MVP Acceptance Criteria

- A user can complete and download a four-photo solo strip.
- A host can create a unique private room.
- A guest can join using the code or link.
- A third participant is rejected.
- Both users see accurate connection, camera, and ready status.
- Both users see local and remote live previews.
- Only the host can start or reset a session.
- Start remains disabled until both users are ready.
- Both devices display the same four countdowns.
- Each device submits exactly one accepted capture per round.
- Captures are associated with the correct room, session, participant, and index.
- Both users receive all eight images in deterministic order.
- Both users render and download the same combined PNG strip.
- Permissions, disconnections, full rooms, and expired rooms have recovery UI.
- Temporary photos and room state are automatically removed.
- Core room, session, Canvas, integration, and end-to-end tests pass.
- No source file exceeds 600 lines.

## 22. Recommended Build Order

```text
Foundation -> Solo -> Rooms -> WebRTC -> Synchronization
-> Image exchange -> Strip generation -> Hardening -> Deployment
```

This order validates the camera and Canvas foundation first, then adds distributed room and synchronization complexity in testable increments.
