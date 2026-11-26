# Changelog

## Phase 3 — Regression tests, type safety and tooling (2026-11-25)

### Added: repeatable desktop browser regression tests
- Added Playwright with a 1440 px desktop viewport and software WebGL support. The suite covers unauthenticated editor redirects, the narrow-window guard, guest project creation, editing, save and reload, sidebar state after reload, live 2D/3D canvases, v6-to-v7 migration, and room editing without a mirrored `room` field.
- Added `npm test`, `playwright.config.ts` and `tests/`; browser reports are ignored by git. Install the test browser once with `npx playwright install chromium`.
- **Verified:** all 5 tests pass, including a live non-zero WebGL canvas and a guest save/reload round-trip with no legacy snapshot fields.

### Added: TypeScript and TypeScript-aware lint checks
- Added `typescript` and `typescript-eslint` as development dependencies. `@types/react` and `@types/react-dom` were already present, so no duplicate type packages were needed.
- Added `npm run typecheck`; the existing tsconfig now uses TypeScript 6-compatible relative path aliases and includes the test files. ESLint now covers `.ts` and `.tsx` as well as JavaScript.
- **Root cause:** Vite transpiles TypeScript without checking it, and the old ESLint config ignored TypeScript files entirely. Type errors and unsafe hook patterns could therefore pass both build and lint.
- Files: `package.json`, `package-lock.json`, `tsconfig.json`, `eslint.config.js`

### Fixed: stale sidebar tools after loading or switching modes
- **Root cause:** `activePanel` copied `floorPlan.uiMode` only during the first render. Loading a project later switched the store to draw mode but could leave Visual Tools selected.
- **Fix:** panel selection is tagged with the mode it belongs to. When the mode changes, the matching Planner Tools or Visual Tools panel is selected immediately without a state-update effect.
- Files: `src/components/layout/Sidebar/SceneControls.jsx`

### Fixed: issues exposed by the expanded checks
- Moved the 2D wheel handler ref update out of render and into an effect; removed unused drei imports; typed R3F pointer events and the legacy furniture `color` field; preserved texture memoization with explicit repeat values.
- Converted the unused texture utility's CommonJS `module.exports` block to ES-module exports, matching the rest of the app.
- Replaced Vite config `__dirname` usage with `import.meta.dirname` for compatibility with Vite's native config loader.
- Files: `src/components/canvas/Canvas2D.jsx`, `src/components/canvas/3d/FurnitureModels.jsx`, `src/components/canvas/3d/CameraSync.jsx`, `src/scenes/Room.tsx`, `src/store/useSceneStore.ts`, `src/utils/textures.js`, `vite.config.js`

### Changed: dependency security updates
- Applied non-breaking `npm audit fix` updates. This removed the reported critical advisories and reduced production findings from 13 to 4.
- Four high-severity advisories remain in Firebase's `@grpc/grpc-js` chain. npm's only suggested fix is a forced downgrade to Firebase 9.14.0, so it was deliberately not applied.

### Verification and remaining external checks
- `npm run typecheck`, `npm run lint`, `npm test` (5 tests), and `npm run build` pass. The 3D chunk remains lazy-loaded and is approximately 993 kB after the dependency updates.
- No Firestore deployment, signed-in cloud test, commit, push, secret-file change, or user-data deletion was performed. The empty untracked `null/` directory remains pending removal approval.

## Phase 2 — Security rules, timestamp normalisation, desktop guard (2026-11-23)

### Added: versioned Firestore security rules
- **Root cause:** the repo contained no `firebase.json` or rules file, so there was no reviewable guarantee that users can only read and write their own projects.
- **Fix:** added `firestore.rules` and `firebase.json`. `rooms` documents are readable, updatable and deletable only by the signed-in user whose uid matches the document's `uid`; creation requires the new document to carry the caller's uid; everything else is denied by default.
- **Not deployed:** deploying rules changes shared infrastructure. Run `firebase deploy --only firestore:rules` only after confirming your current production rules with `firebase firestore:rules` (or the console). Legacy `rooms` documents without a `uid` field will stop being accessible to clients once these rules are live.
- Files: `firestore.rules`, `firebase.json`

### Added: documented environment configuration
- Added `.env.example` listing the `VITE_FIREBASE_*` variables the app reads. The hardcoded fallbacks in `src/firebase/firebase.js` were intentionally left in place so local development keeps working without a `.env`; removing them should happen once a real `.env.local` exists.
- Files: `.env.example`

### Fixed: dashboard ordering with mixed timestamp types
- **Root cause:** projects were ordered by `createdAt` in Firestore, but records mix Firestore Timestamps (newer) with ISO strings (guest/legacy), and Firestore sorts by value type before value, so legacy projects could appear first.
- **Fix:** fetch the user's rooms and sort in the client after normalising `createdAt` (Timestamp, Date, number or ISO string) with `updatedAt` as fallback. This also removes the composite index requirement for `where('uid') + orderBy('createdAt')`.
- Files: `src/pages/Dashboard/Dashboard.jsx`

### Added: desktop width guard for the editor
- **Root cause:** below roughly 960 px the two open side panels consumed the whole row, leaving the canvas 0 px wide, and header content overflowed horizontally.
- **Fix:** below 1024 px the editor renders an explicit "Roometry needs a wider window" notice instead of a broken, zero-width canvas. Above that width behaviour is unchanged.
- Files: `src/pages/Editor/Editor.jsx`, `src/pages/Editor/Editor.css`

### Changed: floor-plan room is authoritative for room dimensions
- **Root cause:** `room` was persisted as a second copy of the selected floor-plan room's dimensions, and hydration trusted that stale copy until the editor explicitly re-synced. The unused `setRoomDimensions` action could also change `room` without touching the floor plan, quietly breaking the mirror.
- **Fix:** the persist layer now re-derives `room` from the selected `floorPlan.rooms` entry during hydration (`merge`), so a stale persisted copy can never leak into the scene; removed the dead `setRoomDimensions` action. A full collapse (deleting the mirrored state entirely) remains for a later phase because it touches every 2D/3D consumer. Superseded by the entry below.
- Files: `src/store/useSceneStore.ts`

### Changed: mirrored `room` state removed (persist v7)
- **Root cause:** the 3D view read a second, duplicated copy of the selected room's dimensions (`state.room`). Every mutation either had to re-sync that copy or leave it stale until the next 3D entry, and the `Live 3D preview while editing` toggle only existed to control that hidden copy.
- **Fix:** `room` is deleted from scene state, persisted data and saved snapshots. `DEFAULT_ROOM_DIMENSIONS` covers the empty-scene case, and consumers read the selected floor-plan room through the new `useActiveRoom` selector (stable object reference, so no extra re-renders). `syncRoomToScene`, `applySelectedRoomToScene` and the `livePreview` flag/ toggle were removed; entering 3D now simply switches mode. The persist version is bumped 6 → 7 and both `migrate` and `merge` strip `room`/`livePreview`, including data resurrected from older project records. `partialize` now writes an explicit floor-plan field list so removed keys cannot be saved back.
- **User-visible change:** the "Live 3D preview while editing" checkbox is gone. With the duplicate removed there is nothing left to defer — the 3D view always matches the floor plan.
- **Verified:** a real v6 localStorage record migrated to v7 (room and livePreview gone, room geometry intact); editing the room width in the 2D panel changed the 3D render; guest save wrote a snapshot without `room`/`livePreview`; production preview create → open → save worked and the 3D context stayed alive with no console errors.
- Files: `src/store/useSceneStore.ts`, `src/pages/Editor/Editor.jsx`, `src/pages/Dashboard/Dashboard.jsx`, `src/components/canvas/Canvas3D.jsx`, `src/components/canvas/Canvas2D.jsx`, `src/scenes/Room.tsx`, `src/components/layout/Sidebar/SceneControls.jsx`, `src/components/layout/Sidebar/planner/PlannerControls.jsx`

### Changed: 2D/3D canvases are code-split
- **Root cause:** three.js, React Three Fiber, drei and postprocessing were bundled into the entry chunk and loaded on every route, including the dashboard and auth pages.
- **Fix:** `Canvas2D` and `Canvas3D` are now `React.lazy` imports with a loading panel fallback. Initial JS dropped from 1,918 kB (587 kB gzip) to 799 kB (244 kB gzip); the 3D scene ships as a 1,081 kB (331 kB gzip) chunk fetched only when the editor mounts it.
- Files: `src/pages/Editor/Editor.jsx`

### Changed: editor route is lazy-loaded
- **Root cause:** `App.jsx` imported every page from the `@pages` barrel, so the editor page, its scene store, the planner and the editor CSS were in the entry chunk even for visitors who only saw the landing, login or dashboard.
- **Fix:** the app shell imports `Landing`, `Auth` and `Dashboard` directly and loads `Editor` with `React.lazy` + `Suspense` (fallback: "Loading studio..."). `Editor` was removed from the `@pages` barrel (with a comment) so a future barrel import cannot silently pull it back into the entry chunk.
- **Result:** production entry JS 799 → 753 kB (244 → 234 kB gzip). Opening the editor fetches its own 38 kB chunk plus 17 kB CSS, 13 kB store, 17 kB planner, and icons; the 3D chunk (1,081 kB) is still only fetched when the 3D view opens. Verified dev and production preview: dashboard requests only the entry chunk, the editor route loads its chunks, 3D stays unloaded in 2D, console clean, unauthenticated `/app/:id` still redirects to `/login`.
- Files: `src/App.jsx`, `src/pages/index.js`

### Changed: project README
- Replaced the stock Vite template README with a project overview: stack, setup, Firebase env vars and rules deployment, guest vs signed-in behaviour, source layout, notable design decisions and known limitations.
- Files: `README.md`

## Phase 1 — Save/load integrity and crash containment (2026-11-23)

### Fixed: projects loading stale or losing saved changes
- **Root cause:** the app kept two copies of the same data (top-level `floorPlan` on the project record and `snapshot.floorPlan`), and the editor also re-applied a snapshot passed through router `location.state` on every mount. After a reload the router state still existed, so older data silently overwrote what was saved.
- **Fix:** the editor now loads a project only by its id — from `localStorage` for guests or Firestore for signed-in users — preferring `snapshot.floorPlan` and falling back to the legacy top-level `floorPlan`. Saves mirror `floorPlan` back to the top level. The router-state application effect was removed.
- Files: `src/pages/Editor/Editor.jsx`, `src/firebase/projects.js`

### Fixed: cloud "New Project" failing and guest saves silently not saving
- **Root cause:** project creation called `updateDoc` on a document that did not exist yet, and guest saves only updated a record they expected to already be in storage, so a missing record did nothing.
- **Fix:** creation uses `setDoc` with `uid`, `id` and `serverTimestamp()`; guest saves upsert (create or update) with an id and `createdAt`; a missing identity now throws a visible error, and failures render a dismissible banner on the dashboard.
- Files: `src/pages/Dashboard/Dashboard.jsx`, `src/pages/Dashboard/Dashboard.css`, `src/pages/Editor/Editor.jsx`

### Fixed: `/app` reachable without signing in or choosing guest mode
- **Root cause:** the editor route mounted before Firebase auth had resolved, so an unauthenticated visitor could land on a project URL directly.
- **Fix:** a route guard waits for `onAuthStateChanged`, then allows signed-in users and guests only; everyone else is redirected to `/login` with the original path in `state.from`. The guest exit now exists on both the Login and Register screens and honours `from` (Register previously referenced the browser `window.location` and always went to `/dashboard`).
- Files: `src/App.jsx`, `src/pages/Auth/Auth.jsx`

### Fixed: seeded rooms overflowing the 2D canvas
- **Root cause:** new projects wrote room dimensions with no margin and inconsistent pixels-per-metre values, so the first room could sit outside the visible canvas.
- **Fix:** width/depth and zoom inputs are clamped, rooms are seeded with a 2 m margin and a consistent 36 px/m scale, and the canvas is sized around the room.
- Files: `src/pages/Dashboard/Dashboard.jsx`

### Fixed: invalid texture URLs crashing the 3D view
- **Root cause:** any string typed into a texture field was passed to `useTexture`, which throws for unsupported URLs; surfaces also mutated shared texture settings.
- **Fix:** URLs are validated (http/https, data URLs, or `/path`) and committed on blur/Enter with an inline error (Escape reverts). A bundled 1×1 fallback texture is used when no texture applies, and each surface clones its texture so repeats do not leak between surfaces.
- Files: `src/utils/textureUrl.js`, `src/components/layout/Sidebar/scene/SceneControlsPanel.jsx`, `src/styles/controls.css`, `src/scenes/Room.tsx`

### Fixed: blank page when 2D/3D rendering fails
- **Root cause:** nothing caught render errors from the canvases, and a lost WebGL context left a dead canvas with no recovery path.
- **Fix:** an error boundary around the canvases shows a recovery panel with "Try again" instead of a blank screen; the 3D canvas listens for `webglcontextlost`/`webglcontextrestored`, shows a retry overlay, and remounts the renderer on restore.
- Files: `src/components/canvas/CanvasErrorBoundary.jsx`, `src/components/canvas/Canvas3D.jsx`, `src/pages/Editor/Editor.jsx`, `src/pages/Editor/Editor.css`

### Verification
- `npm run build` passes: 1,918.47 kB JS (587.13 kB gzip), 85.46 kB CSS (15.70 kB gzip).
- ESLint is clean on the changed JS/JSX files. `src/scenes/Room.tsx` is not covered by the current ESLint flat config (pre-existing gap; the build still type-checks it).
- Verified in the browser: guest save/reload round-trip, seed-room normalisation, invalid texture URL rejection (nothing persisted), access-gate redirect with `from`, guest return to the project from Login, guest entry from Register, dashboard listing, and the error-boundary retry after a real WebGL context loss.
- Not yet verified: signed-in cloud create/save (no test account available in the current environment); 1024/1440 px visual checks (the in-app browser viewport is constrained).

### Known limitations (not addressed in Phase 1)
- Below roughly 960 px window width, both sidebars open leave the canvas 0 px wide and the header scrolls horizontally. The app targets desktop widths of 1024 px and above.
- Dashboard ordering can misplace legacy projects because `createdAt` may be a Firestore Timestamp or an ISO string.
- No Zustand persist version bump was needed: persisted data shape did not change in this phase.
