import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useEffect } from 'react'
import Room from '../scenes/Room'

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

export default function SceneViewport({ cameraMode, preset }) {
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

      <OrbitControls
        enablePan={cameraMode !== 'firstPerson'}
        minDistance={4}
        maxDistance={12}
        maxPolarAngle={cameraMode === 'top' ? Math.PI / 2.01 : Math.PI / 2.02}
        target={preset.target}
      />
    </Canvas>
  )
}
