// Scene tab controls for the sidebar.
import ControlSection from '../ControlSection'
import { ControlIcon } from '@components/ui/ControlIcons'

export default function SceneControlsPanel({
  cameraMode,
  setCameraMode,
  floor,
  ceiling,
  walls,
  setFloorMaterial,
  setCeilingMaterial,
  setWall,
  wallOrder,
  furniturePlacement,
  setFurniturePlacement,
  selectedRoom,
  selectedFurniture,
  selectedFurnitureId,
  setSelectedFurnitureId,
  roomFurniture,
  updateSelectedFurniture,
  handlePlaceFurniture,
  recentFurniture,
  sampleFurnitureTemplates,
  removeFurniture,
  resetScene,
  firstPerson,
  setFirstPersonSettings,
  floorPlan,
}) {
  return (
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
          Floor Roughness ({floor.roughness.toFixed(2)})
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={floor.roughness}
            onChange={(e) => setFloorMaterial({ roughness: Number(e.target.value) })}
          />
        </label>

        <label>
          Floor Metalness ({floor.metalness.toFixed(2)})
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={floor.metalness}
            onChange={(e) => setFloorMaterial({ metalness: Number(e.target.value) })}
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

        <label>
          Ceiling Roughness ({ceiling.roughness.toFixed(2)})
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={ceiling.roughness}
            onChange={(e) => setCeilingMaterial({ roughness: Number(e.target.value) })}
          />
        </label>

        <label>
          Ceiling Metalness ({ceiling.metalness.toFixed(2)})
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={ceiling.metalness}
            onChange={(e) => setCeilingMaterial({ metalness: Number(e.target.value) })}
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
              <label>
                Roughness
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={walls[wallKey].roughness}
                  onChange={(e) => setWall(wallKey, { roughness: Number(e.target.value) })}
                />
              </label>
              <label>
                Metalness
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={walls[wallKey].metalness}
                  onChange={(e) => setWall(wallKey, { metalness: Number(e.target.value) })}
                />
              </label>
            </div>
          ))}
        </div>
      </ControlSection>

      <ControlSection title="Furniture" icon="furniture">
        <p className="subtle-note">Choose what to place in the currently selected room.</p>
        {recentFurniture.length > 0 && (
          <div className="control-group no-margin">
            <p className="subtle-note">Recent</p>
            <div className="room-chip-grid">
              {recentFurniture.map((template) => (
                <button
                  key={`recent-${template.type}`}
                  type="button"
                  className={`room-chip ${furniturePlacement?.type === template.type ? 'active' : ''}`}
                  onClick={() => handlePlaceFurniture(template)}
                  disabled={!selectedRoom}
                >
                  {template.type}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="room-chip-grid">
          {sampleFurnitureTemplates.map((template) => (
            <button
              key={template.type}
              type="button"
              className={`room-chip ${furniturePlacement?.type === template.type ? 'active' : ''}`}
              onClick={() => handlePlaceFurniture(template)}
              disabled={!selectedRoom}
            >
              Place {template.type}
            </button>
          ))}
        </div>

        {furniturePlacement && (
          <div className="control-group no-margin">
            <p className="subtle-note">
              Placement active: click in 3D to drop {furniturePlacement.type}.{' '}
              <button type="button" className="text-link" onClick={() => setFurniturePlacement(null)}>
                Cancel
              </button>
            </p>
            <p className="subtle-note">Tips: Q/E rotate, G toggle snap, Esc cancel placement.</p>

            <label>
              Rotation ({(furniturePlacement.rotationY ?? 0).toFixed(2)} rad)
              <input
                type="range"
                min={-Math.PI}
                max={Math.PI}
                step="0.05"
                value={furniturePlacement.rotationY ?? 0}
                onChange={(e) =>
                  setFurniturePlacement({
                    ...furniturePlacement,
                    rotationY: Number(e.target.value),
                  })
                }
              />
            </label>

            <label className="toggle">
              <input
                type="checkbox"
                checked={furniturePlacement.snapToGrid}
                onChange={(e) =>
                  setFurniturePlacement({
                    ...furniturePlacement,
                    snapToGrid: e.target.checked,
                  })
                }
              />
              <span className="icon-label">
                <ControlIcon name="workspace" size={14} />
                Snap placement to grid
              </span>
            </label>
          </div>
        )}

        <label>
          Selected
          <select
            value={selectedFurnitureId}
            onChange={(e) => setSelectedFurnitureId(e.target.value)}
          >
            <option value="">None</option>
            {roomFurniture.map((item) => (
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
          {roomFurniture.map((item) => (
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
  )
}
