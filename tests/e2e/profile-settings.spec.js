import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const base = '/CSE442/2026-Fall/cse-442y/'
const dist = fileURLToPath(new URL('../../dist/', import.meta.url))

test.beforeEach(async ({ page }) => {
  await page.route('https://gymrank.test/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname
    const relative = pathname.slice(base.length) || 'index.html'
    const target = path.resolve(dist, relative)
    if (!target.startsWith(dist)) return route.abort()
    try {
      const body = await readFile(target)
      const contentType = target.endsWith('.js') ? 'text/javascript' : target.endsWith('.css') ? 'text/css' : 'text/html'
      await route.fulfill({ status: 200, contentType, body })
    } catch {
      await route.abort()
    }
  })
})

test('profile saves training preferences and updates plan equipment marks', async ({ page }) => {
  const saved = { goal: 'strength', experience: 'beginner', equipment: ['full_gym'] }
  const posts = []
  let signedIn = true

  await page.route('**/api/*.php', async (route) => {
    const request = route.request()
    const endpoint = new URL(request.url()).pathname.split('/').pop()
    let body
    if (endpoint === 'session.php' && !signedIn) return route.fulfill({ status: 401, contentType: 'application/json', body: '{"error":"Please log in."}' })
    if (endpoint === 'session.php' || endpoint === 'login.php') {
      if (endpoint === 'login.php') signedIn = true
      body = { user: { id: 1, full_name: 'Review Choices', email: 'review@example.com' } }
    }
    else if (endpoint === 'logout.php') { signedIn = false; body = {} }
    else if (endpoint === 'preferences.php') {
      if (request.method() === 'POST') {
        const change = request.postDataJSON()
        posts.push({ endpoint, change })
        saved.goal = change.training_goal
      }
      body = { training_goal: saved.goal }
    } else if (endpoint === 'setup.php') {
      if (request.method() === 'POST') {
        const change = request.postDataJSON()
        posts.push({ endpoint, change })
        Object.assign(saved, change)
      }
      body = { experience: saved.experience, equipment: saved.equipment }
    } else if (endpoint === 'current_plan.php') body = { plan: null, week: null }
    else if (endpoint === 'plans.php') body = [
      { id: 1, name: 'Full Body Strength', level: 'beginner', weeks: '8', days_per_week: 3, goals: ['strength'], required_equipment: ['barbell', 'cable_machine'] },
      { id: 2, name: 'Bodyweight Basics', level: 'beginner', weeks: '4', days_per_week: 3, goals: ['aerobic', 'fat_loss'], required_equipment: [] },
    ]
    else body = {}
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  })

  await page.goto(`https://gymrank.test${base}#/profile`)
  await expect(page.getByRole('heading', { name: 'Profile', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Review Choices' })).toBeVisible()
  await expect(page.getByLabel('Profile picture: RC')).toBeVisible()
  const preferences = page.getByRole('region', { name: 'Training Preferences' })
  await expect(preferences).toContainText('Strength')
  await expect(preferences).toContainText('Beginner')
  await expect(preferences).toContainText('Full gym access')

  await page.getByRole('link', { name: 'Edit Training Preferences' }).click()
  await page.getByLabel('Training goal').selectOption('aerobic')
  await page.getByLabel('Experience level').selectOption('intermediate')
  await page.getByRole('button', { name: 'Bodyweight only' }).click()
  await expect(page.getByRole('button', { name: 'Full gym access' })).toHaveAttribute('aria-pressed', 'false')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Settings saved.' })).toBeVisible()
  await expect(preferences).toContainText('Aerobic fitness')
  await expect(preferences).toContainText('Intermediate')
  await expect(preferences).toContainText('Bodyweight only')
  expect(posts).toEqual([
    { endpoint: 'setup.php', change: { experience: 'intermediate', equipment: ['bodyweight'] } },
    { endpoint: 'preferences.php', change: { training_goal: 'aerobic' } },
  ])

  await page.reload()
  await expect(preferences).toContainText('Bodyweight only')
  await page.getByRole('link', { name: 'Plans', exact: true }).first().click()
  await expect(page.getByRole('img', { name: /Insufficient equipment: you need Barbell and Cable machine/ })).toBeVisible()
  await page.goto(`https://gymrank.test${base}#/recommended`)
  await expect(page.getByText('Aerobic fitness · Intermediate · Bodyweight only')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Bodyweight Basics' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Full Body Strength' })).toHaveCount(0)
  await page.goto(`https://gymrank.test${base}#/profile`)
  await page.getByRole('button', { name: 'Log out' }).last().click()
  await expect(page.getByRole('heading', { name: 'Log in to GymRank' })).toBeVisible()
  await page.getByLabel('Email', { exact: true }).fill('review@example.com')
  await page.getByLabel('Password', { exact: true }).fill('ABC12345678@')
  await page.getByRole('button', { name: 'Log in', exact: true }).click()
  await page.goto(`https://gymrank.test${base}#/profile`)
  await expect(preferences).toContainText('Aerobic fitness')
  await expect(preferences).toContainText('Intermediate')
  await expect(preferences).toContainText('Bodyweight only')
})

test('cancel leaves saved values and changing experience preserves other settings', async ({ page }) => {
  const saved = { goal: 'strength', experience: 'beginner', equipment: ['full_gym'] }
  const posts = []
  await page.route('**/api/*.php', async (route) => {
    const request = route.request()
    const endpoint = new URL(request.url()).pathname.split('/').pop()
    let body = {}
    if (endpoint === 'session.php') body = { user: { id: 2, full_name: 'Preserve Settings', email: 'preserve@example.com' } }
    if (endpoint === 'preferences.php') body = { training_goal: saved.goal }
    if (endpoint === 'setup.php') {
      if (request.method() === 'POST') {
        const change = request.postDataJSON()
        posts.push(change)
        Object.assign(saved, change)
      }
      body = { experience: saved.experience, equipment: saved.equipment }
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  })
  await page.goto(`https://gymrank.test${base}#/profile`)
  await page.getByRole('link', { name: 'Edit Training Preferences' }).click()
  await page.getByLabel('Training goal').selectOption('aerobic')
  await page.getByRole('button', { name: 'Bodyweight only' }).click()
  await page.getByRole('link', { name: 'Cancel' }).click()
  const preferences = page.getByRole('region', { name: 'Training Preferences' })
  await expect(preferences).toContainText('Strength')
  await expect(preferences).toContainText('Full gym access')
  expect(posts).toHaveLength(0)

  await page.getByRole('link', { name: 'Edit Training Preferences' }).click()
  await page.getByLabel('Experience level').selectOption('advanced')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(preferences).toContainText('Advanced')
  await expect(preferences).toContainText('Strength')
  await expect(preferences).toContainText('Full gym access')
  expect(posts).toEqual([{ experience: 'advanced' }])
  await expect(page.getByText('preserve@example.com').first()).toBeVisible()
})
