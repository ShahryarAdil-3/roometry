import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PointerLockControls } from '@react-three/drei'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import Room from '../scenes/room'
import { useSceneStore } from '../store/useSceneStore'

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
  const doorway = {
    width: 1.8,
    height: 2.2,
    outsideDepth: 1.6,
  }

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

  const collidesWithWalls = (x, z, y) => {
    const halfW = roomWidth / 2
    const halfD = roomDepth / 2
    const doorwayHalf = doorway.width / 2

    if (x <= -halfW + wallRadius || x >= halfW - wallRadius) {
      return true
    }

    if (z >= halfD - wallRadius) {
      return true
    }

    if (z <= -halfD - doorway.outsideDepth) {
      return true
    }

    if (z <= -halfD + wallRadius) {
      const insideDoorwayWidth = Math.abs(x) <= doorwayHalf - wallRadius * 0.35
      const belowDoorLintel = y <= doorway.height
      if (!(insideDoorwayWidth && belowDoorLintel)) {
        return true
      }
    }

    return false
  }

  const collidesWithFurniture = (x, z) => {
    for (const box of furnitureColliders) {
      if (x > box.minX && x < box.maxX && z > box.minZ && z < box.maxZ) {
        return true
      }
    }

    return false
  }

  useFrame((_, delta) => {
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

export default function SceneViewport({ cameraMode, preset, onFirstPersonLockChange }) {
  const room = useSceneStore((state) => state.room)
  const furniture = useSceneStore((state) => state.furniture)
  const firstPerson = useSceneStore((state) => state.firstPerson)

  return (
    <Canvas shadows camera={{ position: preset.position, fov: preset.fov }} dpr={[1, 2]}>
      <CameraSync preset={preset} />
      <color attach="background" args={['#c6d3dd']} />
      <hemisphereLight intensity={0.45} groundColor="#99856e" />
      <directionalLight
        castShadow
        position={[5, 8, 4]}
        intensity={1.1}
        shadow-mapSize={[2048, 2048]}
      />

      <Room />

      {cameraMode === 'firstPerson' ? (
        <FirstPersonController
          roomWidth={room.width}
          roomDepth={room.depth}
          eyeHeight={preset.position[1]}
          furniture={furniture}
          settings={firstPerson}
          onLockChange={onFirstPersonLockChange}
        />
      ) : (
        <OrbitControls
          enablePan
          minDistance={4}
          maxDistance={12}
          maxPolarAngle={cameraMode === 'top' ? Math.PI / 2.01 : Math.PI / 2.02}
          target={preset.target}
        />
      )}
    </Canvas>
  )
}
