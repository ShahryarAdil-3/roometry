import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type WallKey = 'north' | 'south' | 'east' | 'west'
export type CameraMode = 'orbit' | 'top' | 'firstPerson'

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
})

const createInitialState = (set: (partial: ((state: SceneState) => Partial<SceneState> | SceneState) | Partial<SceneState> | SceneState) => void): SceneState => ({
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

  resetScene: () =>
    set(() => ({
      ...createInitialSceneData(),
    })),
})

export const useSceneStore = create<SceneState>()(
  persist((set) => createInitialState(set), {
    name: 'roometry-scene-v3',
    version: 3,
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({
      room: state.room,
      walls: state.walls,
      floor: state.floor,
      ceiling: state.ceiling,
      furniture: state.furniture,
      cameraMode: state.cameraMode,
      firstPerson: state.firstPerson,
    }),
    migrate: (persistedState) => {
      const state = persistedState as Partial<SceneData> | undefined
      return {
        ...createInitialSceneData(),
        ...state,
        cameraPresets,
      }
    },
  }),
)
