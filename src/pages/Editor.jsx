import { useEffect, useMemo, useRef, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSceneStore } from '../store/useSceneStore'
import SceneControls from '../components/SceneControls'
import SceneViewport from '../components/SceneViewport'
import FloorMapCanvas from '../components/FloorMapCanvas'
import { ControlIcon } from '../components/ui/ControlIcons'
import { auth } from '../firebase/firebase'
import { fetchProjectSnapshot, saveProjectSnapshot } from '../firebase/projects'
import '../App.css'

const STYLE_VARIANTS = [
  { id: 'minimal', label: 'Minimal', icon: 'theme-minimal' },
  { id: 'futuristic', label: 'Futuristic', icon: 'theme-futuristic' },
  { id: 'cad', label: 'CAD', icon: 'theme-cad' },
]

const STYLE_VARIANT_STORAGE_KEY = 'roometry-style-variant'
const GUEST_MODE_STORAGE_KEY = 'roometry_guest_mode'
const GUEST_PROJECTS_STORAGE_KEY = 'roometry_guest_rooms'
const WALL_KEYS = ['north', 'south', 'east', 'west']

const cloneSerializable = (value) => JSON.parse(JSON.stringify(value))

const detectTouchDevice = () => {
  if (typeof window === 'undefined') {
    return false
  }

  return window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 820
}

const createSnapshotFromState = (state) =>
  cloneSerializable({
    room: state.room,
    walls: state.walls,
    floor: state.floor,
    ceiling: state.ceiling,
    furniture: state.furniture,
    cameraMode: state.cameraMode,
    firstPerson: state.firstPerson,
    floorPlan: {
      ...state.floorPlan,
      constraintMessage: null,
    },
  })

const deriveProjectName = (snapshot) => {
  const selected = snapshot.floorPlan.rooms.find((room) => room.id === snapshot.floorPlan.selectedRoomId)
  if (selected?.name) {
    return selected.name
  }

  if (snapshot.floorPlan.rooms[0]?.name) {
    return snapshot.floorPlan.rooms[0].name
  }

  return `Project ${new Date().toLocaleDateString()}`
}

const applySnapshotToStore = (snapshot) => {
  if (!snapshot || typeof snapshot !== 'object') {
    return false
  }

  const current = useSceneStore.getState()
  const incomingFloorPlan = snapshot.floorPlan ?? {}
  const incomingRooms = Array.isArray(incomingFloorPlan.rooms)
    ? cloneSerializable(incomingFloorPlan.rooms)
    : current.floorPlan.rooms
  const selectedRoomId =
    incomingRooms.find((room) => room.id === incomingFloorPlan.selectedRoomId)?.id ??
    incomingRooms[0]?.id ??
    null

  const nextWalls = { ...current.walls }
  for (const wallKey of WALL_KEYS) {
    nextWalls[wallKey] = {
      ...current.walls[wallKey],
      ...(snapshot.walls?.[wallKey] ?? {}),
    }
  }

  useSceneStore.setState(
    {
      room: {
        ...current.room,
        ...(snapshot.room ?? {}),
      },
      walls: nextWalls,
      floor: {
        ...current.floor,
        ...(snapshot.floor ?? {}),
      },
      ceiling: {
        ...current.ceiling,
        ...(snapshot.ceiling ?? {}),
      },
      furniture: Array.isArray(snapshot.furniture)
        ? cloneSerializable(snapshot.furniture)
        : current.furniture,
      cameraMode: snapshot.cameraMode ?? current.cameraMode,
      firstPerson: {
        ...current.firstPerson,
        ...(snapshot.firstPerson ?? {}),
      },
      floorPlan: {
        ...current.floorPlan,
        ...incomingFloorPlan,
        canvas: {
          ...current.floorPlan.canvas,
          ...(incomingFloorPlan.canvas ?? {}),
        },
        rooms: incomingRooms,
        selectedRoomId,
        constraintMessage: null,
      },
    },
    false,
  )

  return true
}

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
  const navigate = useNavigate()
  const location = useLocation()

  const cameraMode = useSceneStore((state) => state.cameraMode)
  const cameraPresets = useSceneStore((state) => state.cameraPresets)
  const room = useSceneStore((state) => state.room)
  const floorPlan = useSceneStore((state) => state.floorPlan)
  const uiMode = useSceneStore((state) => state.floorPlan.uiMode)
  const selectRoom = useSceneStore((state) => state.selectRoom)
  const setCameraMode = useSceneStore((state) => state.setCameraMode)
  const setUiMode = useSceneStore((state) => state.setUiMode)
  const applySelectedRoomToScene = useSceneStore((state) => state.applySelectedRoomToScene)
  const setCanvasSettings = useSceneStore((state) => state.setCanvasSettings)
  const resetScene = useSceneStore((state) => state.resetScene)

  const queryProjectId = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return params.get('id')
  }, [location.search])

  const queryIsNewProject = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return params.get('new') === '1'
  }, [location.search])

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
  const [authUser, setAuthUser] = useState(() => auth.currentUser)
  const [activeProjectId, setActiveProjectId] = useState(queryProjectId)
  const [isProjectLoading, setIsProjectLoading] = useState(false)
  const [saveState, setSaveState] = useState('idle')
  const [saveMessage, setSaveMessage] = useState('')
  const [projectName, setProjectName] = useState('Untitled Project')
  const [isTouchDevice, setIsTouchDevice] = useState(detectTouchDevice)
  const [guestModePreference] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return window.localStorage.getItem(GUEST_MODE_STORAGE_KEY) === 'true'
  })
  const [isProjectSetupOpen, setIsProjectSetupOpen] = useState(false)
  const [projectSetup, setProjectSetup] = useState(() => ({
    name: 'Untitled Project',
    width: 18,
    depth: 14,
    pixelsPerMeter: 36,
  }))

  const isGuestMode = guestModePreference && !authUser

  const statusClearTimeoutRef = useRef(null)
  const loadedProjectRef = useRef('')
  const newProjectFlowRef = useRef('')

  const setTransientStatus = (nextState, message, duration = 3000) => {
    setSaveState(nextState)
    setSaveMessage(message)

    if (statusClearTimeoutRef.current) {
      window.clearTimeout(statusClearTimeoutRef.current)
    }

    if (duration > 0) {
      statusClearTimeoutRef.current = window.setTimeout(() => {
        setSaveState('idle')
        setSaveMessage('')
        statusClearTimeoutRef.current = null
      }, duration)
    }
  }

  const ensureSelectedRoom = () => {
    if (floorPlan.selectedRoomId) {
      return true
    }

    if (floorPlan.rooms[0]?.id) {
      selectRoom(floorPlan.rooms[0].id)
      return true
    }

    return false
  }

  const openVisualizeMode = () => {
    if (!ensureSelectedRoom()) {
      setTransientStatus('error', 'Create or select a room before entering 3D.', 3200)
      return
    }

    applySelectedRoomToScene()
    setCameraMode('orbit')
    setUiMode('visualize')
  }

  useEffect(() => {
    window.localStorage.setItem(STYLE_VARIANT_STORAGE_KEY, styleVariant)
  }, [styleVariant])

  useEffect(() => {
    setActiveProjectId(queryProjectId)
  }, [queryProjectId])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const mediaQuery = window.matchMedia('(pointer: coarse)')

    const syncTouchState = () => {
      setIsTouchDevice(detectTouchDevice())
    }

    syncTouchState()
    mediaQuery.addEventListener('change', syncTouchState)
    window.addEventListener('resize', syncTouchState)

    return () => {
      mediaQuery.removeEventListener('change', syncTouchState)
      window.removeEventListener('resize', syncTouchState)
    }
  }, [])

  useEffect(() => {
    if (!queryIsNewProject) {
      newProjectFlowRef.current = ''
      return
    }

    const flowKey = `${location.pathname}${location.search}`
    if (newProjectFlowRef.current === flowKey) {
      return
    }

    newProjectFlowRef.current = flowKey
    resetScene()
    loadedProjectRef.current = ''
    setActiveProjectId(null)
    setProjectName('Untitled Project')

    const freshCanvas = useSceneStore.getState().floorPlan.canvas
    setProjectSetup({
      name: 'Untitled Project',
      width: freshCanvas.width,
      depth: freshCanvas.depth,
      pixelsPerMeter: freshCanvas.pixelsPerMeter,
    })
    setIsProjectSetupOpen(true)
  }, [location.pathname, location.search, queryIsNewProject, resetScene])

  useEffect(() => {
    if (!activeProjectId) {
      loadedProjectRef.current = ''
      return
    }

    const loadKey = `${activeProjectId}:${isGuestMode ? 'guest' : authUser?.uid ?? 'anonymous'}`
    if (loadedProjectRef.current === loadKey) {
      return
    }

    if (!isGuestMode && !authUser) {
      return
    }

    let isCancelled = false

    const loadProject = async () => {
      setIsProjectLoading(true)

      try {
        if (isGuestMode) {
          const serialized = window.localStorage.getItem(GUEST_PROJECTS_STORAGE_KEY)
          const items = serialized ? JSON.parse(serialized) : []
          const found = items.find((item) => item.id === activeProjectId)
          if (!found?.snapshot) {
            setTransientStatus('error', 'Saved guest project was not found.', 3200)
            return
          }

          if (applySnapshotToStore(found.snapshot)) {
            setProjectName(found.name ?? deriveProjectName(found.snapshot))
            setTransientStatus('success', 'Guest project loaded.', 2400)
          }
          loadedProjectRef.current = loadKey
          return
        }

        const cloudProject = await fetchProjectSnapshot({
          uid: authUser.uid,
          projectId: activeProjectId,
        })

        if (!cloudProject?.snapshot) {
          setTransientStatus('error', 'Cloud project was not found or has no data.', 3400)
          loadedProjectRef.current = loadKey
          return
        }

        if (applySnapshotToStore(cloudProject.snapshot)) {
          setProjectName(cloudProject.name ?? deriveProjectName(cloudProject.snapshot))
          setTransientStatus('success', 'Cloud project loaded.', 2400)
        }

        loadedProjectRef.current = loadKey
      } catch (error) {
        if (!isCancelled) {
          setTransientStatus(
            'error',
            error instanceof Error ? error.message : 'Unable to load project right now.',
            4200,
          )
        }
      } finally {
        if (!isCancelled) {
          setIsProjectLoading(false)
        }
      }
    }

    loadProject()

    return () => {
      isCancelled = true
    }
  }, [activeProjectId, authUser, isGuestMode])

  useEffect(
    () => () => {
      if (statusClearTimeoutRef.current) {
        window.clearTimeout(statusClearTimeoutRef.current)
      }
    },
    [],
  )

  const handleSaveProject = async () => {
    const snapshot = createSnapshotFromState(useSceneStore.getState())
    const fallbackName = deriveProjectName(snapshot)
    const nextProjectName = (projectName || fallbackName).trim() || fallbackName
    const roomCount = snapshot.floorPlan.rooms.length

    setProjectName(nextProjectName)
    setSaveState('saving')
    setSaveMessage('Saving project...')

    try {
      if (isGuestMode) {
        const serialized = window.localStorage.getItem(GUEST_PROJECTS_STORAGE_KEY)
        const projects = serialized ? JSON.parse(serialized) : []
        const projectId = activeProjectId ?? `guest-${Date.now()}`
        const now = new Date().toISOString()
        const index = projects.findIndex((item) => item.id === projectId)
        const existing = index >= 0 ? projects[index] : null

        const payload = {
          id: projectId,
          uid: 'guest',
          name: nextProjectName,
          roomCount,
          snapshot,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        }

        const nextProjects = [...projects]
        if (index >= 0) {
          nextProjects[index] = payload
        } else {
          nextProjects.unshift(payload)
        }

        window.localStorage.setItem(GUEST_PROJECTS_STORAGE_KEY, JSON.stringify(nextProjects))
        window.localStorage.setItem(GUEST_MODE_STORAGE_KEY, 'true')

        if (!activeProjectId) {
          navigate(`/app?id=${projectId}`, { replace: true })
          setActiveProjectId(projectId)
        }

        setTransientStatus('success', 'Saved locally in guest mode.', 2600)
        return
      }

      if (!authUser) {
        setTransientStatus('error', 'Sign in first to save this project to the cloud.', 3600)
        return
      }

      const savedProjectId = await saveProjectSnapshot({
        uid: authUser.uid,
        projectId: activeProjectId,
        name: nextProjectName,
        snapshot,
      })

      if (savedProjectId !== activeProjectId) {
        navigate(`/app?id=${savedProjectId}`, { replace: true })
      }

      setActiveProjectId(savedProjectId)
      setTransientStatus('success', 'Project saved to cloud. Open it from any device.', 2800)
    } catch (error) {
      setTransientStatus(
        'error',
        error instanceof Error ? error.message : 'Project save failed. Please try again.',
        4600,
      )
    }
  }

  const goToDashboard = () => {
    navigate('/dashboard')
  }

  const handleProjectSetupSubmit = (event) => {
    event.preventDefault()

    const nextName = (projectSetup.name || 'Untitled Project').trim() || 'Untitled Project'
    const width = Number(projectSetup.width)
    const depth = Number(projectSetup.depth)
    const pixelsPerMeter = Number(projectSetup.pixelsPerMeter)

    setProjectName(nextName)
    setCanvasSettings({
      width,
      depth,
      pixelsPerMeter,
    })

    setIsProjectSetupOpen(false)
    navigate('/app', { replace: true })
    setTransientStatus('success', 'New canvas created. Save to keep this project.', 2500)
  }

  return (
    <div className={`app app-${uiMode} app-style-${styleVariant} ${showControls ? 'controls-open' : 'controls-closed'}`}>
      <div className={`app-sidebar ${showControls ? 'open' : ''}`}>
        {showControls && <SceneControls onHide={() => setShowControls(false)} />}
      </div>

      <div className="app-main">
        <div className="app-topbar">
          <div className="app-primary-actions" role="group" aria-label="Project actions">
            <button type="button" className="editor-action-btn" onClick={goToDashboard}>
              <span className="icon-label">
                <ControlIcon name="planner" size={14} />
                Dashboard
              </span>
            </button>

            <button
              type="button"
              className={`editor-action-btn save-btn ${saveState === 'success' ? 'saved' : ''}`}
              onClick={handleSaveProject}
              disabled={saveState === 'saving' || isProjectLoading}
            >
              <span className="icon-label">
                <ControlIcon name="preview" size={14} />
                {saveState === 'saving' ? 'Saving...' : 'Save Project'}
              </span>
            </button>
          </div>

          <button
            type="button"
            className="toggle-controls-btn"
            onClick={() => setShowControls((value) => !value)}
          >
            <span className="icon-label">
              <ControlIcon name={showControls ? 'hide' : 'show'} size={14} />
              {showControls ? 'Hide' : 'Controls'}
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
        </div>

        {!!saveMessage && (
          <div className={`editor-status-badge ${saveState === 'error' ? 'error' : ''}`}>
            {saveMessage}
          </div>
        )}

        {isTouchDevice && (
          <div className="mobile-editor-quickbar" role="toolbar" aria-label="Mobile editor controls">
            <button type="button" onClick={() => setShowControls((value) => !value)}>
              {showControls ? 'Hide Tools' : 'Show Tools'}
            </button>
            <button
              type="button"
              className={uiMode === 'draw' ? 'active' : ''}
              onClick={() => setUiMode('draw')}
            >
              2D
            </button>
            <button
              type="button"
              className={uiMode === 'visualize' ? 'active' : ''}
              onClick={openVisualizeMode}
              disabled={!floorPlan.rooms.length}
            >
              3D
            </button>
            {uiMode === 'visualize' && (
              <>
                <button
                  type="button"
                  className={cameraMode === 'orbit' ? 'active' : ''}
                  onClick={() => setCameraMode('orbit')}
                >
                  Orbit
                </button>
                <button
                  type="button"
                  className={cameraMode === 'top' ? 'active' : ''}
                  onClick={() => setCameraMode('top')}
                >
                  Top
                </button>
                <button
                  type="button"
                  className={cameraMode === 'firstPerson' ? 'active' : ''}
                  onClick={() => setCameraMode('firstPerson')}
                  disabled={!floorPlan.rooms.length}
                >
                  FP
                </button>
              </>
            )}
          </div>
        )}

        <div className="app-canvas-container">
          {uiMode === 'draw' ? (
            <FloorMapCanvas isTouchDevice={isTouchDevice} />
          ) : (
            <SceneViewport
              cameraMode={cameraMode}
              preset={activePreset}
              isTouchDevice={isTouchDevice}
              onFirstPersonLockChange={setIsFirstPersonLocked}
            />
          )}

          {uiMode === 'visualize' && cameraMode === 'firstPerson' && !isTouchDevice && (
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

          {uiMode === 'visualize' && isTouchDevice && (
            <div className="fp-help mobile-help">
              {cameraMode === 'firstPerson'
                ? 'Use joystick to move and swipe on right side to look around.'
                : 'Touch: drag to rotate, pinch to zoom, two-finger drag to pan.'}
            </div>
          )}
        </div>

        {isProjectSetupOpen && (
          <div className="project-setup-overlay" role="dialog" aria-modal="true" aria-label="New project setup">
            <form className="project-setup-card" onSubmit={handleProjectSetupSubmit}>
              <h3>Start New Project</h3>
              <p>Set your project name and initial canvas size before you begin.</p>

              <label>
                Project Name
                <input
                  type="text"
                  value={projectSetup.name}
                  onChange={(e) => setProjectSetup((current) => ({ ...current, name: e.target.value }))}
                  placeholder="My Project"
                  required
                />
              </label>

              <div className="project-setup-grid">
                <label>
                  Canvas Width (m)
                  <input
                    type="number"
                    min="6"
                    max="200"
                    step="1"
                    value={projectSetup.width}
                    onChange={(e) => setProjectSetup((current) => ({ ...current, width: Number(e.target.value) }))}
                    required
                  />
                </label>
                <label>
                  Canvas Depth (m)
                  <input
                    type="number"
                    min="6"
                    max="200"
                    step="1"
                    value={projectSetup.depth}
                    onChange={(e) => setProjectSetup((current) => ({ ...current, depth: Number(e.target.value) }))}
                    required
                  />
                </label>
                <label>
                  Pixels / Meter
                  <input
                    type="number"
                    min="16"
                    max="140"
                    step="1"
                    value={projectSetup.pixelsPerMeter}
                    onChange={(e) =>
                      setProjectSetup((current) => ({ ...current, pixelsPerMeter: Number(e.target.value) }))
                    }
                    required
                  />
                </label>
              </div>

              <button type="submit" className="project-setup-submit">Create Canvas</button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
