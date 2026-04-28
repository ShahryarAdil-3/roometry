import React, { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc, where } from 'firebase/firestore'
import { Clock, Cuboid, LayoutGrid, LogOut, Pencil, Plus, Trash2, Wand2 } from 'lucide-react'
import { auth, db } from '../firebase/firebase'

const formatCreatedAt = (value) => {
  if (!value) {
    return 'Just now'
  }

  if (typeof value.toDate === 'function') {
    return value.toDate().toLocaleDateString()
  }

  const parsed = new Date(value)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString()
  }

  return 'Just now'
}

function Dashboard() {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [isGuestMode, setIsGuestMode] = useState(false)
  const [profileLabel, setProfileLabel] = useState('')
  const [editingRoom, setEditingRoom] = useState(null)
  const [editDraft, setEditDraft] = useState({
    name: '',
    width: 18,
    depth: 14,
    pixelsPerMeter: 36,
  })

  useEffect(() => {
    const guestEnabled = window.localStorage.getItem('roometry_guest_mode') === 'true'

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true)

      if (user) {
        setIsGuestMode(false)
        setProfileLabel(user.email ?? 'Authenticated user')

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
        } finally {
          setLoading(false)
        }

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

      setRooms([])
      setLoading(false)
      navigate('/login')
    })

    return () => unsubscribe()
  }, [navigate])

  const handleCreate = () => {
    navigate(`/app?new=1&nonce=${Date.now().toString(36)}`)
  }

  const handleOpenRoom = (roomId) => {
    if (roomId) {
      navigate(`/app?id=${roomId}`)
      return
    }

    navigate('/app')
  }

  const openEditModal = (event, room) => {
    event.stopPropagation()

    const canvas = room.floorPlan?.canvas ?? {}
    setEditingRoom(room)
    setEditDraft({
      name: room.name || 'Untitled Project',
      width: Number(canvas.width) || 18,
      depth: Number(canvas.depth) || 14,
      pixelsPerMeter: Number(canvas.pixelsPerMeter) || 36,
    })
  }

  const closeEditModal = () => {
    setEditingRoom(null)
  }

  const handleSaveEdit = async (event) => {
    event.preventDefault()

    if (!editingRoom) {
      return
    }

    const nextName = (editDraft.name || 'Untitled Project').trim() || 'Untitled Project'
    const nextWidth = Number(editDraft.width)
    const nextDepth = Number(editDraft.depth)
    const nextPixelsPerMeter = Number(editDraft.pixelsPerMeter)

    if (isGuestMode) {
      const nextRooms = rooms.map((room) => {
        if (room.id !== editingRoom.id) {
          return room
        }

        return {
          ...room,
          name: nextName,
          updatedAt: new Date().toISOString(),
          floorPlan: {
            ...room.floorPlan,
            canvas: {
              ...room.floorPlan?.canvas,
              width: nextWidth,
              depth: nextDepth,
              pixelsPerMeter: nextPixelsPerMeter,
            },
          },
        }
      })

      setRooms(nextRooms)
      window.localStorage.setItem('roometry_guest_rooms', JSON.stringify(nextRooms))
      closeEditModal()
      return
    }

    await updateDoc(doc(db, 'rooms', editingRoom.id), {
      name: nextName,
      updatedAt: new Date().toISOString(),
      'floorPlan.canvas.width': nextWidth,
      'floorPlan.canvas.depth': nextDepth,
      'floorPlan.canvas.pixelsPerMeter': nextPixelsPerMeter,
    })

    setRooms((previous) =>
      previous.map((room) => {
        if (room.id !== editingRoom.id) {
          return room
        }

        return {
          ...room,
          name: nextName,
          updatedAt: new Date().toISOString(),
          floorPlan: {
            ...room.floorPlan,
            canvas: {
              ...room.floorPlan?.canvas,
              width: nextWidth,
              depth: nextDepth,
              pixelsPerMeter: nextPixelsPerMeter,
            },
          },
        }
      }),
    )

    closeEditModal()
  }

  const metrics = useMemo(
    () => [
      { label: 'Saved Rooms', value: String(rooms.length).padStart(2, '0') },
      { label: 'Profile', value: isGuestMode ? 'Guest' : 'Cloud' },
      { label: 'Workflow', value: '2D -> 3D' },
    ],
    [isGuestMode, rooms.length],
  )

  const handleDeleteRoom = async (event, roomId) => {
    event.stopPropagation()

    if (isGuestMode) {
      const nextRooms = rooms.filter((room) => room.id !== roomId)
      setRooms(nextRooms)
      window.localStorage.setItem('roometry_guest_rooms', JSON.stringify(nextRooms))
      return
    }

    await deleteDoc(doc(db, 'rooms', roomId))
    setRooms((previous) => previous.filter((room) => room.id !== roomId))
  }

  const handleLogout = async () => {
    if (isGuestMode) {
      window.localStorage.removeItem('roometry_guest_mode')
      navigate('/')
      return
    }

    await signOut(auth)
    navigate('/')
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="premium-grid-bg pointer-events-none absolute inset-0 opacity-[0.15]" />
      <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-cyan-300/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-16 bottom-8 h-64 w-64 rounded-full bg-emerald-300/10 blur-[130px]" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-12 pt-8 md:px-10 md:pt-10">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
          className="surface-glass mb-8 p-6 md:p-7"
        >
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100/90">Project Dashboard</p>
              <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl md:text-5xl">Your saved spatial concepts</h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
                Organize rooms, resume active drafts, and launch directly into the editor when you are ready to refine.
              </p>
              <p className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-400">{profileLabel || 'Loading profile'}</p>
            </div>

            <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-cyan-200/45 hover:bg-white/[0.09]"
              >
                <LogOut size={15} />
                Logout
              </button>

              <button
                type="button"
                onClick={handleCreate}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
              >
                <Plus size={16} />
                Create New
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {metrics.map((item) => (
              <div key={item.label} className="surface-glass-soft p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
                <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </motion.header>

        {loading ? (
          <div className="surface-glass flex min-h-72 flex-col items-center justify-center gap-4 p-8 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
              className="rounded-2xl border border-cyan-100/20 bg-cyan-200/10 p-3"
            >
              <LayoutGrid size={28} className="text-cyan-100" />
            </motion.div>
            <p className="text-sm text-slate-300">Loading your saved rooms...</p>
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white md:text-2xl">Saved Rooms</h2>
              <span className="text-xs uppercase tracking-[0.18em] text-slate-400">Click a card to open</span>
            </div>

            <motion.div
              layout
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              <motion.button
                type="button"
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleCreate}
                className="surface-glass group flex min-h-64 flex-col items-center justify-center border-dashed p-5 text-center transition hover:border-cyan-200/55"
              >
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-200/30 bg-cyan-200/10 text-cyan-100">
                  <Plus size={20} />
                </span>
                <p className="text-base font-semibold text-white">Create New Room</p>
                <p className="mt-2 text-sm text-slate-300">Start a fresh 2D layout and preview it in 3D instantly.</p>
              </motion.button>

              <AnimatePresence>
                {rooms.map((room, index) => (
                  <motion.article
                    key={room.id}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ delay: index * 0.03, duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
                    className="surface-glass group relative cursor-pointer overflow-hidden p-0"
                    onClick={() => handleOpenRoom(room.id)}
                  >
                    <div className="relative flex aspect-video items-center justify-center overflow-hidden border-b border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/55 to-cyan-950/35">
                      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(94,234,212,0.2),transparent_45%)]" />
                      <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-100/20 bg-cyan-200/10 text-cyan-100">
                        <Cuboid size={24} />
                      </span>
                    </div>

                    <div className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="line-clamp-1 text-base font-semibold text-white">{room.name || 'Untitled Room'}</h3>
                        <span className="rounded-full border border-white/15 bg-white/[0.03] px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-slate-300">
                          2D/3D
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <Clock size={12} />
                          {formatCreatedAt(room.createdAt)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Wand2 size={12} />
                          Ready
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(event) => openEditModal(event, room)}
                      className="absolute right-14 top-3 rounded-lg border border-cyan-200/25 bg-cyan-300/14 p-2 text-cyan-100 opacity-0 transition hover:bg-cyan-300/28 group-hover:opacity-100"
                      aria-label="Edit room details"
                    >
                      <Pencil size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={(event) => handleDeleteRoom(event, room.id)}
                      className="absolute right-3 top-3 rounded-lg border border-rose-200/25 bg-rose-300/15 p-2 text-rose-100 opacity-0 transition hover:bg-rose-300/28 group-hover:opacity-100"
                      aria-label="Delete room"
                    >
                      <Trash2 size={14} />
                    </button>
                  </motion.article>
                ))}
              </AnimatePresence>
            </motion.div>

            {!rooms.length && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="surface-glass mt-6 flex min-h-44 flex-col items-center justify-center gap-3 p-8 text-center"
              >
                <span className="rounded-2xl border border-white/15 bg-white/[0.04] p-3">
                  <LayoutGrid size={22} className="text-slate-300" />
                </span>
                <p className="text-lg font-semibold text-white">No rooms yet</p>
                <p className="max-w-md text-sm text-slate-300">
                  Create your first layout and build a polished transition from 2D planning into 3D visualization.
                </p>
              </motion.div>
            )}
          </>
        )}

        {editingRoom && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/75 px-4">
            <form
              onSubmit={handleSaveEdit}
              className="surface-glass w-full max-w-xl space-y-4 p-5 md:p-6"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100/90">Edit Project</p>
                <h3 className="mt-1 text-2xl font-semibold text-white">Update name and canvas size</h3>
              </div>

              <label className="block space-y-1 text-xs uppercase tracking-[0.12em] text-slate-300">
                Name
                <input
                  type="text"
                  value={editDraft.name}
                  onChange={(event) => setEditDraft((current) => ({ ...current, name: event.target.value }))}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-200/45"
                  required
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block space-y-1 text-xs uppercase tracking-[0.12em] text-slate-300">
                  Width (m)
                  <input
                    type="number"
                    min="6"
                    max="200"
                    step="1"
                    value={editDraft.width}
                    onChange={(event) => setEditDraft((current) => ({ ...current, width: Number(event.target.value) }))}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-200/45"
                    required
                  />
                </label>

                <label className="block space-y-1 text-xs uppercase tracking-[0.12em] text-slate-300">
                  Depth (m)
                  <input
                    type="number"
                    min="6"
                    max="200"
                    step="1"
                    value={editDraft.depth}
                    onChange={(event) => setEditDraft((current) => ({ ...current, depth: Number(event.target.value) }))}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-200/45"
                    required
                  />
                </label>

                <label className="block space-y-1 text-xs uppercase tracking-[0.12em] text-slate-300">
                  PPM
                  <input
                    type="number"
                    min="16"
                    max="140"
                    step="1"
                    value={editDraft.pixelsPerMeter}
                    onChange={(event) =>
                      setEditDraft((current) => ({ ...current, pixelsPerMeter: Number(event.target.value) }))
                    }
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-200/45"
                    required
                  />
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
                >
                  Save changes
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard