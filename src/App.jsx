import { useState } from 'react'
import { useSceneStore } from './store/useSceneStore'
import SceneControls from './components/SceneControls'
import SceneViewport from './components/SceneViewport'
import './App.css'

function App() {
  const cameraMode = useSceneStore((state) => state.cameraMode)
  const cameraPresets = useSceneStore((state) => state.cameraPresets)
  const activePreset = cameraPresets[cameraMode] ?? cameraPresets.orbit
  const [showControls, setShowControls] = useState(true)

  return (
    <div className="app">
      <SceneViewport cameraMode={cameraMode} preset={activePreset} />

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
