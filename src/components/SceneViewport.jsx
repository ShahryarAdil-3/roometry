import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PointerLockControls } from '@react-three/drei'
import { useEffect, useRef } from 'react'
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

function FirstPersonController({ roomWidth, roomDepth, eyeHeight = 1.7 }) {
  const camera = useThree((state) => state.camera)
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
  })

  useEffect(() => {
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
  }, [])

  useFrame((_, delta) => {
    const keys = pressedRef.current
    const direction = camera.getWorldDirection(new THREE.Vector3())
    const forwardVector = { x: 0, z: 0 }
    const rightVector = { x: 0, z: 0 }

    forwardVector.x = direction.x
    forwardVector.z = direction.z

    const forwardLength = Math.hypot(forwardVector.x, forwardVector.z) || 1
    forwardVector.x /= forwardLength
    forwardVector.z /= forwardLength

    rightVector.x = forwardVector.z
    rightVector.z = -forwardVector.x

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

    if (moveX !== 0 || moveZ !== 0) {
      const movementLength = Math.hypot(moveX, moveZ)
      const speed = (keys.ShiftLeft || keys.ShiftRight ? 4.5 : 2.6) * delta
      const nextX = camera.position.x + (moveX / movementLength) * speed
      const nextZ = camera.position.z + (moveZ / movementLength) * speed
      const halfW = roomWidth / 2 - 0.25
      const halfD = roomDepth / 2 - 0.25

      camera.position.x = THREE.MathUtils.clamp(nextX, -halfW, halfW)
      camera.position.z = THREE.MathUtils.clamp(nextZ, -halfD, halfD)
    }

    camera.position.y = eyeHeight
  })

  return <PointerLockControls makeDefault />
}

export default function SceneViewport({ cameraMode, preset }) {
  const room = useSceneStore((state) => state.room)

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
