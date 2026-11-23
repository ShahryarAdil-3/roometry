# Changelog

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
