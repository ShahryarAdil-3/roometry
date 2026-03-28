import { useState } from 'react'
import { useSceneStore } from './store/useSceneStore'
import SceneControls from './components/SceneControls'
import SceneViewport from './components/SceneViewport'
import FloorMapCanvas from './components/FloorMapCanvas'
import './App.css'

function App() {
  const cameraMode = useSceneStore((state) => state.cameraMode)
  const cameraPresets = useSceneStore((state) => state.cameraPresets)
  const uiMode = useSceneStore((state) => state.floorPlan.uiMode)
  const activePreset = cameraPresets[cameraMode] ?? cameraPresets.orbit
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
