// Quick actions for focus mode.
import { ControlIcon } from '@components/ui/ControlIcons'

export default function FocusControls({
  onZoomIn,
  onZoomOut,
  onResetView,
  onCenterSelected,
  onQuickVisualize,
  onExitFocus,
  selectedRoom,
}) {
  return (
    <div
      className="floor-map-focus-controls"
      role="toolbar"
      aria-label="Canvas focus quick actions"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className="focus-action-btn"
        onClick={onZoomIn}
        title="Zoom in"
        aria-label="Zoom in"
      >
        <ControlIcon name="zoom-in" size={14} />
      </button>

      <button
        type="button"
        className="focus-action-btn"
        onClick={onZoomOut}
        title="Zoom out"
        aria-label="Zoom out"
      >
        <ControlIcon name="zoom-out" size={14} />
      </button>

      <button
        type="button"
        className="focus-action-btn"
        onClick={onResetView}
        title="Reset view"
        aria-label="Reset view"
      >
        <ControlIcon name="reset" size={14} />
      </button>

      <button
        type="button"
        className="focus-action-btn"
        onClick={onCenterSelected}
        title="Center selected room"
        aria-label="Center selected room"
        disabled={!selectedRoom}
      >
        <ControlIcon name="rooms" size={14} />
      </button>

      <button
        type="button"
        className="focus-action-btn"
        onClick={onQuickVisualize}
        title="Visualize selected room"
        aria-label="Visualize selected room"
        disabled={!selectedRoom}
      >
        <ControlIcon name="visualize" size={14} />
      </button>

      <button
        type="button"
        className="focus-action-btn active"
        onClick={onExitFocus}
        title="Restore hidden panels"
        aria-label="Restore hidden panels"
      >
        <ControlIcon name="focus-off" size={14} />
      </button>
    </div>
  )
}
