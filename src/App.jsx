import { lazy, Suspense, useState } from 'react'
import { useSceneStore } from './store/useSceneStore'
import SceneControls from './components/SceneControls'
import './App.css'

const SceneViewport = lazy(() => import('./components/SceneViewport'))

function App() {
  const cameraMode = useSceneStore((state) => state.cameraMode)
  const cameraPresets = useSceneStore((state) => state.cameraPresets)
  const activePreset = cameraPresets[cameraMode]
  const [showControls, setShowControls] = useState(true)

  return (
    <div className="app">
      <Suspense fallback={<div className="loading-overlay">Loading 3D scene...</div>}>
        <SceneViewport cameraMode={cameraMode} preset={activePreset} />
      </Suspense>

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
