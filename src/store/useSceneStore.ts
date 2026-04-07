import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type WallKey = 'north' | 'south' | 'east' | 'west'
export type CameraMode = 'orbit' | 'top' | 'firstPerson'
export type UiMode = 'draw' | 'visualize'

export interface RoomDoor {
  id: string
  wall: WallKey
  offset: number
  width: number
  height: number
}

export interface FloorPlanRoom {
  id: string
  name: string
  x: number
  z: number
  width: number
  depth: number
  height: number
  wallThickness: number
  doors: RoomDoor[]
}

export interface FloorPlanCanvas {
  width: number
  depth: number
  pixelsPerMeter: number
}

export interface MaterialState {
  color: string
  textureUrl?: string
  roughness: number
  metalness: number
}

export interface WallState extends MaterialState {
  visible: boolean
}

export interface FurnitureItem {
  id: string
  type: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  material?: Partial<MaterialState>
}

interface CameraPreset {
  position: [number, number, number]
  target: [number, number, number]
  fov: number
}

export interface FirstPersonSettings {
  moveSpeed: number
  sprintMultiplier: number
  jumpVelocity: number
  lookSensitivity: number
  headBobIntensity: number
  headBobFrequency: number
  crouchHeight: number
}

interface SceneData {
  room: {
    width: number
    depth: number
    height: number
  }
  walls: Record<WallKey, WallState>
  floor: MaterialState
  ceiling: MaterialState
  furniture: FurnitureItem[]
  cameraMode: CameraMode
  cameraPresets: Record<CameraMode, CameraPreset>
  firstPerson: FirstPersonSettings
  floorPlan: {
    rooms: FloorPlanRoom[]
    selectedRoomId: string | null
    uiMode: UiMode
    livePreview: boolean
    canvas: FloorPlanCanvas
    snapEnabled: boolean
    snapStep: number
    constraintMessage: string | null
  }
}

interface SceneActions {
  setRoomDimensions: (dimensions: Partial<SceneData['room']>) => void
  setWall: (wall: WallKey, patch: Partial<WallState>) => void
  setFloorMaterial: (patch: Partial<MaterialState>) => void
  setCeilingMaterial: (patch: Partial<MaterialState>) => void
  addFurniture: (item: FurnitureItem) => void
  updateFurniture: (id: string, patch: Partial<Omit<FurnitureItem, 'id'>>) => void
  removeFurniture: (id: string) => void
  setCameraMode: (mode: CameraMode) => void
  setFirstPersonSettings: (patch: Partial<FirstPersonSettings>) => void
  setUiMode: (mode: UiMode) => void
  setLivePreview: (enabled: boolean) => void
  setCanvasSettings: (patch: Partial<FloorPlanCanvas>) => void
  setSnapSettings: (patch: { enabled?: boolean; step?: number }) => void
  createRoom: (room: Omit<FloorPlanRoom, 'id' | 'name' | 'doors'> & { id?: string; name?: string }) => string | null
  moveRoom: (roomId: string, nextX: number, nextZ: number) => boolean
  updateRoom: (roomId: string, patch: Partial<Omit<FloorPlanRoom, 'id' | 'doors'>>) => void
  removeRoom: (roomId: string) => void
  selectRoom: (roomId: string | null) => void
  setSelectedRoomDimensions: (patch: Partial<Pick<FloorPlanRoom, 'width' | 'depth' | 'height'>>) => void
  upsertDoor: (roomId: string, door: Omit<RoomDoor, 'id'> & { id?: string }) => void
  removeDoor: (roomId: string, doorId: string) => void
  applySelectedRoomToScene: () => void
  resetScene: () => void
}

export type SceneState = SceneData & SceneActions

const cameraPresets: Record<CameraMode, CameraPreset> = {
  orbit: {
    position: [5, 3, 6],
    target: [0, 1.4, 0],
    fov: 50,
  },
  top: {
    position: [0, 10, 0.001],
    target: [0, 0, 0],
    fov: 45,
  },
  firstPerson: {
    position: [0, 1.7, 2.5],
    target: [0, 1.7, 0],
    fov: 65,
  },
}

const MIN_ROOM_WIDTH = 1
const MIN_ROOM_DEPTH = 1
const MIN_ROOM_HEIGHT = 2
const MIN_DOOR_WIDTH = 0.6
const MIN_DOOR_HEIGHT = 1.8
const MIN_CANVAS_SIZE = 6
const MAX_CANVAS_SIZE = 200
const MIN_PIXELS_PER_METER = 16
const MAX_PIXELS_PER_METER = 140
const MIN_SNAP_STEP = 0.01
const MAX_SNAP_STEP = 1
const GRID_UNIT_METERS = 1

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const toFinite = (value: number, fallback: number) => (Number.isFinite(value) ? value : fallback)
const clampFinite = (value: number, fallback: number, min: number, max: number) =>
  clamp(toFinite(value, fallback), min, max)
const snapToGrid = (value: number) => Math.round(value / GRID_UNIT_METERS) * GRID_UNIT_METERS

const sanitizeRoomDimensions = (room: Pick<FloorPlanRoom, 'width' | 'depth' | 'height'>) => ({
  width: Math.max(MIN_ROOM_WIDTH, snapToGrid(clampFinite(room.width, MIN_ROOM_WIDTH, MIN_ROOM_WIDTH, 1000))),
  depth: Math.max(MIN_ROOM_DEPTH, snapToGrid(clampFinite(room.depth, MIN_ROOM_DEPTH, MIN_ROOM_DEPTH, 1000))),
  height: clampFinite(room.height, MIN_ROOM_HEIGHT, MIN_ROOM_HEIGHT, 1000),
})

const sanitizeCanvas = (canvas: FloorPlanCanvas): FloorPlanCanvas => ({
  width: clampFinite(canvas.width, 18, MIN_CANVAS_SIZE, MAX_CANVAS_SIZE),
  depth: clampFinite(canvas.depth, 14, MIN_CANVAS_SIZE, MAX_CANVAS_SIZE),
  pixelsPerMeter: clampFinite(canvas.pixelsPerMeter, 36, MIN_PIXELS_PER_METER, MAX_PIXELS_PER_METER),
})

const clampRoomToCanvas = (room: FloorPlanRoom, canvas: FloorPlanCanvas): FloorPlanRoom => {
  const minX = -canvas.width / 2
  const minZ = -canvas.depth / 2
  const maxX = canvas.width / 2 - room.width
  const maxZ = canvas.depth / 2 - room.depth

  return {
    ...room,
    x: clamp(room.x, minX, maxX),
    z: clamp(room.z, minZ, maxZ),
  }
}

const roomsOverlap = (a: FloorPlanRoom, b: FloorPlanRoom) => {
  const separated =
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.z + a.depth <= b.z ||
    b.z + b.depth <= a.z

  return !separated
}

const validateRoomPlacement = (
  room: FloorPlanRoom,
  rooms: FloorPlanRoom[],
  canvas: FloorPlanCanvas,
  ignoreRoomId?: string,
): string | null => {
  const minX = -canvas.width / 2
  const minZ = -canvas.depth / 2
  const maxX = canvas.width / 2
  const maxZ = canvas.depth / 2

  if (room.x < minX || room.z < minZ || room.x + room.width > maxX || room.z + room.depth > maxZ) {
    return 'Room must stay inside canvas boundaries.'
  }

  for (const otherRoom of rooms) {
    if (otherRoom.id === ignoreRoomId) {
      continue
    }

    if (roomsOverlap(room, otherRoom)) {
      return `Room overlaps with ${otherRoom.name}.`
    }
  }

  return null
}

const doorOffsetLimit = (room: FloorPlanRoom, wall: WallKey, doorWidth: number) => {
  const span = wall === 'north' || wall === 'south' ? room.width : room.depth
  return Math.max(0, span / 2 - doorWidth / 2)
}

const sanitizeDoor = (room: FloorPlanRoom, door: Omit<RoomDoor, 'id'> & { id?: string }): RoomDoor => {
  const maxWidth = (door.wall === 'north' || door.wall === 'south' ? room.width : room.depth) - 0.2
  const width = clampFinite(door.width, 1, MIN_DOOR_WIDTH, maxWidth)
  const height = clampFinite(door.height, 2.1, MIN_DOOR_HEIGHT, room.height - 0.1)
  const offsetLimit = doorOffsetLimit(room, door.wall, width)

  return {
    id: door.id ?? `${door.wall}-door-${Date.now()}`,
    wall: door.wall,
    offset: clampFinite(door.offset, 0, -offsetLimit, offsetLimit),
    width,
    height,
  }
}

const syncRoomToScene = (state: SceneState): Partial<SceneState> | SceneState => {
  const selectedRoom = state.floorPlan.rooms.find((room) => room.id === state.floorPlan.selectedRoomId)
  if (!selectedRoom) {
    return state
  }

  const nextDimensions = sanitizeRoomDimensions(selectedRoom)
  if (
    state.room.width === nextDimensions.width &&
    state.room.depth === nextDimensions.depth &&
    state.room.height === nextDimensions.height
  ) {
    return state
  }

  return {
    room: {
      ...state.room,
      ...nextDimensions,
    },
  }
}

const createInitialSceneData = (): SceneData => ({
  room: {
    width: 8,
    depth: 8,
    height: 3,
  },
  walls: {
    north: { color: '#ece7de', roughness: 0.95, metalness: 0, visible: true },
    south: { color: '#ece7de', roughness: 0.95, metalness: 0, visible: true },
    east: { color: '#ece7de', roughness: 0.95, metalness: 0, visible: true },
    west: { color: '#ece7de', roughness: 0.95, metalness: 0, visible: true },
  },
  floor: {
    color: '#8b6f52',
    roughness: 0.9,
    metalness: 0.05,
  },
  ceiling: {
    color: '#f8f8f8',
    roughness: 1,
    metalness: 0,
  },
  furniture: [],
  cameraMode: 'orbit',
  cameraPresets,
  firstPerson: {
    moveSpeed: 2.6,
    sprintMultiplier: 1.73,
    jumpVelocity: 4.2,
    lookSensitivity: 1,
    headBobIntensity: 0.04,
    headBobFrequency: 9,
    crouchHeight: 1.2,
  },
  floorPlan: {
    rooms: [],
    selectedRoomId: null,
    uiMode: 'draw',
    livePreview: true,
    canvas: {
      width: 18,
      depth: 14,
      pixelsPerMeter: 36,
    },
    snapEnabled: true,
    snapStep: 0.1,
    constraintMessage: null,
  },
})

const createInitialState = (
  set: (partial: ((state: SceneState) => Partial<SceneState> | SceneState) | Partial<SceneState> | SceneState) => void,
  get: () => SceneState,
): SceneState => ({
  ...createInitialSceneData(),

  setRoomDimensions: (dimensions) =>
    set((state) => {
      const nextRoom = { ...state.room, ...dimensions }
      if (
        nextRoom.width === state.room.width &&
        nextRoom.depth === state.room.depth &&
        nextRoom.height === state.room.height
      ) {
        return state
      }

      return { room: nextRoom }
    }),

  setWall: (wall, patch) =>
    set((state) => {
      const currentWall = state.walls[wall]
      const nextWall = { ...currentWall, ...patch }
      if (
        nextWall.color === currentWall.color &&
        nextWall.textureUrl === currentWall.textureUrl &&
        nextWall.roughness === currentWall.roughness &&
        nextWall.metalness === currentWall.metalness &&
        nextWall.visible === currentWall.visible
      ) {
        return state
      }

      return {
        walls: {
          ...state.walls,
          [wall]: nextWall,
        },
      }
    }),

  setFloorMaterial: (patch) =>
    set((state) => {
      const nextFloor = { ...state.floor, ...patch }
      if (
        nextFloor.color === state.floor.color &&
        nextFloor.textureUrl === state.floor.textureUrl &&
        nextFloor.roughness === state.floor.roughness &&
        nextFloor.metalness === state.floor.metalness
      ) {
        return state
      }

      return { floor: nextFloor }
    }),

  setCeilingMaterial: (patch) =>
    set((state) => {
      const nextCeiling = { ...state.ceiling, ...patch }
      if (
        nextCeiling.color === state.ceiling.color &&
        nextCeiling.textureUrl === state.ceiling.textureUrl &&
        nextCeiling.roughness === state.ceiling.roughness &&
        nextCeiling.metalness === state.ceiling.metalness
      ) {
        return state
      }

      return { ceiling: nextCeiling }
    }),

  addFurniture: (item) =>
    set((state) => ({
      furniture: [...state.furniture, item],
    })),

  updateFurniture: (id, patch) =>
    set((state) => {
      const index = state.furniture.findIndex((item) => item.id === id)
      if (index < 0) {
        return state
      }

      const nextFurniture = [...state.furniture]
      nextFurniture[index] = { ...nextFurniture[index], ...patch }

      return { furniture: nextFurniture }
    }),

  removeFurniture: (id) =>
    set((state) => {
      const nextFurniture = state.furniture.filter((item) => item.id !== id)
      if (nextFurniture.length === state.furniture.length) {
        return state
      }

      return { furniture: nextFurniture }
    }),

  setCameraMode: (mode) =>
    set((state) => {
      if (state.cameraMode === mode) {
        return state
      }

      return {
        cameraMode: mode,
      }
    }),

  setFirstPersonSettings: (patch) =>
    set((state) => {
      const next = { ...state.firstPerson, ...patch }
      if (
        next.moveSpeed === state.firstPerson.moveSpeed &&
        next.sprintMultiplier === state.firstPerson.sprintMultiplier &&
        next.jumpVelocity === state.firstPerson.jumpVelocity &&
        next.lookSensitivity === state.firstPerson.lookSensitivity &&
        next.headBobIntensity === state.firstPerson.headBobIntensity &&
        next.headBobFrequency === state.firstPerson.headBobFrequency &&
        next.crouchHeight === state.firstPerson.crouchHeight
      ) {
        return state
      }

      return { firstPerson: next }
    }),

  setUiMode: (mode) =>
    set((state) => {
      if (state.floorPlan.uiMode === mode) {
        return state
      }

      const nextState: SceneState = {
        ...state,
        floorPlan: {
          ...state.floorPlan,
          uiMode: mode,
        },
      }

      if (mode === 'visualize') {
        const synced = syncRoomToScene(nextState)
        return synced === nextState ? nextState : { ...nextState, ...synced }
      }

      return nextState
    }),

  setLivePreview: (enabled) =>
    set((state) => {
      if (state.floorPlan.livePreview === enabled) {
        return state
      }

      return {
        floorPlan: {
          ...state.floorPlan,
          livePreview: enabled,
        },
      }
    }),

  setCanvasSettings: (patch) =>
    set((state) => {
      const nextCanvas = sanitizeCanvas({
        ...state.floorPlan.canvas,
        ...patch,
      })

      if (
        nextCanvas.width === state.floorPlan.canvas.width &&
        nextCanvas.depth === state.floorPlan.canvas.depth &&
        nextCanvas.pixelsPerMeter === state.floorPlan.canvas.pixelsPerMeter
      ) {
        return state
      }

      const nextRooms = state.floorPlan.rooms.map((room) => clampRoomToCanvas(room, nextCanvas))
      for (let index = 0; index < nextRooms.length; index += 1) {
        const message = validateRoomPlacement(
          nextRooms[index],
          nextRooms,
          nextCanvas,
          nextRooms[index].id,
        )

        if (message) {
          return {
            floorPlan: {
              ...state.floorPlan,
              constraintMessage:
                'Cannot apply canvas size because it would cause room overlap or out-of-bounds placement.',
            },
          }
        }
      }

      return {
        floorPlan: {
          ...state.floorPlan,
          canvas: nextCanvas,
          rooms: nextRooms,
          constraintMessage: null,
        },
      }
    }),

  setSnapSettings: (patch) =>
    set((state) => {
      const nextEnabled = patch.enabled ?? state.floorPlan.snapEnabled
      const nextStep = clampFinite(
        patch.step ?? state.floorPlan.snapStep,
        state.floorPlan.snapStep,
        MIN_SNAP_STEP,
        MAX_SNAP_STEP,
      )

      if (
        nextEnabled === state.floorPlan.snapEnabled &&
        nextStep === state.floorPlan.snapStep
      ) {
        return state
      }

      return {
        floorPlan: {
          ...state.floorPlan,
          snapEnabled: nextEnabled,
          snapStep: nextStep,
        },
      }
    }),

  createRoom: (room) => {
    const roomId = room.id ?? `room-${Date.now()}`
    let createdId: string | null = null
    set((state) => {
      const name = room.name ?? `Room ${state.floorPlan.rooms.length + 1}`
      const dimensions = sanitizeRoomDimensions(room)
      const candidateRoom: FloorPlanRoom = {
        id: roomId,
        name,
        x: snapToGrid(room.x),
        z: snapToGrid(room.z),
        width: dimensions.width,
        depth: dimensions.depth,
        height: dimensions.height,
        wallThickness: Math.max(room.wallThickness, 0.05),
        doors: [],
      }

      const nextRoom = clampRoomToCanvas(candidateRoom, state.floorPlan.canvas)
      const placementIssue = validateRoomPlacement(
        nextRoom,
        state.floorPlan.rooms,
        state.floorPlan.canvas,
      )
      if (placementIssue) {
        return {
          floorPlan: {
            ...state.floorPlan,
            constraintMessage: placementIssue,
          },
        }
      }

      createdId = roomId

      const nextState: SceneState = {
        ...state,
        floorPlan: {
          ...state.floorPlan,
          rooms: [...state.floorPlan.rooms, nextRoom],
          selectedRoomId: roomId,
          constraintMessage: null,
        },
      }

      if (state.floorPlan.livePreview || state.floorPlan.uiMode === 'visualize') {
        const synced = syncRoomToScene(nextState)
        return synced === nextState ? nextState : { ...nextState, ...synced }
      }

      return nextState
    })

    return createdId
  },

  moveRoom: (roomId, nextX, nextZ) => {
    let moved = false
    set((state) => {
      const roomIndex = state.floorPlan.rooms.findIndex((room) => room.id === roomId)
      if (roomIndex < 0) {
        return state
      }

      const currentRoom = state.floorPlan.rooms[roomIndex]
      const nextRoom = clampRoomToCanvas(
        {
          ...currentRoom,
          x: snapToGrid(nextX),
          z: snapToGrid(nextZ),
        },
        state.floorPlan.canvas,
      )

      const placementIssue = validateRoomPlacement(
        nextRoom,
        state.floorPlan.rooms,
        state.floorPlan.canvas,
        roomId,
      )
      if (placementIssue) {
        return {
          floorPlan: {
            ...state.floorPlan,
            constraintMessage: placementIssue,
          },
        }
      }

      const nextRooms = [...state.floorPlan.rooms]
      nextRooms[roomIndex] = nextRoom

      moved = nextRoom.x !== currentRoom.x || nextRoom.z !== currentRoom.z

      const nextState: SceneState = {
        ...state,
        floorPlan: {
          ...state.floorPlan,
          rooms: nextRooms,
          constraintMessage: null,
        },
      }

      if (
        roomId === state.floorPlan.selectedRoomId &&
        (state.floorPlan.livePreview || state.floorPlan.uiMode === 'visualize')
      ) {
        const synced = syncRoomToScene(nextState)
        return synced === nextState ? nextState : { ...nextState, ...synced }
      }

      return nextState
    })

    return moved
  },

  updateRoom: (roomId, patch) =>
    set((state) => {
      const roomIndex = state.floorPlan.rooms.findIndex((room) => room.id === roomId)
      if (roomIndex < 0) {
        return state
      }

      const currentRoom = state.floorPlan.rooms[roomIndex]
      const merged = { ...currentRoom, ...patch }
      const dimensions = sanitizeRoomDimensions(merged)
      const roomBeforeClamp: FloorPlanRoom = {
        ...merged,
        x: snapToGrid(merged.x),
        z: snapToGrid(merged.z),
        width: dimensions.width,
        depth: dimensions.depth,
        height: dimensions.height,
        wallThickness: Math.max(merged.wallThickness, 0.05),
      }

      const nextRoom = clampRoomToCanvas(roomBeforeClamp, state.floorPlan.canvas)
      const placementIssue = validateRoomPlacement(
        nextRoom,
        state.floorPlan.rooms,
        state.floorPlan.canvas,
        roomId,
      )
      if (placementIssue) {
        return {
          floorPlan: {
            ...state.floorPlan,
            constraintMessage: placementIssue,
          },
        }
      }

      const nextRooms = [...state.floorPlan.rooms]
      nextRooms[roomIndex] = nextRoom

      const nextState: SceneState = {
        ...state,
        floorPlan: {
          ...state.floorPlan,
          rooms: nextRooms,
          constraintMessage: null,
        },
      }

      if (
        roomId === state.floorPlan.selectedRoomId &&
        (state.floorPlan.livePreview || state.floorPlan.uiMode === 'visualize')
      ) {
        const synced = syncRoomToScene(nextState)
        return synced === nextState ? nextState : { ...nextState, ...synced }
      }

      return nextState
    }),

  removeRoom: (roomId) =>
    set((state) => {
      const nextRooms = state.floorPlan.rooms.filter((room) => room.id !== roomId)
      if (nextRooms.length === state.floorPlan.rooms.length) {
        return state
      }

      const nextSelectedId =
        state.floorPlan.selectedRoomId === roomId
          ? (nextRooms[0]?.id ?? null)
          : state.floorPlan.selectedRoomId

      const nextState: SceneState = {
        ...state,
        floorPlan: {
          ...state.floorPlan,
          rooms: nextRooms,
          selectedRoomId: nextSelectedId,
          constraintMessage: null,
        },
      }

      if (state.floorPlan.livePreview || state.floorPlan.uiMode === 'visualize') {
        const synced = syncRoomToScene(nextState)
        return synced === nextState ? nextState : { ...nextState, ...synced }
      }

      return nextState
    }),

  selectRoom: (roomId) =>
    set((state) => {
      if (state.floorPlan.selectedRoomId === roomId) {
        return state
      }

      const nextState: SceneState = {
        ...state,
        floorPlan: {
          ...state.floorPlan,
          selectedRoomId: roomId,
          constraintMessage: null,
        },
      }

      if (state.floorPlan.livePreview || state.floorPlan.uiMode === 'visualize') {
        const synced = syncRoomToScene(nextState)
        return synced === nextState ? nextState : { ...nextState, ...synced }
      }

      return nextState
    }),

  setSelectedRoomDimensions: (patch) => {
    const selectedRoomId = get().floorPlan.selectedRoomId
    if (!selectedRoomId) {
      return
    }

    get().updateRoom(selectedRoomId, patch)
  },

  upsertDoor: (roomId, door) =>
    set((state) => {
      const roomIndex = state.floorPlan.rooms.findIndex((room) => room.id === roomId)
      if (roomIndex < 0) {
        return state
      }

      const room = state.floorPlan.rooms[roomIndex]
      const sanitizedDoor = sanitizeDoor(room, door)
      const existingIndex = room.doors.findIndex((item) => item.id === sanitizedDoor.id)
      const doorOnWallIndex = room.doors.findIndex(
        (item) => item.wall === sanitizedDoor.wall && item.id !== sanitizedDoor.id,
      )

      const nextDoors = [...room.doors]
      if (existingIndex >= 0) {
        nextDoors[existingIndex] = sanitizedDoor
      } else if (doorOnWallIndex >= 0) {
        nextDoors[doorOnWallIndex] = sanitizedDoor
      } else {
        nextDoors.push(sanitizedDoor)
      }

      const nextRooms = [...state.floorPlan.rooms]
      nextRooms[roomIndex] = {
        ...room,
        doors: nextDoors,
      }

      return {
        floorPlan: {
          ...state.floorPlan,
          rooms: nextRooms,
          constraintMessage: null,
        },
      }
    }),

  removeDoor: (roomId, doorId) =>
    set((state) => {
      const roomIndex = state.floorPlan.rooms.findIndex((room) => room.id === roomId)
      if (roomIndex < 0) {
        return state
      }

      const room = state.floorPlan.rooms[roomIndex]
      const nextDoors = room.doors.filter((door) => door.id !== doorId)
      if (nextDoors.length === room.doors.length) {
        return state
      }

      const nextRooms = [...state.floorPlan.rooms]
      nextRooms[roomIndex] = {
        ...room,
        doors: nextDoors,
      }

      return {
        floorPlan: {
          ...state.floorPlan,
          rooms: nextRooms,
          constraintMessage: null,
        },
      }
    }),

  applySelectedRoomToScene: () =>
    set((state) => {
      const synced = syncRoomToScene(state)
      return synced
    }),

  resetScene: () =>
    set(() => ({
      ...createInitialSceneData(),
    })),
})

export const useSceneStore = create<SceneState>()(
  persist((set, get) => createInitialState(set, get), {
    name: 'roometry-scene-v3',
    version: 5,
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({
      room: state.room,
      walls: state.walls,
      floor: state.floor,
      ceiling: state.ceiling,
      furniture: state.furniture,
      cameraMode: state.cameraMode,
      firstPerson: state.firstPerson,
      floorPlan: state.floorPlan,
    }),
    migrate: (persistedState) => {
      const state = persistedState as Partial<SceneData> | undefined
      const initialFloorPlan = createInitialSceneData().floorPlan

      const migratedRooms = state?.floorPlan?.rooms?.map((room, index) => ({
        ...room,
        name: room.name ?? `Room ${index + 1}`,
        x: snapToGrid(room.x ?? 0),
        z: snapToGrid(room.z ?? 0),
        width: Math.max(MIN_ROOM_WIDTH, snapToGrid(room.width ?? MIN_ROOM_WIDTH)),
        depth: Math.max(MIN_ROOM_DEPTH, snapToGrid(room.depth ?? MIN_ROOM_DEPTH)),
        wallThickness: Math.max(room.wallThickness ?? 0.12, 0.05),
        doors: Array.isArray(room.doors) ? room.doors : [],
      }))

      const migratedCanvas = sanitizeCanvas({
        width: state?.floorPlan?.canvas?.width ?? initialFloorPlan.canvas.width,
        depth: state?.floorPlan?.canvas?.depth ?? initialFloorPlan.canvas.depth,
        pixelsPerMeter:
          state?.floorPlan?.canvas?.pixelsPerMeter ??
          initialFloorPlan.canvas.pixelsPerMeter,
      })

      return {
        ...createInitialSceneData(),
        ...state,
        floorPlan: {
          ...initialFloorPlan,
          ...(state?.floorPlan ?? {}),
          rooms: migratedRooms ?? [],
          canvas: migratedCanvas,
          snapEnabled: state?.floorPlan?.snapEnabled ?? initialFloorPlan.snapEnabled,
          snapStep: clamp(state?.floorPlan?.snapStep ?? initialFloorPlan.snapStep, MIN_SNAP_STEP, MAX_SNAP_STEP),
          constraintMessage: null,
          selectedRoomId:
            state?.floorPlan?.selectedRoomId ??
            (migratedRooms && migratedRooms.length > 0 ? migratedRooms[0].id : null),
        },
        cameraPresets,
      }
    },
  }),
)
