import { useEffect, useMemo, useState } from 'react'
import { useSceneStore } from './store/useSceneStore'
import SceneControls from './components/SceneControls'
import SceneViewport from './components/SceneViewport'
import FloorMapCanvas from './components/FloorMapCanvas'
import { ControlIcon } from './components/ui/ControlIcons'
import './App.css'

const STYLE_VARIANTS = [
  { id: 'minimal', label: 'Minimal', icon: 'theme-minimal' },
  { id: 'futuristic', label: 'Futuristic', icon: 'theme-futuristic' },
  { id: 'cad', label: 'CAD', icon: 'theme-cad' },
]

const STYLE_VARIANT_STORAGE_KEY = 'roometry-style-variant'

const resolveInitialStyleVariant = () => {
  if (typeof window === 'undefined') {
    return 'futuristic'
  }

  const savedVariant = window.localStorage.getItem(STYLE_VARIANT_STORAGE_KEY)
  if (savedVariant && STYLE_VARIANTS.some((variant) => variant.id === savedVariant)) {
    return savedVariant
  }

  return 'futuristic'
}

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
  const [styleVariant, setStyleVariant] = useState(resolveInitialStyleVariant)

  useEffect(() => {
    window.localStorage.setItem(STYLE_VARIANT_STORAGE_KEY, styleVariant)
  }, [styleVariant])

  return (
    <div className={`app app-${uiMode} app-style-${styleVariant}`}>
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
        <span className="icon-label">
          <ControlIcon name={showControls ? 'hide' : 'show'} size={14} />
          {showControls ? 'Hide Controls' : 'Show Controls'}
        </span>
      </button>

      <div className="style-variant-dock" role="group" aria-label="Style variants">
        <span className="style-variant-label">
          <ControlIcon name="palette" size={13} />
          Style
        </span>
        {STYLE_VARIANTS.map((variant) => (
          <button
            key={variant.id}
            type="button"
            className={`style-variant-btn ${styleVariant === variant.id ? 'active' : ''}`}
            onClick={() => setStyleVariant(variant.id)}
            title={`Switch to ${variant.label} theme`}
            aria-label={`Switch to ${variant.label} theme`}
          >
            <ControlIcon name={variant.icon} size={13} />
            {variant.label}
          </button>
        ))}
      </div>

      {showControls && <SceneControls onHide={() => setShowControls(false)} />}
    </div>
  )
}

export default App
