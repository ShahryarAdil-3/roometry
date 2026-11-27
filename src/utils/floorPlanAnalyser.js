const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

export function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const objectUrl = typeof source === 'string' ? null : URL.createObjectURL(source)

    const releaseObjectUrl = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }

    image.onload = () => {
      releaseObjectUrl()
      if (!image.naturalWidth || !image.naturalHeight) {
        reject(new Error('The image has no readable dimensions.'))
        return
      }
      resolve(image)
    }
    image.onerror = () => {
      releaseObjectUrl()
      reject(new Error('Could not load this image. Try a PNG or JPEG file.'))
    }
    image.src = objectUrl ?? source
  })
}

function scaleToCanvas(image, maxDimension = 1024) {
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight))
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('Image analysis is not supported by this browser.')
  context.drawImage(image, 0, 0, width, height)
  return { canvas, context, scale }
}

function toWallMask(imageData, threshold) {
  const { data, width, height } = imageData
  const mask = new Uint8Array(width * height)

  for (let index = 0; index < width * height; index += 1) {
    const offset = index * 4
    const alpha = data[offset + 3]
    const luminance =
      data[offset] * 0.299 + data[offset + 1] * 0.587 + data[offset + 2] * 0.114
    mask[index] = alpha >= 128 && luminance <= threshold ? 1 : 0
  }

  return mask
}

function dilateWalls(mask, width, height, radius) {
  if (radius <= 0) return mask

  const horizontal = new Uint8Array(mask.length)
  const output = new Uint8Array(mask.length)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x
      for (let dx = -radius; dx <= radius; dx += 1) {
        const nextX = clamp(x + dx, 0, width - 1)
        if (mask[y * width + nextX]) {
          horizontal[index] = 1
          break
        }
      }
    }
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x
      for (let dy = -radius; dy <= radius; dy += 1) {
        const nextY = clamp(y + dy, 0, height - 1)
        if (horizontal[nextY * width + x]) {
          output[index] = 1
          break
        }
      }
    }
  }

  return output
}

function hasWallRun(mask, width, height, x, y, dx, dy, length = 3) {
  for (let step = 1; step <= length; step += 1) {
    const nextX = x + dx * step
    const nextY = y + dy * step
    if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) return false
    if (!mask[nextY * width + nextX]) return false
  }
  return true
}

function sealWallGaps(mask, width, height, maxGap) {
  const horizontal = new Uint8Array(mask)

  for (let y = 0; y < height; y += 1) {
    let gapStart = -1
    for (let x = 0; x <= width; x += 1) {
      const isWall = x < width && mask[y * width + x]
      if (isWall) {
        if (gapStart >= 0) {
          const gapLength = x - gapStart
          const leftWall = gapStart - 1
          if (
            gapLength <= maxGap &&
            hasWallRun(mask, width, height, leftWall, y, -1, 0) &&
            hasWallRun(mask, width, height, x, y, 1, 0)
          ) {
            horizontal.fill(1, y * width + gapStart, y * width + x)
          }
        }
        gapStart = -1
      } else if (gapStart < 0 && x < width) {
        gapStart = x
      }
    }
  }

  const output = new Uint8Array(horizontal)
  for (let x = 0; x < width; x += 1) {
    let gapStart = -1
    for (let y = 0; y <= height; y += 1) {
      const isWall = y < height && horizontal[y * width + x]
      if (isWall) {
        if (gapStart >= 0) {
          const gapLength = y - gapStart
          const topWall = gapStart - 1
          if (
            gapLength <= maxGap &&
            hasWallRun(horizontal, width, height, x, topWall, 0, -1) &&
            hasWallRun(horizontal, width, height, x, y, 0, 1)
          ) {
            for (let fillY = gapStart; fillY < y; fillY += 1) {
              output[fillY * width + x] = 1
            }
          }
        }
        gapStart = -1
      } else if (gapStart < 0 && y < height) {
        gapStart = y
      }
    }
  }

  return output
}

function connectedComponents(mask, width, height) {
  const labels = new Int32Array(width * height)
  const parent = [0]
  let nextLabel = 1

  const find = (label) => {
    let root = label
    while (parent[root] !== root) root = parent[root]
    while (parent[label] !== label) {
      const next = parent[label]
      parent[label] = root
      label = next
    }
    return root
  }

  const union = (a, b) => {
    const rootA = find(a)
    const rootB = find(b)
    if (rootA !== rootB) parent[rootB] = rootA
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x
      if (!mask[index]) continue
      const left = x > 0 ? labels[index - 1] : 0
      const top = y > 0 ? labels[index - width] : 0

      if (!left && !top) {
        labels[index] = nextLabel
        parent[nextLabel] = nextLabel
        nextLabel += 1
      } else if (left && top) {
        labels[index] = Math.min(left, top)
        union(left, top)
      } else {
        labels[index] = left || top
      }
    }
  }

  for (let index = 0; index < labels.length; index += 1) {
    if (labels[index]) labels[index] = find(labels[index])
  }

  return labels
}

function computeRegions(labels, width, height) {
  const regions = new Map()

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const label = labels[y * width + x]
      if (!label) continue
      if (!regions.has(label)) {
        regions.set(label, { minX: x, minY: y, maxX: x, maxY: y, area: 0 })
      }
      const region = regions.get(label)
      region.minX = Math.min(region.minX, x)
      region.minY = Math.min(region.minY, y)
      region.maxX = Math.max(region.maxX, x)
      region.maxY = Math.max(region.maxY, y)
      region.area += 1
    }
  }

  return [...regions.values()]
}

const roundDimension = (value) => Math.round(value * 100) / 100

export function analyseFloorPlan(image, {
  pixelsPerMetre,
  threshold = 175,
  minAreaSqM = 1.5,
  defaultHeight = 2.7,
  wallThickness = 0.15,
  maxDoorWidthM = 1.2,
} = {}) {
  if (!Number.isFinite(pixelsPerMetre) || pixelsPerMetre <= 0) {
    throw new Error('Enter a positive image scale in pixels per metre.')
  }

  const { canvas, context, scale } = scaleToCanvas(image)
  const { width, height } = canvas
  const analysisPpm = pixelsPerMetre * scale
  const imageData = context.getImageData(0, 0, width, height)
  const wallMask = toWallMask(imageData, threshold)
  const connectRadius = Math.max(1, Math.round(Math.min(width, height) / 600))
  const connectedWalls = dilateWalls(wallMask, width, height, connectRadius)
  const maxDoorGap = clamp(Math.round(analysisPpm * maxDoorWidthM), 4, 96)
  const sealedWalls = sealWallGaps(connectedWalls, width, height, maxDoorGap)

  const floorMask = new Uint8Array(sealedWalls.length)
  for (let index = 0; index < sealedWalls.length; index += 1) {
    floorMask[index] = sealedWalls[index] ? 0 : 1
  }

  const labels = connectedComponents(floorMask, width, height)
  const regions = computeRegions(labels, width, height)
  const minAreaPixels = minAreaSqM * analysisPpm * analysisPpm
  const rooms = []

  for (const region of regions) {
    const touchesImageEdge =
      region.minX === 0 || region.minY === 0 ||
      region.maxX === width - 1 || region.maxY === height - 1
    if (touchesImageEdge || region.area < minAreaPixels) continue

    const widthPixels = region.maxX - region.minX + 1
    const depthPixels = region.maxY - region.minY + 1
    const boundsArea = widthPixels * depthPixels
    if (region.area / boundsArea < 0.15) continue

    const widthM = widthPixels / analysisPpm
    const depthM = depthPixels / analysisPpm
    if (widthM < 1 || depthM < 1) continue

    rooms.push({
      x: roundDimension(region.minX / analysisPpm),
      z: roundDimension(region.minY / analysisPpm),
      width: roundDimension(widthM),
      depth: roundDimension(depthM),
      height: defaultHeight,
      wallThickness,
      doors: [],
    })
  }

  rooms.sort((a, b) => {
    const aCenter = a.z + a.depth / 2
    const bCenter = b.z + b.depth / 2
    return Math.abs(aCenter - bCenter) < Math.min(a.depth, b.depth) / 2
      ? a.x - b.x
      : aCenter - bCenter
  })

  return {
    rooms,
    canvasWidthM: width / analysisPpm,
    canvasDepthM: height / analysisPpm,
  }
}
