import { useMemo, useState } from 'react'
import { useSceneStore } from '../store/useSceneStore'

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
]

function ControlSection({ title, defaultOpen = false, children }) {
  return (
    <details className="control-section" open={defaultOpen}>
      <summary>{title}</summary>
      <div className="control-section-body">{children}</div>
    </details>
  )
}

export default function SceneControls({ onHide }) {
  const floorPlan = useSceneStore((state) => state.floorPlan)
  const setUiMode = useSceneStore((state) => state.setUiMode)
  const setLivePreview = useSceneStore((state) => state.setLivePreview)
  const setCanvasSettings = useSceneStore((state) => state.setCanvasSettings)
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
  const addFurniture = useSceneStore((state) => state.addFurniture)
  const updateFurniture = useSceneStore((state) => state.updateFurniture)
  const removeFurniture = useSceneStore((state) => state.removeFurniture)
  const firstPerson = useSceneStore((state) => state.firstPerson)
  const setFirstPersonSettings = useSceneStore((state) => state.setFirstPersonSettings)
  const resetScene = useSceneStore((state) => state.resetScene)

  const [selectedFurnitureId, setSelectedFurnitureId] = useState('')
  const [doorWall, setDoorWall] = useState('north')
  const [doorOffset, setDoorOffset] = useState(0)
  const [doorWidth, setDoorWidth] = useState(1)
  const [doorHeight, setDoorHeight] = useState(2.1)

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
    () => furniture.find((item) => item.id === selectedFurnitureId),
    [furniture, selectedFurnitureId],
  )

  const nextTemplate = useMemo(
    () => sampleFurnitureTemplates[furniture.length % sampleFurnitureTemplates.length],
    [furniture.length],
  )

  const handleAddFurniture = () => {
    const template = sampleFurnitureTemplates[furniture.length % sampleFurnitureTemplates.length]
    addFurniture({
      id: `furniture-${Date.now()}`,
      type: template.type,
      position: template.position,
      rotation: [0, 0, 0],
      scale: template.scale,
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

  const currentWallDoor = selectedRoom?.doors.find((door) => door.wall === doorWall)

  return (
    <aside className="scene-controls">
      <div className="controls-header">
        <div>
          <h2>Roometry Studio</h2>
          <p className="controls-subtitle">Plan in meters, visualize in 3D.</p>
        </div>
        <button type="button" className="hide-btn" onClick={onHide}>
          Hide
        </button>
      </div>

      <div className="mode-toggle-row mode-toggle-row-main">
        <button
          type="button"
          className={floorPlan.uiMode === 'draw' ? 'active' : ''}
          onClick={() => setUiMode('draw')}
        >
          2D Planner
        </button>
        <button
          type="button"
          className={floorPlan.uiMode === 'visualize' ? 'active' : ''}
          onClick={() => {
            applySelectedRoomToScene()
            setCameraMode('orbit')
            setUiMode('visualize')
          }}
          disabled={!selectedRoom}
        >
          3D Visualize
        </button>
      </div>

      {floorPlan.constraintMessage && (
        <div className="constraint-banner">{floorPlan.constraintMessage}</div>
      )}

      <ControlSection title="Workspace" defaultOpen>
        <div className="inline-row inline-row-3">
          <label>
            Width (m)
            <input
              type="number"
              min="6"
              max="200"
              step="1"
              defaultValue={canvas.width}
              key={`workspace-width-${canvas.width}`}
              onBlur={(e) => commitNumeric(e.target.value, (value) => setCanvasSettings({ width: value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur()
                }
              }}
            />
          </label>
          <label>
            Depth (m)
            <input
              type="number"
              min="6"
              max="200"
              step="1"
              defaultValue={canvas.depth}
              key={`workspace-depth-${canvas.depth}`}
              onBlur={(e) => commitNumeric(e.target.value, (value) => setCanvasSettings({ depth: value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur()
                }
              }}
            />
          </label>
          <label>
            Px / m
            <input
              type="number"
              min="16"
              max="140"
              step="1"
              defaultValue={canvas.pixelsPerMeter}
              key={`workspace-ppm-${canvas.pixelsPerMeter}`}
              onBlur={(e) =>
                commitNumeric(e.target.value, (value) =>
                  setCanvasSettings({ pixelsPerMeter: value }),
                )
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur()
                }
              }}
            />
          </label>
        </div>

        <label className="toggle">
          <input
            type="checkbox"
            checked
            disabled
          />
          Snap to 1m x 1m grid (locked)
        </label>

        <label>
          Snap Step (m)
          <input
            type="number"
            min="1"
            max="1"
            step="1"
            value={1}
            readOnly
            disabled
          />
        </label>

        <p>
          Canvas move: Shift + drag or middle/right mouse drag. Zoom: mouse wheel.
        </p>
      </ControlSection>

      <ControlSection title="Rooms" defaultOpen>
        <label>
          Selected Room
          <select
            value={floorPlan.selectedRoomId ?? ''}
            onChange={(e) => selectRoom(e.target.value || null)}
          >
            <option value="">None</option>
            {floorPlan.rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
        </label>

        {selectedRoom && (
          <>
            <label>
              Room Name
              <input
                type="text"
                value={selectedRoom.name}
                onChange={(e) =>
                  updateRoom(selectedRoom.id, { name: e.target.value || selectedRoom.name })
                }
              />
            </label>

            <div className="inline-row">
              <label>
                Width (m)
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={selectedRoom.width}
                  onChange={(e) => setSelectedRoomDimensions({ width: Number(e.target.value) })}
                />
              </label>
              <label>
                Depth (m)
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={selectedRoom.depth}
                  onChange={(e) => setSelectedRoomDimensions({ depth: Number(e.target.value) })}
                />
              </label>
              <label>
                Height (m)
                <input
                  type="number"
                  min="2"
                  step="0.1"
                  value={selectedRoom.height}
                  onChange={(e) => setSelectedRoomDimensions({ height: Number(e.target.value) })}
                />
              </label>
            </div>

            <div className="inline-row inline-row-2">
              <label>
                Origin X
                <input
                  type="number"
                  step="1"
                  value={selectedRoom.x}
                  onChange={(e) => updateRoom(selectedRoom.id, { x: Number(e.target.value) })}
                />
              </label>
              <label>
                Origin Z
                <input
                  type="number"
                  step="1"
                  value={selectedRoom.z}
                  onChange={(e) => updateRoom(selectedRoom.id, { z: Number(e.target.value) })}
                />
              </label>
            </div>

            <label>
              Wall Thickness (2D only)
              <input
                type="number"
                min="0.05"
                step="0.01"
                value={selectedRoom.wallThickness}
                onChange={(e) =>
                  updateRoom(selectedRoom.id, { wallThickness: Number(e.target.value) })
                }
              />
            </label>

            <label className="toggle">
              <input
                type="checkbox"
                checked={floorPlan.livePreview}
                onChange={(e) => setLivePreview(e.target.checked)}
              />
              Live 3D preview while editing
            </label>

            <div className="inline-row inline-row-2">
              <button
                type="button"
                onClick={() => {
                  applySelectedRoomToScene()
                  setCameraMode('orbit')
                  setUiMode('visualize')
                }}
              >
                Visualize
              </button>
              <button type="button" onClick={() => removeRoom(selectedRoom.id)}>
                Remove Room
              </button>
            </div>

            <div className="nudge-grid">
              <span>Move (Step)</span>
              <input
                type="number"
                min="1"
                step="1"
                value={1}
                readOnly
                disabled
              />
              <button type="button" onClick={() => moveRoom(selectedRoom.id, selectedRoom.x, selectedRoom.z - 1)}>Up</button>
              <div className="nudge-row">
                <button type="button" onClick={() => moveRoom(selectedRoom.id, selectedRoom.x - 1, selectedRoom.z)}>Left</button>
                <button type="button" onClick={() => moveRoom(selectedRoom.id, selectedRoom.x + 1, selectedRoom.z)}>Right</button>
              </div>
              <button type="button" onClick={() => moveRoom(selectedRoom.id, selectedRoom.x, selectedRoom.z + 1)}>Down</button>
            </div>
          </>
        )}

        <ul className="furniture-list compact-list">
          {floorPlan.rooms.map((room) => (
            <li key={room.id}>
              <span>{room.name}</span>
              <button type="button" onClick={() => selectRoom(room.id)}>
                Select
              </button>
            </li>
          ))}
        </ul>
      </ControlSection>

      {selectedRoom && (
        <ControlSection title="Doors">
          <label>
            Wall
            <select value={doorWall} onChange={(e) => setDoorWall(e.target.value)}>
              {wallOrder.map((wallKey) => (
                <option key={wallKey} value={wallKey}>
                  {wallKey}
                </option>
              ))}
            </select>
          </label>

          <div className="inline-row">
            <label>
              Offset
              <input
                type="number"
                step="0.1"
                value={doorOffset}
                onChange={(e) => setDoorOffset(Number(e.target.value))}
              />
            </label>
            <label>
              Width
              <input
                type="number"
                min="0.6"
                step="0.1"
                value={doorWidth}
                onChange={(e) => setDoorWidth(Number(e.target.value))}
              />
            </label>
            <label>
              Height
              <input
                type="number"
                min="1.8"
                step="0.1"
                value={doorHeight}
                onChange={(e) => setDoorHeight(Number(e.target.value))}
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() =>
              upsertDoor(selectedRoom.id, {
                id: currentWallDoor?.id,
                wall: doorWall,
                offset: doorOffset,
                width: doorWidth,
                height: doorHeight,
              })
            }
          >
            {currentWallDoor ? 'Update Door' : 'Add Door'} ({doorWall})
          </button>

          {currentWallDoor && (
            <button
              type="button"
              onClick={() => removeDoor(selectedRoom.id, currentWallDoor.id)}
            >
              Remove {doorWall} Door
            </button>
          )}

          <ul className="furniture-list compact-list">
            {selectedRoom.doors.map((door) => (
              <li key={door.id}>
                <span>
                  {door.wall}: {door.width.toFixed(1)} x {door.height.toFixed(1)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setDoorWall(door.wall)
                    setDoorOffset(door.offset)
                    setDoorWidth(door.width)
                    setDoorHeight(door.height)
                  }}
                >
                  Edit
                </button>
              </li>
            ))}
          </ul>
        </ControlSection>
      )}

      <ControlSection title="Camera & Navigation" defaultOpen={floorPlan.uiMode === 'visualize'}>
        <label>
          Camera
          <select value={cameraMode} onChange={(e) => setCameraMode(e.target.value)}>
            <option value="orbit">Orbit</option>
            <option value="top">Top</option>
            <option value="firstPerson">First Person</option>
          </select>
        </label>

        {cameraMode === 'firstPerson' && (
          <div className="control-group no-margin">
            <p>WASD/Arrows move, Shift sprint, Space jump, Esc unlock cursor.</p>

            <label>
              Move Speed ({firstPerson.moveSpeed.toFixed(1)})
              <input
                type="range"
                min="1"
                max="8"
                step="0.1"
                value={firstPerson.moveSpeed}
                onChange={(e) => setFirstPersonSettings({ moveSpeed: Number(e.target.value) })}
              />
            </label>

            <label>
              Look Sensitivity ({firstPerson.lookSensitivity.toFixed(1)})
              <input
                type="range"
                min="0.2"
                max="2.5"
                step="0.1"
                value={firstPerson.lookSensitivity}
                onChange={(e) =>
                  setFirstPersonSettings({ lookSensitivity: Number(e.target.value) })
                }
              />
            </label>

            <label>
              Sprint Multiplier ({firstPerson.sprintMultiplier.toFixed(2)})
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={firstPerson.sprintMultiplier}
                onChange={(e) =>
                  setFirstPersonSettings({ sprintMultiplier: Number(e.target.value) })
                }
              />
            </label>

            <label>
              Jump Strength ({firstPerson.jumpVelocity.toFixed(1)})
              <input
                type="range"
                min="2"
                max="8"
                step="0.1"
                value={firstPerson.jumpVelocity}
                onChange={(e) =>
                  setFirstPersonSettings({ jumpVelocity: Number(e.target.value) })
                }
              />
            </label>

            <label>
              Crouch Height ({firstPerson.crouchHeight.toFixed(1)}m)
              <input
                type="range"
                min="0.8"
                max="1.6"
                step="0.05"
                value={firstPerson.crouchHeight}
                onChange={(e) =>
                  setFirstPersonSettings({ crouchHeight: Number(e.target.value) })
                }
              />
            </label>

            <label>
              Head Bob Intensity ({firstPerson.headBobIntensity.toFixed(2)})
              <input
                type="range"
                min="0"
                max="0.12"
                step="0.01"
                value={firstPerson.headBobIntensity}
                onChange={(e) =>
                  setFirstPersonSettings({ headBobIntensity: Number(e.target.value) })
                }
              />
            </label>
          </div>
        )}
      </ControlSection>

      <ControlSection title="Materials">
        <label>
          Floor Color
          <input
            type="color"
            value={floor.color}
            onChange={(e) => setFloorMaterial({ color: e.target.value })}
          />
        </label>

        <label>
          Floor Texture URL
          <input
            type="text"
            placeholder="https://... or /textures/floor.jpg"
            value={floor.textureUrl ?? ''}
            onChange={(e) => setFloorMaterial({ textureUrl: e.target.value.trim() || undefined })}
          />
        </label>

        <label>
          Ceiling Color
          <input
            type="color"
            value={ceiling.color}
            onChange={(e) => setCeilingMaterial({ color: e.target.value })}
          />
        </label>

        <div className="control-group no-margin">
          <p>Walls</p>
          {wallOrder.map((wallKey) => (
            <div key={wallKey} className="wall-row">
              <span>{wallKey}</span>
              <input
                type="color"
                value={walls[wallKey].color}
                onChange={(e) => setWall(wallKey, { color: e.target.value })}
              />
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={walls[wallKey].visible}
                  onChange={(e) => setWall(wallKey, { visible: e.target.checked })}
                />
                Show
              </label>
              <input
                className="wall-texture"
                type="text"
                placeholder="Texture URL"
                value={walls[wallKey].textureUrl ?? ''}
                onChange={(e) =>
                  setWall(wallKey, { textureUrl: e.target.value.trim() || undefined })
                }
              />
            </div>
          ))}
        </div>
      </ControlSection>

      <ControlSection title="Furniture">
        <button type="button" onClick={handleAddFurniture}>
          Add {nextTemplate.type}
        </button>
        <label>
          Selected
          <select
            value={selectedFurnitureId}
            onChange={(e) => setSelectedFurnitureId(e.target.value)}
          >
            <option value="">None</option>
            {furniture.map((item) => (
              <option key={item.id} value={item.id}>
                {item.type} ({item.id.slice(-4)})
              </option>
            ))}
          </select>
        </label>

        {selectedFurniture && (
          <div className="transform-grid">
            <label>
              X
              <input
                type="number"
                step="0.1"
                value={selectedFurniture.position[0]}
                onChange={(e) =>
                  updateSelectedFurniture('position', [
                    Number(e.target.value),
                    selectedFurniture.position[1],
                    selectedFurniture.position[2],
                  ])
                }
              />
            </label>
            <label>
              Y
              <input
                type="number"
                step="0.1"
                value={selectedFurniture.position[1]}
                onChange={(e) =>
                  updateSelectedFurniture('position', [
                    selectedFurniture.position[0],
                    Number(e.target.value),
                    selectedFurniture.position[2],
                  ])
                }
              />
            </label>
            <label>
              Z
              <input
                type="number"
                step="0.1"
                value={selectedFurniture.position[2]}
                onChange={(e) =>
                  updateSelectedFurniture('position', [
                    selectedFurniture.position[0],
                    selectedFurniture.position[1],
                    Number(e.target.value),
                  ])
                }
              />
            </label>
            <label>
              Rot Y
              <input
                type="number"
                step="0.1"
                value={selectedFurniture.rotation[1]}
                onChange={(e) =>
                  updateSelectedFurniture('rotation', [
                    selectedFurniture.rotation[0],
                    Number(e.target.value),
                    selectedFurniture.rotation[2],
                  ])
                }
              />
            </label>
            <label>
              Scale
              <input
                type="number"
                step="0.1"
                value={selectedFurniture.scale[0]}
                onChange={(e) => {
                  const nextScale = Number(e.target.value)
                  updateSelectedFurniture('scale', [nextScale, nextScale, nextScale])
                }}
              />
            </label>
          </div>
        )}

        <ul className="furniture-list compact-list">
          {furniture.map((item) => (
            <li key={item.id}>
              <span>{item.type}</span>
              <button type="button" onClick={() => removeFurniture(item.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      </ControlSection>

      <button type="button" className="danger" onClick={resetScene}>
        Reset Scene
      </button>
    </aside>
  )
}
