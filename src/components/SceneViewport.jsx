import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PointerLockControls } from '@react-three/drei'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { useCallback, useEffect, useMemo, useRef } from 'react'
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
  eyeHeight = 1.7,
  doors,
  furniture,
  settings,
  onLockChange,
}) {
  const camera = useThree((state) => state.camera)
  const controlsRef = useRef(null)
  const velocityYRef = useRef(0)
  const isGroundedRef = useRef(true)
  const isLockedRef = useRef(false)
  const bobTimeRef = useRef(0)
  const eyeLevelRef = useRef(eyeHeight)
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

    const onKeyDown = (event) => {
      if (event.code in pressedRef.current) {
        pressedRef.current[event.code] = true
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
    }
  }, [camera, eyeHeight])

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

    if (keys.Space && isGroundedRef.current) {
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
  })

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

  const selectedRoom = floorPlan.rooms.find((roomItem) => roomItem.id === floorPlan.selectedRoomId)
  const selectedDoors = selectedRoom?.doors ?? []
  const minDistance = Math.max(4, Math.max(room.width, room.depth) * 0.5)
  const maxDistance = Math.max(12, Math.max(room.width, room.depth) * 1.8)
  const useFirstPerson = cameraMode === 'firstPerson' && !isTouchDevice
  const resolvedCameraMode = useFirstPerson ? cameraMode : cameraMode === 'firstPerson' ? 'orbit' : cameraMode

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

      <Room />

      {useFirstPerson ? (
        <FirstPersonController
          roomWidth={room.width}
          roomDepth={room.depth}
          eyeHeight={preset.position[1]}
          doors={selectedDoors}
          furniture={furniture}
          settings={firstPerson}
          onLockChange={onFirstPersonLockChange}
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
    </Canvas>
  )
}
