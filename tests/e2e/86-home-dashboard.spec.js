import { expect } from '@playwright/test'
import { weekRangeLabel } from '../../src/weeklySchedule.js'
import { createAccountAndLogIn, logIn } from './helpers.js'
import { step } from './banner.js'
import { acceptanceTests } from './stories.js'

// Story 86's shared-server target is https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/.
// Playwright uses its configured baseURL; set E2E_BASE_URL to that URL when running against cattle.
const todayCard = (page) => page.locator('.dashboard-today')
const greeting = (page, name) => page.getByRole('heading', { level: 1, name: `Welcome back, ${name}` })

async function finishOnboarding(page, { level = 'Beginner', equipment = 'Full gym access' } = {}) {
  await expect(page.getByRole('heading', { name: 'Choose your training goal' })).toBeVisible()
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
  const account = await createAccountAndLogIn(page, name)
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
    await step('Step 1: the Dashboard shows Marcus and his initials', async () => {
      await expect(page).toHaveURL(/#\/dashboard$/)
      await expect(greeting(page, 'Marcus')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Open account menu' })).toContainText('MD')
    })
    await step('Step 2: the three summary cards show their initial values', async () => {
      await expect(page.locator('.dashboard-metric__label')).toHaveText(['RANK', 'WORKOUTS THIS WEEK', 'WEEKLY CONSISTENCY'])
      await expect(page.locator('.dashboard-metric__value')).toHaveText(['Getting started', '0 of 3', '0 weeks'])
    })
    await step('Step 3: Today’s workout identifies the plan and current week', async () => {
      await expectWeek(page)
      await expect(todayCard(page)).toContainText('Current plan: Beginner Fundamentals')
    })
    await step('Step 4: the card shows today’s training or rest day', async () => {
      if ([1, 3, 5].includes(new Date().getDay())) {
        await expect(todayCard(page).locator('.dashboard-card__title')).toHaveText(/Full body [ABC]/)
        await expect(todayCard(page).locator('.dashboard-exercises li')).toHaveCount(3)
      } else {
        await expect(todayCard(page).locator('.dashboard-card__title')).toHaveText('Rest day')
        await expect(todayCard(page)).toContainText('No session scheduled today in your Beginner Fundamentals plan.')
      }
    })
    await step('Step 5: refreshing preserves the account, plan, and week', async () => {
      await page.reload()
      await expect(greeting(page, 'Marcus')).toBeVisible()
      await expect(todayCard(page)).toContainText('Current plan: Beginner Fundamentals')
      await expectWeek(page)
      await expect(page.locator('.dashboard-metric__value')).toHaveText(['Getting started', '0 of 3', '0 weeks'])
    })
  },

  2: async ({ page }) => {
    await step('Setup: Sofia chooses Beginner Fundamentals', () => accountWithPlan(page, 'Sofia Switch', { level: 'Intermediate' }))
    await step('Step 1: Plans opens the workout plan library', async () => {
      await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Plans' }).click()
      await expect(page.getByRole('heading', { name: 'Find your next workout plan' })).toBeVisible()
      await expect(page.getByText('Browse all training programs')).toBeVisible()
    })
    await step('Step 2: Bodyweight Basics opens the switch dialog', async () => {
      const row = page.locator('.plan-list__item').filter({ has: page.getByText('Bodyweight Basics', { exact: true }) })
      await row.getByRole('button', { name: 'Choose plan' }).click()
      await expect(page.getByRole('dialog')).toContainText('Switch to Bodyweight Basics?')
      await expect(page.getByRole('dialog')).toContainText("reset this week's progress")
    })
    await step('Step 3: Switch plan returns to the Dashboard with the new plan', async () => {
      await page.getByRole('dialog').getByRole('button', { name: 'Switch plan' }).click()
      await expect(page).toHaveURL(/#\/dashboard$/)
      await expect(page.getByRole('status')).toContainText('Switched to Bodyweight Basics. Your week starts over today.')
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
      await createAccountAndLogIn(page, 'Taylor Empty')
      await finishOnboarding(page)
    })
    await step('Step 1: the Dashboard shows Taylor and the no-plan greeting', async () => {
      await page.goto('#/dashboard')
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Welcome, Taylor')
      await expect(page.locator('.dashboard-header__eyebrow')).toHaveText('WELCOME TO GYMRANK')
    })
    await step('Step 2: the summary distinguishes no plan from zero workouts', async () => {
      await expect(page.locator('.dashboard-metric__value')).toHaveText(['Getting started', 'No plan yet', '0 weeks'])
    })
    await step('Step 3: Today’s workout shows the empty state and week', async () => {
      await expectWeek(page)
      await expect(todayCard(page)).toContainText('No workout plan selected')
      await expect(todayCard(page).locator('.dashboard-exercises li')).toHaveCount(0)
    })
    await step('Step 4: Browse workout plans opens the library', async () => {
      await todayCard(page).getByRole('button', { name: /Browse workout plans/ }).click()
      await expect(page.getByRole('heading', { name: 'Find your next workout plan' })).toBeVisible()
    })
  },

  4: async ({ page }) => {
    await step('Setup: Alex has a saved Beginner Fundamentals plan', () => accountWithPlan(page, 'Alex Loading'))
    let releaseGate
    let releasePlan
    await page.route('**/api/setup.php', async (route) => {
      await new Promise((resolve) => { releaseGate = resolve })
      await route.continue()
    })
    await page.route('**/api/current_plan.php', async (route) => {
      await new Promise((resolve) => { releasePlan = resolve })
      await route.continue()
    })
    try {
      await step('Step 1: checking the account setup is visible during a slow request', async () => {
        await page.reload()
        await expect(page.getByText('Checking your account setup…')).toBeVisible()
        await expect.poll(() => typeof releaseGate).toBe('function')
        releaseGate()
      })
      await step('Step 2: Today’s workout shows its loading state', async () => {
        await expect(page.getByText("Loading today's workout...")).toBeVisible()
        await expect.poll(() => typeof releasePlan).toBe('function')
        releasePlan()
      })
      await step('Step 3: the saved plan and week replace loading', async () => {
        await expect(greeting(page, 'Alex')).toBeVisible()
        await expect(todayCard(page)).toContainText('Current plan: Beginner Fundamentals')
        await expectWeek(page)
      })
      await step('Step 4: the finished card is not an empty-plan state', async () => {
        await expect(todayCard(page)).not.toContainText('No workout plan selected')
      })
    } finally {
      releaseGate?.()
      releasePlan?.()
      await page.unroute('**/api/setup.php')
      await page.unroute('**/api/current_plan.php')
    }
  },

  5: async ({ page }) => {
    await step('Setup: Jordan has a saved Beginner Fundamentals plan', () => accountWithPlan(page, 'Jordan Error'))
    await page.route('**/api/current_plan.php', (route) => route.abort())
    try {
      await step('Step 1: the saved-plan request is blocked on refresh', async () => {
        await page.reload()
        await expect(page.getByRole('alert')).toContainText("Couldn't load your workout summary.")
      })
      await step('Step 2: the Dashboard shows an error instead of No plan yet', async () => {
        await expect(greeting(page, 'Jordan')).toBeVisible()
        await expect(todayCard(page)).toContainText("Couldn't load your workout summary. Check your connection and try again.")
        await expect(page.locator('.dashboard-metric__value').nth(1)).toHaveText('Unavailable')
        await expect(todayCard(page).getByRole('button', { name: 'Try again' })).toBeVisible()
      })
      await page.unroute('**/api/current_plan.php')
      await step('Step 3: Try again restores the saved plan', async () => {
        await todayCard(page).getByRole('button', { name: 'Try again' }).click()
        await expect(todayCard(page)).toContainText('Current plan: Beginner Fundamentals')
        await expect(todayCard(page)).not.toContainText("Couldn't load your workout summary.")
      })
    } finally {
      await page.unroute('**/api/current_plan.php')
    }
  },

  6: async ({ page }) => {
    let account
    await step('Setup: Casey registers and reaches Training Goal', async () => {
      account = await createAccountAndLogIn(page, 'Casey Resume')
      await expect(page.getByRole('heading', { name: 'Choose your training goal' })).toBeVisible()
    })
    await step('Step 1: a fresh session resumes at Training Goal', async () => {
      await page.context().clearCookies()
      await logIn(page, account)
      await expect(page.getByRole('heading', { name: 'Choose your training goal' })).toBeVisible()
    })
    await step('Step 2: direct Dashboard access returns to Training Goal', async () => {
      await page.goto('#/dashboard')
      await expect(page).toHaveURL(/#\/goal$/)
      await expect(page.getByText('WORKOUTS THIS WEEK')).toHaveCount(0)
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
      await expect(page.getByText('WORKOUTS THIS WEEK')).toBeVisible()
    })
  },
})
