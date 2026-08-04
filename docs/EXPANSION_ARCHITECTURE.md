# JoyShot Expansion Architecture

## Product boundaries

JoyShot remains a modular monolith with three packages:

- `apps/web`: camera access, editing, local gallery, animation export, event setup, PWA, and UI.
- `apps/realtime`: short-lived room coordination, capture validation, signaling, rate limits, and metrics.
- `packages/shared`: versioned validation schemas and Socket.IO contracts.

Captured pixels remain browser-local in solo mode. In a shared room, compressed captures are held only in active server memory long enough to distribute the pair. The local gallery uses IndexedDB and is opt-in.

## Added web modules

| Module | Responsibility |
| --- | --- |
| `features/camera` | Device enumeration, switching, mirroring, media lifecycle |
| `features/editor` | Non-destructive per-frame edits, order, retake entry point |
| `features/media` | GIF, WebM, square, and Story exports |
| `features/gallery` | Device-local IndexedDB storage and retention cleanup |
| `features/event` | Event name, caption, brand color, logo, kiosk setup |
| `features/sharing` | Native sharing, clipboard fallback, invite QR codes |
| `components/pwa` | Service-worker registration and install experience |

The strip renderer accepts editing and branding options but does not own UI state. That keeps Canvas rendering usable by solo, room, and event flows.

## Realtime additions

- Participant display names and reactions
- Host-controlled room locking and guest removal
- Per-socket rate limiting on high-risk events
- Security response headers
- JSON structured logs
- Prometheus-compatible `/metrics`
- Optional Socket.IO Redis pub/sub through `REDIS_URL`

Redis pub/sub distributes Socket.IO broadcasts. Active room/session state still lives in one process, so production must use one realtime instance or sticky owner routing. True horizontally writable rooms require a Redis room repository with atomic transitions and are intentionally not simulated by the current adapter.

## Optional account and cloud gallery boundary

Accounts and cloud persistence require user-selected identity and storage providers. They should be introduced behind a separate versioned HTTP API without changing local-first behavior.

Suggested entities:

```text
users(id, provider_subject, display_name, created_at, deleted_at)
events(id, owner_user_id, slug, name, brand_json, retention_hours, created_at)
albums(id, owner_user_id, event_id, visibility, expires_at, created_at)
assets(id, album_id, object_key, mime_type, byte_size, checksum, created_at)
album_members(album_id, user_id, role)
```

Required API outline:

```text
POST   /v1/albums                 Create an opt-in cloud album
POST   /v1/albums/:id/uploads     Obtain a short-lived signed upload URL
GET    /v1/albums/:id/assets      List authorized assets
DELETE /v1/assets/:id             Delete one asset and its object
DELETE /v1/account                Queue a complete user-data deletion
GET    /v1/account/export         Request a portable export
```

Uploads must be explicit, encrypted in transit, protected by object-store signed URLs, and governed by an expiry worker. The browser-local gallery remains the default when this API is absent.

## Group rooms

The current media and synchronized-capture protocol is deliberately two-person. Supporting three or four people is a separate topology change, not a capacity constant:

- Use an SFU rather than full-mesh WebRTC on mobile.
- Version capture pairs into capture groups.
- Define deterministic participant ordering.
- Add late-join, partial-group timeout, and host-transfer rules.
- Load-test image fan-out and server memory before release.

Until an SFU and group capture contract are configured, the server continues to reject a third participant. This avoids presenting a room size the media path cannot safely support.

## Operations

- Configure a TURN relay for restrictive networks.
- Scrape `/metrics`; alert on connection spikes and room/session failures.
- Keep captured bytes out of logs and traces.
- Use one realtime instance unless shared room ownership is implemented.
- Run `npm run verify` before deployment.
- Smoke-test separate mobile networks and Safari camera switching.

## Main risks

| Risk | Mitigation |
| --- | --- |
| GIF encoding uses significant mobile memory | Export at 480×360 and disable controls while encoding |
| IndexedDB can be cleared by the browser | Describe the gallery as local, offer downloads |
| Service-worker stale assets | Version the cache name and use network-first fetches |
| Event logo payload becomes large | Limit uploads to 600 KB |
| Reaction spam or join guessing | Socket-level fixed-window limits |
| Multi-instance room inconsistency | Single owner process until a distributed repository exists |
