import React, { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion, useAnimation } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import {
  Clock,
  Cuboid,
  LayoutGrid,
  LogOut,
  Pencil,
  Plus,
  Trash2,
  Wand2,
  Search,
  Filter,
  SortAsc,
  MoreVertical,
  Eye,
  Heart,
  Share2
} from 'lucide-react'
import { auth, db } from '@appFirebase/firebase'
import ThemeToggle from '@components/ThemeToggle'
import './Dashboard.css'

const formatDateRelative = (value) => {
  if (!value) return 'Just now'
  const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value)
  const now = new Date()
  const diff = now - date

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 7) return date.toLocaleDateString()
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  return 'Just now'
}

// Animated Project Card
const ProjectCard = ({
  room,
  index,
  onEdit,
  onDelete,
  onOpen
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [showActions, setShowActions] = useState(false)

  const cardControls = useAnimation()

  const handleHoverStart = () => {
    setIsHovered(true)
    cardControls.start({ scale: 1.02, y: -5 })
  }

  const handleHoverEnd = () => {
    setIsHovered(false)
    cardControls.start({ scale: 1, y: 0 })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.5 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      className="project-card"
      onHoverStart={handleHoverStart}
      onHoverEnd={handleHoverEnd}
    >
      <motion.div
        className="project-card-image"
        style={{ background: room.snapshot?.colors?.primary || '#f0f0f0' }}
        animate={{
          scale: isHovered ? 1.1 : 1,
          boxShadow: isHovered ? '0 10px 40px rgba(0,0,0,0.2)' : '0 4px 16px rgba(0,0,0,0.1)'
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="project-card-image-placeholder">
          {room.name?.charAt(0)?.toUpperCase() || 'P'}
        </div>
        <div className="project-card-badge">
          {room.snapshot?.cameraMode === 'firstPerson' ? '3D' : '2D'}
        </div>
        <motion.button
          className="project-card-quick-action"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => { e.stopPropagation(); onOpen(room) }}
        >
          <Eye size={16} />
        </motion.button>
      </motion.div>

      <div className="project-card-content">
        <div className="project-card-header">
          <h3 className="project-card-title">
            {room.name || `Project ${index + 1}`}
          </h3>
          <motion.div
            className="project-card-actions"
            initial={{ opacity: 0 }}
            animate={{ opacity: showActions ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <button
              className="project-card-action-btn"
              onClick={(e) => { e.stopPropagation(); onEdit(room) }}
            >
              <Pencil size={14} />
            </button>
            <button
              className="project-card-action-btn project-card-action-btn-danger"
              onClick={(e) => { e.stopPropagation(); onDelete(room) }}
            >
              <Trash2 size={14} />
            </button>
          </motion.div>
          <button
            className="project-card-more-btn"
            onClick={(e) => { e.stopPropagation(); setShowActions(!showActions) }}
          >
            <MoreVertical size={16} />
          </button>
        </div>

        <div className="project-card-meta">
          <span className="project-card-date">
            <Clock size={12} />
            {formatDateRelative(room.createdAt)}
          </span>
          {room.snapshot?.dimensions && (
            <span className="project-card-dimensions">
              {room.snapshot.dimensions.width}m x {room.snapshot.dimensions.depth}m
            </span>
          )}
        </div>

        <div className="project-card-stats">
          <span className="project-card-stat">
            <Cuboid size={14} />
            {room.snapshot?.furnitureCount || 0}
          </span>
          <span className="project-card-stat">
            <Wand2 size={14} />
            {room.snapshot?.cameraMode === 'firstPerson' ? '3D' : '2D'}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

// Empty State
const EmptyState = ({ onCreate }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="empty-state"
    >
      <motion.div
        className="empty-state-icon"
        initial={{ rotate: -20, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5, type: 'spring', stiffness: 200 }}
      >
        <LayoutGrid size={48} />
      </motion.div>
      <h2 className="empty-state-title">No Projects Yet</h2>
      <p className="empty-state-description">
        Start creating your first interior design project
      </p>
      <motion.button
        className="empty-state-button"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        onClick={onCreate}
      >
        <Plus size={18} />
        Create New Project
      </motion.button>
    </motion.div>
  )
}

// Create Project Modal
const CreateProjectModal = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('')
  const [width, setWidth] = useState(18)
  const [depth, setDepth] = useState(14)
  const [pixelsPerMeter, setPixelsPerMeter] = useState(36)
  const [template, setTemplate] = useState('blank')

  const handleSubmit = (e) => {
    e.preventDefault()
    onCreate({ name, width, depth, pixelsPerMeter, template })
    setName('')
    setWidth(18)
    setDepth(14)
    setPixelsPerMeter(36)
    setTemplate('blank')
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="modal-overlay"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">Create New Project</h2>
              <button className="modal-close" onClick={onClose}>
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="modal-field">
                <label className="modal-label">Project Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Living Room"
                  className="modal-input"
                />
              </div>

              <div className="modal-field">
                <label className="modal-label">Template</label>
                <select
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  className="modal-select"
                >
                  <option value="blank">Blank Project</option>
                  <option value="living-room">Living Room</option>
                  <option value="bedroom">Bedroom</option>
                  <option value="kitchen">Kitchen</option>
                  <option value="office">Office</option>
                </select>
              </div>

              <div className="modal-fields-grid">
                <div className="modal-field">
                  <label className="modal-label">Width (m)</label>
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
                    min="1"
                    max="100"
                    step="0.1"
                    className="modal-input"
                  />
                </div>
                <div className="modal-field">
                  <label className="modal-label">Depth (m)</label>
                  <input
                    type="number"
                    value={depth}
                    onChange={(e) => setDepth(parseFloat(e.target.value) || 0)}
                    min="1"
                    max="100"
                    step="0.1"
                    className="modal-input"
                  />
                </div>
              </div>

              <div className="modal-field">
                <label className="modal-label">Grid Density</label>
                <input
                  type="range"
                  value={pixelsPerMeter}
                  onChange={(e) => setPixelsPerMeter(parseInt(e.target.value))}
                  min="16"
                  max="140"
                  step="2"
                  className="modal-range"
                />
                <span className="modal-range-value">{pixelsPerMeter} px/m</span>
              </div>

              <div className="modal-actions">
                <button type="button" className="modal-button-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="modal-button-primary">
                  <Plus size={16} />
                  Create Project
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Confirm Delete Modal
const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, itemName }) => {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="modal-overlay"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="modal-content modal-content-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">Confirm Delete</h2>
              <button className="modal-close" onClick={onClose}>
                &times;
              </button>
            </div>

            <div className="modal-body">
              <p>Are you sure you want to delete "{itemName}"? This action cannot be undone.</p>
            </div>

            <div className="modal-actions">
              <button type="button" className="modal-button-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="button" className="modal-button-danger" onClick={onConfirm}>
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Edit Project Modal
const EditProjectModal = ({ isOpen, onClose, onSave, project }) => {
  const [name, setName] = useState(project?.name || '')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({ ...project, name })
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="modal-overlay"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">Edit Project</h2>
              <button className="modal-close" onClick={onClose}>
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="modal-field">
                <label className="modal-label">Project Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Living Room"
                  className="modal-input"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="modal-button-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="modal-button-primary">
                  <Pencil size={16} />
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Dashboard Header
const DashboardHeader = ({ user, onLogout, onCreate, isGuest }) => {
  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="dashboard-header"
    >
      <div className="dashboard-header-left">
        <motion.div
          className="dashboard-logo"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Cuboid size={24} />
          <span>ROOMETRY</span>
        </motion.div>
        <p className="dashboard-welcome">
          Welcome back, {user?.displayName || user?.email || 'User'}
        </p>
      </div>

      <div className="dashboard-header-right">
        <div className="dashboard-search">
          <Search size={16} />
          <input type="text" placeholder="Search projects..." />
        </div>
        <ThemeToggle />
        <motion.button
          className="dashboard-button-primary"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          onClick={onCreate}
        >
          <Plus size={16} />
          New Project
        </motion.button>
        <motion.button
          className="dashboard-button-secondary"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={onLogout}
        >
          <LogOut size={16} />
          {isGuest ? 'Exit' : 'Logout'}
        </motion.button>
      </div>
    </motion.header>
  )
}

// Quick Actions
const QuickActions = ({ onAction }) => {
  const actions = [
    { icon: LayoutGrid, label: 'New Project', value: 'new' },
  ]

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="quick-actions"
    >
      {actions.map((action, i) => {
        const Icon = action.icon
        return (
          <motion.button
            key={action.value}
            className="quick-action"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
            whileHover={{ scale: 1.05, y: -3 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onAction(action.value)}
          >
            <Icon size={20} />
            <span>{action.label}</span>
          </motion.button>
        )
      })}
    </motion.div>
  )
}

// Projects Grid
const ProjectsGrid = ({ rooms, onEdit, onDelete, onOpen, loading }) => {

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="loading-state"
      >
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="loading-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.5 }}
          />
        ))}
      </motion.div>
    )
  }

  if (rooms.length === 0) {
    return <EmptyState onCreate={() => onEdit(null)} />
  }

  return (
    <motion.div
      className="projects-grid"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <AnimatePresence mode="popLayout">
        {rooms.map((room, i) => (
          <ProjectCard
            key={room.id}
            room={room}
            index={i}
            onEdit={() => onEdit(room)}
            onDelete={() => onDelete(room)}
            onOpen={() => onOpen(room)}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  )
}

// Main Dashboard Component
function Dashboard() {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [isGuestMode, setIsGuestMode] = useState(false)
  const [profileLabel, setProfileLabel] = useState('')
  const [dashboardError, setDashboardError] = useState('')

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [roomToDelete, setRoomToDelete] = useState(null)
  const [roomToEdit, setRoomToEdit] = useState(null)

  const loadCloudProjects = useCallback(async (user) => {
    try {
      const roomsQuery = query(
        collection(db, 'rooms'),
        where('uid', '==', user.uid),
        orderBy('createdAt', 'desc'),
      )
      const snapshot = await getDocs(roomsQuery)
      const mappedRooms = snapshot.docs.map((entry) => ({
        id: entry.id,
        ...entry.data(),
      }))
      setRooms(mappedRooms)
    } catch (error) {
      console.error('Error fetching rooms:', error)
    }
  }, [])

  useEffect(() => {
    const guestEnabled = window.localStorage.getItem('roometry_guest_mode') === 'true'

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true)

      if (user) {
        setIsGuestMode(false)
        setProfileLabel(user.email ?? 'Authenticated user')

        await loadCloudProjects(user)
        setLoading(false)

        return
      }

      if (guestEnabled) {
        setIsGuestMode(true)
        setProfileLabel('Guest mode')

        try {
          const storedRooms = JSON.parse(window.localStorage.getItem('roometry_guest_rooms') ?? '[]')
          setRooms(Array.isArray(storedRooms) ? storedRooms : [])
        } catch {
          setRooms([])
        } finally {
          setLoading(false)
        }

        return
      }

      navigate('/login', { replace: true, state: { from: '/dashboard' } })
      setRooms([])
      setLoading(false)
    })

    return () => unsubscribe()
  }, [loadCloudProjects, navigate])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      window.localStorage.removeItem('roometry_guest_mode')
      navigate('/', { replace: true })
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const handleCreateProject = async (config) => {
    setDashboardError('')
    const projectRoomId = `room_${Date.now()}`
    const roomWidth = Math.min(100, Math.max(1, Number(config.width) || 18))
    const roomDepth = Math.min(100, Math.max(1, Number(config.depth) || 14))
    const pixelsPerMeter = Math.min(140, Math.max(16, Number(config.pixelsPerMeter) || 36))
    const margin = 2
    const projectName = (config.name || '').trim() || `Project ${Date.now()}`
    const newRoom = {
      id: projectRoomId,
      name: projectName,
      createdAt: new Date(),
      updatedAt: new Date(),
      roomCount: 1,
      snapshot: {
        room: { width: roomWidth, depth: roomDepth, height: 2.7 },
        walls: { north: {}, south: {}, east: {}, west: {} },
        floor: { color: '#f5f5f5' },
        ceiling: { color: '#ffffff' },
        furniture: [],
        cameraMode: 'orbit',
        dimensions: { width: roomWidth, depth: roomDepth },
        furnitureCount: 0,
        colors: { primary: '#c07a45' }
      },
      floorPlan: {
        rooms: [{
          id: projectRoomId,
          name: projectName,
          x: margin,
          z: margin,
          width: roomWidth,
          depth: roomDepth,
          height: 2.7,
          wallThickness: 0.15,
          doors: []
        }],
        selectedRoomId: projectRoomId,
        uiMode: 'draw',
        livePreview: false,
        canvas: {
          width: roomWidth + margin * 2,
          depth: roomDepth + margin * 2,
          pixelsPerMeter,
        },
        snapEnabled: true,
        snapStep: 0.5,
        constraintMessage: null
      }
    }

    try {
      if (isGuestMode) {
        const stored = JSON.parse(window.localStorage.getItem('roometry_guest_rooms') ?? '[]')
        const updated = [newRoom, ...(Array.isArray(stored) ? stored : [])]
        window.localStorage.setItem('roometry_guest_rooms', JSON.stringify(updated))
        setRooms(updated)
      } else {
        if (!auth.currentUser) {
          throw new Error('Sign in or continue as a guest before creating a project.')
        }

        const docRef = doc(collection(db, 'rooms'))
        await setDoc(docRef, {
          ...newRoom,
          uid: auth.currentUser.uid,
          id: docRef.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        newRoom.id = docRef.id
        setRooms([newRoom, ...rooms])
      }

      navigate(`/app/${encodeURIComponent(newRoom.id)}`, {
        replace: true,
        state: { snapshot: newRoom.snapshot, floorPlan: newRoom.floorPlan },
      })
    } catch (error) {
      console.error('Error creating project:', error)
      setDashboardError(error.message || 'Could not create the project. Please try again.')
    }
  }

  const handleOpenProject = (room) => {
    navigate(`/app/${encodeURIComponent(room.id)}`, {
      state: { snapshot: room.snapshot, floorPlan: room.floorPlan },
    })
  }

  const handleDeleteProject = async (room) => {
    setRoomToDelete(room)
    setIsDeleteModalOpen(true)
  }

  const confirmDeleteProject = async () => {
    if (!roomToDelete) return

    try {
      if (isGuestMode) {
        const stored = JSON.parse(window.localStorage.getItem('roometry_guest_rooms') ?? '[]')
        const updated = stored.filter(r => r.id !== roomToDelete.id)
        window.localStorage.setItem('roometry_guest_rooms', JSON.stringify(updated))
        setRooms(updated)
      } else {
        await deleteDoc(doc(db, 'rooms', roomToDelete.id))
        setRooms(rooms.filter(r => r.id !== roomToDelete.id))
      }
      setIsDeleteModalOpen(false)
      setRoomToDelete(null)
    } catch (error) {
      console.error('Error deleting project:', error)
    }
  }

  const handleEditProject = (room) => {
    setRoomToEdit(room)
    setIsEditModalOpen(true)
  }

  const confirmEditProject = async (updatedRoom) => {
    try {
      if (isGuestMode) {
        const stored = JSON.parse(window.localStorage.getItem('roometry_guest_rooms') ?? '[]')
        const updated = stored.map(r => r.id === updatedRoom.id ? updatedRoom : r)
        window.localStorage.setItem('roometry_guest_rooms', JSON.stringify(updated))
        setRooms(updated)
      } else {
        await updateDoc(doc(db, 'rooms', updatedRoom.id), {
          name: updatedRoom.name,
          updatedAt: new Date()
        })
        setRooms(rooms.map(r => r.id === updatedRoom.id ? updatedRoom : r))
      }
      setIsEditModalOpen(false)
      setRoomToEdit(null)
    } catch (error) {
      console.error('Error updating project:', error)
    }
  }

  const handleQuickAction = (action) => {
    switch (action) {
      case 'new':
        setIsCreateModalOpen(true)
        break
    }
  }

  return (
    <div className="dashboard-shell">
      {/* Header */}
      <DashboardHeader
        user={{ displayName: profileLabel }}
        onLogout={handleLogout}
        onCreate={() => setIsCreateModalOpen(true)}
        isGuest={isGuestMode}
      />

      {dashboardError && (
        <div className="dashboard-error" role="alert">
          <span>{dashboardError}</span>
          <button type="button" onClick={() => setDashboardError('')}>
            Dismiss
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <QuickActions onAction={handleQuickAction} />

      {/* Projects Section */}
      <motion.div
        className="dashboard-main"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className="dashboard-section-header">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            Your Projects
          </motion.h2>
          <motion.div
            className="dashboard-section-actions"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <button className="dashboard-sort-btn">
              <SortAsc size={14} />
              Sort
            </button>
            <button className="dashboard-filter-btn">
              <Filter size={14} />
              Filter
            </button>
          </motion.div>
        </div>

        <ProjectsGrid
          rooms={rooms}
          loading={loading}
          onEdit={handleEditProject}
          onDelete={handleDeleteProject}
          onOpen={handleOpenProject}
        />
      </motion.div>

      {/* Modals */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateProject}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteProject}
        itemName={roomToDelete?.name || 'this project'}
      />

      <EditProjectModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={confirmEditProject}
        project={roomToEdit}
      />
    </div>
  )
}

export default Dashboard