import { useMemo, useState } from 'react'
import { useSceneStore } from '../store/useSceneStore'
import { ControlIcon } from './ui/ControlIcons'

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

function ControlSection({ title, icon, defaultOpen = false, hint, children }) {
  return (
    <details className="control-section" open={defaultOpen}>
      <summary>
        <span className="icon-label">
          <span className="icon-badge">
            <ControlIcon name={icon} size={14} />
          </span>
          <span>{title}</span>
        </span>
      </summary>
      <div className="control-section-body">
        {hint ? <p className="control-hint">{hint}</p> : null}
        {children}
      </div>
    </details>
  )
}

function MetricChip({ icon, label, value }) {
  return (
    <div className="metric-chip">
      <span className="icon-badge metric-icon">
        <ControlIcon name={icon} size={13} />
      </span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
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

  const [activePanel, setActivePanel] = useState(floorPlan.uiMode === 'draw' ? 'planner' : 'scene')
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
          <>
            <ControlSection
              title="Workspace"
              icon="workspace"
              defaultOpen
              hint="1m grid is fixed to keep planning precise."
            >
              <div className="inline-row inline-row-3">
                <label>
                  Width(m)
                  <input
                    type="number"
                    min="6"
                    max="200"
                    step="1"
                    defaultValue={canvas.width}
                    key={`workspace-width-${canvas.width}`}
                    onBlur={(e) =>
                      commitNumeric(e.target.value, (value) => setCanvasSettings({ width: value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur()
                      }
                    }}
                  />
                </label>
                <label>
                  Depth(m)
                  <input
                    type="number"
                    min="6"
                    max="200"
                    step="1"
                    defaultValue={canvas.depth}
                    key={`workspace-depth-${canvas.depth}`}
                    onBlur={(e) =>
                      commitNumeric(e.target.value, (value) => setCanvasSettings({ depth: value }))
                    }
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

              <p className="subtle-note">
                <span className="icon-label">
                  <ControlIcon name="pan" size={14} />
                  Move canvas: Shift + drag or middle/right drag
                </span>
              </p>
              <p className="subtle-note">
                <span className="icon-label">
                  <ControlIcon name="zoom" size={14} />
                  Zoom: mouse wheel
                </span>
              </p>
            </ControlSection>

            <ControlSection title="Rooms" icon="rooms" defaultOpen>
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

              {floorPlan.rooms.length > 0 && (
                <div className="room-chip-grid" role="list" aria-label="Rooms quick select">
                  {floorPlan.rooms.map((room) => (
                    <button
                      key={room.id}
                      type="button"
                      className={`room-chip ${room.id === floorPlan.selectedRoomId ? 'active' : ''}`}
                      onClick={() => selectRoom(room.id)}
                    >
                      {room.name}
                    </button>
                  ))}
                </div>
              )}

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
                    <span className="icon-label">
                      <ControlIcon name="preview" size={14} />
                      Live 3D preview while editing
                    </span>
                  </label>

                  <div className="inline-row inline-row-2">
                    <button
                      type="button"
                      onClick={() => {
                        applySelectedRoomToScene()
                        setCameraMode('orbit')
                        setUiMode('visualize')
                        setActivePanel('scene')
                      }}
                    >
                      <span className="icon-label">
                        <ControlIcon name="visualize" size={14} />
                        Visualize
                      </span>
                    </button>
                    <button type="button" onClick={() => removeRoom(selectedRoom.id)}>
                      Remove Room
                    </button>
                  </div>

                  <div className="nudge-grid">
                    <span className="icon-label">
                      <ControlIcon name="move" size={14} />
                      Move by 1m
                    </span>
                    <button
                      type="button"
                      onClick={() => moveRoom(selectedRoom.id, selectedRoom.x, selectedRoom.z - 1)}
                    >
                      Up
                    </button>
                    <div className="nudge-row">
                      <button
                        type="button"
                        onClick={() => moveRoom(selectedRoom.id, selectedRoom.x - 1, selectedRoom.z)}
                      >
                        Left
                      </button>
                      <button
                        type="button"
                        onClick={() => moveRoom(selectedRoom.id, selectedRoom.x + 1, selectedRoom.z)}
                      >
                        Right
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => moveRoom(selectedRoom.id, selectedRoom.x, selectedRoom.z + 1)}
                    >
                      Down
                    </button>
                  </div>
                </>
              )}
            </ControlSection>

            {selectedRoom && (
              <ControlSection title="Doors" icon="doors" hint="One configurable door per wall.">
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
                  <button type="button" onClick={() => removeDoor(selectedRoom.id, currentWallDoor.id)}>
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
          </>
        )}

        {activePanel === 'scene' && (
          <>
            <ControlSection
              title="Camera & Navigation"
              icon="camera"
              defaultOpen={floorPlan.uiMode === 'visualize'}
            >
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
                  <p className="subtle-note">WASD/Arrows move, Shift sprint, Space jump, Esc unlock cursor.</p>

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

            <ControlSection title="Materials" icon="materials" hint="Quickly recolor room surfaces.">
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
                <p className="subtle-note">Walls</p>
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

            <ControlSection title="Furniture" icon="furniture">
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
              <span className="icon-label">
                <ControlIcon name="reset" size={14} />
                Reset Scene
              </span>
            </button>
          </>
        )}
      </div>
    </aside>
  )
}
