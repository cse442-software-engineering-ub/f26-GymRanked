import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import { step } from './banner.js'
import { logIn, logOut } from './helpers.js'
import { acceptanceTests } from './stories.js'

// Story 124 uses the accounts in database/seeds/weekly_competition.sql (#126). The seed dates workouts in the current
// week, so it only works from Thursday to Saturday (New York time). Local runs reload it before every test, which
// also puts back what the tests change; a run against a deployed copy can't, so it needs a fresh seed first.
const PASSWORD = 'Weekly-Test-Compete!'
const account = (name) => ({ email: `week-${name}@example.com`, password: PASSWORD })
const CASEY = account('casey')
const API = '**/api/weekly_standings.php'
const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url))

const CIRCLE = [
  '#1 Maya R. 3 of 3 days 100%',
  '#2 Casey L. You 2 of 3 days 67%',
  '#2 Jordan K. 2 of 3 days 67%',
  '#2 Pat M. 2 of 3 days 67%',
  '#5 Alex T. 1 of 3 days 33%',
  '#5 Riley S. 1 of 3 days 33%',
  '#7 Nia C. 0 of 3 days 0%',
  '#7 Sam L. 0 of 3 days 0%',
]

// Loads the seed through api/config.php's database and clears these accounts' login counters. Prints no credentials.
const LOAD_SEED = `
require 'api/config.php';
$db = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
$db->set_charset('utf8mb4');
$db->multi_query(file_get_contents('database/seeds/weekly_competition.sql'));
do { if ($result = $db->store_result()) $result->free(); } while ($db->more_results() && $db->next_result());
if ($db->errno) { echo $db->error; exit(1); }
$keys = [];
foreach (['casey', 'maya', 'pat', 'dana', 'ivy', 'lee', 'nia'] as $name) {
    $keys[] = "'" . hash('sha256', "login:email:week-$name@example.com") . "'";
}
$db->query('DELETE FROM auth_attempts WHERE attempt_key IN (' . implode(',', $keys) . ')');
`

const seedWorksToday = () => ['Thu', 'Fri', 'Sat'].includes(
  new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short' }).format(new Date()),
)

test.beforeEach(() => {
  test.skip(!seedWorksToday(), 'The weekly competition seed only works from Thursday to Saturday.')
  if (!process.env.E2E_BASE_URL) execFileSync('php', ['-r', LOAD_SEED], { cwd: REPO_ROOT })
})

const main = (page) => page.locator('main')
const hero = (page) => main(page).locator('.weekly-hero')
const days = (page) => hero(page).locator('.weekly-hero__days')
const rows = (page) => main(page).locator('.weekly-row')
const weeklyRing = (page) => page.locator('.dashboard-weekly__ring-center')
const homeRank = (page) => page.locator('.dashboard-weekly__stats > div').filter({ hasText: 'Weekly rank' }).locator('strong')
const switchLink = (page, label) => page.getByRole('navigation', { name: 'Leaderboards' }).getByRole('link', { name: label })
const fitsWidth = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)

// "Select Leaderboard": the top navigation on a computer, the menu (three lines) on a phone.
async function openWeekly(page) {
  const menu = page.getByRole('button', { name: 'Open navigation menu' })
  const topLink = page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Leaderboard' })
  await menu.or(topLink).filter({ visible: true }).waitFor()
  if (await menu.isVisible()) {
    await menu.click()
    await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'Leaderboard' }).click()
  } else {
    await topLink.click()
  }
  await expect(page).toHaveURL(/#\/leaderboard\/weekly$/)
  await expect(hero(page)).toBeVisible()
}

async function expectStandings(page, expected) {
  await expect.poll(() => rows(page).evaluateAll((items) => items.map((item) => [
    item.querySelector('.weekly-rank').textContent,
    item.querySelector('.weekly-name').textContent,
    item.querySelector('.weekly-you')?.textContent,
    item.querySelector('.weekly-days').textContent,
    item.querySelector('.weekly-percent').textContent,
  ].filter(Boolean).join(' ')))).toEqual(expected)
}

async function expectHomeRing(page, text) {
  await expect(weeklyRing(page)).toContainText(text)
  await expect(weeklyRing(page)).toContainText('training days logged')
}

// Dashboard, Resume workout, Complete workout, then Complete workout in the box.
async function finishWorkout(page) {
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Dashboard' }).click()
  await page.getByRole('button', { name: /Resume workout/ }).click()
  await expect(page).toHaveURL(/#\/workout\/active$/)
  await main(page).getByRole('button', { name: 'Complete workout' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Complete workout' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Workout complete' })).toBeVisible()
}

acceptanceTests('124-weekly-consistency-competition.md', {
  1: async ({ page }) => {
    await step('Setup: log in as Casey', () => logIn(page, CASEY))
    await step('Step 1: Leaderboard opens Weekly consistency', async () => {
      await openWeekly(page)
      await expect(page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Leaderboard' })).toHaveAttribute('aria-current', 'page')
      await expect(switchLink(page, 'Weekly consistency')).toHaveAttribute('aria-current', 'page')
      await expect(switchLink(page, 'Strength')).not.toHaveAttribute('aria-current', 'page')
    })
    await step('Step 2: the circle, the promise and the countdown to Monday', async () => {
      await expect(hero(page)).toContainText('The 3-day circle')
      await expect(hero(page)).toContainText('Show up. Move up. Start fresh.')
      const line = await hero(page).locator('.weekly-time-left').textContent()
      expect(line).toMatch(/^\d+d \d+h \d+m left · Resets Monday, 12:00 AM New York time$/)
      const data = await (await page.request.get('api/weekly_standings.php')).json()
      const [, d, h, m] = line.match(/^(\d+)d (\d+)h (\d+)m/).map(Number)
      const minutesLeft = (Date.parse(data.resets_at) - Date.parse(data.now)) / 60000
      expect(Math.abs(d * 1440 + h * 60 + m - minutesLeft)).toBeLessThan(2)
    })
    await step('Step 3: your rank, your days and the columns', async () => {
      await expect(hero(page).getByRole('heading', { level: 1 })).toHaveText("You're #2")
      await expect(days(page)).toHaveText('2/3 days · 67%')
      await expect(main(page).locator('.weekly-standings__header span')).toHaveText(['Rank', 'Member', 'Training days', 'Goal reached'])
    })
    await step('Step 4: the whole circle, with shared ranks', async () => {
      await expectStandings(page, CIRCLE)
      await expect(main(page).locator('.weekly-note')).toHaveText('Shared progress = shared rank. Everyone here has the same 3-day goal.')
      for (const name of ['Dana F.', 'Ivy P.', 'Lee F.', 'Tess T.']) await expect(main(page)).not.toContainText(name)
    })
  },

  2: async ({ page }) => {
    await step('Setup: Casey is at 2/3 on Home and on the standings', async () => {
      await logIn(page, CASEY)
      await expectHomeRing(page, '2/3')
      await openWeekly(page)
      await expect(hero(page)).toContainText("You're #2")
      await expect(days(page)).toHaveText('2/3 days · 67%')
    })
    await step('Step 1: finish the workout; Home shows 3/3', async () => {
      await finishWorkout(page)
      await main(page).getByRole('button', { name: 'Return to dashboard' }).click()
      await expectHomeRing(page, '3/3')
      await expect(homeRank(page)).toHaveText('#1')
    })
    const expectFinished = async () => {
      await expect(hero(page).getByRole('heading', { level: 1 })).toHaveText("You're #1")
      await expect(days(page)).toHaveText('3/3 days · 100%')
      await expect(hero(page)).toContainText('Goal reached')
      await expectStandings(page, [
        '#1 Casey L. You 3 of 3 days 100%',
        '#1 Maya R. 3 of 3 days 100%',
        '#3 Jordan K. 2 of 3 days 67%',
        '#3 Pat M. 2 of 3 days 67%',
        '#5 Alex T. 1 of 3 days 33%',
        '#5 Riley S. 1 of 3 days 33%',
        '#7 Nia C. 0 of 3 days 0%',
        '#7 Sam L. 0 of 3 days 0%',
      ])
    }
    await step('Steps 2 and 3: the standings show #1 shared with Maya', async () => {
      await openWeekly(page)
      await expect(switchLink(page, 'Weekly consistency')).toHaveAttribute('aria-current', 'page')
      await expectFinished()
    })
    await step('Step 4: a refresh changes nothing', async () => {
      await page.reload()
      await expectFinished()
    })
  },

  3: async ({ page }) => {
    await step('Setup: three sessions on two dates count as 2/3', async () => {
      await logIn(page, account('pat'))
      await expectHomeRing(page, '2/3')
    })
    await step('Step 1: Pat’s card and row', async () => {
      await openWeekly(page)
      await expect(days(page)).toHaveText('2/3 days · 67%')
      const me = main(page).locator('.weekly-row.is-me')
      await expect(me.locator('.weekly-name')).toHaveText('Pat M.')
      await expect(me.locator('.weekly-days')).toHaveText('2 of 3 days')
      await expect(me.locator('.weekly-percent')).toHaveText('67%')
    })
    await step('Step 2: Maya’s fourth day stays at 3 of 3 and 100%', async () => {
      const maya = rows(page).filter({ hasText: 'Maya R.' })
      await expect(maya.locator('.weekly-days')).toHaveText('3 of 3 days')
      await expect(maya.locator('.weekly-percent')).toHaveText('100%')
    })
  },

  4: async ({ page }) => {
    await step('Setup: Dana is at 1/5', async () => {
      await logIn(page, account('dana'))
      await expectHomeRing(page, '1/5')
    })
    await step('Step 1: Dana is alone in the 5-day circle', async () => {
      await openWeekly(page)
      await expect(hero(page)).toContainText('The 5-day circle')
      await expect(hero(page)).toContainText("You're #1")
      await expect(days(page)).toHaveText('1/5 days · 20%')
      await expectStandings(page, ['#1 Dana F. You 1 of 5 days 20%'])
    })
    await step('Step 2: no 3-day people, and the note says 5-day', async () => {
      for (const name of ['Maya R.', 'Casey L.']) await expect(main(page)).not.toContainText(name)
      await expect(main(page).locator('.weekly-note')).toHaveText('Shared progress = shared rank. Everyone here has the same 5-day goal.')
    })
    await step('Step 3: Maya’s circle doesn’t list Dana', async () => {
      await logOut(page)
      await logIn(page, account('maya'))
      await openWeekly(page)
      await expect(hero(page)).toContainText('The 3-day circle')
      await expect(main(page)).not.toContainText('Dana F.')
    })
  },

  5: async ({ page }) => {
    const IVY = account('ivy')
    const joinButton = () => hero(page).getByRole('button', { name: 'Join the weekly competition' })
    await step('Setup: Ivy is at 2/3', async () => {
      await logIn(page, IVY)
      await expectHomeRing(page, '2/3')
    })
    await step('Step 1: a Join button instead of a rank', async () => {
      await openWeekly(page)
      await expect(hero(page).getByRole('heading', { level: 1 })).toHaveText('Join the weekly competition')
      await expect(days(page)).toHaveText('2/3 days · 67%')
      await expect(joinButton()).toBeVisible()
      await expect(main(page).locator('.weekly-row.is-me')).toHaveCount(0)
    })
    const expectPractice = async () => {
      await expect(hero(page).getByRole('heading', { level: 1 })).toHaveText('Practice week')
      await expect(hero(page)).toContainText(/Your ranked weeks start Monday, [A-Z][a-z]+ \d+\./)
      await expect(days(page)).toHaveText('2/3 days · 67%')
      await expect(hero(page).getByRole('button', { name: 'Leave' })).toBeVisible()
      await expect(main(page)).not.toContainText('Ivy P.')
    }
    await step('Step 2: joining starts a practice week', async () => {
      await joinButton().click()
      await expectPractice()
    })
    await step('Step 3: still in the practice week after logging back in', async () => {
      await logOut(page)
      await logIn(page, IVY)
      await openWeekly(page)
      await expectPractice()
    })
    await step('Step 4: leaving keeps the workouts', async () => {
      await hero(page).getByRole('button', { name: 'Leave' }).click()
      await expect(main(page).getByRole('status')).toHaveText("You've left the weekly competition. Your workouts are kept.")
      await expect(joinButton()).toBeVisible()
      await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Dashboard' }).click()
      await expectHomeRing(page, '2/3')
    })
  },

  6: async ({ page }) => {
    const expectNoRank = async () => {
      await expect(hero(page)).not.toContainText("You're #")
      await expect(main(page).locator('.weekly-row.is-me')).toHaveCount(0)
    }
    await step('Setup: Lee is at 1/3', async () => {
      await logIn(page, account('lee'))
      await expectHomeRing(page, '1/3')
      await expect(homeRank(page)).toHaveText('Practice week')
    })
    await step('Steps 1 and 2: a practice week with no rank', async () => {
      await openWeekly(page)
      await expect(hero(page).getByRole('heading', { level: 1 })).toHaveText('Practice week')
      await expect(days(page)).toHaveText('1/3 days · 33%')
      await expect(hero(page)).toContainText(/Your ranked weeks start Monday, [A-Z][a-z]+ \d+\./)
      await expectNoRank()
    })
    await step('Step 3: a finished workout counts, still with no rank', async () => {
      await finishWorkout(page)
      await openWeekly(page)
      await expect(days(page)).toHaveText('2/3 days · 67%')
      await expect(hero(page).getByRole('heading', { level: 1 })).toHaveText('Practice week')
      await expectNoRank()
    })
  },

  7: async ({ page }) => {
    await step('Setup: log in as Nia', () => logIn(page, account('nia')))
    await step('Step 1: Home starts this week at 0/3', async () => {
      await expectHomeRing(page, '0/3')
      await expect(page.locator('.dashboard-weekly__day-status').filter({ hasText: 'Logged' })).toHaveCount(0)
      await expect(page.locator('.dashboard-milestone, .dashboard-card').filter({ hasText: 'Weekly milestone' })).toContainText('This week: 3 training days.')
    })
    await step('Step 2: last week’s days don’t count on the standings', async () => {
      await openWeekly(page)
      await expect(hero(page)).toContainText("You're #7")
      await expect(days(page)).toHaveText('0/3 days · 0%')
    })
    await step('Step 3: last week’s workouts are still in the history', async () => {
      await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Progress' }).click()
      await main(page).getByRole('link', { name: /Workout history/ }).click()
      await expect(main(page).locator('.history-list > li')).toHaveCount(3)
    })
  },

  8: async ({ page }) => {
    await step('Setup: log in as Casey and open Leaderboard', async () => {
      await logIn(page, CASEY)
      await openWeekly(page)
      await expect(hero(page)).toContainText("You're #2")
    })
    await step('Step 1: Strength is the story 10 leaderboard', async () => {
      await switchLink(page, 'Strength').click()
      await expect(page).toHaveURL(/#\/leaderboard$/)
      for (const label of ['Overall', 'Bench press', 'Back squat', 'Deadlift']) {
        await expect(main(page).getByRole('group', { name: 'Board' }).getByRole('button', { name: label, exact: true })).toBeVisible()
      }
      await expect(main(page)).toContainText('How to get ranked')
      await expect(main(page)).not.toContainText('The 3-day circle')
    })
    await step('Step 2: back to the same rank', async () => {
      await switchLink(page, 'Weekly consistency').click()
      await expect(page).toHaveURL(/#\/leaderboard\/weekly$/)
      await expect(hero(page)).toContainText("You're #2")
    })
  },

  9: async ({ page }) => {
    await step('Setup: Home shows 2/3 and #2', async () => {
      await logIn(page, CASEY)
      await expectHomeRing(page, '2/3')
      await expect(homeRank(page)).toHaveText('#2')
    })
    await step('Step 1: View weekly standings shows the same rank and count', async () => {
      await page.getByRole('link', { name: /View weekly standings/ }).click()
      await expect(page).toHaveURL(/#\/leaderboard\/weekly$/)
      await expect(switchLink(page, 'Weekly consistency')).toHaveAttribute('aria-current', 'page')
      await expect(hero(page)).toContainText("You're #2")
      await expect(days(page)).toHaveText('2/3 days · 67%')
    })
    await step('Step 2: a failed request says so, with no made-up numbers', async () => {
      await page.route(API, (route) => route.abort())
      await page.reload()
      await expect(main(page).getByRole('alert')).toContainText("Couldn't load this week's standings. Check your connection and try again.")
      await expect(main(page).getByRole('button', { name: 'Try again' })).toBeVisible()
      await expect(hero(page)).toHaveCount(0)
      await expect(main(page)).not.toContainText('0/3 days')
    })
    await step('Step 3: Try again brings them back', async () => {
      await page.unroute(API)
      await main(page).getByRole('button', { name: 'Try again' }).click()
      await expect(hero(page)).toContainText("You're #2")
      await expect(days(page)).toHaveText('2/3 days · 67%')
    })
  },

  10: async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await step('Setup: log in as Casey on a phone-sized window', () => logIn(page, CASEY))
    await step('Step 1: both choices fit, with no sideways scrolling', async () => {
      await openWeekly(page)
      await expect(switchLink(page, 'Weekly consistency')).toBeVisible()
      await expect(switchLink(page, 'Strength')).toBeVisible()
      expect(await fitsWidth(page)).toBe(true)
    })
    await step('Step 2: your card is on screen, and each row shows its numbers', async () => {
      await expect(hero(page)).toContainText("You're #2")
      await expect(days(page)).toHaveText('2/3 days · 67%')
      const bottom = await hero(page).locator('.weekly-time-left').evaluate((item) => item.getBoundingClientRect().bottom)
      expect(bottom).toBeLessThanOrEqual(844)
      await expectStandings(page, CIRCLE)
      for (const part of ['.weekly-rank', '.weekly-name', '.weekly-days', '.weekly-percent']) {
        await expect(rows(page).first().locator(part)).toBeVisible()
      }
    })
    await step('Step 3: Light mode from Profile, then Dark again', async () => {
      const themeButton = (label) => page.getByRole('group', { name: 'Color theme' }).getByRole('button', { name: label })
      await page.goto('#/profile')
      await themeButton('Light').click()
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
      await openWeekly(page)
      await expect(hero(page)).toContainText("You're #2")
      await expect(rows(page)).toHaveCount(CIRCLE.length)
      expect(await fitsWidth(page)).toBe(true)
      await page.goto('#/profile')
      await themeButton('Dark').click()
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    })
  },
})
