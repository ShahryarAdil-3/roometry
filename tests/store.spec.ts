import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('migrates v6 scene data without resurrecting legacy fields', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const sceneModulePath = '/src/store/useSceneStore.ts'
    const { useSceneStore } = await import(sceneModulePath) as typeof import('../src/store/useSceneStore')
    const options = useSceneStore.persist.getOptions()
    const legacyState = {
      room: { width: 99, depth: 99, height: 9 },
      furniture: [{
        id: 'legacy-chair',
        type: 'chair',
        position: [0, 0.4, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      }],
      floorPlan: {
        rooms: [{
          id: 'legacy-room',
          x: 0,
          z: 0,
          width: 7,
          depth: 6,
          height: 2.8,
          wallThickness: 0.12,
        }],
        selectedRoomId: 'legacy-room',
        livePreview: true,
      },
    }

    const migrated = await options.migrate?.(legacyState, 6) as
      import('../src/store/useSceneStore').SceneState | undefined
    if (!migrated) {
      throw new Error('The scene migration did not return state.')
    }

    useSceneStore.setState(migrated)
    useSceneStore.getState().setUiMode('visualize')
    const persisted = JSON.parse(window.localStorage.getItem('roometry-scene') ?? '{}')

    return {
      version: options.version,
      room: migrated.floorPlan.rooms[0],
      furnitureRoomId: migrated.furniture[0]?.roomId,
      hasRoom: 'room' in migrated,
      hasLivePreview: 'livePreview' in migrated.floorPlan,
      persistedHasRoom: 'room' in persisted.state,
      persistedHasLivePreview: 'livePreview' in persisted.state.floorPlan,
      persistedVersion: persisted.version,
    }
  })

  expect(result.version).toBe(7)
  expect(result.room).toMatchObject({
    id: 'legacy-room',
    name: 'Room 1',
    width: 7,
    depth: 6,
    height: 2.8,
    doors: [],
  })
  expect(result.furnitureRoomId).toBe('legacy-room')
  expect(result).toMatchObject({
    hasRoom: false,
    hasLivePreview: false,
    persistedHasRoom: false,
    persistedHasLivePreview: false,
    persistedVersion: 7,
  })
})

test('keeps the selected room as the only editable room geometry', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const sceneModulePath = '/src/store/useSceneStore.ts'
    const { useSceneStore } = await import(sceneModulePath) as typeof import('../src/store/useSceneStore')
    const store = useSceneStore.getState()
    store.resetScene()

    const roomId = store.createRoom({
      id: 'room-a',
      name: 'Studio',
      x: 0,
      z: 0,
      width: 4,
      depth: 4,
      height: 2.7,
      wallThickness: 0.12,
    })
    const overlappingRoomId = store.createRoom({
      id: 'room-b',
      x: 0,
      z: 0,
      width: 4,
      depth: 4,
      height: 2.7,
      wallThickness: 0.12,
    })

    useSceneStore.getState().setSelectedRoomDimensions({ width: 6, depth: 5, height: 2.9 })
    const state = useSceneStore.getState()

    return {
      roomId,
      overlappingRoomId,
      selectedRoomId: state.floorPlan.selectedRoomId,
      rooms: state.floorPlan.rooms,
      hasMirroredRoom: 'room' in state,
      constraintMessage: state.floorPlan.constraintMessage,
    }
  })

  expect(result.roomId).toBe('room-a')
  expect(result.overlappingRoomId).toBeNull()
  expect(result.selectedRoomId).toBe('room-a')
  expect(result.rooms).toHaveLength(1)
  expect(result.rooms[0]).toMatchObject({ width: 6, depth: 5, height: 2.9 })
  expect(result.hasMirroredRoom).toBe(false)
  expect(result.constraintMessage).toBeNull()
})
