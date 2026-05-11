// Canvas workspace grid overlay.

export default function WorkspaceOverlay({ topLeft, width, height, gridOffsetX, gridOffsetY, canvas }) {
  return (
    <div
      className="floor-map-workspace"
      style={{
        left: `${topLeft.x}px`,
        top: `${topLeft.y}px`,
        width: `${width}px`,
        height: `${height}px`,
        '--grid-offset-x': `${gridOffsetX}px`,
        '--grid-offset-y': `${gridOffsetY}px`,
      }}
      aria-hidden="true"
    >
      <div className="floor-map-grid" />
      <span className="floor-map-workspace-label">
        Canvas {canvas.width.toFixed(1)}m x {canvas.depth.toFixed(1)}m
      </span>
    </div>
  )
}
