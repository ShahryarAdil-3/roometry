// Sync three.js camera to the selected preset.
import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'

export default function CameraSync({ preset }) {
  const camera = useThree((state) => state.camera)

  useEffect(() => {
    camera.position.set(preset.position[0], preset.position[1], preset.position[2])
    camera.fov = preset.fov
    camera.lookAt(preset.target[0], preset.target[1], preset.target[2])
    camera.updateProjectionMatrix()
  }, [camera, preset])

  return null
}
