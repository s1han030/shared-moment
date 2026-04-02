# Shared Moment

A photography planning and shooting guidance app prototype.

## Getting Started

```bash
npm install
npm run dev
```

## Project Structure

```
src/
  App.jsx                  # Root component & screen router
  main.jsx                 # Entry point
  index.css                # Global styles & keyframes
  lib/
    constants.js           # Design tokens (colors)
    claude.js              # Claude API: analyseRefImage, checkPoseMatch
  components/
    Ic.jsx                 # Icon component
    StatusBar.jsx          # iOS-style status bar
    FloatingNav.jsx        # Bottom nav bar
    PoseSkeleton.jsx       # Skeleton overlay renderer
  screens/
    PlanHome.jsx           # Plan list + calendar
    CreateEvent.jsx        # Create / edit plan
    EventDetail.jsx        # Plan detail view
    ShootCamera.jsx        # Camera + AI pose guidance
    Library.jsx            # Reference image library
    PlanRefDetail.jsx      # Per-plan reference manager
    AfterReflect.jsx       # Post-shoot reflection
    GuideHome.jsx          # Photography guides
    Profile.jsx            # User profile
```

## Key Features

- **AI pose analysis** — upload a reference image, Claude analyses the pose,
  body angles, and composition. Results guide the live shoot.
- **Real-time matching** — during shooting, live camera frames are compared
  against reference pose criteria every 6 seconds.
- **Visual overlays** — ghost image, subject zone box, key-point markers,
  and composition lines shown on the viewfinder.
- **Calendar scheduling** — drag-and-drop plans onto week/day timeline.
- **Collaborators** — invite members with view/edit/shoot permissions,
  with pending status tracking.

## API Key

The app calls `https://api.anthropic.com/v1/messages` directly from the browser.
Set your key in `src/lib/claude.js` → `callClaude()`, or wire it through
an environment variable via Vite:

```js
// src/lib/claude.js
const API_KEY = import.meta.env.VITE_ANTHROPIC_KEY;
```

Then create `.env.local`:
```
VITE_ANTHROPIC_KEY=sk-ant-...
```
