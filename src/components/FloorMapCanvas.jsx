import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSceneStore } from '../store/useSceneStore'
import { ControlIcon } from './ui/ControlIcons'

const MIN_DRAW_SIZE = 16
const MIN_ROOM_SIZE = 1
const MIN_VIEW_ZOOM = 0
const MAX_VIEW_ZOOM = 4
const RULER_GUTTER = 18
const GRID_UNIT_METERS = 1

const RESIZE_HANDLES = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']

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

export default function FloorMapCanvas({ isTouchDevice = false }) {
  const floorPlan = useSceneStore((state) => state.floorPlan)
  const createRoom = useSceneStore((state) => state.createRoom)
  const moveRoom = useSceneStore((state) => state.moveRoom)
  const updateRoom = useSceneStore((state) => state.updateRoom)
  const selectRoom = useSceneStore((state) => state.selectRoom)
  const applySelectedRoomToScene = useSceneStore((state) => state.applySelectedRoomToScene)
  const setUiMode = useSceneStore((state) => state.setUiMode)
  const setCameraMode = useSceneStore((state) => state.setCameraMode)

  const selectedRoom = useMemo(
    () => floorPlan.rooms.find((room) => room.id === floorPlan.selectedRoomId) ?? null,
    [floorPlan.rooms, floorPlan.selectedRoomId],
  )

  const canvas = floorPlan.canvas ?? {
    width: 18,
    depth: 14,
    pixelsPerMeter: 36,
  }
  const canvasRef = useRef(null)
  const [canvasRect, setCanvasRect] = useState(null)
  const [draftRect, setDraftRect] = useState(null)
  const [dragState, setDragState] = useState(null)
  const [resizeState, setResizeState] = useState(null)
  const [panState, setPanState] = useState(null)
  const [view, setView] = useState({ x: 0, z: 0, zoom: 1 })
  const [showTopChrome, setShowTopChrome] = useState(true)
  const [showBottomChrome, setShowBottomChrome] = useState(true)

  const pixelsPerMeter = canvas.pixelsPerMeter
  const horizontalLimit = canvas.width / 2
  const verticalLimit = canvas.depth / 2
  const canvasFocusMode = !showTopChrome && !showBottomChrome

  const snap = useCallback((value) => roundToStep(value, GRID_UNIT_METERS), [])

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

  const endPan = useCallback(() => {
    setPanState(null)
  }, [])

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
      setView(
        clampView({
          ...panState.startView,
          x: panState.startView.x - dxPx / (pixelsPerMeter * panState.startView.zoom),
          z: panState.startView.z - dzPx / (pixelsPerMeter * panState.startView.zoom),
        }),
      )
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
      const step = event.shiftKey ? GRID_UNIT_METERS * 5 : GRID_UNIT_METERS

      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
        deltaX = -step
      } else if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
        deltaX = step
      } else if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') {
        deltaZ = -step
      } else if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') {
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
  }, [floorPlan.rooms, floorPlan.selectedRoomId, moveRoom, snap])

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

    const zoomFactor = Math.exp(-event.deltaY * 0.0015)
    const nextZoom = Math.max(MIN_VIEW_ZOOM, Math.min(MAX_VIEW_ZOOM, view.zoom * zoomFactor))

    const relativeX =
      (event.clientX - canvasRect.left - canvasRect.width / 2) / (pixelsPerMeter * nextZoom)
    const relativeZ =
      (event.clientY - canvasRect.top - canvasRect.height / 2) / (pixelsPerMeter * nextZoom)

    setView(
      clampView({
        x: worldBefore.x - relativeX,
        z: worldBefore.z - relativeZ,
        zoom: nextZoom,
      }),
    )
  }

  const toggleCanvasFocus = () => {
    if (canvasFocusMode) {
      setShowTopChrome(true)
      setShowBottomChrome(true)
      return
    }

    setShowTopChrome(false)
    setShowBottomChrome(false)
  }

  const zoomBy = (factor) => {
    setView((current) =>
      clampView({
        ...current,
        zoom: current.zoom * factor,
      }),
    )
  }

  const panBy = (dx, dz) => {
    setView((current) =>
      clampView({
        ...current,
        x: current.x + dx,
        z: current.z + dz,
      }),
    )
  }

  const resetView = () => {
    setView({ x: 0, z: 0, zoom: 1 })
  }

  const centerSelectedRoom = () => {
    if (!selectedRoom) {
      return
    }

    const roomCenterX = selectedRoom.x + selectedRoom.width / 2
    const roomCenterZ = selectedRoom.z + selectedRoom.depth / 2
    setView((current) =>
      clampView({
        ...current,
        x: roomCenterX,
        z: roomCenterZ,
      }),
    )
  }

  const quickVisualize = () => {
    if (!selectedRoom) {
      return
    }

    applySelectedRoomToScene()
    setCameraMode('orbit')
    setUiMode('visualize')
  }

  const rulerStep = GRID_UNIT_METERS

  const gridOffsets = useMemo(() => {
    const spacing = pixelsPerMeter * view.zoom
    if (!canvasRect || !Number.isFinite(spacing) || spacing <= 0) {
      return { x: 0, y: 0 }
    }

    const originX = canvasRect.width / 2 - view.x * spacing
    const originY = canvasRect.height / 2 - view.z * spacing

    return {
      x: ((originX % spacing) + spacing) % spacing,
      y: ((originY % spacing) + spacing) % spacing,
    }
  }, [canvasRect, pixelsPerMeter, view.x, view.z, view.zoom])

  const xTicks = useMemo(() => {
    if (!canvasRect) {
      return []
    }

    const scale = pixelsPerMeter * view.zoom
    const minVisible = view.x - canvasRect.width / (2 * scale)
    const maxVisible = view.x + canvasRect.width / (2 * scale)
    const start = Math.floor(minVisible / rulerStep) * rulerStep
    const ticks = []
    const majorStep = rulerStep * 5

    for (let value = start; value <= maxVisible + rulerStep; value += rulerStep) {
      const rounded = Number(value.toFixed(4))
      const left = canvasRect.width / 2 + (rounded - view.x) * scale - RULER_GUTTER
      const major = Math.abs(Math.round(rounded / majorStep) * majorStep - rounded) < 0.0001
      ticks.push({ value: rounded, left, major })
    }

    return ticks
  }, [canvasRect, pixelsPerMeter, rulerStep, view.x, view.zoom])

  const zTicks = useMemo(() => {
    if (!canvasRect) {
      return []
    }

    const scale = pixelsPerMeter * view.zoom
    const minVisible = view.z - canvasRect.height / (2 * scale)
    const maxVisible = view.z + canvasRect.height / (2 * scale)
    const start = Math.floor(minVisible / rulerStep) * rulerStep
    const ticks = []
    const majorStep = rulerStep * 5

    for (let value = start; value <= maxVisible + rulerStep; value += rulerStep) {
      const rounded = Number(value.toFixed(4))
      const top = canvasRect.height / 2 + (rounded - view.z) * scale - RULER_GUTTER
      const major = Math.abs(Math.round(rounded / majorStep) * majorStep - rounded) < 0.0001
      ticks.push({ value: rounded, top, major })
    }

    return ticks
  }, [canvasRect, pixelsPerMeter, rulerStep, view.z, view.zoom])

  return (
    <section className={`floor-map-shell ${showTopChrome ? '' : 'floor-map-shell-top-hidden'}`}>
      {showTopChrome && (
        <header className="floor-map-header">
          <h1 className="floor-map-title">
            <span className="icon-badge">
              <ControlIcon name="map" size={16} />
            </span>
            Floor Planner
          </h1>
          <p className="floor-map-description">
            1 meter equals {pixelsPerMeter} pixels. Drag on empty space to draw, drag a room to move,
            and collisions or boundary violations are blocked. Snapping is fixed to a 1m x 1m grid for
            precise alignment. Use arrows or WASD to nudge, hold Shift for bigger steps.
          </p>

          <div className="planner-pill-row">
            <span className="planner-pill">
              <ControlIcon name="workspace" size={14} />
              1m Grid Locked
            </span>
            <span className="planner-pill">
              <ControlIcon name="pan" size={14} />
              Shift + Drag to Pan
            </span>
            <span className="planner-pill">
              <ControlIcon name="zoom" size={14} />
              Wheel to Zoom
            </span>
          </div>

          <div className="floor-map-view-tools">
            <button type="button" onClick={() => setView({ x: 0, z: 0, zoom: 1 })}>
              <ControlIcon name="reset" size={14} />
              Reset View
            </button>
            <span className="floor-map-readout">
              <ControlIcon name="zoom" size={13} />
              Zoom: {view.zoom.toFixed(2)}x | Pan: {view.x.toFixed(1)}m, {view.z.toFixed(1)}m
            </span>
          </div>
        </header>
      )}

      <div className={`floor-map-main ${showBottomChrome ? '' : 'floor-map-main-bottom-hidden'}`}>
        <div
          ref={canvasRef}
          className={`floor-map-canvas ${panState ? 'panning' : ''}`}
          style={{
            '--grid-size': `${pixelsPerMeter * view.zoom}px`,
            '--grid-offset-x': `${gridOffsets.x}px`,
            '--grid-offset-y': `${gridOffsets.y}px`,
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
          <div
            className="floor-map-canvas-toolbar"
            role="toolbar"
            aria-label="Canvas visibility controls"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={`canvas-tool-btn ${showTopChrome ? '' : 'active'}`}
              onClick={() => setShowTopChrome((value) => !value)}
              title={showTopChrome ? 'Hide top panel' : 'Show top panel'}
              aria-label={showTopChrome ? 'Hide top panel' : 'Show top panel'}
            >
              <ControlIcon name={showTopChrome ? 'collapse-top' : 'expand-top'} size={14} />
            </button>

            <button
              type="button"
              className={`canvas-tool-btn ${showBottomChrome ? '' : 'active'}`}
              onClick={() => setShowBottomChrome((value) => !value)}
              title={showBottomChrome ? 'Hide bottom panel' : 'Show bottom panel'}
              aria-label={showBottomChrome ? 'Hide bottom panel' : 'Show bottom panel'}
            >
              <ControlIcon name={showBottomChrome ? 'collapse-bottom' : 'expand-bottom'} size={14} />
            </button>

            <button
              type="button"
              className={`canvas-tool-btn ${canvasFocusMode ? 'active' : ''}`}
              onClick={toggleCanvasFocus}
              title={canvasFocusMode ? 'Restore all planner panels' : 'Focus canvas only'}
              aria-label={canvasFocusMode ? 'Restore all planner panels' : 'Focus canvas only'}
            >
              <ControlIcon name={canvasFocusMode ? 'focus-off' : 'focus-on'} size={14} />
            </button>
          </div>

          {canvasFocusMode && (
            <div
              className="floor-map-focus-controls"
              role="toolbar"
              aria-label="Canvas focus quick actions"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="focus-action-btn"
                onClick={() => zoomBy(1.2)}
                title="Zoom in"
                aria-label="Zoom in"
              >
                <ControlIcon name="zoom-in" size={14} />
              </button>

              <button
                type="button"
                className="focus-action-btn"
                onClick={() => zoomBy(0.84)}
                title="Zoom out"
                aria-label="Zoom out"
              >
                <ControlIcon name="zoom-out" size={14} />
              </button>

              <button
                type="button"
                className="focus-action-btn"
                onClick={() => setView({ x: 0, z: 0, zoom: 1 })}
                title="Reset view"
                aria-label="Reset view"
              >
                <ControlIcon name="reset" size={14} />
              </button>

              <button
                type="button"
                className="focus-action-btn"
                onClick={centerSelectedRoom}
                title="Center selected room"
                aria-label="Center selected room"
                disabled={!selectedRoom}
              >
                <ControlIcon name="rooms" size={14} />
              </button>

              <button
                type="button"
                className="focus-action-btn"
                onClick={quickVisualize}
                title="Visualize selected room"
                aria-label="Visualize selected room"
                disabled={!selectedRoom}
              >
                <ControlIcon name="visualize" size={14} />
              </button>

              <button
                type="button"
                className="focus-action-btn active"
                onClick={toggleCanvasFocus}
                title="Restore hidden panels"
                aria-label="Restore hidden panels"
              >
                <ControlIcon name="focus-off" size={14} />
              </button>
            </div>
          )}

          {isTouchDevice && (
            <div
              className="floor-map-mobile-controls"
              role="toolbar"
              aria-label="Mobile planner controls"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
            >
              <button type="button" onClick={() => panBy(0, -1)} aria-label="Pan up">
                Up
              </button>
              <button type="button" onClick={() => panBy(-1, 0)} aria-label="Pan left">
                Left
              </button>
              <button type="button" onClick={resetView} aria-label="Reset view">
                Reset
              </button>
              <button type="button" onClick={() => panBy(1, 0)} aria-label="Pan right">
                Right
              </button>
              <button type="button" onClick={() => panBy(0, 1)} aria-label="Pan down">
                Down
              </button>
              <button type="button" onClick={() => zoomBy(1.2)} aria-label="Zoom in">
                +
              </button>
              <button type="button" onClick={() => zoomBy(0.84)} aria-label="Zoom out">
                -
              </button>
              <button
                type="button"
                onClick={quickVisualize}
                disabled={!selectedRoom}
                aria-label="Visualize selected room"
              >
                3D
              </button>
            </div>
          )}

          <div className="floor-map-grid" />

          <div className="floor-map-ruler floor-map-ruler-x" aria-hidden="true">
            {xTicks.map((tick) => (
              <span
                key={`x-${tick.value}`}
                className={tick.major ? 'major' : ''}
                style={{ left: `${tick.left}px` }}
              >
                <i />
                {tick.major ? <strong>{tick.value}m</strong> : null}
              </span>
            ))}
          </div>

          <div className="floor-map-ruler floor-map-ruler-z" aria-hidden="true">
            {zTicks.map((tick) => (
              <span
                key={`z-${tick.value}`}
                className={tick.major ? 'major' : ''}
                style={{ top: `${tick.top}px` }}
              >
                <i />
                {tick.major ? <strong>{tick.value}m</strong> : null}
              </span>
            ))}
          </div>

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

        {showBottomChrome && (
          <>
            <div className="floor-map-footnote">
              Canvas: {canvas.width.toFixed(1)}m x {canvas.depth.toFixed(1)}m
              {floorPlan.constraintMessage ? ` | ${floorPlan.constraintMessage}` : ''}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
