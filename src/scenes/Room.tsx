import { useEffect, useMemo, Suspense } from 'react'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { DEFAULT_ROOM_DIMENSIONS, useActiveRoom, useSceneStore } from '../store/useSceneStore'
import type { RoomDoor, WallKey } from '../store/useSceneStore'
import FurnitureModel from '../components/canvas/3d/FurnitureModels'
import { isSupportedTextureUrl } from '../utils/textureUrl'

const FALLBACK_TEXTURE =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGP4DwQACfsD/fteaysAAAAASUVORK5CYII='

interface SurfaceProps {
    size: [number, number]
    position: [number, number, number]
    rotation: [number, number, number]
    color: string
    textureUrl?: string
    repeat?: [number, number]
    onPointerMove?: (event: any) => void
    onPointerDown?: (event: any) => void
}

interface WallWithDoorProps {
    wall: WallKey
    roomWidth: number
    roomDepth: number
    roomHeight: number
    color: string
    textureUrl?: string
    door?: RoomDoor
}

interface RoomProps {
    width?: number
    depth?: number
    height?: number
    floorColor?: string
    floorTexture?: string
    wallColor?: string
    wallTexture?: string
    ceilingColor?: string
    onFurniturePointerDown?: (furnitureId: string) => void
    onFloorPointerMove?: (event: any) => void
    onFloorPointerDown?: (event: any) => void
}

const prepareTexture = (texture: THREE.Texture | null, repeat: [number, number]) => {
    if (!texture) {
        return null
    }

    const prepared = texture.clone()
    prepared.wrapS = THREE.RepeatWrapping
    prepared.wrapT = THREE.RepeatWrapping
    prepared.repeat.set(repeat[0], repeat[1])
    prepared.colorSpace = THREE.SRGBColorSpace
    prepared.needsUpdate = true

    return prepared
}

function Surface({
    size,
    position,
    rotation,
    color,
    textureUrl,
    repeat = [1, 1],
    onPointerMove,
    onPointerDown,
}: SurfaceProps) {
    const resolvedTextureUrl =
        typeof textureUrl === 'string' && isSupportedTextureUrl(textureUrl) ? textureUrl : null
    const loadedTexture = useTexture(resolvedTextureUrl ?? FALLBACK_TEXTURE)

    const map = useMemo(
        () => prepareTexture(resolvedTextureUrl ? loadedTexture : null, repeat),
        [loadedTexture, repeat[0], repeat[1], resolvedTextureUrl],
    )

    useEffect(() => () => {
        map?.dispose()
    }, [map])

    return (
        <mesh
            position={position}
            rotation={rotation}
            receiveShadow
            onPointerMove={onPointerMove}
            onPointerDown={onPointerDown}
        >
            <planeGeometry args={size} />
            <meshStandardMaterial color={color} map={map} side={THREE.DoubleSide} />
        </mesh>
    )
}

function WallWithDoor({
    wall,
    roomWidth,
    roomDepth,
    roomHeight,
    color,
    textureUrl,
    door,
}: WallWithDoorProps) {
    const axisSpan = wall === 'north' || wall === 'south' ? roomWidth : roomDepth
    const sideWidth = door ? Math.max((axisSpan - door.width) / 2, 0) : axisSpan
    const headerHeight = door ? Math.max(roomHeight - door.height, 0) : 0
    const wallZ = wall === 'north' ? -roomDepth / 2 : roomDepth / 2
    const wallX = wall === 'west' ? -roomWidth / 2 : roomWidth / 2
    const rotation: [number, number, number] =
        wall === 'north'
            ? [0, 0, 0]
            : wall === 'south'
                ? [0, Math.PI, 0]
                : wall === 'west'
                    ? [0, Math.PI / 2, 0]
                    : [0, -Math.PI / 2, 0]

    if (!door) {
        return (
            <Surface
                size={wall === 'north' || wall === 'south' ? [roomWidth, roomHeight] : [roomDepth, roomHeight]}
                position={
                    wall === 'north' || wall === 'south'
                        ? [0, roomHeight / 2, wallZ]
                        : [wallX, roomHeight / 2, 0]
                }
                rotation={rotation}
                color={color}
                textureUrl={textureUrl}
                repeat={[3, 1.5]}
            />
        )
    }

    return (
        <>
            {sideWidth > 0 && (
                <Surface
                    size={[sideWidth, roomHeight]}
                    position={
                        wall === 'north' || wall === 'south'
                            ? [door.offset - (door.width / 2 + sideWidth / 2), roomHeight / 2, wallZ]
                            : [wallX, roomHeight / 2, door.offset - (door.width / 2 + sideWidth / 2)]
                    }
                    rotation={rotation}
                    color={color}
                    textureUrl={textureUrl}
                    repeat={[1.2, 1.5]}
                />
            )}
            {sideWidth > 0 && (
                <Surface
                    size={[sideWidth, roomHeight]}
                    position={
                        wall === 'north' || wall === 'south'
                            ? [door.offset + (door.width / 2 + sideWidth / 2), roomHeight / 2, wallZ]
                            : [wallX, roomHeight / 2, door.offset + (door.width / 2 + sideWidth / 2)]
                    }
                    rotation={rotation}
                    color={color}
                    textureUrl={textureUrl}
                    repeat={[1.2, 1.5]}
                />
            )}
            {headerHeight > 0 && (
                <Surface
                    size={[door.width, headerHeight]}
                    position={
                        wall === 'north' || wall === 'south'
                            ? [door.offset, door.height + headerHeight / 2, wallZ]
                            : [wallX, door.height + headerHeight / 2, door.offset]
                    }
                    rotation={rotation}
                    color={color}
                    textureUrl={textureUrl}
                    repeat={[1.2, 0.8]}
                />
            )}
        </>
    )
}

export default function Room({
    width,
    depth,
    height,
    floorColor,
    floorTexture,
    wallColor,
    wallTexture,
    ceilingColor,
    onFurniturePointerDown,
    onFloorPointerMove,
    onFloorPointerDown,
}: RoomProps) {
    const activeRoom = useActiveRoom()
    const room = activeRoom ?? DEFAULT_ROOM_DIMENSIONS
    const floor = useSceneStore((state) => state.floor)
    const ceiling = useSceneStore((state) => state.ceiling)
    const walls = useSceneStore((state) => state.walls)
    const furniture = useSceneStore((state) => state.furniture)
    const floorPlan = useSceneStore((state) => state.floorPlan)

    const resolvedWidth = width ?? room.width
    const resolvedDepth = depth ?? room.depth
    const resolvedHeight = height ?? room.height
    const resolvedFloorColor = floorColor ?? floor.color
    const resolvedWallColor = wallColor ?? walls.north.color
    const resolvedCeilingColor = ceilingColor ?? ceiling.color
    const resolvedFloorTexture = floorTexture ?? floor.textureUrl
    const resolvedWallTexture = wallTexture ?? walls.north.textureUrl
    const selectedRoom = floorPlan.rooms.find((roomItem) => roomItem.id === floorPlan.selectedRoomId)
    const doors = selectedRoom?.doors ?? []
    const roomFurniture = furniture.filter((item) => item.roomId === selectedRoom?.id)
    const getDoor = (wall: WallKey) => doors.find((door) => door.wall === wall)

    return (
        <group>
            <Surface
                size={[resolvedWidth, resolvedDepth]}
                position={[0, 0, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                color={resolvedFloorColor}
                textureUrl={resolvedFloorTexture}
                repeat={[3, 3]}
                onPointerMove={onFloorPointerMove}
                onPointerDown={onFloorPointerDown}
            />

            <Surface
                size={[resolvedWidth, resolvedDepth]}
                position={[0, resolvedHeight, 0]}
                rotation={[Math.PI / 2, 0, 0]}
                color={resolvedCeilingColor}
            />

            {walls.north.visible && (
                <WallWithDoor
                    wall="north"
                    roomWidth={resolvedWidth}
                    roomDepth={resolvedDepth}
                    roomHeight={resolvedHeight}
                    color={wallColor ?? walls.north.color ?? resolvedWallColor}
                    textureUrl={wallTexture ?? walls.north.textureUrl ?? resolvedWallTexture}
                    door={getDoor('north')}
                />
            )}
            {walls.south.visible && (
                <WallWithDoor
                    wall="south"
                    roomWidth={resolvedWidth}
                    roomDepth={resolvedDepth}
                    roomHeight={resolvedHeight}
                    color={wallColor ?? walls.south.color ?? resolvedWallColor}
                    textureUrl={wallTexture ?? walls.south.textureUrl ?? resolvedWallTexture}
                    door={getDoor('south')}
                />
            )}
            {walls.west.visible && (
                <WallWithDoor
                    wall="west"
                    roomWidth={resolvedWidth}
                    roomDepth={resolvedDepth}
                    roomHeight={resolvedHeight}
                    color={wallColor ?? walls.west.color ?? resolvedWallColor}
                    textureUrl={wallTexture ?? walls.west.textureUrl ?? resolvedWallTexture}
                    door={getDoor('west')}
                />
            )}
            {walls.east.visible && (
                <WallWithDoor
                    wall="east"
                    roomWidth={resolvedWidth}
                    roomDepth={resolvedDepth}
                    roomHeight={resolvedHeight}
                    color={wallColor ?? walls.east.color ?? resolvedWallColor}
                    textureUrl={wallTexture ?? walls.east.textureUrl ?? resolvedWallTexture}
                    door={getDoor('east')}
                />
            )}

            {roomFurniture.map((item) => (
                <Suspense key={item.id} fallback={null}>
                    <group
                        position={item.position}
                        rotation={item.rotation}
                        scale={item.scale}
                        castShadow
                        receiveShadow
                        onPointerDown={(event) => {
                            event.stopPropagation()
                            onFurniturePointerDown?.(item.id)
                        }}
                    >
                        <FurnitureModel
                            type={item.type}
                            color={item.material?.color ?? item.color ?? '#808080'}
                        />
                    </group>
                </Suspense>
            ))}
        </group>
    )
}