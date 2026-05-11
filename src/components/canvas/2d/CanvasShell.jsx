// Planner chrome wrapper and layout.
import CanvasHeader from './CanvasHeader'

export default function CanvasShell({
  showTopChrome,
  pixelsPerMeter,
  activeSnapStep,
  snapEnabled,
  view,
  canvas,
  onResetView,
  onFitCanvas,
  children,
  footnote,
}) {
  return (
    <section className={`floor-map-shell ${showTopChrome ? '' : 'floor-map-shell-top-hidden'}`}>
      {showTopChrome && (
        <CanvasHeader
          pixelsPerMeter={pixelsPerMeter}
          activeSnapStep={activeSnapStep}
          snapEnabled={snapEnabled}
          view={view}
          canvas={canvas}
          onResetView={onResetView}
          onFitCanvas={onFitCanvas}
        />
      )}

      {children}

      {footnote}
    </section>
  )
}