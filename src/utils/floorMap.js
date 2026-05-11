// Floor map math helpers.

const RULER_STEPS = [0.5, 1, 2, 5, 10, 20, 50, 100]

export const toWorldFromScreen = (point, rect, pixelsPerMeter, view) => ({
  x: view.x + (point.x - rect.left - rect.width / 2) / (pixelsPerMeter * view.zoom),
  z: view.z + (point.y - rect.top - rect.height / 2) / (pixelsPerMeter * view.zoom),
})

export const toScreenFromWorld = (point, rect, pixelsPerMeter, view) => ({
  x: rect.width / 2 + (point.x - view.x) * pixelsPerMeter * view.zoom,
  y: rect.height / 2 + (point.z - view.z) * pixelsPerMeter * view.zoom,
})

export const roundToStep = (value, step) => {
  if (!Number.isFinite(step) || step <= 0) {
    return value
  }

  return Math.round(value / step) * step
}

export const pickRulerStep = (scale) => {
  const targetPx = 80
  for (const step of RULER_STEPS) {
    if (step * scale >= targetPx) {
      return step
    }
  }

  return RULER_STEPS[RULER_STEPS.length - 1]
}
