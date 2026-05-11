// Sidebar controls for the scene and planner.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSceneStore } from '@store/useSceneStore'
import { ControlIcon } from '@components/ui/ControlIcons'
import useRecentFurniture from '@hooks/useRecentFurniture'
import ControlSection from './ControlSection'
import MetricChip from './MetricChip'
import PlannerControls from './planner/PlannerControls'
import SceneControlsPanel from './scene/SceneControlsPanel'

const wallOrder = ['north', 'south', 'east', 'west']

const sampleFurnitureTemplates = [
  {
    type: 'chair',
    scale: [0.8, 0.8, 0.8],
    position: [-1.6, 0.4, -1.2],
    color: '#5c6370',
  },
  {
    type: 'table',
    scale: [1.6, 0.75, 1],
    position: [0, 0.375, 0],
    color: '#8c6a4f',
  },
  {
    type: 'sofa',
    scale: [2, 0.9, 1],
    position: [1.8, 0.45, 1.3],
    color: '#7a8a99',
  },
  {
    type: 'bed',
    scale: [2.2, 0.55, 1.5],
    position: [0.8, 0.28, -1.8],
    color: '#7688a1',
  },
  {
    type: 'desk',
    scale: [1.4, 0.75, 0.7],
    position: [-1.9, 0.37, 1.5],
    color: '#7a5a44',
  },
  {
    type: 'cabinet',
    scale: [0.9, 1.6, 0.6],
    position: [2.1, 0.8, -0.3],
    color: '#5f7182',
  },
]

export default function SceneControls({ onHide }) {
  const floorPlan = useSceneStore((state) => state.floorPlan)
  const setUiMode = useSceneStore((state) => state.setUiMode)
  const setLivePreview = useSceneStore((state) => state.setLivePreview)
  const setCanvasSettings = useSceneStore((state) => state.setCanvasSettings)
  const setSnapSettings = useSceneStore((state) => state.setSnapSettings)
  const selectRoom = useSceneStore((state) => state.selectRoom)
  const moveRoom = useSceneStore((state) => state.moveRoom)
  const updateRoom = useSceneStore((state) => state.updateRoom)
  const removeRoom = useSceneStore((state) => state.removeRoom)
  const setSelectedRoomDimensions = useSceneStore((state) => state.setSelectedRoomDimensions)
  const upsertDoor = useSceneStore((state) => state.upsertDoor)
  const removeDoor = useSceneStore((state) => state.removeDoor)
  const applySelectedRoomToScene = useSceneStore((state) => state.applySelectedRoomToScene)

  const cameraMode = useSceneStore((state) => state.cameraMode)
  const setCameraMode = useSceneStore((state) => state.setCameraMode)
  const floor = useSceneStore((state) => state.floor)
  const ceiling = useSceneStore((state) => state.ceiling)
  const setFloorMaterial = useSceneStore((state) => state.setFloorMaterial)
  const setCeilingMaterial = useSceneStore((state) => state.setCeilingMaterial)
  const walls = useSceneStore((state) => state.walls)
  const setWall = useSceneStore((state) => state.setWall)
  const furniture = useSceneStore((state) => state.furniture)
  const updateFurniture = useSceneStore((state) => state.updateFurniture)
  const removeFurniture = useSceneStore((state) => state.removeFurniture)
  const furniturePlacement = useSceneStore((state) => state.furniturePlacement)
  const setFurniturePlacement = useSceneStore((state) => state.setFurniturePlacement)
  const firstPerson = useSceneStore((state) => state.firstPerson)
  const setFirstPersonSettings = useSceneStore((state) => state.setFirstPersonSettings)
  const resetScene = useSceneStore((state) => state.resetScene)

  const [activePanel, setActivePanel] = useState(floorPlan.uiMode === 'draw' ? 'planner' : 'scene')
  const [selectedFurnitureId, setSelectedFurnitureId] = useState('')
  const [doorWall, setDoorWall] = useState('north')
  const [doorOffset, setDoorOffset] = useState(0)
  const [doorWidth, setDoorWidth] = useState(1)
  const [doorHeight, setDoorHeight] = useState(2.1)
  const furnitureConstraintAlertRef = useRef('')
  const { recentFurniture, addRecentFurniture } = useRecentFurniture()

  const selectedRoom = useMemo(
    () => floorPlan.rooms.find((room) => room.id === floorPlan.selectedRoomId) ?? null,
    [floorPlan.rooms, floorPlan.selectedRoomId],
  )

  const canvas = floorPlan.canvas ?? {
    width: 18,
    depth: 14,
    pixelsPerMeter: 36,
  }
  const commitNumeric = (rawValue, callback) => {
    const parsed = Number(rawValue)
    if (Number.isFinite(parsed)) {
      callback(parsed)
    }
  }

  const selectedFurniture = useMemo(
    () => furniture.find((item) => item.id === selectedFurnitureId && item.roomId === selectedRoom?.id),
    [furniture, selectedFurnitureId, selectedRoom?.id],
  )

  const roomFurniture = useMemo(
    () => furniture.filter((item) => item.roomId === selectedRoom?.id),
    [furniture, selectedRoom?.id],
  )

  const handlePlaceFurniture = (template) => {
    if (!selectedRoom) {
      window.alert('Select a room before placing furniture.')
      return
    }

    addRecentFurniture(template)

    if (furniturePlacement?.type === template.type && furniturePlacement.roomId === selectedRoom.id) {
      setFurniturePlacement(null)
      return
    }

    setFurniturePlacement({
      type: template.type,
      roomId: selectedRoom.id,
      scale: template.scale,
      rotationY: 0,
      snapToGrid: true,
      material: {
        color: template.color,
      },
    })
  }

  const updateSelectedFurniture = (key, nextValues) => {
    if (!selectedFurniture) {
      return
    }

    updateFurniture(selectedFurniture.id, {
      [key]: nextValues,
    })
  }

  useEffect(() => {
    if (!selectedRoom || !selectedFurnitureId) {
      return
    }

    const stillExists = furniture.some(
      (item) => item.id === selectedFurnitureId && item.roomId === selectedRoom.id,
    )
    if (!stillExists) {
      // Defer state update to avoid synchronous state change inside effect
      // which can trigger the react-hooks/set-state-in-effect rule.
      setTimeout(() => setSelectedFurnitureId(''), 0)
    }
  }, [furniture, selectedFurnitureId, selectedRoom])

  useEffect(() => {
    const message = floorPlan.constraintMessage
    if (!message || !message.toLowerCase().includes('furniture')) {
      return
    }

    if (furnitureConstraintAlertRef.current === message) {
      return
    }

    furnitureConstraintAlertRef.current = message
    window.alert(message)
  }, [floorPlan.constraintMessage])

  return (
    <aside className="scene-controls">
      <div className="controls-header">
        <div className="controls-brand">
          <span className="icon-badge controls-brand-icon">
            <ControlIcon name="planner" size={16} />
          </span>
          <div>
            <h2>Roometry Studio</h2>
            <p className="controls-subtitle">Design faster, visualize better.</p>
          </div>
        </div>
        <button type="button" className="hide-btn" onClick={onHide}>
          <span className="icon-label">
            <ControlIcon name="hide" size={14} />
            Hide
          </span>
        </button>
      </div>

      <div className="controls-metrics">
        <MetricChip icon="rooms" label="Rooms" value={String(floorPlan.rooms.length)} />
        <MetricChip icon="workspace" label="Canvas" value={`${canvas.width}x${canvas.depth}m`} />
        <MetricChip icon="visualize" label="Mode" value={floorPlan.uiMode === 'draw' ? '2D' : '3D'} />
      </div>

      <div className="mode-toggle-row mode-toggle-row-main">
        <button
          type="button"
          className={floorPlan.uiMode === 'draw' ? 'active' : ''}
          onClick={() => {
            setUiMode('draw')
            setActivePanel('planner')
          }}
        >
          <span className="icon-label">
            <ControlIcon name="planner" size={14} />
            2D Planner
          </span>
        </button>
        <button
          type="button"
          className={floorPlan.uiMode === 'visualize' ? 'active' : ''}
          onClick={() => {
            applySelectedRoomToScene()
            setCameraMode('orbit')
            setUiMode('visualize')
            setActivePanel('scene')
          }}
          disabled={!selectedRoom}
        >
          <span className="icon-label">
            <ControlIcon name="visualize" size={14} />
            3D Visualize
          </span>
        </button>
      </div>

      <div className="controls-tabs">
        <button
          type="button"
          className={activePanel === 'planner' ? 'active' : ''}
          onClick={() => setActivePanel('planner')}
        >
          <span className="icon-label">
            <ControlIcon name="workspace" size={14} />
            Planner Tools
          </span>
        </button>
        <button
          type="button"
          className={activePanel === 'scene' ? 'active' : ''}
          onClick={() => setActivePanel('scene')}
        >
          <span className="icon-label">
            <ControlIcon name="camera" size={14} />
            Visual Tools
          </span>
        </button>
      </div>

      {floorPlan.constraintMessage && (
        <div className="constraint-banner">
          <span className="icon-label">
            <ControlIcon name="warning" size={14} />
            {floorPlan.constraintMessage}
          </span>
        </div>
      )}

      <div className="controls-stack">
        {activePanel === 'planner' && (
          <PlannerControls
            floorPlan={floorPlan}
            canvas={canvas}
            selectedRoom={selectedRoom}
            wallOrder={wallOrder}
            doorWall={doorWall}
            doorOffset={doorOffset}
            doorWidth={doorWidth}
            doorHeight={doorHeight}
            setDoorWall={setDoorWall}
            setDoorOffset={setDoorOffset}
            setDoorWidth={setDoorWidth}
            setDoorHeight={setDoorHeight}
            setCanvasSettings={setCanvasSettings}
            setSnapSettings={setSnapSettings}
            selectRoom={selectRoom}
            moveRoom={moveRoom}
            updateRoom={updateRoom}
            removeRoom={removeRoom}
            setSelectedRoomDimensions={setSelectedRoomDimensions}
            setLivePreview={setLivePreview}
            applySelectedRoomToScene={applySelectedRoomToScene}
            setCameraMode={setCameraMode}
            setUiMode={setUiMode}
            commitNumeric={commitNumeric}
            upsertDoor={upsertDoor}
            removeDoor={removeDoor}
          />
        )}

        {activePanel === 'scene' && (
          <SceneControlsPanel
            cameraMode={cameraMode}
            setCameraMode={setCameraMode}
            floor={floor}
            ceiling={ceiling}
            walls={walls}
            setFloorMaterial={setFloorMaterial}
            setCeilingMaterial={setCeilingMaterial}
            setWall={setWall}
            wallOrder={wallOrder}
            furniturePlacement={furniturePlacement}
            setFurniturePlacement={setFurniturePlacement}
            selectedRoom={selectedRoom}
            selectedFurniture={selectedFurniture}
            selectedFurnitureId={selectedFurnitureId}
            setSelectedFurnitureId={setSelectedFurnitureId}
            roomFurniture={roomFurniture}
            updateSelectedFurniture={updateSelectedFurniture}
            handlePlaceFurniture={handlePlaceFurniture}
            recentFurniture={recentFurniture}
            sampleFurnitureTemplates={sampleFurnitureTemplates}
            removeFurniture={removeFurniture}
            resetScene={resetScene}
            firstPerson={firstPerson}
            setFirstPersonSettings={setFirstPersonSettings}
            floorPlan={floorPlan}
          />
        )}
      </div>
    </aside>
  )
}
