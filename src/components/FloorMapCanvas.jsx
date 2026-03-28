import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSceneStore } from '../store/useSceneStore'

const MIN_DRAW_SIZE = 16
const MIN_ROOM_SIZE = 1

const RESIZE_HANDLES = [
  'n',
  's',
  'e',
  'w',
  'ne',
  'nw',
  'se',
  'sw',
]

const MIN_VIEW_ZOOM = 0.5
const MAX_VIEW_ZOOM = 4
const NATIVE_SCROLL_CONTENT_SIZE = 3200

const toWorldFromScreen = (point, rect, pixelsPerMeter, view) => ({
  x: view.x + (point.x - rect.left - rect.width / 2) / (pixelsPerMeter * view.zoom),
  z: view.z + (point.y - rect.top - rect.height / 2) / (pixelsPerMeter * view.zoom),
})

const toScreenFromWorld = (point, rect, pixelsPerMeter, view) => ({
  x: rect.width / 2 + (point.x - view.x) * pixelsPerMeter * view.zoom,
  y: rect.height / 2 + (point.z - view.z) * pixelsPerMeter * view.zoom,
})

const roundToStep = (value, step) => {
  if (!Number.isFinite(step) || step <= 0) {
    return value
  }

  return Math.round(value / step) * step
}

export default function FloorMapCanvas() {
  const floorPlan = useSceneStore((state) => state.floorPlan)
  const createRoom = useSceneStore((state) => state.createRoom)
  const moveRoom = useSceneStore((state) => state.moveRoom)
  const updateRoom = useSceneStore((state) => state.updateRoom)
  const selectRoom = useSceneStore((state) => state.selectRoom)
  const selectedRoom = useMemo(
    () => floorPlan.rooms.find((room) => room.id === floorPlan.selectedRoomId) ?? null,
    [floorPlan.rooms, floorPlan.selectedRoomId],
  )

  const canvas = floorPlan.canvas ?? {
    width: 18,
    depth: 14,
    pixelsPerMeter: 36,
  }
  const snapEnabled = floorPlan.snapEnabled ?? true
  const snapStep = floorPlan.snapStep ?? 0.1

  const canvasRef = useRef(null)
  const nativeScrollRef = useRef(null)
  const [canvasRect, setCanvasRect] = useState(null)
  const [draftRect, setDraftRect] = useState(null)
  const [dragState, setDragState] = useState(null)
  const [resizeState, setResizeState] = useState(null)
  const [panState, setPanState] = useState(null)
  const [view, setView] = useState({ x: 0, z: 0, zoom: 1 })

  const pixelsPerMeter = canvas.pixelsPerMeter
  const canvasAspectRatio = `${canvas.width} / ${canvas.depth}`
  const snap = useCallback(
    (value) => (snapEnabled ? roundToStep(value, snapStep) : value),
    [snapEnabled, snapStep],
  )
  const horizontalLimit = canvas.width / 2
  const verticalLimit = canvas.depth / 2

  const clampView = useCallback(
    (nextView) => ({
      x: Math.max(-horizontalLimit, Math.min(horizontalLimit, nextView.x)),
      z: Math.max(-verticalLimit, Math.min(verticalLimit, nextView.z)),
      zoom: Math.max(MIN_VIEW_ZOOM, Math.min(MAX_VIEW_ZOOM, nextView.zoom)),
    }),
    [horizontalLimit, verticalLimit],
  )

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

  useEffect(() => {
    const element = nativeScrollRef.current
    if (!element) {
      return
    }

    const centerLeft = (NATIVE_SCROLL_CONTENT_SIZE - element.clientWidth) / 2
    const centerTop = (NATIVE_SCROLL_CONTENT_SIZE - element.clientHeight) / 2
    const nextLeft = centerLeft + view.x * pixelsPerMeter * view.zoom
    const nextTop = centerTop + view.z * pixelsPerMeter * view.zoom

    if (Math.abs(element.scrollLeft - nextLeft) > 1) {
      element.scrollLeft = nextLeft
    }
    if (Math.abs(element.scrollTop - nextTop) > 1) {
      element.scrollTop = nextTop
    }
  }, [pixelsPerMeter, view.x, view.z, view.zoom])

  const handleNativeScroll = (event) => {
    const element = event.currentTarget
    const centerLeft = (NATIVE_SCROLL_CONTENT_SIZE - element.clientWidth) / 2
    const centerTop = (NATIVE_SCROLL_CONTENT_SIZE - element.clientHeight) / 2
    const nextX = (element.scrollLeft - centerLeft) / (pixelsPerMeter * view.zoom)
    const nextZ = (element.scrollTop - centerTop) / (pixelsPerMeter * view.zoom)

    setView((current) =>
      clampView({
        ...current,
        x: nextX,
        z: nextZ,
      }),
    )
  }

  const beginDraw = (event) => {
    if (dragState || resizeState || panState) {
      return
    }

    if (event.button === 1 || event.button === 2 || (event.button === 0 && event.shiftKey)) {
      if (!canvasRect) {
        return
      }

      setPanState({
        startX: event.clientX,
        startY: event.clientY,
        startView: view,
      })
      return
    }

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

      const startWorld = toWorldFromScreen(current.start, current.rect, pixelsPerMeter, view)
      const endWorld = toWorldFromScreen(current.current, current.rect, pixelsPerMeter, view)
      const minX = snap(Math.min(startWorld.x, endWorld.x))
      const maxX = snap(Math.max(startWorld.x, endWorld.x))
      const minZ = snap(Math.min(startWorld.z, endWorld.z))
      const maxZ = snap(Math.max(startWorld.z, endWorld.z))

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

  const beginRoomDrag = (event, room) => {
    if (event.button !== 0 || !canvasRect || resizeState) {
      return
    }

    event.stopPropagation()
    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    const worldPoint = toWorldFromScreen(
      {
        x: event.clientX,
        y: event.clientY,
      },
      canvasRect,
      pixelsPerMeter,
      view,
    )

    setDragState({
      roomId: room.id,
      pointerOffsetX: worldPoint.x - room.x,
      pointerOffsetZ: worldPoint.z - room.z,
    })
    selectRoom(room.id)
  }

  const beginRoomResize = (event, room, handle) => {
    if (event.button !== 0 || !canvasRect) {
      return
    }

    event.stopPropagation()
    event.preventDefault()

    const worldPoint = toWorldFromScreen(
      {
        x: event.clientX,
        y: event.clientY,
      },
      canvasRect,
      pixelsPerMeter,
      view,
    )

    setResizeState({
      roomId: room.id,
      handle,
      startWorld: worldPoint,
      origin: {
        x: room.x,
        z: room.z,
        width: room.width,
        depth: room.depth,
      },
    })
    setDragState(null)
    selectRoom(room.id)
  }

  const endPan = useCallback(() => {
    setPanState(null)
  }, [])

  useEffect(() => {
    if (!dragState || !canvasRect) {
      return undefined
    }

    const onMove = (event) => {
      const worldPoint = toWorldFromScreen(
        {
          x: event.clientX,
          y: event.clientY,
        },
        canvasRect,
        pixelsPerMeter,
        view,
      )

      moveRoom(
        dragState.roomId,
        snap(worldPoint.x - dragState.pointerOffsetX),
        snap(worldPoint.z - dragState.pointerOffsetZ),
      )
    }

    const onUp = () => {
      setDragState(null)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [canvasRect, dragState, moveRoom, pixelsPerMeter, snap, view])

  useEffect(() => {
    if (!resizeState || !canvasRect) {
      return undefined
    }

    const onMove = (event) => {
      const worldPoint = toWorldFromScreen(
        {
          x: event.clientX,
          y: event.clientY,
        },
        canvasRect,
        pixelsPerMeter,
        view,
      )

      const dx = worldPoint.x - resizeState.startWorld.x
      const dz = worldPoint.z - resizeState.startWorld.z
      const { origin, handle } = resizeState

      let nextX = origin.x
      let nextZ = origin.z
      let nextWidth = origin.width
      let nextDepth = origin.depth

      if (handle.includes('e')) {
        nextWidth = origin.width + dx
      }
      if (handle.includes('s')) {
        nextDepth = origin.depth + dz
      }
      if (handle.includes('w')) {
        nextX = origin.x + dx
        nextWidth = origin.width - dx
      }
      if (handle.includes('n')) {
        nextZ = origin.z + dz
        nextDepth = origin.depth - dz
      }

      if (nextWidth < MIN_ROOM_SIZE) {
        if (handle.includes('w')) {
          nextX = origin.x + (origin.width - MIN_ROOM_SIZE)
        }
        nextWidth = MIN_ROOM_SIZE
      }

      if (nextDepth < MIN_ROOM_SIZE) {
        if (handle.includes('n')) {
          nextZ = origin.z + (origin.depth - MIN_ROOM_SIZE)
        }
        nextDepth = MIN_ROOM_SIZE
      }

      updateRoom(resizeState.roomId, {
        x: snap(nextX),
        z: snap(nextZ),
        width: Math.max(MIN_ROOM_SIZE, snap(nextWidth)),
        depth: Math.max(MIN_ROOM_SIZE, snap(nextDepth)),
      })
    }

    const onUp = () => {
      setResizeState(null)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [canvasRect, pixelsPerMeter, resizeState, snap, updateRoom, view])

  useEffect(() => {
    if (!panState || !canvasRect) {
      return undefined
    }

    const onMove = (event) => {
      const dxPx = event.clientX - panState.startX
      const dzPx = event.clientY - panState.startY
      setView(clampView({
        ...panState.startView,
        x: panState.startView.x - dxPx / (pixelsPerMeter * panState.startView.zoom),
        z: panState.startView.z - dzPx / (pixelsPerMeter * panState.startView.zoom),
      }))
    }

    const onUp = () => {
      setPanState(null)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [canvasRect, clampView, panState, pixelsPerMeter])

  useEffect(() => {
    if (!floorPlan.selectedRoomId) {
      return undefined
    }

    const onKeyDown = (event) => {
      const targetTag = event.target?.tagName?.toLowerCase()
      if (targetTag === 'input' || targetTag === 'select' || targetTag === 'textarea') {
        return
      }

      let deltaX = 0
      let deltaZ = 0
      const baseStep = snapEnabled ? Math.max(snapStep, 0.1) : 0.5
      const step = event.shiftKey ? baseStep * 10 : baseStep

      if (event.key === 'ArrowLeft') {
        deltaX = -step
      } else if (event.key === 'ArrowRight') {
        deltaX = step
      } else if (event.key === 'ArrowUp') {
        deltaZ = -step
      } else if (event.key === 'ArrowDown') {
        deltaZ = step
      } else if (event.key.toLowerCase() === 'a') {
        deltaX = -step
      } else if (event.key.toLowerCase() === 'd') {
        deltaX = step
      } else if (event.key.toLowerCase() === 'w') {
        deltaZ = -step
      } else if (event.key.toLowerCase() === 's') {
        deltaZ = step
      } else {
        return
      }

      event.preventDefault()
      const room = floorPlan.rooms.find((item) => item.id === floorPlan.selectedRoomId)
      if (!room) {
        return
      }

      moveRoom(room.id, snap(room.x + deltaX), snap(room.z + deltaZ))
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [floorPlan.rooms, floorPlan.selectedRoomId, moveRoom, snap, snapEnabled, snapStep])

  const handleWheel = (event) => {
    if (!canvasRect) {
      return
    }

    event.preventDefault()
    const worldBefore = toWorldFromScreen(
      { x: event.clientX, y: event.clientY },
      canvasRect,
      pixelsPerMeter,
      view,
    )

    const zoomDelta = event.deltaY < 0 ? 1.12 : 0.9
    const nextZoom = Math.max(MIN_VIEW_ZOOM, Math.min(MAX_VIEW_ZOOM, view.zoom * zoomDelta))

    const relativeX = (event.clientX - canvasRect.left - canvasRect.width / 2) / (pixelsPerMeter * nextZoom)
    const relativeZ = (event.clientY - canvasRect.top - canvasRect.height / 2) / (pixelsPerMeter * nextZoom)

    setView(clampView({
      x: worldBefore.x - relativeX,
      z: worldBefore.z - relativeZ,
      zoom: nextZoom,
    }))
  }

  return (
    <section className="floor-map-shell">
      <header className="floor-map-header">
        <h1>Floor Map</h1>
        <p>
          1 meter equals {pixelsPerMeter} pixels. Drag on empty space to draw, drag a room to move,
          and collisions or boundary violations are blocked.
          {` `}
          {snapEnabled ? `Snapping: ${snapStep.toFixed(2)}m` : 'Snapping: off'}.
          {` `}
          Use arrows or WASD to nudge, hold Shift for bigger steps.
        </p>
        <div className="floor-map-view-tools">
          <button
            type="button"
            onClick={() => setView({ x: 0, z: 0, zoom: 1 })}
          >
            Reset View
          </button>
          <span>
            Zoom: {view.zoom.toFixed(2)}x | Pan: {view.x.toFixed(1)}m, {view.z.toFixed(1)}m
          </span>
        </div>
      </header>

      <div
        ref={canvasRef}
        className={`floor-map-canvas ${panState ? 'panning' : ''}`}
        style={{
          '--grid-size': `${pixelsPerMeter * view.zoom}px`,
          aspectRatio: canvasAspectRatio,
        }}
        onPointerDown={beginDraw}
        onPointerMove={updateDraw}
        onPointerUp={endDraw}
        onPointerLeave={() => {
          endDraw()
          endPan()
        }}
        onWheel={handleWheel}
        onClick={() => selectRoom(null)}
        onContextMenu={(event) => event.preventDefault()}
        role="application"
        aria-label="Floor map drawing canvas"
      >
        <div className="floor-map-grid" />

        {floorPlan.rooms.map((room) => {
          if (!canvasRect) {
            return null
          }

          const topLeft = toScreenFromWorld({ x: room.x, z: room.z }, canvasRect, pixelsPerMeter, view)

          return (
            <button
              key={room.id}
              type="button"
              className={`room-rect ${room.id === floorPlan.selectedRoomId ? 'selected' : ''}`}
              style={{
                left: `${topLeft.x}px`,
                top: `${topLeft.y}px`,
                width: `${room.width * pixelsPerMeter * view.zoom}px`,
                height: `${room.depth * pixelsPerMeter * view.zoom}px`,
              }}
              onClick={(event) => {
                event.stopPropagation()
                selectRoom(room.id)
              }}
              onPointerDown={(event) => beginRoomDrag(event, room)}
              title={`${room.name}: ${room.width.toFixed(1)}m x ${room.depth.toFixed(1)}m`}
            >
              <span>{room.name}</span>
              <small>
                {room.width.toFixed(1)}m x {room.depth.toFixed(1)}m
              </small>

              {room.id === floorPlan.selectedRoomId &&
                RESIZE_HANDLES.map((handle) => (
                  <i
                    key={`${room.id}-${handle}`}
                    className={`resize-handle resize-${handle}`}
                    onPointerDown={(event) => beginRoomResize(event, room, handle)}
                    aria-hidden="true"
                  />
                ))}
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

      <div className="floor-map-scrollbars" aria-label="Canvas navigation scrollbars">
        <div className="floor-map-scrollbars-title">Scrollbars (native): drag bars to pan view</div>
        <div
          ref={nativeScrollRef}
          className="floor-map-native-scroll"
          onScroll={handleNativeScroll}
          role="region"
          aria-label="Canvas native scroll region"
        >
          <div
            className="floor-map-native-scroll-content"
            style={{
              width: `${NATIVE_SCROLL_CONTENT_SIZE}px`,
              height: `${NATIVE_SCROLL_CONTENT_SIZE}px`,
            }}
          />
        </div>
      </div>

      <div className="floor-map-footnote">
        Canvas: {canvas.width.toFixed(1)}m x {canvas.depth.toFixed(1)}m
        {floorPlan.constraintMessage ? ` | ${floorPlan.constraintMessage}` : ''}
      </div>
    </section>
  )
}
