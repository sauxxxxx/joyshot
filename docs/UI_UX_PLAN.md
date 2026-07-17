# Online Photobooth UI/UX Plan

## 1. Design Direction

Use a **Soft Pop Studio** theme: a modern digital photo booth that feels warm, playful, tactile, and slightly nostalgic without looking childish.

The visual language should reference:

- Printed photo strips
- Soft cream paper
- Rounded camera screens
- Coral and violet accents
- Tactile, pressable controls
- Subtle film grain and sticker-like details
- Clear, modern typography

The camera feeds and countdown must remain the visual focus. Avoid corporate dashboard styling, excessive glassmorphism, and decorations that compete with faces.

## 2. Color System

| Role | Color | Hex |
|---|---|---|
| Background | Warm cream | `#FFF8F1` |
| Main surface | White | `#FFFFFF` |
| Primary | Coral | `#F05A67` |
| Primary hover | Deep coral | `#D94858` |
| Secondary | Soft violet | `#7C5CFC` |
| Accent | Butter yellow | `#FFD166` |
| Main text | Ink navy | `#182033` |
| Secondary text | Slate | `#667085` |
| Border | Warm gray | `#E8DDD5` |
| Success | Green | `#168C61` |
| Error | Red | `#C9363E` |

Use semantic CSS tokens instead of raw color values inside components. Coral is the primary action color for actions such as **Create Room**, **Start Session**, and **Download Strip**. Violet identifies the partner and secondary actions.

Color must never be the only status indicator. Pair success, warning, and error colors with text and icons.

## 3. Typography

- **Headings:** Fredoka, weights 600-700
- **Body and controls:** Nunito, weights 400-700
- **Countdown:** Fredoka with tabular figures

Fredoka gives the product personality while Nunito keeps instructions and controls readable.

Suggested type scale:

| Token | Desktop | Mobile | Use |
|---|---:|---:|---|
| Display | 56 px | 40 px | Landing hero |
| Heading 1 | 40 px | 32 px | Page title |
| Heading 2 | 30 px | 26 px | Section title |
| Heading 3 | 22 px | 20 px | Card title |
| Body | 16 px | 16 px | Main content |
| Small | 14 px | 14 px | Status and helper text |
| Countdown | 120 px | 88 px | Capture countdown |

Use a body line height of approximately 1.5. Keep instructional text concise and limit long text blocks to a readable measure.

## 4. Layout System

- Use a mobile-first layout.
- Follow a 4 px base with an 8 px spacing rhythm.
- Use 16 px mobile gutters, 24 px tablet gutters, and 32 px desktop gutters.
- Keep general content within a 1200 px maximum-width container.
- Use `min-height: 100dvh` for full-screen flows.
- Respect mobile safe areas around fixed controls.
- Prevent horizontal scrolling at all supported breakpoints.

Primary breakpoints:

```text
Small mobile:  375 px
Tablet:        768 px
Desktop:       1024 px
Wide desktop:  1440 px
```

## 5. Navigation Model

The product is a short task flow, so it does not need a dashboard sidebar or large navigation system.

Use:

- A compact top bar with logo and contextual actions
- Browser-compatible back behavior
- A visible leave action inside rooms
- A sticky bottom action area on mobile when necessary
- Deep links for shared room URLs

Each screen should have one dominant primary action. Secondary and destructive actions must be visually subordinate.

## 6. Landing Page

The landing page immediately explains the two available modes.

```text
+-------------------------------------------------+
| Logo                              How it works  |
|                                                 |
|       Capture moments, even miles apart.        |
|   Take synchronized photos with someone you     |
|              love or shoot solo.                |
|                                                 |
|    +----------------+  +----------------+       |
|    |   Solo Booth   |  | Two-Person     |       |
|    |  One camera    |  | Photobooth     |       |
|    |                |  | Two devices    |       |
|    |   Start Solo   |  | Create Room    |       |
|    +----------------+  +----------------+       |
|                                                 |
|      Camera only activates with permission      |
+-------------------------------------------------+
```

### Content hierarchy

1. Product promise
2. Short explanation
3. Two mode cards
4. Camera privacy reassurance
5. Compact “How it works” section

Use custom illustrations or stylized strip previews instead of generic stock photography.

Primary action: **Create a Room**
Secondary action: **Start Solo**

## 7. Join-Room Page

Keep joining simple and focused.

```text
+-------------------------------------+
|              Join a room            |
|                                     |
|  Enter the code your friend shared  |
|                                     |
|       +---------------------+       |
|       |      K 7 P 4 Q X    |       |
|       +---------------------+       |
|                                     |
|           [ Join Room ]             |
|                                     |
|          Create your own room       |
+-------------------------------------+
```

### Interaction rules

- Automatically normalize the code to uppercase.
- Support pasting a complete code.
- Use one accessible text input visually styled as six cells.
- Keep a persistent visible label; do not rely on a placeholder.
- Validate on blur or submission rather than on every keystroke.
- Show the error and recovery instruction below the field.
- Let shared links deep-link directly to the room flow.

## 8. Camera Setup

Camera setup happens before the user enters the active booth.

```text
+----------------------------------------------+
|               Camera setup                  |
|                                              |
|       +------------------------------+       |
|       |                              |       |
|       |       Your camera preview    |       |
|       |                              |       |
|       +------------------------------+       |
|                                              |
| Camera: [ Front Camera             v ]       |
|                                              |
|       [ Allow Camera / Continue ]            |
+----------------------------------------------+
```

### Requirements

- Explain why camera access is needed before requesting permission.
- Provide a camera selector when multiple devices exist.
- Provide clear retry instructions when access fails.
- Mirror the local preview so it behaves like a mirror.
- Define capture mirroring separately and apply it consistently.
- Show camera readiness using an icon and text.

## 9. Waiting Room

The waiting room confirms the room, cameras, peer connection, and participant readiness before the session starts.

```text
+-------------------------------------------------+
| Room K7P4QX                    Copy link  Leave  |
|                                                 |
|      +----------------+ +----------------+      |
|      |                | |                |      |
|      | Your camera    | | Waiting for... |      |
|      |                | |                |      |
|      +----------------+ +----------------+      |
|        You - Ready        Partner - Offline     |
|                                                 |
|              Share this room code               |
|                    K7P4QX                       |
|                                                 |
|                  [ I'm Ready ]                  |
+-------------------------------------------------+
```

When the guest joins, the placeholder transitions into the remote WebRTC preview.

### Participant states

- Connected
- Camera ready
- Ready
- Disconnected
- Reconnecting

Each state uses an icon, text, and color. Readiness changes should be announced through an ARIA live region.

## 10. Active Two-Person Booth

This screen removes unnecessary controls and maximizes both camera previews.

```text
+--------------------------------------------------+
| K7P4QX                         Photo 2 of 4       |
|                                                  |
|  +--------------------+ +--------------------+  |
|  |                    | |                    |  |
|  |     Your live      | |   Partner's live   |  |
|  |       camera       | |       camera       |  |
|  |                    | |                    |  |
|  +--------------------+ +--------------------+  |
|       You - Ready            Alex - Ready        |
|                                                  |
|                     3                            |
|                                                  |
|                [ Start Session ]                 |
+--------------------------------------------------+
```

### Before starting

- Show both camera previews.
- Show connection, camera, and ready status.
- Show the selected strip theme.
- Enable Start only for the host and only when both users are ready.
- Show guests “Waiting for host to start.”
- Explain disabled Start states rather than leaving users guessing.

### During countdown

- Lock setup controls.
- Reduce the visual prominence of surrounding UI.
- Display a large countdown near the center of the video grid.
- Add a circular progress ring.
- Show a short prompt such as “Look at the camera!”
- Flash both preview cards at capture time.
- Update `Photo 2 of 4` progress.
- Keep the countdown from covering participants' faces.

## 11. Mobile Booth Layout

Before starting, use vertically stacked previews so connection states remain clear. During capture, use a dominant local preview with partner picture-in-picture to keep the countdown above the fold.

```text
+----------------------------+
| K7P4QX       Photo 2 of 4  |
|                            |
| +------------------------+ |
| |                        | |
| |      Your camera       | |
| |                        | |
| |              +-------+ | |
| |              |Partner| | |
| |              +-------+ | |
| +------------------------+ |
|                            |
|             3              |
|                            |
|       Both users ready     |
+----------------------------+
```

Provide an accessible control to swap the dominant preview. Do not depend on dragging or gestures alone.

## 12. Between-Photo State

After each capture, provide brief confirmation without interrupting the session rhythm.

```text
Photo 2 captured
Next photo in 5 seconds

[Pair 1 complete] [Pair 2 complete] [Pair 3 pending] [Pair 4 pending]
```

Use small paired thumbnails or status tiles at the bottom. Do not open a review screen after each photo. Retakes happen after the full sequence so both participants remain synchronized.

## 13. Processing State

After the last capture, show meaningful progress.

```text
+----------------------------------------+
|          Making your photo strip      |
|                                        |
|       [Animated strip illustration]    |
|                                        |
|    Received your photos          Done  |
|    Receiving partner's photos    Done  |
|    Building the strip            ...   |
+----------------------------------------+
```

If a partner upload is delayed, state exactly what is happening and provide a timeout recovery action. Avoid an indefinite generic spinner.

## 14. Final Strip Screen

The finished strip should dominate the results screen.

```text
+--------------------------------------------------+
|                Your strip is ready!              |
|                                                  |
|       +-----------------------+                  |
|       |    You  |  Partner    |  Theme           |
|       |    You  |  Partner    |  ( ) Classic     |
|       |    You  |  Partner    |  ( ) Pink Pop    |
|       |    You  |  Partner    |  ( ) Midnight    |
|       +-----------------------+                  |
|                                                  |
|           [ Download PNG ]                       |
|          Retake       New Room                   |
+--------------------------------------------------+
```

Both users initially receive the same selected theme and photo order. Theme changes can render locally without resending captures.

Primary action: **Download PNG**
Secondary action: **Take Another**
Tertiary action: **Leave Room**

## 15. Initial Strip Themes

### Classic Booth

- White frame
- Ink or black text
- Simple date stamp
- Very subtle film grain
- Default theme

### Pink Pop

- Warm coral or pink frame
- Small heart, star, or sparkle SVG decorations
- Rounded labels
- Suitable for couples and friends

### Midnight

- Ink-navy frame
- Cream text
- Violet accents
- Cleaner evening or long-distance-date mood

Decorations remain in borders and must never overlap faces.

## 16. Component Styling

### Camera Cards

- Default aspect ratio: `4 / 3`
- Border radius: 20-24 px
- Thin warm-gray border
- Soft, consistent elevation
- Dark fallback background
- Participant name and status attached to the lower edge
- Fixed aspect ratio to prevent layout shift as streams connect

### Buttons

- Minimum height: 48 px
- Minimum touch target: 44 x 44 px
- Rounded rectangle shape
- Press feedback near `scale(0.97)` without changing layout bounds
- Transition duration: 150-200 ms
- One primary action per screen
- Visible 2-4 px keyboard focus ring
- Clear hover, pressed, loading, and disabled states

### Inputs

- Minimum height: 48 px
- Persistent visible label
- Helper or error text below the field
- Focus ring matching the primary color
- No layout shift when validation appears

### Surfaces

Use solid or nearly solid surfaces. Reserve blur for overlays and dialogs where it communicates separation. Avoid decorative blur over camera content.

### Icons

Use one consistent outline icon set such as Lucide. Do not use emojis as structural interface icons. Icon-only buttons require accessible labels.

## 17. Motion and Sound

### Useful motion

- Button compression on press
- Soft participant-card entrance when someone joins
- Countdown number scale and fade
- Brief white camera flash
- Captured thumbnail moving into its slot
- Strip reveal after processing

Keep micro-interactions between 150 and 300 ms. Animate transforms and opacity instead of layout properties. Every animation should communicate a state change.

Respect `prefers-reduced-motion`; replace scale and movement with simple opacity changes where needed.

### Optional sound

- Quiet countdown tick
- Camera shutter
- Visible mute toggle before starting

Do not autoplay sound before user interaction. Store the mute preference for the current session.

## 18. Feedback and Error Presentation

- Place form errors next to the related control.
- Include both the cause and the recovery action.
- Disable repeated submissions while a request is pending.
- Show loading text on buttons for actions longer than 300 ms.
- Use accessible toasts only for non-blocking confirmations.
- Use persistent inline or full-screen states for camera, room, and connection failures.
- Do not remove user controls during a recoverable failure.

Examples:

```text
Camera access is blocked. Allow camera access in your browser settings, then retry.

The room is full. Ask the host to create a new room.

Partner video is unavailable. Photo capture can continue, or you can retry the connection.
```

## 19. Accessibility Requirements

- Meet WCAG AA contrast: 4.5:1 for normal text and 3:1 for large text.
- Support full keyboard navigation in visual order.
- Keep visible focus rings.
- Use semantic buttons, headings, form labels, and status regions.
- Announce countdown and participant changes without excessive repetition.
- Never communicate status by color alone.
- Keep touch targets at least 44 x 44 px.
- Support browser zoom and text scaling.
- Respect reduced-motion preferences.
- Provide text labels for icon-only controls.
- Ensure dialogs trap focus and restore it to their trigger on close.

## 20. UX Acceptance Criteria

- A first-time user can distinguish Solo and Two Person modes immediately.
- A guest can join by code or shared link without instructions from the host.
- Camera permission is requested with clear context and recovery guidance.
- Both live previews and their ownership labels are unambiguous.
- Host, guest, connection, camera, and ready states are always understandable.
- The host understands why Start is enabled or disabled.
- Countdown and capture progress remain visible on mobile and desktop.
- Capture UI does not cover faces or move when streams connect.
- Processing communicates real progress and timeout recovery.
- The final strip is the dominant element on the result screen.
- Download, retake, leave, and new-room actions have clear hierarchy.
- All core flows work at 375, 768, 1024, and 1440 px widths.
- Keyboard, screen-reader, reduced-motion, and contrast checks pass.

## 21. Design Summary

```text
Warm cream background
+ coral primary actions
+ violet partner accents
+ Fredoka headings
+ Nunito body text
+ tactile rounded controls
+ restrained photo-strip nostalgia
```

Soft Pop Studio works for couples, long-distance partners, friends, and solo users without making the application exclusively romantic. More expressive personalization belongs in selectable photo-strip themes rather than the core interface.
