import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, OrbitControls, PointerLockControls } from '@react-three/drei'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import Room from '../scenes/Room'
import { useSceneStore } from '../store/useSceneStore'

/* eslint-disable react-hooks/immutability */

function CameraSync({ preset }) {
  const camera = useThree((state) => state.camera)

  useEffect(() => {
    camera.position.set(preset.position[0], preset.position[1], preset.position[2])
    camera.fov = preset.fov
    camera.lookAt(preset.target[0], preset.target[1], preset.target[2])
    camera.updateProjectionMatrix()
  }, [camera, preset])

  return null
}

function FirstPersonController({
  roomWidth,
  roomDepth,
  roomHeight,
  eyeHeight = 1.7,
  doors,
  furniture,
  settings,
  onLockChange,
  allowGrab = true,
  isTouchDevice = false,
  mobileMoveRef,
  mobileLookRef,
  setNearbyFurnitureId,
  grabbedFurnitureId,
  setGrabbedFurnitureId,
}) {
  const camera = useThree((state) => state.camera)
  const updateFurniture = useSceneStore((state) => state.updateFurniture)
  const controlsRef = useRef(null)
  const velocityYRef = useRef(0)
  const isGroundedRef = useRef(true)
  const isLockedRef = useRef(false)
  const bobTimeRef = useRef(0)
  const eyeLevelRef = useRef(eyeHeight)
  const yawRef = useRef(0)
  const pitchRef = useRef(0)
  const nearbyFurnitureRef = useRef(null)
  const pressedRef = useRef({
    KeyW: false,
    KeyA: false,
    KeyS: false,
    KeyD: false,
    ArrowUp: false,
    ArrowLeft: false,
    ArrowDown: false,
    ArrowRight: false,
    ShiftLeft: false,
    ShiftRight: false,
    Space: false,
    ControlLeft: false,
    ControlRight: false,
  })

  const colliderPadding = 0.38
  const jumpVelocity = settings.jumpVelocity
  const gravity = 12.5
  const wallRadius = 0.22
  const reachDistance = 2.4
  const heldDistance = 1.45

  const doorByWall = useMemo(() => {
    const map = {
      north: null,
      south: null,
      east: null,
      west: null,
    }

    for (const door of doors) {
      map[door.wall] = door
    }

    return map
  }, [doors])

  const furnitureColliders = useMemo(() => {
    return furniture.map((item) => {
      const halfX = (item.scale?.[0] ?? 1) * 0.5 + colliderPadding
      const halfZ = (item.scale?.[2] ?? 1) * 0.5 + colliderPadding

      return {
        minX: item.position[0] - halfX,
        maxX: item.position[0] + halfX,
        minZ: item.position[2] - halfZ,
        maxZ: item.position[2] + halfZ,
      }
    })
  }, [furniture])

  useEffect(() => {
    eyeLevelRef.current = eyeHeight
    camera.position.y = eyeHeight

    const initialEuler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ')
    yawRef.current = initialEuler.y
    pitchRef.current = initialEuler.x

    if (isTouchDevice) {
      isLockedRef.current = true
      onLockChange?.(true)
    }

    const onKeyDown = (event) => {
      if (event.code in pressedRef.current) {
        pressedRef.current[event.code] = true
      }

      if (allowGrab && event.code === 'KeyF' && !event.repeat && nearbyFurnitureRef.current) {
        setGrabbedFurnitureId((current) =>
          current === nearbyFurnitureRef.current ? null : nearbyFurnitureRef.current,
        )
      }
    }

    const onKeyUp = (event) => {
      if (event.code in pressedRef.current) {
        pressedRef.current[event.code] = false
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)

      if (mobileMoveRef?.current) {
        mobileMoveRef.current = { x: 0, y: 0 }
      }
      if (mobileLookRef?.current) {
        mobileLookRef.current = { x: 0, y: 0 }
      }

      if (isTouchDevice) {
        onLockChange?.(false)
      }
    }
  }, [allowGrab, camera, eyeHeight, isTouchDevice, onLockChange, setGrabbedFurnitureId, mobileMoveRef, mobileLookRef])

  const collidesWithWalls = useCallback((x, z, y) => {
    const halfW = roomWidth / 2
    const halfD = roomDepth / 2

    if (x <= -halfW + wallRadius) {
      const door = doorByWall.west
      if (!door || Math.abs(z - door.offset) > door.width / 2 - wallRadius * 0.35 || y > door.height) {
        return true
      }
    }

    if (x >= halfW - wallRadius) {
      const door = doorByWall.east
      if (!door || Math.abs(z - door.offset) > door.width / 2 - wallRadius * 0.35 || y > door.height) {
        return true
      }
    }

    if (z <= -halfD + wallRadius) {
      const door = doorByWall.north
      if (!door || Math.abs(x - door.offset) > door.width / 2 - wallRadius * 0.35 || y > door.height) {
        return true
      }
    }

    if (z >= halfD - wallRadius) {
      const door = doorByWall.south
      if (!door || Math.abs(x - door.offset) > door.width / 2 - wallRadius * 0.35 || y > door.height) {
        return true
      }
    }

    return false
  }, [doorByWall, roomDepth, roomWidth])

  const collidesWithFurniture = useCallback((x, z) => {
    for (const box of furnitureColliders) {
      if (x > box.minX && x < box.maxX && z > box.minZ && z < box.maxZ) {
        return true
      }
    }

    return false
  }, [furnitureColliders])

  const clampToInterior = useCallback((x, z) => {
    const halfW = roomWidth / 2
    const halfD = roomDepth / 2
    const margin = wallRadius + 0.05

    return {
      x: THREE.MathUtils.clamp(x, -halfW + margin, halfW - margin),
      z: THREE.MathUtils.clamp(z, -halfD + margin, halfD - margin),
    }
  }, [roomDepth, roomWidth])

  const findNearestSafePoint = useCallback((x, z, y) => {
    const clamped = clampToInterior(x, z)
    if (!collidesWithWalls(clamped.x, clamped.z, y) && !collidesWithFurniture(clamped.x, clamped.z)) {
      return clamped
    }

    const center = clampToInterior(0, 0)
    if (!collidesWithWalls(center.x, center.z, y) && !collidesWithFurniture(center.x, center.z)) {
      return center
    }

    const radii = [0.35, 0.6, 0.9, 1.2, 1.5]
    for (const radius of radii) {
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
        const candidate = clampToInterior(
          center.x + Math.cos(angle) * radius,
          center.z + Math.sin(angle) * radius,
        )
        if (
          !collidesWithWalls(candidate.x, candidate.z, y) &&
          !collidesWithFurniture(candidate.x, candidate.z)
        ) {
          return candidate
        }
      }
    }

    return center
  }, [clampToInterior, collidesWithFurniture, collidesWithWalls])

  useEffect(() => {
    const y = Math.max(eyeHeight, camera.position.y)
    const safe = findNearestSafePoint(camera.position.x, camera.position.z, y)
    camera.position.set(safe.x, y, safe.z)
  }, [camera, eyeHeight, findNearestSafePoint])

  useFrame((_, delta) => {
    if (furniture.length) {
      let nearestId = null
      let nearestDistance = Number.POSITIVE_INFINITY

      for (const item of furniture) {
        const distance = Math.hypot(
          camera.position.x - item.position[0],
          camera.position.y - item.position[1],
          camera.position.z - item.position[2],
        )

        if (distance < reachDistance && distance < nearestDistance) {
          nearestDistance = distance
          nearestId = item.id
        }
      }

      if (nearbyFurnitureRef.current !== nearestId) {
        nearbyFurnitureRef.current = nearestId
        setNearbyFurnitureId(nearestId)
      }
    } else if (nearbyFurnitureRef.current !== null) {
      nearbyFurnitureRef.current = null
      setNearbyFurnitureId(null)
    }

    if (grabbedFurnitureId && !furniture.some((item) => item.id === grabbedFurnitureId)) {
      setGrabbedFurnitureId(null)
    }

    if (
      collidesWithWalls(camera.position.x, camera.position.z, camera.position.y) ||
      collidesWithFurniture(camera.position.x, camera.position.z)
    ) {
      const safe = findNearestSafePoint(camera.position.x, camera.position.z, camera.position.y)
      camera.position.x = safe.x
      camera.position.z = safe.z
    }

    if (!isLockedRef.current) {
      return
    }

    const keys = pressedRef.current
    const direction = camera.getWorldDirection(new THREE.Vector3())
    const forwardVector = { x: 0, z: 0 }
    const rightVector = { x: 0, z: 0 }

    forwardVector.x = direction.x
    forwardVector.z = direction.z

    const forwardLength = Math.hypot(forwardVector.x, forwardVector.z) || 1
    forwardVector.x /= forwardLength
    forwardVector.z /= forwardLength

    rightVector.x = -forwardVector.z
    rightVector.z = forwardVector.x

    let moveX = 0
    let moveZ = 0

    if (isTouchDevice && mobileLookRef?.current) {
      const deltaLookX = mobileLookRef.current.x
      const deltaLookY = mobileLookRef.current.y

      if (deltaLookX !== 0 || deltaLookY !== 0) {
        yawRef.current -= deltaLookX * 0.0042 * settings.lookSensitivity
        pitchRef.current -= deltaLookY * 0.0042 * settings.lookSensitivity
        pitchRef.current = THREE.MathUtils.clamp(pitchRef.current, -1.35, 1.35)

        camera.rotation.set(pitchRef.current, yawRef.current, 0, 'YXZ')
        mobileLookRef.current.x = 0
        mobileLookRef.current.y = 0
      }
    }

    if (keys.KeyW || keys.ArrowUp) {
      moveX += forwardVector.x
      moveZ += forwardVector.z
    }
    if (keys.KeyS || keys.ArrowDown) {
      moveX -= forwardVector.x
      moveZ -= forwardVector.z
    }
    if (keys.KeyD || keys.ArrowRight) {
      moveX += rightVector.x
      moveZ += rightVector.z
    }
    if (keys.KeyA || keys.ArrowLeft) {
      moveX -= rightVector.x
      moveZ -= rightVector.z
    }

    if (isTouchDevice && mobileMoveRef?.current) {
      const mobileX = mobileMoveRef.current.x
      const mobileY = mobileMoveRef.current.y

      moveX += rightVector.x * mobileX + forwardVector.x * -mobileY
      moveZ += rightVector.z * mobileX + forwardVector.z * -mobileY
    }

    const isCrouching = keys.ControlLeft || keys.ControlRight
    const targetEye = isCrouching ? settings.crouchHeight : eyeHeight
    eyeLevelRef.current = THREE.MathUtils.lerp(eyeLevelRef.current, targetEye, 0.18)

    if (moveX !== 0 || moveZ !== 0) {
      const movementLength = Math.hypot(moveX, moveZ)
      const moveSpeed = keys.ShiftLeft || keys.ShiftRight
        ? settings.moveSpeed * settings.sprintMultiplier
        : settings.moveSpeed
      const speed = moveSpeed * delta
      const nextX = camera.position.x + (moveX / movementLength) * speed
      const nextZ = camera.position.z + (moveZ / movementLength) * speed
      const currentY = camera.position.y

      if (!collidesWithWalls(nextX, camera.position.z, currentY) && !collidesWithFurniture(nextX, camera.position.z)) {
        camera.position.x = nextX
      }
      if (!collidesWithWalls(camera.position.x, nextZ, currentY) && !collidesWithFurniture(camera.position.x, nextZ)) {
        camera.position.z = nextZ
      }

      if (isGroundedRef.current) {
        bobTimeRef.current += delta * settings.headBobFrequency
      }
    } else {
      bobTimeRef.current = 0
    }

    if (!isTouchDevice && keys.Space && isGroundedRef.current) {
      velocityYRef.current = jumpVelocity
      isGroundedRef.current = false
    }

    velocityYRef.current -= gravity * delta
    camera.position.y += velocityYRef.current * delta

    const floorEyeLevel = eyeLevelRef.current
    if (camera.position.y <= floorEyeLevel) {
      camera.position.y = floorEyeLevel
      velocityYRef.current = 0
      isGroundedRef.current = true
    }

    if (isGroundedRef.current && bobTimeRef.current > 0) {
      camera.position.y += Math.sin(bobTimeRef.current) * settings.headBobIntensity
    }

    if (
      collidesWithWalls(camera.position.x, camera.position.z, camera.position.y) ||
      collidesWithFurniture(camera.position.x, camera.position.z)
    ) {
      const safe = findNearestSafePoint(camera.position.x, camera.position.z, camera.position.y)
      camera.position.x = safe.x
      camera.position.z = safe.z
    }

    if (grabbedFurnitureId) {
      const heldFurniture = furniture.find((item) => item.id === grabbedFurnitureId)
      if (heldFurniture) {
        const directionToView = camera.getWorldDirection(new THREE.Vector3()).normalize()
        const targetX = camera.position.x + directionToView.x * heldDistance
        const targetZ = camera.position.z + directionToView.z * heldDistance

        const halfX = Math.max(0.2, (heldFurniture.scale?.[0] ?? 1) * 0.5)
        const halfY = Math.max(0.2, (heldFurniture.scale?.[1] ?? 1) * 0.5)
        const halfZ = Math.max(0.2, (heldFurniture.scale?.[2] ?? 1) * 0.5)

        const safeX = THREE.MathUtils.clamp(targetX, -roomWidth / 2 + halfX + 0.05, roomWidth / 2 - halfX - 0.05)
        const safeY = THREE.MathUtils.clamp(
          heldFurniture.position[1],
          halfY + 0.02,
          Math.max(halfY + 0.02, roomHeight - halfY - 0.02),
        )
        const safeZ = THREE.MathUtils.clamp(targetZ, -roomDepth / 2 + halfZ + 0.05, roomDepth / 2 - halfZ - 0.05)

        if (
          Math.abs(heldFurniture.position[0] - safeX) > 0.006 ||
          Math.abs(heldFurniture.position[1] - safeY) > 0.006 ||
          Math.abs(heldFurniture.position[2] - safeZ) > 0.006
        ) {
          updateFurniture(grabbedFurnitureId, {
            position: [safeX, safeY, safeZ],
          })
        }
      }
    }
  })

  if (isTouchDevice) {
    return null
  }

  return (
    <PointerLockControls
      ref={controlsRef}
      makeDefault
      selector=".app canvas"
      pointerSpeed={settings.lookSensitivity}
      onLock={() => {
        isLockedRef.current = true
        onLockChange?.(true)
      }}
      onUnlock={() => {
        isLockedRef.current = false
        onLockChange?.(false)
      }}
    />
  )
}

export default function SceneViewport({ cameraMode, preset, onFirstPersonLockChange, isTouchDevice = false }) {
  const room = useSceneStore((state) => state.room)
  const furniture = useSceneStore((state) => state.furniture)
  const addFurniture = useSceneStore((state) => state.addFurniture)
  const updateFurniture = useSceneStore((state) => state.updateFurniture)
  const furniturePlacement = useSceneStore((state) => state.furniturePlacement)
  const setFurniturePlacement = useSceneStore((state) => state.setFurniturePlacement)
  const firstPerson = useSceneStore((state) => state.firstPerson)
  const floorPlan = useSceneStore((state) => state.floorPlan)
  const mobileMoveRef = useRef({ x: 0, y: 0 })
  const mobileLookRef = useRef({ x: 0, y: 0 })
  const [nearbyFurnitureId, setNearbyFurnitureId] = useState(null)
  const [grabbedFurnitureId, setGrabbedFurnitureId] = useState(null)
  const [ghostPosition, setGhostPosition] = useState(null)
  const [ghostBlocked, setGhostBlocked] = useState(false)
  const [movingFurnitureId, setMovingFurnitureId] = useState(null)
  const [guideLines, setGuideLines] = useState({ x: null, z: null })

  const selectedRoom = floorPlan.rooms.find((roomItem) => roomItem.id === floorPlan.selectedRoomId)
  const selectedDoors = selectedRoom?.doors ?? []
  const placementTemplate =
    furniturePlacement && furniturePlacement.roomId === selectedRoom?.id ? furniturePlacement : null
  const selectedRoomFurniture = useMemo(
    () => furniture.filter((item) => item.roomId === selectedRoom?.id),
    [furniture, selectedRoom?.id],
  )
  const minDistance = Math.max(4, Math.max(room.width, room.depth) * 0.5)
  const maxDistance = Math.max(12, Math.max(room.width, room.depth) * 1.8)
  const useFirstPerson = cameraMode === 'firstPerson'
  const resolvedCameraMode = cameraMode

  useEffect(() => {
    if (!placementTemplate) {
      return
    }

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setFurniturePlacement(null)
        setMovingFurnitureId(null)
        setGhostPosition(null)
        setGhostBlocked(false)
        return
      }

      if (event.key.toLowerCase() === 'g') {
        setFurniturePlacement({
          ...placementTemplate,
          snapToGrid: !placementTemplate.snapToGrid,
        })
        return
      }

      if (event.key.toLowerCase() === 'q') {
        setFurniturePlacement({
          ...placementTemplate,
          rotationY: (placementTemplate.rotationY ?? 0) - 0.2,
        })
      }

      if (event.key.toLowerCase() === 'e') {
        setFurniturePlacement({
          ...placementTemplate,
          rotationY: (placementTemplate.rotationY ?? 0) + 0.2,
        })
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [placementTemplate, setFurniturePlacement])

  useEffect(() => {
    if (!useFirstPerson) {
      return
    }

    const onKeyDown = (event) => {
      if (event.key.toLowerCase() !== 'f') {
        return
      }

      if (!nearbyFurnitureId) {
        return
      }

      const item = selectedRoomFurniture.find((entry) => entry.id === nearbyFurnitureId)
      if (!item) {
        return
      }

      event.preventDefault()
      setFurniturePlacement({
        type: item.type,
        roomId: item.roomId,
        scale: item.scale,
        rotationY: item.rotation?.[1] ?? 0,
        snapToGrid: placementTemplate?.snapToGrid ?? true,
        material: item.material,
      })
      setMovingFurnitureId(item.id)
      setGhostPosition(item.position)
      setGuideLines({ x: null, z: null })
      setGrabbedFurnitureId(null)
    }

    window.addEventListener('keydown', onKeyDown)

    return () => window.removeEventListener('keydown', onKeyDown)
  }, [nearbyFurnitureId, placementTemplate?.snapToGrid, selectedRoomFurniture, setFurniturePlacement, useFirstPerson])


  const getHalfExtents = useCallback((scale) => ({
    x: Math.max(0.2, (scale?.[0] ?? 1) * 0.5),
    y: Math.max(0.2, (scale?.[1] ?? 1) * 0.5),
    z: Math.max(0.2, (scale?.[2] ?? 1) * 0.5),
  }), [])

  const isFurnitureColliding = useCallback(
    (position, scale, ignoreId) => {
      if (!position || !scale) {
        return false
      }

      const half = getHalfExtents(scale)
      const minX = position[0] - half.x
      const maxX = position[0] + half.x
      const minZ = position[2] - half.z
      const maxZ = position[2] + half.z

      return selectedRoomFurniture.some((item) => {
        if (item.id === ignoreId) {
          return false
        }

        const otherHalf = getHalfExtents(item.scale)
        const otherMinX = item.position[0] - otherHalf.x
        const otherMaxX = item.position[0] + otherHalf.x
        const otherMinZ = item.position[2] - otherHalf.z
        const otherMaxZ = item.position[2] + otherHalf.z

        const separated =
          maxX <= otherMinX ||
          minX >= otherMaxX ||
          maxZ <= otherMinZ ||
          minZ >= otherMaxZ

        return !separated
      })
    },
    [getHalfExtents, selectedRoomFurniture],
  )

  const handleFurniturePointerDown = (furnitureId) => {
    const item = selectedRoomFurniture.find((entry) => entry.id === furnitureId)
    if (!item) {
      return
    }

    if (placementTemplate) {
      setMovingFurnitureId(furnitureId)
      setGhostPosition(item.position)
      setGuideLines({ x: null, z: null })
      return
    }

    setFurniturePlacement({
      type: item.type,
      roomId: item.roomId,
      scale: item.scale,
      rotationY: item.rotation?.[1] ?? 0,
      snapToGrid: true,
      material: item.material,
    })
    setMovingFurnitureId(furnitureId)
    setGhostPosition(item.position)

    if (!useFirstPerson) {
      return
    }

    if (nearbyFurnitureId !== furnitureId) {
      return
    }

    setGrabbedFurnitureId((current) => (current === furnitureId ? null : furnitureId))
  }

  const clampPlacementPoint = useCallback(
    (point) => {
      if (!placementTemplate) {
        return null
      }

      const halfX = Math.max(0.2, (placementTemplate.scale?.[0] ?? 1) * 0.5)
      const halfY = Math.max(0.2, (placementTemplate.scale?.[1] ?? 1) * 0.5)
      const halfZ = Math.max(0.2, (placementTemplate.scale?.[2] ?? 1) * 0.5)

      const snapStep = placementTemplate.snapToGrid
        ? Math.max(0.05, floorPlan.snapStep || 0.25)
        : 0

      let rawX = THREE.MathUtils.clamp(point.x, -room.width / 2 + halfX, room.width / 2 - halfX)
      let rawZ = THREE.MathUtils.clamp(point.z, -room.depth / 2 + halfZ, room.depth / 2 - halfZ)

      if (snapStep) {
        rawX = Math.round(rawX / snapStep) * snapStep
        rawZ = Math.round(rawZ / snapStep) * snapStep
      }

      const alignThreshold = 0.35
      let guideX = null
      let guideZ = null

      const centerX = 0
      const centerZ = 0
      const leftX = -room.width / 2 + halfX
      const rightX = room.width / 2 - halfX
      const topZ = -room.depth / 2 + halfZ
      const bottomZ = room.depth / 2 - halfZ

      if (Math.abs(rawX - centerX) <= alignThreshold) {
        rawX = centerX
        guideX = centerX
      } else if (Math.abs(rawX - leftX) <= alignThreshold) {
        rawX = leftX
        guideX = leftX
      } else if (Math.abs(rawX - rightX) <= alignThreshold) {
        rawX = rightX
        guideX = rightX
      }

      if (Math.abs(rawZ - centerZ) <= alignThreshold) {
        rawZ = centerZ
        guideZ = centerZ
      } else if (Math.abs(rawZ - topZ) <= alignThreshold) {
        rawZ = topZ
        guideZ = topZ
      } else if (Math.abs(rawZ - bottomZ) <= alignThreshold) {
        rawZ = bottomZ
        guideZ = bottomZ
      }

      return {
        position: [rawX, halfY, rawZ],
        guideX,
        guideZ,
      }
    },
    [floorPlan.snapStep, placementTemplate, room.depth, room.width],
  )

  const handleFloorPointerMove = useCallback(
    (event) => {
      if (!placementTemplate) {
        if (ghostPosition) {
          setGhostPosition(null)
          setGhostBlocked(false)
        }
        return
      }

      const next = clampPlacementPoint(event.point)
      if (next) {
        setGhostPosition(next.position)
        setGuideLines({ x: next.guideX, z: next.guideZ })
        setGhostBlocked(isFurnitureColliding(next.position, placementTemplate.scale, movingFurnitureId))
      }
    },
    [clampPlacementPoint, ghostPosition, isFurnitureColliding, movingFurnitureId, placementTemplate],
  )

  const handleFloorPointerDown = useCallback(
    (event) => {
      if (!placementTemplate || !ghostPosition || ghostBlocked) {
        return
      }

      event.stopPropagation()
      if (movingFurnitureId) {
        updateFurniture(movingFurnitureId, {
          position: ghostPosition,
          rotation: [0, placementTemplate.rotationY ?? 0, 0],
        })
        setMovingFurnitureId(null)
        setGuideLines({ x: null, z: null })
        return
      }

      addFurniture({
        id: `furniture-${Date.now()}`,
        type: placementTemplate.type,
        roomId: placementTemplate.roomId,
        position: ghostPosition,
        rotation: [0, placementTemplate.rotationY ?? 0, 0],
        scale: placementTemplate.scale,
        material: placementTemplate.material,
      })
    },
    [addFurniture, ghostBlocked, ghostPosition, movingFurnitureId, placementTemplate, updateFurniture],
  )

  return (
    <Canvas shadows camera={{ position: preset.position, fov: preset.fov }} dpr={[1, 2]}>
      <CameraSync preset={preset} />
      <color attach="background" args={['#a9bfce']} />
      <fog attach="fog" args={['#a9bfce', 8, 32]} />
      <hemisphereLight intensity={0.52} groundColor="#6f6f7a" color="#e4f4ff" />
      <ambientLight intensity={0.18} color="#d9ecff" />
      <directionalLight
        castShadow
        position={[6, 9, 5]}
        intensity={1.25}
        color="#fff2d9"
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight position={[-5, 4, -6]} intensity={0.45} color="#9edfff" />
      <spotLight position={[0, room.height + 2.5, 0]} angle={0.55} intensity={0.38} color="#a9efff" />

      <Room
        onFurniturePointerDown={handleFurniturePointerDown}
        onFloorPointerMove={handleFloorPointerMove}
        onFloorPointerDown={handleFloorPointerDown}
      />

      {useFirstPerson ? (
        <FirstPersonController
          roomWidth={room.width}
          roomDepth={room.depth}
          roomHeight={room.height}
          eyeHeight={preset.position[1]}
          doors={selectedDoors}
          furniture={selectedRoomFurniture}
          settings={firstPerson}
          onLockChange={onFirstPersonLockChange}
          allowGrab={!placementTemplate && !movingFurnitureId}
          isTouchDevice={isTouchDevice}
          mobileMoveRef={mobileMoveRef}
          mobileLookRef={mobileLookRef}
          setNearbyFurnitureId={setNearbyFurnitureId}
          grabbedFurnitureId={grabbedFurnitureId}
          setGrabbedFurnitureId={setGrabbedFurnitureId}
        />
      ) : (
        <OrbitControls
          enablePan
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={isTouchDevice ? 0.75 : 1}
          zoomSpeed={0.85}
          panSpeed={0.7}
          minDistance={minDistance}
          maxDistance={maxDistance}
          maxPolarAngle={resolvedCameraMode === 'top' ? Math.PI / 2.01 : Math.PI / 2.02}
          target={preset.target}
          touches={{
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN,
          }}
        />
      )}

      <EffectComposer>
        <Bloom intensity={0.35} luminanceThreshold={0.7} mipmapBlur />
        <Vignette eskil={false} offset={0.19} darkness={0.56} />
      </EffectComposer>

      {placementTemplate && ghostPosition && (
        <mesh
          position={ghostPosition}
          rotation={[0, placementTemplate.rotationY ?? 0, 0]}
          scale={placementTemplate.scale}
          renderOrder={2}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color={ghostBlocked ? '#e76b6b' : placementTemplate.material?.color ?? '#7aa8c7'}
            transparent
            opacity={0.35}
            wireframe
          />
        </mesh>
      )}

      {placementTemplate && (guideLines.x !== null || guideLines.z !== null) && (
        <group>
          {guideLines.x !== null && (
            <mesh position={[guideLines.x, 0.02, 0]}>
              <boxGeometry args={[0.02, 0.02, room.depth]} />
              <meshStandardMaterial color="#7dd3fc" transparent opacity={0.6} />
            </mesh>
          )}
          {guideLines.z !== null && (
            <mesh position={[0, 0.02, guideLines.z]}>
              <boxGeometry args={[room.width, 0.02, 0.02]} />
              <meshStandardMaterial color="#7dd3fc" transparent opacity={0.6} />
            </mesh>
          )}
        </group>
      )}

      {placementTemplate && (
        <Html fullscreen>
          <div className="placement-hud">
            <div className="placement-hud-title">
              Placing: {placementTemplate.type}
            </div>
            <div className="placement-hud-row">
              Rotation: {(placementTemplate.rotationY ?? 0).toFixed(2)} rad
            </div>
            <div className="placement-hud-row">
              Snap: {placementTemplate.snapToGrid ? 'On' : 'Off'}
            </div>
            <div className="placement-hud-row">
              Keys: Q/E rotate, G toggle snap, Esc cancel
            </div>
            {ghostBlocked && (
              <div className="placement-hud-warning">Blocked: overlaps another item.</div>
            )}
          </div>
        </Html>
      )}

      {(useFirstPerson && (nearbyFurnitureId || grabbedFurnitureId) && !placementTemplate && !movingFurnitureId) && (
        <Html fullscreen>
          <div className="fp-furniture-hint">
            {grabbedFurnitureId
              ? 'Dragging furniture. Click again or press F to release.'
              : 'Furniture nearby: press F to move it.'}
          </div>
        </Html>
      )}

      {useFirstPerson && isTouchDevice && (
        <Html fullscreen>
          <div className="mobile-fp-overlay" role="presentation">
            <MobileJoystick moveRef={mobileMoveRef} />
            <MobileLookPad lookRef={mobileLookRef} />
          </div>
        </Html>
      )}
    </Canvas>
  )
}

function MobileJoystick({ moveRef }) {
  const stickRef = useRef(null)
  const centerRef = useRef({ x: 0, y: 0 })
  const activePointerRef = useRef(null)

  const updateFromPointer = (event) => {
    const center = centerRef.current
    const dx = event.clientX - center.x
    const dy = event.clientY - center.y
    const maxDistance = 48
    const length = Math.hypot(dx, dy) || 1
    const clamped = Math.min(maxDistance, length)
    const nextX = (dx / length) * clamped
    const nextY = (dy / length) * clamped

    if (stickRef.current) {
      stickRef.current.style.transform = `translate(${nextX}px, ${nextY}px)`
    }

    moveRef.current = {
      x: nextX / maxDistance,
      y: nextY / maxDistance,
    }
  }

  return (
    <div
      className="mobile-joystick"
      onPointerDown={(event) => {
        activePointerRef.current = event.pointerId
        event.currentTarget.setPointerCapture(event.pointerId)
        const bounds = event.currentTarget.getBoundingClientRect()
        centerRef.current = {
          x: bounds.left + bounds.width / 2,
          y: bounds.top + bounds.height / 2,
        }
        updateFromPointer(event)
      }}
      onPointerMove={(event) => {
        if (activePointerRef.current !== event.pointerId) {
          return
        }
        updateFromPointer(event)
      }}
      onPointerUp={(event) => {
        if (activePointerRef.current !== event.pointerId) {
          return
        }

        activePointerRef.current = null
        moveRef.current = { x: 0, y: 0 }
        if (stickRef.current) {
          stickRef.current.style.transform = 'translate(0px, 0px)'
        }
      }}
    >
      <div className="mobile-joystick-base" />
      <div ref={stickRef} className="mobile-joystick-stick" />
    </div>
  )
}

function MobileLookPad({ lookRef }) {
  const activePointerRef = useRef(null)
  const lastPointRef = useRef({ x: 0, y: 0 })

  return (
    <div
      className="mobile-look-pad"
      onPointerDown={(event) => {
        activePointerRef.current = event.pointerId
        lastPointRef.current = {
          x: event.clientX,
          y: event.clientY,
        }
        event.currentTarget.setPointerCapture(event.pointerId)
      }}
      onPointerMove={(event) => {
        if (activePointerRef.current !== event.pointerId) {
          return
        }

        const dx = event.clientX - lastPointRef.current.x
        const dy = event.clientY - lastPointRef.current.y
        lookRef.current.x += dx
        lookRef.current.y += dy

        lastPointRef.current = {
          x: event.clientX,
          y: event.clientY,
        }
      }}
      onPointerUp={(event) => {
        if (activePointerRef.current === event.pointerId) {
          activePointerRef.current = null
        }
      }}
    >
      <span>Swipe to look</span>
    </div>
  )
}
