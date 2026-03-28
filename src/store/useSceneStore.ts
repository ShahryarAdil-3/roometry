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
  createRoom: (room: Omit<FloorPlanRoom, 'id' | 'name' | 'doors'> & { id?: string; name?: string }) => string
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

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const sanitizeRoomDimensions = (room: Pick<FloorPlanRoom, 'width' | 'depth' | 'height'>) => ({
  width: Math.max(room.width, MIN_ROOM_WIDTH),
  depth: Math.max(room.depth, MIN_ROOM_DEPTH),
  height: Math.max(room.height, MIN_ROOM_HEIGHT),
})

const doorOffsetLimit = (room: FloorPlanRoom, wall: WallKey, doorWidth: number) => {
  const span = wall === 'north' || wall === 'south' ? room.width : room.depth
  return Math.max(0, span / 2 - doorWidth / 2)
}

const sanitizeDoor = (room: FloorPlanRoom, door: Omit<RoomDoor, 'id'> & { id?: string }): RoomDoor => {
  const width = clamp(door.width, MIN_DOOR_WIDTH, (door.wall === 'north' || door.wall === 'south' ? room.width : room.depth) - 0.2)
  const height = clamp(door.height, MIN_DOOR_HEIGHT, room.height - 0.1)
  const offsetLimit = doorOffsetLimit(room, door.wall, width)

  return {
    id: door.id ?? `${door.wall}-door-${Date.now()}`,
    wall: door.wall,
    offset: clamp(door.offset, -offsetLimit, offsetLimit),
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

  createRoom: (room) => {
    const roomId = room.id ?? `room-${Date.now()}`
    set((state) => {
      const name = room.name ?? `Room ${state.floorPlan.rooms.length + 1}`
      const dimensions = sanitizeRoomDimensions(room)
      const nextRoom: FloorPlanRoom = {
        id: roomId,
        name,
        x: room.x,
        z: room.z,
        width: dimensions.width,
        depth: dimensions.depth,
        height: dimensions.height,
        wallThickness: Math.max(room.wallThickness, 0.05),
        doors: [],
      }

      const nextState: SceneState = {
        ...state,
        floorPlan: {
          ...state.floorPlan,
          rooms: [...state.floorPlan.rooms, nextRoom],
          selectedRoomId: roomId,
        },
      }

      if (state.floorPlan.livePreview || state.floorPlan.uiMode === 'visualize') {
        const synced = syncRoomToScene(nextState)
        return synced === nextState ? nextState : { ...nextState, ...synced }
      }

      return nextState
    })

    return roomId
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
      const nextRoom: FloorPlanRoom = {
        ...merged,
        width: dimensions.width,
        depth: dimensions.depth,
        height: dimensions.height,
        wallThickness: Math.max(merged.wallThickness, 0.05),
      }

      const nextRooms = [...state.floorPlan.rooms]
      nextRooms[roomIndex] = nextRoom

      const nextState: SceneState = {
        ...state,
        floorPlan: {
          ...state.floorPlan,
          rooms: nextRooms,
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
    version: 4,
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

      const migratedRooms = state?.floorPlan?.rooms?.map((room, index) => ({
        ...room,
        name: room.name ?? `Room ${index + 1}`,
        wallThickness: Math.max(room.wallThickness ?? 0.12, 0.05),
        doors: Array.isArray(room.doors) ? room.doors : [],
      }))

      return {
        ...createInitialSceneData(),
        ...state,
        floorPlan: {
          ...createInitialSceneData().floorPlan,
          ...(state?.floorPlan ?? {}),
          rooms: migratedRooms ?? [],
          selectedRoomId:
            state?.floorPlan?.selectedRoomId ??
            (migratedRooms && migratedRooms.length > 0 ? migratedRooms[0].id : null),
        },
        cameraPresets,
      }
    },
  }),
)
