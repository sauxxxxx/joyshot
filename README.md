# JoyShot

A privacy-first online photobooth built with Next.js, Socket.IO, browser camera APIs, WebRTC, and HTML Canvas.

## Current Milestone

- Soft Pop Studio design system
- Responsive landing page
- Complete solo camera flow
- Four-shot countdown and local capture
- Classic, Pink Pop, and Midnight photo strips
- Browser-only PNG generation and download
- Shared typed event contracts
- Private two-person rooms with reconnect tokens
- Host and guest roles, camera status, and ready gates
- Dual live previews with WebRTC signaling
- Server-timed four-shot sessions and binary photo exchange
- Combined two-person strip generation and download
- Realtime server health endpoint

Production deployments should configure a TURN relay in addition to STUN so live peer video works on restrictive networks.

## Local Development

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Camera access works on localhost during development and requires HTTPS in production.

### Camera testing on another device

Browsers block camera access on plain HTTP LAN addresses. Generate a trusted development certificate once, then start both services over HTTPS:

```powershell
npm run setup:https
npm run dev:https
```

Open the `https://<LAN-IP>:3000` address printed by the setup command. To use a second computer, copy only `certificates/lan-rootCA.pem` to that computer and import it into the current user's **Trusted Root Certification Authorities** store before opening the site. Never share `lan-key.pem`.

If the computer's LAN IP changes, rerun `npm run setup:https` so the new address is included in the certificate.

Individual processes:

```bash
npm run dev:web
npm run dev:realtime
```

The realtime health endpoint is `http://localhost:3001/health`.

## Environment variables

Copy `.env.example` to `.env.local` for local overrides. Do not commit real deployment values.

| Variable | Service | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_REALTIME_URL` | Web | Public HTTPS URL of the Socket.IO service |
| `NEXT_PUBLIC_STUN_URL` | Web | STUN server used for WebRTC negotiation |
| `PORT` | Realtime | Listening port supplied by the hosting provider |
| `WEB_ORIGIN` | Realtime | Exact public origin of the deployed web application |
| `ROOM_TTL_MINUTES` | Realtime | Inactive room lifetime |
| `RECONNECT_GRACE_SECONDS` | Realtime | Time allowed for a participant to reconnect |
| `MAX_IMAGE_BYTES` | Realtime | Maximum submitted image payload size |

For production, use HTTPS URLs: `NEXT_PUBLIC_REALTIME_URL=https://realtime.example.com` and `WEB_ORIGIN=https://example.com`.

## Deployment shape

The repository is an npm workspace monorepo:

- `apps/web` — Next.js frontend, intended for Vercel.
- `apps/realtime` — persistent Node.js and Socket.IO service, intended for a Node-compatible host.
- `packages/shared` — contracts used by both applications and built before verification.

The realtime MVP keeps room state in memory, so deploy it as one persistent instance. Horizontal scaling requires shared room storage and Socket.IO pub/sub, such as Redis.

## Verification

```bash
npm run verify
```

GitHub Actions runs the same verification on every push and pull request.

See [the implementation plan](docs/IMPLEMENTATION_PLAN.md) and [the UI/UX plan](docs/UI_UX_PLAN.md) for the complete roadmap and acceptance criteria.
