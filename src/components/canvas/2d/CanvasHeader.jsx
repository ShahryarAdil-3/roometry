// Header section for the 2D floor planner — compact pill layout.
import { ControlIcon } from '@components/ui/ControlIcons'

export default function CanvasHeader({
  activeSnapStep,
  snapEnabled,
  view,
  canvas,
  onResetView,
  onFitCanvas,
}) {
  return (
    <header className="floor-map-header">
      <div className="floor-map-title-row">
        <h1 className="floor-map-title">
          <span className="icon-badge">
            <ControlIcon name="map" size={14} />
          </span>
          Floor Planner
        </h1>
        <div className="floor-map-view-tools">
          <button type="button" onClick={onResetView}>
            <ControlIcon name="reset" size={13} />
            Reset
          </button>
          <button type="button" onClick={onFitCanvas}>
            <ControlIcon name="workspace" size={13} />
            Fit
          </button>
          <span className="floor-map-readout">
            {view.zoom.toFixed(2)}× zoom
          </span>
        </div>
      </div>

      <div className="planner-pill-row">
        <span className="planner-pill">
          <ControlIcon name="workspace" size={12} />
          {snapEnabled ? `Snap ${activeSnapStep.toFixed(2)}m` : 'Snap off'}
        </span>
        <span className="planner-pill">
          <ControlIcon name="pan" size={12} />
          Shift+drag to pan
        </span>
        <span className="planner-pill">
          <ControlIcon name="zoom" size={12} />
          Scroll to zoom
        </span>
        <span className="planner-pill">
          <ControlIcon name="move" size={12} />
          Canvas {canvas.width}×{canvas.depth}m
        </span>
      </div>
    </header>
  )
}
