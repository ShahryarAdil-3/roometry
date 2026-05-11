// 2D floor plan canvas with drawing and resize handles.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSceneStore } from '@store/useSceneStore'
import {
  pickRulerStep,
  roundToStep,
  toScreenFromWorld,
  toWorldFromScreen,
} from '@utils/floorMap'
import CanvasShell from './2d/CanvasShell'
import CanvasToolbar from './2d/CanvasToolbar'
import FocusControls from './2d/FocusControls'
import MobileControls from './2d/MobileControls'
import WorkspaceOverlay from './2d/WorkspaceOverlay'
import Rulers from './2d/Rulers'
import RoomsLayer from './2d/RoomsLayer'
import DraftRect from './2d/DraftRect'
import ConstraintModal from './2d/ConstraintModal'
import ConfirmDeleteModal from './2d/ConfirmDeleteModal'

const MIN_DRAW_SIZE = 16
const MIN_ROOM_SIZE = 1
const MIN_VIEW_ZOOM = 0
const MAX_VIEW_ZOOM = 4
const RULER_GUTTER = 18
const GRID_UNIT_METERS = 1

export default function Canvas2D({ isTouchDevice = false }) {
  const floorPlan = useSceneStore((state) => state.floorPlan)
  const createRoom = useSceneStore((state) => state.createRoom)
  const moveRoom = useSceneStore((state) => state.moveRoom)
  const updateRoom = useSceneStore((state) => state.updateRoom)
  const removeRoom = useSceneStore((state) => state.removeRoom)
  const selectRoom = useSceneStore((state) => state.selectRoom)
  const applySelectedRoomToScene = useSceneStore((state) => state.applySelectedRoomToScene)
  const setUiMode = useSceneStore((state) => state.setUiMode)
  const setCameraMode = useSceneStore((state) => state.setCameraMode)
  const clearConstraintMessage = useSceneStore((state) => state.clearConstraintMessage)

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
  const [confirmDeleteRoomId, setConfirmDeleteRoomId] = useState(null)
  const lastFitKeyRef = useRef('')

  const pixelsPerMeter = canvas.pixelsPerMeter
  const horizontalLimit = canvas.width / 2
  const verticalLimit = canvas.depth / 2
  const canvasFocusMode = !showTopChrome && !showBottomChrome

  const activeSnapStep = floorPlan.snapEnabled
    ? Math.max(0.01, Math.min(1, floorPlan.snapStep || GRID_UNIT_METERS))
    : 0

  const snap = useCallback(
    (value) => (floorPlan.snapEnabled ? roundToStep(value, activeSnapStep) : value),
    [activeSnapStep, floorPlan.snapEnabled],
  )

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

      if (event.key === 'Delete' || event.key === 'Backspace') {
        const room = floorPlan.rooms.find((item) => item.id === floorPlan.selectedRoomId)
        if (room) {
          event.preventDefault()
          setConfirmDeleteRoomId(room.id)
        }
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

  const fitCanvasToView = useCallback(() => {
    if (!canvasRect) {
      return
    }

    const padding = 48
    const maxZoomX = (canvasRect.width - padding) / (canvas.width * pixelsPerMeter)
    const maxZoomZ = (canvasRect.height - padding) / (canvas.depth * pixelsPerMeter)
    const nextZoom = Math.max(MIN_VIEW_ZOOM, Math.min(MAX_VIEW_ZOOM, Math.min(maxZoomX, maxZoomZ)))

    setView({ x: 0, z: 0, zoom: Number.isFinite(nextZoom) ? nextZoom : 1 })
  }, [canvas.depth, canvas.width, canvasRect, pixelsPerMeter])

  useEffect(() => {
    if (!canvasRect) {
      return
    }

    const fitKey = `${canvas.width}x${canvas.depth}x${canvasRect.width}x${canvasRect.height}`
    if (lastFitKeyRef.current === fitKey) {
      return
    }

    lastFitKeyRef.current = fitKey
    const timer = window.setTimeout(() => {
      fitCanvasToView()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [canvas.width, canvas.depth, canvasRect, fitCanvasToView])

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

  const rulerStep = useMemo(() => pickRulerStep(pixelsPerMeter * view.zoom), [pixelsPerMeter, view.zoom])

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
    const minVisible = Math.max(0, view.x - canvasRect.width / (2 * scale) + canvas.width / 2)
    const maxVisible = Math.min(canvas.width, view.x + canvasRect.width / (2 * scale) + canvas.width / 2)
    const start = Math.floor(minVisible / rulerStep) * rulerStep
    const ticks = []

    for (let value = start; value <= maxVisible + rulerStep; value += rulerStep) {
      const rounded = Number(value.toFixed(4))
      const worldX = rounded - canvas.width / 2
      const left = canvasRect.width / 2 + (worldX - view.x) * scale - RULER_GUTTER
      ticks.push({ value: rounded, left })
    }

    return ticks
  }, [canvas.width, canvasRect, pixelsPerMeter, rulerStep, view.x, view.zoom])

  const zTicks = useMemo(() => {
    if (!canvasRect) {
      return []
    }

    const scale = pixelsPerMeter * view.zoom
    const minVisible = Math.max(0, view.z - canvasRect.height / (2 * scale) + canvas.depth / 2)
    const maxVisible = Math.min(canvas.depth, view.z + canvasRect.height / (2 * scale) + canvas.depth / 2)
    const start = Math.floor(minVisible / rulerStep) * rulerStep
    const ticks = []

    for (let value = start; value <= maxVisible + rulerStep; value += rulerStep) {
      const rounded = Number(value.toFixed(4))
      const worldZ = rounded - canvas.depth / 2
      const top = canvasRect.height / 2 + (worldZ - view.z) * scale - RULER_GUTTER
      ticks.push({ value: rounded, top })
    }

    return ticks
  }, [canvas.depth, canvasRect, pixelsPerMeter, rulerStep, view.z, view.zoom])

  return (
    <CanvasShell
      showTopChrome={showTopChrome}
      pixelsPerMeter={pixelsPerMeter}
      activeSnapStep={activeSnapStep}
      snapEnabled={floorPlan.snapEnabled}
      view={view}
      canvas={canvas}
      onResetView={resetView}
      onFitCanvas={fitCanvasToView}
      footnote={
        showBottomChrome ? (
          <div className="floor-map-footnote">
            Canvas: {canvas.width.toFixed(1)}m x {canvas.depth.toFixed(1)}m
            {floorPlan.constraintMessage ? ` | ${floorPlan.constraintMessage}` : ''}
          </div>
        ) : null
      }
    >
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
          <CanvasToolbar
            showTopChrome={showTopChrome}
            showBottomChrome={showBottomChrome}
            canvasFocusMode={canvasFocusMode}
            onToggleTop={() => setShowTopChrome((value) => !value)}
            onToggleBottom={() => setShowBottomChrome((value) => !value)}
            onToggleFocus={toggleCanvasFocus}
          />

          {canvasFocusMode && (
            <FocusControls
              onZoomIn={() => zoomBy(1.2)}
              onZoomOut={() => zoomBy(0.84)}
              onResetView={() => setView({ x: 0, z: 0, zoom: 1 })}
              onCenterSelected={centerSelectedRoom}
              onQuickVisualize={quickVisualize}
              onExitFocus={toggleCanvasFocus}
              selectedRoom={selectedRoom}
            />
          )}

          {isTouchDevice && (
            <MobileControls
              onPanBy={panBy}
              onResetView={resetView}
              onZoomIn={() => zoomBy(1.2)}
              onZoomOut={() => zoomBy(0.84)}
              onFitCanvas={fitCanvasToView}
              onQuickVisualize={quickVisualize}
              selectedRoom={selectedRoom}
            />
          )}

          {canvasRect && (() => {
            const topLeft = toScreenFromWorld(
              { x: -canvas.width / 2, z: -canvas.depth / 2 },
              canvasRect,
              pixelsPerMeter,
              view,
            )
            const width = canvas.width * pixelsPerMeter * view.zoom
            const height = canvas.depth * pixelsPerMeter * view.zoom
            const gridOffsetX = gridOffsets.x - topLeft.x
            const gridOffsetY = gridOffsets.y - topLeft.y

            return (
              <WorkspaceOverlay
                topLeft={topLeft}
                width={width}
                height={height}
                gridOffsetX={gridOffsetX}
                gridOffsetY={gridOffsetY}
                canvas={canvas}
              />
            )
          })()}

          <Rulers xTicks={xTicks} zTicks={zTicks} />

          <RoomsLayer
            rooms={floorPlan.rooms}
            selectedRoomId={floorPlan.selectedRoomId}
            canvasRect={canvasRect}
            pixelsPerMeter={pixelsPerMeter}
            view={view}
            toScreenFromWorld={toScreenFromWorld}
            onSelectRoom={selectRoom}
            onBeginDrag={beginRoomDrag}
            onBeginResize={beginRoomResize}
          />

          {draftRect && <DraftRect draftRect={draftRect} />}
        </div>

      </div>

      <ConstraintModal message={floorPlan.constraintMessage} onDismiss={clearConstraintMessage} />
      <ConfirmDeleteModal
        roomId={confirmDeleteRoomId}
        onCancel={() => setConfirmDeleteRoomId(null)}
        onConfirm={(roomId) => {
          removeRoom(roomId)
          setConfirmDeleteRoomId(null)
        }}
      />
    </CanvasShell>
  )
}
