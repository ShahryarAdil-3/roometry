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

interface SceneState {
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
  cameraPresets: Record<CameraMode, { position: [number, number, number]; target: [number, number, number]; fov: number }>

  setRoomDimensions: (dimensions: Partial<SceneState['room']>) => void
  setWall: (wall: WallKey, patch: Partial<WallState>) => void
  setFloorMaterial: (patch: Partial<MaterialState>) => void
  setCeilingMaterial: (patch: Partial<MaterialState>) => void
  addFurniture: (item: FurnitureItem) => void
  updateFurniture: (id: string, patch: Partial<Omit<FurnitureItem, 'id'>>) => void
  removeFurniture: (id: string) => void
  setCameraMode: (mode: CameraMode) => void
  resetScene: () => void
}

const initialScene: Omit<SceneState, 'setRoomDimensions' | 'setWall' | 'setFloorMaterial' | 'setCeilingMaterial' | 'addFurniture' | 'updateFurniture' | 'removeFurniture' | 'setCameraMode' | 'resetScene'> = {
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
  cameraPresets: {
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
  },
}

export const useSceneStore = create<SceneState>()(
  persist((set) => ({
  ...initialScene,

  setRoomDimensions: (dimensions) =>
    set((state) => ({
      room: { ...state.room, ...dimensions },
    })),

  setWall: (wall, patch) =>
    set((state) => ({
      walls: {
        ...state.walls,
        [wall]: { ...state.walls[wall], ...patch },
      },
    })),

  setFloorMaterial: (patch) =>
    set((state) => ({
      floor: { ...state.floor, ...patch },
    })),

  setCeilingMaterial: (patch) =>
    set((state) => ({
      ceiling: { ...state.ceiling, ...patch },
    })),

  addFurniture: (item) =>
    set((state) => ({
      furniture: [...state.furniture, item],
    })),

  updateFurniture: (id, patch) =>
    set((state) => ({
      furniture: state.furniture.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    })),

  removeFurniture: (id) =>
    set((state) => ({
      furniture: state.furniture.filter((item) => item.id !== id),
    })),

  setCameraMode: (mode) =>
    set(() => ({
      cameraMode: mode,
    })),

  resetScene: () =>
    set(() => ({
      ...initialScene,
    })),
  }),
  {
    name: 'roometry-scene-v1',
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({
      room: state.room,
      walls: state.walls,
      floor: state.floor,
      ceiling: state.ceiling,
      furniture: state.furniture,
      cameraMode: state.cameraMode,
      cameraPresets: state.cameraPresets,
    }),
  }),
)
