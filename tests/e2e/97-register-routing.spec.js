import { expect, test } from '@playwright/test'

const account = { id: 97, full_name: 'Route Complete', email: 'route-complete@example.com' }
const plan = {
  id: 1, name: 'Beginner Fundamentals', level: 'beginner', goals: ['strength'],
  required_equipment: [], days_per_week: 3, duration_weeks: 4,
}

async function mockAccount(context, values = {}) {
  const state = { signedIn: true, goal: 'strength', experience: 'beginner', equipment: ['full_gym'], ...values }
  await context.route('**/api/*.php', async (route) => {
    const { pathname } = new URL(route.request().url())
    const endpoint = pathname.split('/').pop()
    const method = route.request().method()
    const reply = (status, body) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

    if (endpoint === 'login.php') {
      state.signedIn = true
      return reply(200, { user: account })
    }
    if (endpoint === 'logout.php') {
      state.signedIn = false
      return reply(200, { message: 'Logged out.' })
    }
    if (!state.signedIn) return reply(401, { error: 'Please log in.' })
    if (endpoint === 'session.php') return reply(200, { user: account })
    if (endpoint === 'theme.php') return reply(200, { theme: 'dark' })
    if (endpoint === 'preferences.php') {
      if (method === 'POST') state.goal = route.request().postDataJSON().training_goal
      return reply(200, { training_goal: state.goal })
    }
    if (endpoint === 'setup.php') {
      if (method === 'POST') Object.assign(state, route.request().postDataJSON())
      return reply(200, { experience: state.experience, equipment: state.equipment })
    }
    if (endpoint === 'plans.php') return reply(200, [plan])
    if (endpoint === 'current_plan.php') return reply(200, { plan: null, week: null })
    return reply(200, {})
  })
  return state
}

test('completed accounts skip auth and onboarding routes but retain normal pages', async ({ page, context }) => {
  const state = await mockAccount(context)

  for (const path of ['/login', '/register', '/goal', '/experience', '/equipment', '/setup', '/recommended']) {
    await page.goto(`#${path}`)
    await expect(page).toHaveURL(/#\/dashboard$/)
    await expect(page.getByRole('heading', { name: 'Welcome, Route' })).toBeVisible()
  }

  for (const [path, heading] of [
    ['/profile', 'Profile'], ['/plans', 'Workout plan library'], ['/progress', 'Your progress'],
  ]) {
    await page.goto(`#${path}`)
    await expect(page).toHaveURL(new RegExp(`#${path}$`))
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible()
  }

  await page.goto('#/')
  await expect(page).toHaveURL(/#\/dashboard$/)
  await page.goBack()
  await expect(page).toHaveURL(/#\/progress$/)
  await page.goForward()
  await expect(page).toHaveURL(/#\/dashboard$/)
  await page.reload()
  await expect(page).toHaveURL(/#\/dashboard$/)
  expect(state).toMatchObject({ goal: 'strength', experience: 'beginner', equipment: ['full_gym'] })
})

test('unfinished accounts resume their saved setup without reopening auth pages', async ({ page, context }) => {
  const state = await mockAccount(context, { goal: null, experience: null, equipment: [] })

  for (const [required, heading] of [
    ['/goal', 'Choose your training goal'],
    ['/experience', 'How experienced are you?'],
    ['/equipment', 'What equipment can you use?'],
  ]) {
    await page.goto('#/login')
    await expect(page).toHaveURL(new RegExp(`#${required}$`))
    await expect(page.getByRole('heading', { name: heading })).toBeVisible()
    for (const path of ['/register', '/dashboard', '/recommended']) {
      await page.goto(`#${path}`)
      await expect(page).toHaveURL(new RegExp(`#${required}$`))
    }
    if (required === '/goal') state.goal = 'strength'
    if (required === '/experience') state.experience = 'beginner'
  }

  await page.goto('#/goal')
  await expect(page.getByRole('heading', { name: 'Choose your training goal' })).toBeVisible()
  await page.goto('#/experience')
  await expect(page.getByRole('heading', { name: 'How experienced are you?' })).toBeVisible()
})

test('equipment save opens recommended plans once, then direct visits skip it', async ({ page, context }) => {
  await mockAccount(context, { equipment: [] })
  await page.goto('#/equipment')
  await expect(page.getByRole('heading', { name: 'What equipment can you use?' })).toBeVisible()
  await page.getByRole('button', { name: 'Full gym access' }).click()
  await page.getByRole('button', { name: 'Save and continue' }).click()

  await expect(page).toHaveURL(/#\/recommended$/)
  await expect(page.getByRole('heading', { name: 'Choose your workout plan' })).toBeVisible()
  await expect(page.getByText('Your setup is saved.')).toBeVisible()
  await page.getByRole('button', { name: 'Choose plan' }).click()
  await expect(page).toHaveURL(/#\/dashboard$/)

  await page.goto('#/recommended')
  await expect(page).toHaveURL(/#\/dashboard$/)
})

test('logout reopens registration and blocks protected routes in another tab', async ({ page, context }) => {
  await mockAccount(context)
  const second = await context.newPage()
  await page.goto('#/dashboard')
  await second.goto('#/register')
  await expect(second).toHaveURL(/#\/dashboard$/)

  await page.getByRole('button', { name: 'Open account menu' }).click()
  await page.getByRole('menuitem', { name: 'Log out' }).click()
  await expect(page).toHaveURL(/#\/login$/)
  await second.reload()
  await expect(second).toHaveURL(/#\/login$/)
  await second.goto('#/register')
  await expect(second.getByRole('heading', { name: 'Create your account' })).toBeVisible()
})

test('signed-out visitors can open auth pages but protected routes go to login', async ({ page, context }) => {
  await mockAccount(context, { signedIn: false })
  for (const path of ['/dashboard', '/goal', '/recommended']) {
    await page.goto(`#${path}`)
    await expect(page).toHaveURL(/#\/login$/)
  }
  await page.goto('#/register')
  await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible()
  await page.goto('#/login')
  await expect(page.getByRole('heading', { name: 'Log in to GymRank' })).toBeVisible()
})
