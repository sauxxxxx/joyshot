# JoyShot experience rework

## Audit

The live product and source were inspected before implementation: landing, solo,
gallery, event setup, room entry and shared room; camera permissions and stream
lifetime; timed capture; canvas layouts and rendering; crop/filter controls;
IndexedDB storage; WebRTC and realtime session coordination; download/share;
responsive styles and PWA prompts.

The old solo journey opened a large setup page with ten frame choices, timer and
layout controls before the capture action. At 390px wide it required scrolling
through approximately 2,974px of page content. Results exposed overlapping edit
and export interfaces. There was no deliberate result reveal or cancellation
path, and a refresh lost the current session. Retakes used the original photo
array even after the editor reordered the displayed photos. CSS crop previews
did not use the same geometry as the exported image. Gallery operations lacked
reliable failure feedback and deletion safeguards. Event customization placed the
frame catalog before the preview. Installation prompts could interrupt capture.

## Journey

Start -> automatic camera permission request -> live view -> one shutter press
-> four timed photos with flash, progress and previews -> print reveal -> result
-> Save photo / Share / Take another.

Optional frame, camera and timer controls remain available before capture.
Customization on the result opens one focused tool at a time: frame/layout,
photo edits, caption, or additional formats. A retake returns to the viewfinder
for exactly one selected slot and preserves the other ordered edits.

Together preserves the existing two-person server-coordinated capture protocol.
Ready/start controls follow the paired cameras; room administration and settings
are disclosed only when requested. Both modes use the same result experience.
Event setup keeps the last decoded preview visible while new details render.

## Small design system

- Cream paper, oxblood controls, restrained metal framing and real photographs.
- Georgia display type, italic emphasis, compact readable utility type.
- Physical round shutter for capture; stamp-style save; quiet secondary actions.
- Camera and result occupy the primary surface, not settings cards.
- Motion only marks entry, countdown, capture and print reveal. Global reduced
  motion rules apply to all new animations.
- Mobile keeps the shutter and result save action in the first viewport, with
  one-column tools and a smaller sticky print while editing.

## Reliability and boundaries

Camera requests stop late streams after navigation, avoid duplicate automatic
requests during development effect replay, and report denied, missing, busy and
disconnected cameras. Capture can be cancelled with a button or Escape and
stops when the document becomes hidden. The camera stops on the result screen.

Solo stores a refresh draft in this tab's sessionStorage when available; quota
failure explicitly asks the user to download. Event guest drafts are excluded.
Save photo downloads PNG and stores one IndexedDB copy per current result in
the mounted result experience. Gallery deletion requires confirmation; the
photo viewer uses a native dialog. Browser data is local, not account storage
or a cloud backup. Together retains its existing temporary relay and WebRTC
architecture; this rework does not add backend persistence.

The editor and rendered exports share crop geometry. Rendering keeps the old
print until a newly decoded image is ready, cancels stale updates, and disables
saving a stale result while an edit is rendering.

## Verification

- TypeScript checks, unit tests and production build.
- Chrome with simulated camera media: start, permission states, cancellation,
  repeated capture, result, edits, draft restore, retake, PNG download, gallery,
  and restart.
- Desktop and mobile viewport checks, plus event preview continuity.
- Two isolated browser contexts exercise room creation/join and paired capture.

Simulated camera tests do not replace real-device checks in iOS Safari, Android,
or remote networks requiring TURN. Native OS share sheets and physical webcam
drivers require manual device testing. No claim of universal browser coverage
or a measured 10/10 user-satisfaction score is made.
