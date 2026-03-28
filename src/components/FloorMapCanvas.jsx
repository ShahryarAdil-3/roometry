import { useEffect, useMemo, useRef, useState } from 'react'
import { useSceneStore } from '../store/useSceneStore'

const GRID_SIZE = 40
const MIN_DRAW_SIZE = 16

const toWorldFromScreen = (point, rect) => ({
  x: (point.x - rect.left - rect.width / 2) / GRID_SIZE,
  z: (point.y - rect.top - rect.height / 2) / GRID_SIZE,
})

const toScreenFromWorld = (point, rect) => ({
  x: rect.width / 2 + point.x * GRID_SIZE,
  y: rect.height / 2 + point.z * GRID_SIZE,
})

export default function FloorMapCanvas() {
  const floorPlan = useSceneStore((state) => state.floorPlan)
  const createRoom = useSceneStore((state) => state.createRoom)
  const selectRoom = useSceneStore((state) => state.selectRoom)
  const selectedRoom = useMemo(
    () => floorPlan.rooms.find((room) => room.id === floorPlan.selectedRoomId) ?? null,
    [floorPlan.rooms, floorPlan.selectedRoomId],
  )

  const canvasRef = useRef(null)
  const [canvasRect, setCanvasRect] = useState(null)
  const [draftRect, setDraftRect] = useState(null)

  useEffect(() => {
    const element = canvasRef.current
    if (!element) {
      return undefined
    }

    const syncRect = () => {
      setCanvasRect(element.getBoundingClientRect())
    }

    syncRect()
    const observer = new ResizeObserver(syncRect)
    observer.observe(element)
    window.addEventListener('resize', syncRect)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', syncRect)
    }
  }, [])

  const beginDraw = (event) => {
    if (event.button !== 0) {
      return
    }

    const container = canvasRef.current
    if (!container) {
      return
    }

    const rect = container.getBoundingClientRect()
    const start = {
      x: event.clientX,
      y: event.clientY,
    }

    setDraftRect({
      start,
      current: start,
      rect,
    })
  }

  const updateDraw = (event) => {
    setDraftRect((current) => {
      if (!current) {
        return current
      }

      return {
        ...current,
        current: {
          x: event.clientX,
          y: event.clientY,
        },
      }
    })
  }

  const endDraw = () => {
    setDraftRect((current) => {
      if (!current) {
        return current
      }

      const widthPx = Math.abs(current.current.x - current.start.x)
      const heightPx = Math.abs(current.current.y - current.start.y)
      if (widthPx < MIN_DRAW_SIZE || heightPx < MIN_DRAW_SIZE) {
        return null
      }

      const startWorld = toWorldFromScreen(current.start, current.rect)
      const endWorld = toWorldFromScreen(current.current, current.rect)
      const minX = Math.min(startWorld.x, endWorld.x)
      const maxX = Math.max(startWorld.x, endWorld.x)
      const minZ = Math.min(startWorld.z, endWorld.z)
      const maxZ = Math.max(startWorld.z, endWorld.z)

      createRoom({
        x: minX,
        z: minZ,
        width: maxX - minX,
        depth: maxZ - minZ,
        height: selectedRoom?.height ?? 3,
        wallThickness: selectedRoom?.wallThickness ?? 0.12,
      })

      return null
    })
  }

  return (
    <section className="floor-map-shell">
      <header className="floor-map-header">
        <h1>Floor Map</h1>
        <p>Drag to draw a room rectangle, then select a room and visualize it in 3D.</p>
      </header>

      <div
        ref={canvasRef}
        className="floor-map-canvas"
        onPointerDown={beginDraw}
        onPointerMove={updateDraw}
        onPointerUp={endDraw}
        onPointerLeave={endDraw}
        onClick={() => selectRoom(null)}
        role="application"
        aria-label="Floor map drawing canvas"
      >
        <div className="floor-map-grid" />

        {floorPlan.rooms.map((room) => {
          if (!canvasRect) {
            return null
          }

          const topLeft = toScreenFromWorld({ x: room.x, z: room.z }, canvasRect)

          return (
            <button
              key={room.id}
              type="button"
              className={`room-rect ${room.id === floorPlan.selectedRoomId ? 'selected' : ''}`}
              style={{
                left: `${topLeft.x}px`,
                top: `${topLeft.y}px`,
                width: `${room.width * GRID_SIZE}px`,
                height: `${room.depth * GRID_SIZE}px`,
              }}
              onClick={(event) => {
                event.stopPropagation()
                selectRoom(room.id)
              }}
              onPointerDown={(event) => event.stopPropagation()}
              title={`${room.name}: ${room.width.toFixed(1)}m x ${room.depth.toFixed(1)}m`}
            >
              <span>{room.name}</span>
            </button>
          )
        })}

        {draftRect && (
          <div
            className="draft-rect"
            style={{
              left: `${Math.min(draftRect.start.x, draftRect.current.x) - draftRect.rect.left}px`,
              top: `${Math.min(draftRect.start.y, draftRect.current.y) - draftRect.rect.top}px`,
              width: `${Math.abs(draftRect.current.x - draftRect.start.x)}px`,
              height: `${Math.abs(draftRect.current.y - draftRect.start.y)}px`,
            }}
          />
        )}
      </div>
    </section>
  )
}
