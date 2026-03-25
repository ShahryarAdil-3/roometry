import { useMemo } from 'react'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { useSceneStore } from '../store/useSceneStore'

const FALLBACK_TEXTURE =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAuMBg6nN4kQAAAAASUVORK5CYII='

const prepareTexture = (texture, repeat) => {
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
}) {
	const loadedTexture = useTexture(textureUrl ?? FALLBACK_TEXTURE)

	const map = useMemo(
		() => prepareTexture(textureUrl ? loadedTexture : null, repeat),
		[loadedTexture, repeat, textureUrl],
	)

	return (
		<mesh position={position} rotation={rotation} receiveShadow>
			<planeGeometry args={size} />
			<meshStandardMaterial color={color} map={map} side={THREE.DoubleSide} />
		</mesh>
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
}) {
	const room = useSceneStore((state) => state.room)
	const floor = useSceneStore((state) => state.floor)
	const ceiling = useSceneStore((state) => state.ceiling)
	const walls = useSceneStore((state) => state.walls)
	const furniture = useSceneStore((state) => state.furniture)

	const resolvedWidth = width ?? room.width
	const resolvedDepth = depth ?? room.depth
	const resolvedHeight = height ?? room.height
	const resolvedFloorColor = floorColor ?? floor.color
	const resolvedWallColor = wallColor ?? walls.north.color
	const resolvedCeilingColor = ceilingColor ?? ceiling.color
	const resolvedFloorTexture = floorTexture ?? floor.textureUrl
	const resolvedWallTexture = wallTexture ?? walls.north.textureUrl

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
				<Surface
					size={[resolvedWidth, resolvedHeight]}
					position={[0, resolvedHeight / 2, -resolvedDepth / 2]}
					rotation={[0, 0, 0]}
					color={wallColor ?? walls.north.color ?? resolvedWallColor}
					textureUrl={wallTexture ?? walls.north.textureUrl ?? resolvedWallTexture}
					repeat={[3, 1.5]}
				/>
			)}
			{walls.south.visible && (
				<Surface
					size={[resolvedWidth, resolvedHeight]}
					position={[0, resolvedHeight / 2, resolvedDepth / 2]}
					rotation={[0, Math.PI, 0]}
					color={wallColor ?? walls.south.color ?? resolvedWallColor}
					textureUrl={wallTexture ?? walls.south.textureUrl ?? resolvedWallTexture}
					repeat={[3, 1.5]}
				/>
			)}
			{walls.west.visible && (
				<Surface
					size={[resolvedDepth, resolvedHeight]}
					position={[-resolvedWidth / 2, resolvedHeight / 2, 0]}
					rotation={[0, Math.PI / 2, 0]}
					color={wallColor ?? walls.west.color ?? resolvedWallColor}
					textureUrl={wallTexture ?? walls.west.textureUrl ?? resolvedWallTexture}
					repeat={[3, 1.5]}
				/>
			)}
			{walls.east.visible && (
				<Surface
					size={[resolvedDepth, resolvedHeight]}
					position={[resolvedWidth / 2, resolvedHeight / 2, 0]}
					rotation={[0, -Math.PI / 2, 0]}
					color={wallColor ?? walls.east.color ?? resolvedWallColor}
					textureUrl={wallTexture ?? walls.east.textureUrl ?? resolvedWallTexture}
					repeat={[3, 1.5]}
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
