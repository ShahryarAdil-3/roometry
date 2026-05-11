// 3D scene canvas with controls and placement UI.
import { Canvas } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import Room from '@scenes/Room'
import { useSceneStore } from '@store/useSceneStore'
import CameraSync from './3d/CameraSync'
import FirstPersonController from './3d/FirstPersonController'
import MobileJoystick from './3d/MobileJoystick'
import MobileLookPad from './3d/MobileLookPad'

export default function Canvas3D({ cameraMode, preset, onFirstPersonLockChange, isTouchDevice = false }) {
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

      {useFirstPerson && (nearbyFurnitureId || grabbedFurnitureId) && !placementTemplate && !movingFurnitureId && (
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
