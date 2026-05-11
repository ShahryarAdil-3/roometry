// Planner tab controls for the sidebar.
import ControlSection from '../ControlSection'
import { ControlIcon } from '@components/ui/ControlIcons'

export default function PlannerControls({
  floorPlan,
  canvas,
  selectedRoom,
  wallOrder,
  doorWall,
  doorOffset,
  doorWidth,
  doorHeight,
  setDoorWall,
  setDoorOffset,
  setDoorWidth,
  setDoorHeight,
  setCanvasSettings,
  setSnapSettings,
  selectRoom,
  moveRoom,
  updateRoom,
  removeRoom,
  setSelectedRoomDimensions,
  setLivePreview,
  applySelectedRoomToScene,
  setCameraMode,
  setUiMode,
  commitNumeric,
  upsertDoor,
  removeDoor,
}) {
  const currentWallDoor = selectedRoom?.doors.find((door) => door.wall === doorWall)

  return (
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
            Move canvas: drag with 2 fingers on mobile, Shift + drag on desktop
          </span>
        </p>
        <p className="subtle-note">
          <span className="icon-label">
            <ControlIcon name="zoom" size={14} />
            Zoom: pinch on mobile, mouse wheel on desktop
          </span>
        </p>

        <label className="toggle">
          <input
            type="checkbox"
            checked={floorPlan.snapEnabled}
            onChange={(e) => setSnapSettings({ enabled: e.target.checked })}
          />
          <span className="icon-label">
            <ControlIcon name="workspace" size={14} />
            Enable snapping
          </span>
        </label>

        <label>
          Snap Step (m)
          <input
            type="number"
            min="0.05"
            max="1"
            step="0.05"
            value={floorPlan.snapStep}
            onChange={(e) => setSnapSettings({ step: Number(e.target.value) })}
          />
        </label>
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
  )
}
