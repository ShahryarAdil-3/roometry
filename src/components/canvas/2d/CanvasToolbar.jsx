// Canvas chrome toggle controls.
import { ControlIcon } from '@components/ui/ControlIcons'

export default function CanvasToolbar({
  showTopChrome,
  showBottomChrome,
  canvasFocusMode,
  onToggleTop,
  onToggleBottom,
  onToggleFocus,
}) {
  return (
    <div
      className="floor-map-canvas-toolbar"
      role="toolbar"
      aria-label="Canvas visibility controls"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className={`canvas-tool-btn ${showTopChrome ? '' : 'active'}`}
        onClick={onToggleTop}
        title={showTopChrome ? 'Hide top panel' : 'Show top panel'}
        aria-label={showTopChrome ? 'Hide top panel' : 'Show top panel'}
      >
        <ControlIcon name={showTopChrome ? 'collapse-top' : 'expand-top'} size={14} />
      </button>

      <button
        type="button"
        className={`canvas-tool-btn ${showBottomChrome ? '' : 'active'}`}
        onClick={onToggleBottom}
        title={showBottomChrome ? 'Hide bottom panel' : 'Show bottom panel'}
        aria-label={showBottomChrome ? 'Hide bottom panel' : 'Show bottom panel'}
      >
        <ControlIcon name={showBottomChrome ? 'collapse-bottom' : 'expand-bottom'} size={14} />
      </button>

      <button
        type="button"
        className={`canvas-tool-btn ${canvasFocusMode ? 'active' : ''}`}
        onClick={onToggleFocus}
        title={canvasFocusMode ? 'Restore all planner panels' : 'Focus canvas only'}
        aria-label={canvasFocusMode ? 'Restore all planner panels' : 'Focus canvas only'}
      >
        <ControlIcon name={canvasFocusMode ? 'focus-off' : 'focus-on'} size={14} />
      </button>
    </div>
  )
}
