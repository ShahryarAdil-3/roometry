// Mobile-only planner controls.

export default function MobileControls({
  onPanBy,
  onResetView,
  onZoomIn,
  onZoomOut,
  onFitCanvas,
  onQuickVisualize,
  selectedRoom,
}) {
  return (
    <div
      className="floor-map-mobile-controls"
      role="toolbar"
      aria-label="Mobile planner controls"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <button type="button" onClick={() => onPanBy(0, -1)} aria-label="Pan up">
        Up
      </button>
      <button type="button" onClick={() => onPanBy(-1, 0)} aria-label="Pan left">
        Left
      </button>
      <button type="button" onClick={onResetView} aria-label="Reset view">
        Reset
      </button>
      <button type="button" onClick={() => onPanBy(1, 0)} aria-label="Pan right">
        Right
      </button>
      <button type="button" onClick={() => onPanBy(0, 1)} aria-label="Pan down">
        Down
      </button>
      <button type="button" onClick={onZoomIn} aria-label="Zoom in">
        +
      </button>
      <button type="button" onClick={onZoomOut} aria-label="Zoom out">
        -
      </button>
      <button type="button" onClick={onFitCanvas} aria-label="Fit canvas">
        Fit
      </button>
      <button
        type="button"
        onClick={onQuickVisualize}
        disabled={!selectedRoom}
        aria-label="Visualize selected room"
      >
        3D
      </button>
    </div>
  )
}
