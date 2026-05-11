// Header section for the 2D floor planner.
import { ControlIcon } from '@components/ui/ControlIcons'

export default function CanvasHeader({
  pixelsPerMeter,
  activeSnapStep,
  snapEnabled,
  view,
  canvas,
  onResetView,
  onFitCanvas,
}) {
  return (
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
          {snapEnabled ? `Snap ${activeSnapStep.toFixed(2)}m` : 'Snap Off'}
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
        <button type="button" onClick={onResetView}>
          <ControlIcon name="reset" size={14} />
          Reset View
        </button>
        <button type="button" onClick={onFitCanvas}>
          <ControlIcon name="workspace" size={14} />
          Fit Canvas
        </button>
        <span className="floor-map-readout">
          <ControlIcon name="zoom" size={13} />
          Zoom: {view.zoom.toFixed(2)}x | Pan: {(view.x + canvas.width / 2).toFixed(1)}m,{' '}
          {(view.z + canvas.depth / 2).toFixed(1)}m
        </span>
      </div>
    </header>
  )
}
