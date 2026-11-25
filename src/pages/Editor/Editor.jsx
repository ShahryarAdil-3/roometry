import { useEffect, useMemo, useRef, useState, Suspense, lazy } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion, useAnimation } from 'framer-motion'
import {
  LayoutGrid,
  Cuboid,
  Eye,
  MousePointer2,
  Move3D,
  Type,
  Save,
  Undo,
  Redo,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Minimize2,
  Maximize2,
  X,
  Plus,
  Trash2
} from 'lucide-react'
import { DEFAULT_ROOM_DIMENSIONS, useActiveRoom, useSceneStore } from '@store/useSceneStore'
import { SceneControls } from '@components/layout/Sidebar'
import CanvasErrorBoundary from '@components/canvas/CanvasErrorBoundary'
import { ControlIcon } from '@components/ui/ControlIcons'
import ThemeToggle from '@components/ThemeToggle'
import { auth } from '@appFirebase/firebase'
import { fetchProjectSnapshot, saveProjectSnapshot } from '@appFirebase/projects'
import '../../styles/editor-ui.css'
import './Editor.css'

// The 2D planner and the three.js scene are by far the heaviest parts of the
// app; load them only when the editor actually mounts a canvas.
const Canvas2D = lazy(() => import('@components/canvas/Canvas2D'))
const Canvas3D = lazy(() => import('@components/canvas/Canvas3D'))

const GUEST_MODE_STORAGE_KEY = 'roometry_guest_mode'
const GUEST_PROJECTS_STORAGE_KEY = 'roometry_guest_rooms'
const WALL_KEYS = ['north', 'south', 'east', 'west']

const cloneSerializable = (value) => JSON.parse(JSON.stringify(value))

const createSnapshotFromState = (state) =>
  cloneSerializable({
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
  if (selected?.name) return selected.name
  if (snapshot.floorPlan.rooms[0]?.name) return snapshot.floorPlan.rooms[0].name
  return `Project ${new Date().toLocaleDateString()}`
}

const applySnapshotToStore = (snapshot) => {
  if (!snapshot || typeof snapshot !== 'object') return false

  const current = useSceneStore.getState()
  const incomingFloorPlan = { ...(snapshot.floorPlan ?? {}) }
  // Drop fields the current schema no longer has so old saves cannot
  // resurrect them in the live store (and from there in the next save).
  delete incomingFloorPlan.livePreview
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

// Animated Toolbar
const Toolbar = ({ activeTool, onToolChange, is3DMode, onToggleMode }) => {
  const tools = [
    { id: 'select', icon: MousePointer2, label: 'Select', color: '#c07a45' },
    { id: 'move', icon: Move3D, label: 'Move', color: '#3a2e24' },
    { id: 'add', icon: Plus, label: 'Add', color: '#5c6370' },
    { id: 'delete', icon: Trash2, label: 'Delete', color: '#dc2626' },
  ]

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="editor-toolbar"
    >
      <div className="editor-toolbar-group">
        {tools.map((tool) => {
          const Icon = tool.icon
          const isActive = activeTool === tool.id

          return (
            <motion.button
              key={tool.id}
              className={`editor-toolbar-btn ${isActive ? 'active' : ''}`}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onToolChange(tool.id)}
              style={isActive ? { background: tool.color, color: 'white' } : {}}
            >
              <Icon size={18} />
              <span className="editor-toolbar-btn-label">{tool.label}</span>
            </motion.button>
          )
        })}
      </div>

      <motion.div
        className="editor-mode-toggle"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onToggleMode}
      >
        <span className="editor-mode-toggle-label">
          {is3DMode ? '2D Mode' : '3D Mode'}
        </span>
        <motion.div
          className="editor-mode-toggle-switch"
          animate={{
            x: is3DMode ? 16 : 0,
            background: is3DMode ? 'var(--primary)' : 'var(--border)'
          }}
          transition={{ duration: 0.3, type: 'spring', stiffness: 500 }}
        />
      </motion.div>
    </motion.div>
  )
}

// Animated Status Bar
const StatusBar = ({ message, type = 'info', onClose }) => {
  const colors = {
    info: '#c07a45',
    success: '#22c55e',
    error: '#dc2626',
    warning: '#f59e0b'
  }

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="editor-status-bar"
          style={{ borderColor: colors[type] }}
        >
          <span style={{ color: colors[type] }}>{message}</span>
          <button className="editor-status-bar-close" onClick={onClose}>
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Side Panel with animations
const SidePanel = ({ children, isOpen, onToggle, title }) => {
  const panelControls = useAnimation()

  useEffect(() => {
    if (isOpen) {
      panelControls.start({ x: 0, opacity: 1 })
    } else {
      panelControls.start({ x: 20, opacity: 0.5 })
    }
  }, [isOpen, panelControls])

  return (
    <motion.div
      className={`editor-side-panel ${isOpen ? 'open' : 'closed'}`}
      animate={panelControls}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="editor-side-panel-header"
        initial={false}
        animate={{ background: isOpen ? 'var(--surface-bg)' : 'transparent' }}
        transition={{ duration: 0.2 }}
      >
        <motion.h3
          initial={false}
          animate={{ opacity: isOpen ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {title}
        </motion.h3>
        <motion.button
          className="editor-side-panel-toggle"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onToggle}
          initial={false}
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronLeft size={18} />
        </motion.button>
      </motion.div>

      <motion.div
        className="editor-side-panel-content"
        initial={false}
        animate={{ opacity: isOpen ? 1 : 0, y: isOpen ? 0 : 10 }}
        transition={{ duration: 0.2, delay: isOpen ? 0.1 : 0 }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

// Enhanced Header
const EditorHeader = ({
  projectName,
  onSave,
  onUndo,
  onRedo,
  is3DMode,
  onToggleMode,
  onToggleSidebar,
  isSidebarOpen
}) => {
  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="editor-header"
    >
      <div className="editor-header-left">
        <motion.button
          className="editor-menu-btn"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleSidebar}
        >
          <LayoutGrid size={20} />
          {isSidebarOpen && <span>Menu</span>}
        </motion.button>

        <div className="editor-header-title">
          <motion.h1
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            {projectName}
          </motion.h1>
          <motion.span
            className="editor-header-mode"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {is3DMode ? '3D View' : '2D Plan'}
          </motion.span>
        </div>
      </div>

      <div className="editor-header-right">
        <motion.div
          className="editor-header-actions"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.button
            className="editor-action-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onUndo}
            disabled={!onUndo}
          >
            <Undo size={16} />
            <span>Undo</span>
          </motion.button>

          <motion.button
            className="editor-action-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRedo}
            disabled={!onRedo}
          >
            <Redo size={16} />
            <span>Redo</span>
          </motion.button>

          <motion.button
            className="editor-action-btn editor-action-btn-primary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onSave}
          >
            <Save size={16} />
            <span>Save</span>
          </motion.button>
        </motion.div>

        <motion.div
          className="editor-header-controls"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <ThemeToggle />
          <motion.button
            className="editor-mode-toggle-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleMode}
          >
            {is3DMode ? <LayoutGrid size={18} /> : <Eye size={18} />}
            <span>{is3DMode ? '2D' : '3D'}</span>
          </motion.button>
          <motion.button
            className="editor-help-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <HelpCircle size={18} />
          </motion.button>
        </motion.div>
      </div>
    </motion.header>
  )
}

// Canvas Container with loading animation
const CanvasContainer = ({ children, isLoading, is3DMode }) => {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="editor-canvas-loading"
      >
        <motion.div
          className="editor-loading-spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        >
          <div className="editor-loading-spinner-inner" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Loading {is3DMode ? '3D' : '2D'} environment...
        </motion.p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="editor-canvas-container"
    >
      <Suspense fallback={null}>
        {children}
      </Suspense>
    </motion.div>
  )
}

// Quick Access Panel
const QuickAccessPanel = ({ onAction }) => {
  const items = [
    { id: 'walls', icon: Cuboid, label: 'Walls', count: 4 },
    { id: 'furniture', icon: Type, label: 'Furniture', count: 10 },
    { id: 'materials', icon: Settings, label: 'Materials', count: 15 },
    { id: 'camera', icon: MousePointer2, label: 'Camera', count: 3 },
  ]

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="editor-quick-access"
    >
      {items.map((item, i) => {
        const Icon = item.icon
        return (
          <motion.button
            key={item.id}
            className="editor-quick-access-btn"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6 + i * 0.05, duration: 0.5 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onAction(item.id)}
          >
            <Icon size={18} />
            <span>{item.label}</span>
            <span className="editor-quick-access-count">{item.count}</span>
          </motion.button>
        )
      })}
    </motion.div>
  )
}

// Main Editor Component
function Editor() {
  const navigate = useNavigate()
  const location = useLocation()
  const { projectId: routeProjectId } = useParams()

  const cameraMode = useSceneStore((state) => state.cameraMode)
  const cameraPresets = useSceneStore((state) => state.cameraPresets)
  const activeRoom = useActiveRoom()
  const room = activeRoom ?? DEFAULT_ROOM_DIMENSIONS
  const floorPlan = useSceneStore((state) => state.floorPlan)
  const uiMode = useSceneStore((state) => state.floorPlan.uiMode)
  const is3DMode = uiMode === 'visualize'
  const selectRoom = useSceneStore((state) => state.selectRoom)
  const setCameraMode = useSceneStore((state) => state.setCameraMode)
  const setUiMode = useSceneStore((state) => state.setUiMode)
  const resetScene = useSceneStore((state) => state.resetScene)

  const queryProjectId = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return routeProjectId ?? params.get('id')
  }, [location.search, routeProjectId])

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

  const [authUser, setAuthUser] = useState(() => auth.currentUser)
  const [activeProjectId, setActiveProjectId] = useState(queryProjectId)
  const [isProjectLoading, setIsProjectLoading] = useState(false)
  const [saveState, setSaveState] = useState('idle')
  const [saveMessage, setSaveMessage] = useState('')
  const [projectName, setProjectName] = useState('Untitled Project')
  const [guestModePreference] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(GUEST_MODE_STORAGE_KEY) === 'true'
  })

  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isPropertiesPanelOpen, setIsPropertiesPanelOpen] = useState(true)
  const [activeTool, setActiveTool] = useState('select')

  const isGuestMode = guestModePreference && !authUser

  const statusClearTimeoutRef = useRef(null)

  useEffect(() => {
    if (!queryProjectId) {
      resetScene()
      setCameraMode('top')
      setUiMode('draw')
      setProjectName('Untitled Project')
    }
  }, [queryProjectId, resetScene, setCameraMode, setUiMode])

  useEffect(() => {
    if (!queryProjectId) {
      return
    }

    let cancelled = false
    setIsProjectLoading(true)

    const loadDirectProject = async () => {
      try {
        let project = null

        if (guestModePreference) {
          const stored = JSON.parse(
            window.localStorage.getItem(GUEST_PROJECTS_STORAGE_KEY) ?? '[]',
          )
          project = Array.isArray(stored)
            ? stored.find((entry) => entry.id === queryProjectId)
            : null
        } else if (authUser) {
          project = await fetchProjectSnapshot({
            uid: authUser.uid,
            projectId: queryProjectId,
          })
        } else {
          return
        }

        if (cancelled) {
          return
        }

        if (!project) {
          navigate('/dashboard', { replace: true })
          return
        }

        applySnapshotToStore({
          ...(project.snapshot ?? {}),
          floorPlan: project.snapshot?.floorPlan ?? project.floorPlan,
        })
        setCameraMode('top')
        setUiMode('draw')
        setProjectName(project.name ?? deriveProjectName(project.snapshot ?? {}))
      } catch (error) {
        console.error('Error loading project:', error)
        navigate('/dashboard', { replace: true })
      } finally {
        if (!cancelled) {
          setIsProjectLoading(false)
        }
      }
    }

    loadDirectProject()

    return () => {
      cancelled = true
    }
  }, [
    authUser,
    guestModePreference,
    navigate,
    queryProjectId,
    setCameraMode,
    setUiMode,
  ])

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
    if (floorPlan.selectedRoomId) return true
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

    setCameraMode('orbit')
    setUiMode('visualize')
  }

  const toggle3DMode = () => {
    if (is3DMode) {
      setUiMode('draw')
      setCameraMode('top')
    } else {
      openVisualizeMode()
    }
  }

  useEffect(() => {
    setActiveProjectId(queryProjectId)
  }, [queryProjectId])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user)
    })

    return () => unsubscribe()
  }, [])

  // Update project name from floor plan
  useEffect(() => {
    const state = useSceneStore.getState()
    const currentProjectName = deriveProjectName(state)
    if (currentProjectName !== projectName) {
      setProjectName(currentProjectName)
    }
  }, [projectName])

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const handleToggleProperties = () => {
    setIsPropertiesPanelOpen(!isPropertiesPanelOpen)
  }

  const handleToolChange = (tool) => {
    setActiveTool(tool)
  }

  const handleSave = async () => {
    const state = useSceneStore.getState()
    const snapshot = createSnapshotFromState(state)

    try {
      setTransientStatus('saving', 'Saving project...', 0)

      const saveName = projectName?.trim() || deriveProjectName(snapshot)

      if (isGuestMode) {
        const stored = JSON.parse(window.localStorage.getItem(GUEST_PROJECTS_STORAGE_KEY) ?? '[]')
        const projects = Array.isArray(stored) ? stored : []
        const now = new Date().toISOString()
        const projectId = activeProjectId ?? `room_${Date.now()}`
        const existing = projects.find((project) => project.id === projectId)
        const nextProject = {
          ...(existing ?? { createdAt: now }),
          id: projectId,
          name: saveName,
          snapshot,
          floorPlan: snapshot.floorPlan,
          roomCount: snapshot.floorPlan?.rooms?.length ?? 0,
          updatedAt: now,
        }
        const nextProjects = existing
          ? projects.map((project) => (project.id === projectId ? nextProject : project))
          : [nextProject, ...projects]

        window.localStorage.setItem(GUEST_PROJECTS_STORAGE_KEY, JSON.stringify(nextProjects))
        if (!activeProjectId) {
          setActiveProjectId(projectId)
        }
      } else if (authUser) {
        const savedProjectId = await saveProjectSnapshot({
          uid: authUser.uid,
          projectId: activeProjectId,
          name: saveName,
          snapshot,
        })

        if (!activeProjectId && savedProjectId) {
          setActiveProjectId(savedProjectId)
          navigate(`/app/${encodeURIComponent(savedProjectId)}`, {
            replace: true,
            state: { snapshot, floorPlan: snapshot.floorPlan },
          })
        }
      } else {
        throw new Error('Sign in or continue as a guest before saving.')
      }

      setTransientStatus('success', 'Project saved successfully!', 2000)
    } catch (error) {
      console.error('Error saving project:', error)
      setTransientStatus('error', error.message || 'Failed to save project', 3000)
    }
  }

  return (
    <div className="editor-shell">
      <div className="editor-narrow-notice" role="alert">
        <h2>Roometry needs a wider window.</h2>
        <p>
          This studio is built for desktop screens. Widen the window to at least
          1024 px to use the editor.
        </p>
      </div>

      {/* Header */}
      <EditorHeader
        projectName={projectName}
        onSave={handleSave}
        is3DMode={is3DMode}
        onToggleMode={toggle3DMode}
        onToggleSidebar={handleToggleSidebar}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Status Bar */}
      <StatusBar
        message={saveMessage}
        type={saveState}
        onClose={() => setTransientStatus('idle', '')}
      />

      <div className="editor-main">
        {/* Side Panel */}
        <SidePanel
          isOpen={isSidebarOpen}
          onToggle={handleToggleSidebar}
          title="Scene Controls"
        >
          <SceneControls />
        </SidePanel>

        {/* Canvas Area */}
        <motion.div
          className="editor-canvas-area"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <CanvasContainer is3DMode={is3DMode} isLoading={isProjectLoading}>
            <Suspense
              fallback={(
                <div className="editor-canvas-loading">
                  <p>Loading {is3DMode ? '3D' : '2D'} environment...</p>
                </div>
              )}
            >
              <CanvasErrorBoundary
                key={`${activeProjectId ?? 'new'}-${is3DMode ? '3d' : '2d'}`}
                title={is3DMode ? 'The 3D view could not be rendered.' : 'The 2D planner could not be rendered.'}
              >
                {is3DMode ? (
                  <Canvas3D
                    cameraMode={cameraMode}
                    preset={activePreset}
                  />
                ) : (
                  <Canvas2D />
                )}
              </CanvasErrorBoundary>
            </Suspense>
          </CanvasContainer>
        </motion.div>

        {/* Properties Panel */}
        <SidePanel
          isOpen={isPropertiesPanelOpen}
          onToggle={handleToggleProperties}
          title="Properties"
        >
          <div className="editor-properties-panel">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h4>Selected Object</h4>
              <p>No object selected</p>
            </motion.div>
          </div>
        </SidePanel>

        {/* Toolbar */}
        <Toolbar
          activeTool={activeTool}
          onToolChange={handleToolChange}
          is3DMode={is3DMode}
          onToggleMode={toggle3DMode}
        />

        {/* Quick Access Panel */}
        <QuickAccessPanel onAction={(id) => console.log('Quick action:', id)} />
      </div>
    </div>
  )
}

export default Editor