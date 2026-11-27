import { expect, test, type Page } from '@playwright/test'

const bufferModulePath = 'node:buffer'
const { Buffer } = await import(bufferModulePath)

async function createThreeRoomPlan(page: Page) {
  const base64 = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 640
    canvas.height = 420
    const context = canvas.getContext('2d')!
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.fillStyle = '#151515'

    context.fillRect(80, 60, 480, 10)
    context.fillRect(80, 350, 480, 10)
    context.fillRect(80, 60, 10, 300)
    context.fillRect(550, 60, 10, 300)

    context.fillRect(300, 60, 10, 120)
    context.fillRect(300, 240, 10, 120)
    context.fillRect(300, 210, 100, 10)
    context.fillRect(450, 210, 110, 10)

    context.font = '18px sans-serif'
    context.fillText('BEDROOM', 125, 145)
    context.fillText('BATH', 375, 125)
    context.fillText('KITCHEN', 350, 295)
    return canvas.toDataURL('image/png').split(',')[1]
  })

  return Buffer.from(base64, 'base64')
}

test('imports a door-separated image as three editable rooms', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('roometry_guest_mode', 'true')
  })
  await page.goto('/dashboard')
  const image = await createThreeRoomPlan(page)

  await page.getByRole('button', { name: 'Import Floor Plan', exact: true }).click()
  await page.locator('.fimp-dropzone input[type="file"]').setInputFiles({
    name: 'three-room-plan.png',
    mimeType: 'image/png',
    buffer: image,
  })
  await page.getByRole('button', { name: 'Next', exact: true }).click()

  await expect(page.getByText('3 rooms detected', { exact: false })).toBeVisible()
  await expect(page.locator('.fimp-preview-canvas')).toBeVisible()
  await page.getByPlaceholder('e.g. My Apartment').fill('Imported Apartment')
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(page.locator('.fimp-room-item')).toHaveCount(3)
  await page.getByRole('button', { name: 'Create Project', exact: true }).click()

  await expect(page).toHaveURL(/\/app\//)
  await expect(page.locator('.editor-header-title h1')).toHaveText('Imported Apartment')
  await expect(page.getByRole('application', { name: 'Floor map drawing canvas' })).toBeVisible()
  await expect(page.locator('.room-rect')).toHaveCount(3)

  const importedProject = await page.evaluate(() => {
    const projects = JSON.parse(window.localStorage.getItem('roometry_guest_rooms') ?? '[]')
    return projects.find((project: { importedFromImage?: boolean }) => project.importedFromImage)
  })
  expect(importedProject.roomCount).toBe(3)
  expect(importedProject.floorPlan.rooms).toHaveLength(3)

  const { canvas, rooms } = importedProject.floorPlan
  for (const room of rooms) {
    expect(room.x).toBeGreaterThanOrEqual(-canvas.width / 2)
    expect(room.z).toBeGreaterThanOrEqual(-canvas.depth / 2)
    expect(room.x + room.width).toBeLessThanOrEqual(canvas.width / 2)
    expect(room.z + room.depth).toBeLessThanOrEqual(canvas.depth / 2)
  }
})
