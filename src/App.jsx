import { useMemo, useState } from 'react'
import { useSceneStore } from './store/useSceneStore'
import SceneControls from './components/SceneControls'
import SceneViewport from './components/SceneViewport'
import FloorMapCanvas from './components/FloorMapCanvas'
import './App.css'

function App() {
  const cameraMode = useSceneStore((state) => state.cameraMode)
  const cameraPresets = useSceneStore((state) => state.cameraPresets)
  const room = useSceneStore((state) => state.room)
  const uiMode = useSceneStore((state) => state.floorPlan.uiMode)
  const activePreset = useMemo(() => {
    const base = cameraPresets[cameraMode] ?? cameraPresets.orbit

    if (uiMode !== 'visualize') {
      return base
    }

    if (cameraMode === 'firstPerson') {
      const eye = Math.max(1.3, Math.min(1.8, room.height - 0.25))
      return {
        ...base,
        position: [0, eye, 0],
        target: [0, eye, -1],
      }
    }

    if (cameraMode === 'orbit') {
      const radius = Math.max(room.width, room.depth)
      return {
        ...base,
        position: [radius * 0.65, Math.max(2.2, room.height * 0.85), radius * 0.85],
        target: [0, Math.min(1.6, room.height * 0.55), 0],
      }
    }

    return base
  }, [cameraMode, cameraPresets, room.depth, room.height, room.width, uiMode])
  const [showControls, setShowControls] = useState(true)
  const [isFirstPersonLocked, setIsFirstPersonLocked] = useState(false)

  return (
    <div className="app">
      {uiMode === 'draw' ? (
        <FloorMapCanvas />
      ) : (
        <SceneViewport
          cameraMode={cameraMode}
          preset={activePreset}
          onFirstPersonLockChange={setIsFirstPersonLocked}
        />
      )}

      {uiMode === 'visualize' && cameraMode === 'firstPerson' && (
        <>
          {isFirstPersonLocked ? (
            <div className="crosshair" aria-hidden="true" />
          ) : (
            <div className="fp-help">
              Click inside the 3D scene to enter first-person mode. Press Esc to
              release cursor.
            </div>
          )}
        </>
      )}

      <button
        type="button"
        className="toggle-controls-btn"
        onClick={() => setShowControls((value) => !value)}
      >
        {showControls ? 'Hide Controls' : 'Show Controls'}
      </button>

      {showControls && <SceneControls onHide={() => setShowControls(false)} />}
    </div>
  )
}

export default App
