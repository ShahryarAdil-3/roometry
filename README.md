# Roometry

A desktop web app for planning interiors: sketch a floor plan in 2D, then walk
or orbit through the same room in 3D at real-world scale. Rooms, doors, wall and
floor materials and furniture live in one scene state, so edits in the planner
show up immediately in the 3D view.

Roometry targets desktop screens (1024 px and wider). Small windows show a
"needs a wider window" notice instead of a broken layout, and there are no
touch or mobile controls.

## Stack

- **React 19 + Vite 8** (rolldown build) with `react-router-dom` 7
- **three.js / React Three Fiber / drei / postprocessing** for the 3D view
- **Zustand 5** with `persist` for the scene (localStorage, key `roometry-scene-v3`)
- **Firebase** Auth (email/password) and Firestore (`rooms` collection) for signed-in projects
- **framer-motion** for page transitions, **Tailwind CSS 4** plus hand-written CSS for layout

## Getting started

Requires Node.js 20+ (developed on Node 24).

```bash
npm install
npm run dev      # dev server on http://localhost:5173
npm run build    # production build in dist/
npm run preview  # serve the production build locally
npm run lint     # ESLint (JS/JSX/TS/TSX)
npm run typecheck # TypeScript checks without emitting files
npm test         # Playwright desktop regression tests
```

For the browser tests, install Chromium once with `npx playwright install chromium`.
Playwright starts Vite automatically and checks the auth redirect, desktop-width
notice, guest create/save/reload flow, v6-to-v7 scene migration, and live 2D/3D
canvases at a 1440 px viewport.

### Firebase configuration

The app reads its Firebase web config from Vite env vars:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

Copy `.env.example` to `.env.local` and fill in the values. Without an
`.env.local`, `src/firebase/firebase.js` falls back to committed values for the
project's development Firebase instance so the app still runs locally; those
fallbacks should be removed once every environment has its own `.env.local`.
Firebase web config values are public identifiers, not secrets — they are safe
to ship, but access is controlled by security rules.

### Firestore rules

`firestore.rules` (registered in `firebase.json`) allows each signed-in user to
read, create, update and delete only `rooms` documents whose `uid` matches their
own uid, and denies everything else. Deploy them with:

```bash
firebase deploy --only firestore:rules
```

Check the currently deployed rules first — older `rooms` documents without a
`uid` field will no longer be readable by clients once these rules are live.

## Using the app

- **Guest mode** — from the login or register screen, "Continue as guest" opens
  the dashboard backed by localStorage (`roometry_guest_rooms`). Projects are
  kept in this browser only.
- **Signed-in mode** — projects are stored in Firestore under the user's uid and
  follow the user across browsers.
- **Import Floor Plan** — choose **Import Floor Plan** on the dashboard and
  upload a PNG, JPEG, WebP or BMP. Enter the image scale, adjust wall contrast,
  review the detected rooms and create an editable 2D project. The importer runs
  locally in the browser; images are not uploaded to Firebase.
- **Editor** — `/app` or `/app/:projectId`. The left panel holds layer and scene
  controls, the canvas toggles between the 2D planner and the 3D view, and the
  right panel edits the selected room. Saves write the whole floor plan plus the
  3D snapshot; loading prefers the snapshot and falls back to the legacy
  top-level `floorPlan` field.

## Project layout

```
src/
  App.jsx                 routes, auth guard for /app, lazy-loaded editor
  pages/                  Landing, Auth (Login/Register), Dashboard, Editor
  components/canvas/      Canvas2D (DOM/SVG planner), Canvas3D (R3F scene),
                          CanvasErrorBoundary, WebGL context recovery
  components/layout/      editor shell: header, sidebar panels, toolbar
  store/useSceneStore.ts  the single scene store (rooms, walls, furniture,
                          materials, UI mode) with persist + hydration merge
  scenes/Room.tsx         the 3D room, walls, doors and furniture renderer
  firebase/               Firebase init and Firestore project helpers
  utils/                  floor-plan image analysis, texture URL validation, helpers
```

## Notable behaviour

- **Floor plan is the source of truth.** `floorPlan.rooms[]` is the only stored
  room geometry. The 3D view reads the selected room through the
  `useActiveRoom` selector, so there is no mirrored room copy that can drift
  out of sync. Persisted state from older versions is migrated to version 7 and
  the obsolete `room` field is discarded on load.
- **Canvas code splitting.** The editor route and both canvases are
  `React.lazy` imports. Only the 3D scene chunk contains three.js, and it is
  fetched the first time the 3D view opens.
- **Crash containment.** Render errors from the canvases show a recovery panel,
  and a lost WebGL context offers a retry that rebuilds the renderer.

## Known limitations

- Signed-in cloud saves have not been exercised against a dedicated test account
  in this environment; guest save/load is verified.
- The 3D scene renders the selected room only, not the whole multi-room plan.
- Image import targets straight-down, high-contrast plans with dark walls and a
  light margin. Rooms become editable rectangular bounds, so irregular shapes
  are approximated; labels are renamed manually. Large open-plan openings may
  remain connected, while skewed photos, furniture-heavy scans and faint walls
  need contrast adjustment or manual correction.
- Windows narrower than 1024 px show a notice rather than a compact layout.
- `npm run build` transpiles TypeScript but does not type-check it; run
  `npm run typecheck` separately.

See `CHANGELOG.md` for the fix history and verification notes.
