import { useMemo } from 'react'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { useSceneStore } from '../store/useSceneStore'
import type { RoomDoor, WallKey } from '../store/useSceneStore'

const FALLBACK_TEXTURE =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAuMBg6nN4kQAAAAASUVORK5CYII='

interface SurfaceProps {
	size: [number, number]
	position: [number, number, number]
	rotation: [number, number, number]
	color: string
	textureUrl?: string
	repeat?: [number, number]
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
}

const prepareTexture = (texture: THREE.Texture | null, repeat: [number, number]) => {
	if (!texture) {
		return null
	}

	texture.wrapS = THREE.RepeatWrapping
	texture.wrapT = THREE.RepeatWrapping
	texture.repeat.set(repeat[0], repeat[1])
	texture.colorSpace = THREE.SRGBColorSpace
	texture.needsUpdate = true

	return texture
}

function Surface({
	size,
	position,
	rotation,
	color,
	textureUrl,
	repeat = [1, 1],
}: SurfaceProps) {
	const loadedTexture = useTexture(textureUrl ?? FALLBACK_TEXTURE)

	const map = useMemo(
		() => prepareTexture(textureUrl ? loadedTexture : null, repeat),
		[loadedTexture, repeat[0], repeat[1], textureUrl],
	)

	return (
		<mesh position={position} rotation={rotation} receiveShadow>
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
}: RoomProps) {
	const room = useSceneStore((state) => state.room)
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

			{furniture.map((item) => (
				<mesh
					key={item.id}
					position={item.position}
					rotation={item.rotation}
					scale={item.scale}
					castShadow
					receiveShadow
				>
					<boxGeometry args={[1, 1, 1]} />
					<meshStandardMaterial
						color={item.material?.color ?? '#808080'}
						roughness={item.material?.roughness ?? 0.65}
						metalness={item.material?.metalness ?? 0.1}
					/>
				</mesh>
			))}
		</group>
	)
}
