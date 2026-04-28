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

      if (event.code === 'KeyF' && !event.repeat && nearbyFurnitureRef.current) {
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
  }, [camera, eyeHeight, isTouchDevice, onLockChange, setGrabbedFurnitureId, mobileMoveRef, mobileLookRef])

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
  const firstPerson = useSceneStore((state) => state.firstPerson)
  const floorPlan = useSceneStore((state) => state.floorPlan)
  const mobileMoveRef = useRef({ x: 0, y: 0 })
  const mobileLookRef = useRef({ x: 0, y: 0 })
  const [nearbyFurnitureId, setNearbyFurnitureId] = useState(null)
  const [grabbedFurnitureId, setGrabbedFurnitureId] = useState(null)

  const selectedRoom = floorPlan.rooms.find((roomItem) => roomItem.id === floorPlan.selectedRoomId)
  const selectedDoors = selectedRoom?.doors ?? []
  const selectedRoomFurniture = useMemo(
    () => furniture.filter((item) => item.roomId === selectedRoom?.id),
    [furniture, selectedRoom?.id],
  )
  const minDistance = Math.max(4, Math.max(room.width, room.depth) * 0.5)
  const maxDistance = Math.max(12, Math.max(room.width, room.depth) * 1.8)
  const useFirstPerson = cameraMode === 'firstPerson'
  const resolvedCameraMode = cameraMode

  const handleFurniturePointerDown = (furnitureId) => {
    if (!useFirstPerson) {
      return
    }

    if (nearbyFurnitureId !== furnitureId) {
      return
    }

    setGrabbedFurnitureId((current) => (current === furnitureId ? null : furnitureId))
  }

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

      <Room onFurniturePointerDown={handleFurniturePointerDown} />

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

      {useFirstPerson && (nearbyFurnitureId || grabbedFurnitureId) && (
        <Html fullscreen>
          <div className="fp-furniture-hint">
            {grabbedFurnitureId
              ? 'Dragging furniture. Click again or press F to release.'
              : 'Furniture nearby: click it or press F to drag.'}
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
