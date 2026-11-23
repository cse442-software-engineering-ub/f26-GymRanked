import { expect } from '@playwright/test'
import { shortDay } from '../../src/dashboard/dashboardFormat.js'
import { weekRangeLabel } from '../../src/weeklySchedule.js'
import { createAccount, logIn } from './helpers.js'
import { step } from './banner.js'
import { acceptanceTests } from './stories.js'

// Story 86's shared-server target is https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/.
// Playwright uses its configured baseURL; set E2E_BASE_URL to that URL when running against cattle.
const todayCard = (page) => page.locator('.dashboard-today')
const planSessions = (page) => page.locator('.dashboard-weekly__stats div').filter({ hasText: 'Plan sessions this week' }).locator('strong')
const libraryHeading = (page) => page.getByRole('heading', { name: 'Find your next workout plan' })
const greeting = (page, name) => page.getByRole('heading', { level: 1, name: `Welcome back, ${name}` })

// A new account's first stop is Personal details (#117), so log in here instead of helpers.logIn.
async function newAccount(page, name) {
  const account = await createAccount(page, name)
  await page.goto('#/login')
  await page.getByLabel('Email').fill(account.email)
  await page.getByLabel('Password', { exact: true }).fill(account.password)
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(page).toHaveURL(/#\/personal-details$/)
  return account
}

async function savePersonalDetails(page) {
  await page.getByLabel('Body weight (lb)').fill('180')
  await page.getByRole('button', { name: 'Man', exact: true }).click()
  await page.getByRole('button', { name: 'Save and continue' }).click()
  await expect(page.getByRole('heading', { name: 'Choose your training goal' })).toBeVisible()
}

async function finishOnboarding(page, { level = 'Beginner', equipment = 'Full gym access' } = {}) {
  await savePersonalDetails(page)
  await expect(page.locator('.ob-step')).toHaveAttribute('aria-busy', 'false')
  await page.getByRole('button', { name: /^Strength/ }).click()
  await page.getByRole('button', { name: 'Save goal' }).click()
  await expect(page.getByRole('heading', { name: 'How experienced are you?' })).toBeVisible()
  await expect(page.locator('.ob-step')).toHaveAttribute('aria-busy', 'false')
  await page.getByRole('button', { name: new RegExp(`^${level}`) }).click()
  await page.getByRole('button', { name: 'Save and continue' }).click()
  await expect(page.getByRole('heading', { name: 'What equipment can you use?' })).toBeVisible()
  await expect(page.locator('.ob-step')).toHaveAttribute('aria-busy', 'false')
  await page.getByRole('button', { name: equipment }).click()
  await page.getByRole('button', { name: 'Save and continue' }).click()
  await expect(page.getByRole('heading', { name: 'Choose your workout plan' })).toBeVisible()
}

async function chooseRecommended(page, planName = 'Beginner Fundamentals') {
  const row = page.locator('.ob-plan').filter({ has: page.getByText(planName, { exact: true }) })
  await row.getByRole('button', { name: 'Choose plan' }).click()
  await expect(page).toHaveURL(/#\/dashboard$/)
  await expect(todayCard(page)).toContainText(`Current plan: ${planName}`)
}

async function accountWithPlan(page, name, options) {
  const account = await newAccount(page, name)
  await finishOnboarding(page, options)
  await chooseRecommended(page)
  return account
}

async function expectWeek(page) {
  await expect(todayCard(page).locator('.dashboard-today__heading-label')).toContainText(weekRangeLabel(new Date()))
}

acceptanceTests('86-home-dashboard.md', {
  1: async ({ page }) => {
    await step('Setup: register Marcus, complete onboarding, and choose Beginner Fundamentals', () => accountWithPlan(page, 'Marcus Dashboard'))
    await step('Step 1: the Dashboard shows Marcus, his initials and an empty week', async () => {
      await expect(page).toHaveURL(/#\/dashboard$/)
      await expect(greeting(page, 'Marcus')).toBeVisible()
      await expect(page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: /View profile/ })).toContainText('MD')
      await expect(page.locator('main')).toContainText('0/3')
      await expect(page.locator('main')).toContainText('training days logged')
      await expect(planSessions(page)).toHaveText('0 of 3')
    })
    await step('Step 2: Today’s workout identifies the plan and current week', async () => {
      await expectWeek(page)
      await expect(todayCard(page)).toContainText('Current plan: Beginner Fundamentals')
    })
    await step('Step 3: the card shows today’s training or rest day', async () => {
      if ([1, 3, 5].includes(new Date().getDay())) {
        await expect(todayCard(page).locator('.dashboard-card__title')).toHaveText(/Full body [ABC]/)
        await expect(todayCard(page).locator('.dashboard-exercises li')).toHaveCount(3)
      } else {
        await expect(todayCard(page).locator('.dashboard-card__title')).toHaveText('Rest day')
        await expect(todayCard(page)).toContainText('No session scheduled today in your Beginner Fundamentals plan.')
      }
    })
    await step('Step 4: refreshing preserves the account, plan, and week', async () => {
      await page.reload()
      await expect(greeting(page, 'Marcus')).toBeVisible()
      await expect(todayCard(page)).toContainText('Current plan: Beginner Fundamentals')
      await expectWeek(page)
      await expect(planSessions(page)).toHaveText('0 of 3')
    })
  },

  2: async ({ page }) => {
    await step('Setup: Sofia chooses Beginner Fundamentals', () => accountWithPlan(page, 'Sofia Switch', { level: 'Intermediate' }))
    await step('Step 1: Plans opens the workout plan library', async () => {
      await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Plans', exact: true }).click()
      await expect(libraryHeading(page)).toBeVisible()
      await expect(page.getByText('Browse all training programs', { exact: false })).toBeVisible()
    })
    await step('Step 2: Bodyweight Basics opens the switch dialog', async () => {
      const row = page.locator('.plan-list__item').filter({ has: page.getByText('Bodyweight Basics', { exact: true }) })
      await row.getByRole('button', { name: 'Choose plan' }).click()
      await expect(page.getByRole('dialog')).toContainText('Switch to Bodyweight Basics?')
      await expect(page.getByRole('dialog')).toContainText("Switching plans now will reset this week's progress.")
    })
    await step('Step 3: Switch plan returns to the Dashboard with the new plan', async () => {
      await page.getByRole('dialog').getByRole('button', { name: 'Switch plan' }).click()
      await expect(page).toHaveURL(/#\/dashboard$/)
      await expect(page.getByRole('status').filter({ hasText: 'Switched to Bodyweight Basics' })).toContainText('Switched to Bodyweight Basics. Your week starts over today.')
      await expect(greeting(page, 'Sofia')).toBeVisible()
    })
    await step('Step 4: Today’s workout names Bodyweight Basics and the week', async () => {
      await expect(todayCard(page)).toContainText('Current plan: Bodyweight Basics')
      await expectWeek(page)
    })
    await step('Step 5: refreshing keeps Bodyweight Basics', async () => {
      await page.reload()
      await expect(todayCard(page)).toContainText('Current plan: Bodyweight Basics')
      await expect(todayCard(page)).not.toContainText('Current plan: Beginner Fundamentals')
    })
  },

  3: async ({ page }) => {
    await step('Setup: Taylor finishes onboarding without choosing a plan', async () => {
      await newAccount(page, 'Taylor Empty')
      await finishOnboarding(page)
    })
    await step('Step 1: the Dashboard shows Taylor, the no-plan greeting and No plan', async () => {
      await page.goto('#/dashboard')
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Welcome, Taylor')
      await expect(page.locator('.dashboard-header__eyebrow')).toHaveText('WELCOME TO GYMRANK')
      await expect(planSessions(page)).toHaveText('No plan')
    })
    await step('Step 2: Today’s workout shows the empty state and week', async () => {
      await expectWeek(page)
      await expect(todayCard(page)).toContainText('No workout plan selected')
      await expect(todayCard(page).locator('.dashboard-exercises li')).toHaveCount(0)
    })
    await step('Step 3: Browse workout plans opens the library', async () => {
      await todayCard(page).getByRole('button', { name: /Browse workout plans/ }).click()
      await expect(libraryHeading(page)).toBeVisible()
    })
  },

  4: async ({ page, context }) => {
    await step('Setup: Alex has a saved Beginner Fundamentals plan', () => accountWithPlan(page, 'Alex Offline'))
    const nav = page.getByRole('navigation', { name: 'Primary' })
    await step('Step 1: Plans opens the library', async () => {
      await nav.getByRole('link', { name: 'Plans', exact: true }).click()
      await expect(libraryHeading(page)).toBeVisible()
    })
    await step('Step 2: offline, Dashboard shows the setup-check error and Try again', async () => {
      await context.setOffline(true)
      // The setup check replaces the whole layout, navigation included, so don't wait on the link after clicking.
      await nav.getByRole('link', { name: 'Dashboard', exact: true }).click({ noWaitAfter: true })
      await expect(page.getByRole('alert').filter({ hasText: 'check your account setup' })).toHaveText(/We couldn’t check your account setup\. Try again\./)
      await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()
      await expect(greeting(page, 'Alex')).toHaveCount(0)
      await expect(page.getByText('No workout plan selected')).toHaveCount(0)
    })
    await step('Step 3: back online, Try again opens the Dashboard with the saved plan', async () => {
      await context.setOffline(false)
      await page.getByRole('button', { name: 'Try again' }).click()
      await expect(greeting(page, 'Alex')).toBeVisible()
      await expect(todayCard(page)).toContainText('Current plan: Beginner Fundamentals')
      await expectWeek(page)
      await expect(todayCard(page)).not.toContainText('No workout plan selected')
    })
  },

  5: async ({ page }) => {
    let account
    await step('Setup: Jordan has a saved Beginner Fundamentals plan', async () => {
      account = await accountWithPlan(page, 'Jordan Guard')
      await expect(greeting(page, 'Jordan')).toBeVisible()
    })
    await step('Step 1: Log out from the menu', async () => {
      await page.getByRole('navigation', { name: 'Primary' }).getByRole('button', { name: 'Log out' }).click()
      await expect(page.getByText('You are logged out.')).toBeVisible()
    })
    await step('Step 2: the Dashboard address opens the Login page', async () => {
      await page.goto('#/dashboard')
      await expect(page).toHaveURL(/#\/login$/)
      await expect(greeting(page, 'Jordan')).toHaveCount(0)
      await expect(todayCard(page)).toHaveCount(0)
    })
    await step('Step 3: logging in again opens Jordan’s Dashboard', async () => {
      await page.getByLabel('Email').fill(account.email)
      await page.getByLabel('Password', { exact: true }).fill(account.password)
      await page.getByRole('button', { name: 'Log in' }).click()
      await expect(page).toHaveURL(/#\/dashboard$/)
      await expect(greeting(page, 'Jordan')).toBeVisible()
      await expect(todayCard(page)).toContainText('Current plan: Beginner Fundamentals')
    })
  },

  6: async ({ page }) => {
    let account
    await step('Setup: Casey registers, saves Personal details and reaches Training Goal', async () => {
      account = await newAccount(page, 'Casey Resume')
      await savePersonalDetails(page)
    })
    await step('Step 1: a fresh session resumes at Training Goal', async () => {
      await page.context().clearCookies()
      await logIn(page, account)
      await expect(page.getByRole('heading', { name: 'Choose your training goal' })).toBeVisible()
    })
    await step('Step 2: direct Dashboard access returns to Training Goal', async () => {
      await page.goto('#/dashboard')
      await expect(page).toHaveURL(/#\/goal$/)
      await expect(page.getByText('Plan sessions this week')).toHaveCount(0)
    })
    await step('Step 3: saving Strength opens Experience', async () => {
      await expect(page.locator('.ob-step')).toHaveAttribute('aria-busy', 'false')
      await page.getByRole('button', { name: /^Strength/ }).click()
      await page.getByRole('button', { name: 'Save goal' }).click()
      await expect(page.getByRole('heading', { name: 'How experienced are you?' })).toBeVisible()
    })
    await step('Step 4: another fresh session resumes at Experience', async () => {
      await page.context().clearCookies()
      await logIn(page, account)
      await expect(page.getByRole('heading', { name: 'How experienced are you?' })).toBeVisible()
    })
    await step('Step 5: Experience and Equipment lead to recommended plans', async () => {
      await expect(page.locator('.ob-step')).toHaveAttribute('aria-busy', 'false')
      await page.getByRole('button', { name: /^Beginner/ }).click()
      await page.getByRole('button', { name: 'Save and continue' }).click()
      await expect(page.getByRole('heading', { name: 'What equipment can you use?' })).toBeVisible()
      await expect(page.locator('.ob-step')).toHaveAttribute('aria-busy', 'false')
      await page.getByRole('button', { name: 'Full gym access' }).click()
      await page.getByRole('button', { name: 'Save and continue' }).click()
      await expect(page.getByRole('heading', { name: 'Choose your workout plan' })).toBeVisible()
    })
    await step('Step 6: choosing a plan opens Casey’s Dashboard', async () => {
      await chooseRecommended(page)
      await expect(greeting(page, 'Casey')).toBeVisible()
      await expect(planSessions(page)).toBeVisible()
    })
  },

  7: async ({ page }, testInfo) => {
    // The server starts today's workout by New York time, and Push Pull Legs trains Monday to Friday only.
    const weekday = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short' }).format(new Date())
    testInfo.skip(weekday === 'Sat' || weekday === 'Sun', 'Push Pull Legs has no workout at the weekend; run this test Monday to Friday (New York time).')
    const facts = page.locator('.home-week__facts')
    const nextLink = facts.getByRole('link', { name: /view this workout in your plan/ })
    const lastLink = facts.getByRole('link', { name: /view this saved workout/ })
    const todayLabel = shortDay(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date()))
    let nextName
    let todayWorkout

    await step('Setup: register Nadia, finish onboarding as Intermediate and choose Push Pull Legs', async () => {
      await newAccount(page, 'Nadia Next')
      await finishOnboarding(page, { level: 'Intermediate' })
      const row = page.locator('.ob-plan').filter({ has: page.getByText('Push Pull Legs', { exact: true }) })
      await row.getByRole('button', { name: 'Choose plan' }).click()
      await expect(page).toHaveURL(/#\/dashboard$/)
      await expect(facts).toContainText('No workouts yet')
    })
    await step('Step 1: Next up shows a workout and a date', async () => {
      await expect(nextLink).toBeVisible()
      nextName = (await nextLink.locator('strong').textContent()).trim()
      expect(['Push', 'Pull', 'Legs']).toContain(nextName)
      await expect(nextLink).toContainText(/· (Mon|Tue|Wed|Thu|Fri), [A-Z][a-z]{2} \d{1,2}/)
    })
    await step('Step 2: Next up opens that workout, highlighted in the plan', async () => {
      await nextLink.click()
      await expect(page).toHaveURL(/#\/plans\/\d+\?day=[1-9]$/)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Push Pull Legs')
      const day = page.locator('.plan-split__item--next')
      await expect(day).toHaveCount(1)
      await expect(day.locator('.plan-split__name')).toHaveText(`${nextName}Next up`)
      await expect(day.locator('.plan-exercise').first()).toBeVisible()
      await expect(day).toBeInViewport()
    })
    await step('Step 3: Back to dashboard returns to the Dashboard', async () => {
      await page.getByRole('link', { name: 'Back to dashboard' }).click()
      await expect(page).toHaveURL(/#\/dashboard$/)
    })
    await step('Step 4: Start workout opens the active workout', async () => {
      todayWorkout = (await page.locator('.home-hero__title').textContent()).trim()
      await page.locator('.home-hero').getByRole('button', { name: /Start workout/ }).click()
      await expect(page).toHaveURL(/#\/workout\/active\?from=dashboard$/)
      await expect(page.getByRole('heading', { name: 'Log a set' })).toBeVisible()
    })
    await step('Step 5: log 135 lb × 8', async () => {
      await page.getByLabel('Weight (lb)').fill('135')
      await page.getByLabel('Reps').fill('8')
      await page.getByRole('button', { name: 'Log set' }).click()
      await expect(page.locator('main')).toContainText('1 set')
    })
    await step('Step 6: complete and save the partial workout', async () => {
      await page.locator('main').getByRole('button', { name: 'Complete workout' }).click()
      await page.getByRole('dialog').getByRole('button', { name: 'Complete workout' }).click()
      const partial = page.getByRole('alertdialog', { name: 'Some exercises have no logged sets' })
      await partial.getByRole('button', { name: 'Save partial workout' }).click()
      await expect(page.getByRole('heading', { level: 1, name: `Workout complete - ${todayWorkout}` })).toBeVisible()
    })
    let summaryUrl
    await step('Step 7: Go back shows today’s workout as Last logged', async () => {
      await page.locator('main').getByRole('button', { name: 'Go back' }).click()
      await expect(page).toHaveURL(/#\/dashboard$/)
      await expect(lastLink).toContainText(`${todayWorkout} · ${todayLabel}`)
    })
    await step('Step 8: Last logged opens that exact saved workout', async () => {
      await lastLink.click()
      await expect(page).toHaveURL(/#\/workouts\/\d+\/summary\?from=dashboard$/)
      summaryUrl = page.url()
      await expect(page.getByRole('heading', { level: 1, name: `Workout complete - ${todayWorkout}` })).toBeVisible()
      await expect(page.locator('main')).toContainText('135 lb × 8')
    })
    await step('Step 9: the summary stays after a refresh', async () => {
      await page.reload()
      expect(page.url()).toBe(summaryUrl)
      await expect(page.getByRole('heading', { level: 1, name: `Workout complete - ${todayWorkout}` })).toBeVisible()
      await expect(page.locator('main')).toContainText('135 lb × 8')
    })
    await step('Step 10: Go back returns to the Dashboard', async () => {
      await page.locator('main').getByRole('button', { name: 'Go back' }).click()
      await expect(page).toHaveURL(/#\/dashboard$/)
      await expect(lastLink).toContainText(`${todayWorkout} · ${todayLabel}`)
    })
  },
})
