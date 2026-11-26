import { expect, test } from '@playwright/test'

test('redirects unauthenticated editor visits to login', async ({ page }) => {
  await page.goto('/app/protected-project')
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Return to the plan.' })).toBeVisible()
})

test('shows the desktop-width notice instead of a crushed editor', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('roometry_guest_mode', 'true')
  })
  await page.goto('/app')

  await expect(page.getByRole('alert')).toContainText('Roometry needs a wider window.')
  await expect(page.getByRole('button', { name: 'Save', exact: true })).not.toBeVisible()
})

test('creates, saves, reloads, and visualizes a guest project', async ({ page }) => {
  test.setTimeout(90_000)
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await page.addInitScript(() => {
    window.localStorage.setItem('roometry_guest_mode', 'true')
  })
  await page.goto('/dashboard')

  await page.getByRole('button', { name: 'New Project', exact: true }).first().click()
  await page.getByPlaceholder('My Living Room').fill('Phase 3 Regression')
  const numericFields = page.locator('.modal-form input[type="number"]')
  await numericFields.nth(0).fill('12')
  await numericFields.nth(1).fill('10')
  await page.getByRole('button', { name: 'Create Project', exact: true }).click()

  await expect(page).toHaveURL(/\/app\/room_/)
  const floorMap = page.getByRole('application', { name: 'Floor map drawing canvas' })
  await expect(floorMap).toBeVisible()
  await expect(page.locator('.controls-tabs button.active')).toHaveText('Planner Tools')

  const widthInput = page.locator('label').filter({ hasText: /^Width \(m\)/ }).locator('input')
  await expect(widthInput).toHaveValue('12')
  await widthInput.fill('11')
  await widthInput.blur()
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByText('Project saved successfully!')).toBeVisible()

  const savedProject = await page.evaluate(() => {
    const projects = JSON.parse(window.localStorage.getItem('roometry_guest_rooms') ?? '[]')
    const project = projects.find((entry: { name?: string }) => entry.name === 'Phase 3 Regression')
    return {
      width: project?.floorPlan?.rooms?.[0]?.width,
      hasRoom: 'room' in (project?.snapshot ?? {}),
      hasLivePreview: 'livePreview' in (project?.floorPlan ?? {}),
    }
  })
  expect(savedProject).toEqual({ width: 11, hasRoom: false, hasLivePreview: false })

  await page.reload()
  await expect(floorMap).toBeVisible()
  await expect(widthInput).toHaveValue('11')
  await expect(page.locator('.controls-tabs button.active')).toHaveText('Planner Tools')

  await page.getByRole('button', { name: '3D Visualize', exact: true }).click()
  const canvas3D = page.locator('.editor-canvas-stage canvas')
  await expect(canvas3D).toBeVisible({ timeout: 30_000 })
  await expect.poll(() => canvas3D.evaluate((canvas: HTMLCanvasElement) => ({
    width: canvas.width,
    height: canvas.height,
    hasContext: Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl')),
  }))).toMatchObject({ hasContext: true })
  expect(await canvas3D.evaluate((canvas: HTMLCanvasElement) => canvas.width)).toBeGreaterThan(0)
  expect(await canvas3D.evaluate((canvas: HTMLCanvasElement) => canvas.height)).toBeGreaterThan(0)
  await expect(page.locator('.editor-canvas-fallback')).toHaveCount(0)

  await page.getByRole('button', { name: '2D Planner', exact: true }).click()
  await expect(floorMap).toBeVisible()
  expect(pageErrors).toEqual([])
})
