import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import { step } from './banner.js'
import { acquireLock, logIn } from './helpers.js'
import { acceptanceTests } from './stories.js'

// Story #131: the navigation menu (#133) and the Buddies rankings (#139). Casey is from the weekly seed; the crew-*
// accounts are Mansur's buddy_rankings seed (#138). Each test reloads its seed first on a local server.
const CASEY = { email: 'week-casey@example.com', password: 'Weekly-Test-Compete!' }
const crew = (name) => ({ email: `crew-${name}@example.com`, password: 'Crew-Test-78!' })
const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url))
const PHONE = { width: 390, height: 844 }

// Tests 1-6 use Casey (the weekly seed, shared with story 124, so they hold the same lock as its tests); tests 7-13
// use the crew accounts, which no other story touches.
const loadSeed = (seed, emails) => `
require 'api/config.php';
$db = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
$db->set_charset('utf8mb4');
$db->multi_query(file_get_contents('database/seeds/${seed}.sql'));
do { if ($result = $db->store_result()) $result->free(); } while ($db->more_results() && $db->next_result());
if ($db->errno) { echo $db->error; exit(1); }
$keys = [];
foreach (${JSON.stringify(emails)} as $email) $keys[] = "'" . hash('sha256', "login:email:$email") . "'";
$db->query('DELETE FROM auth_attempts WHERE attempt_key IN (' . implode(',', $keys) . ')');
`
const CREW_EMAILS = ['nora', 'tim', 'gus', 'cal', 'zed', 'ola'].map((name) => `crew-${name}@example.com`)

let releaseWeekly = null
test.afterEach(() => { releaseWeekly?.(); releaseWeekly = null })
test.beforeEach(async ({}, testInfo) => {
  const number = Number(testInfo.title.match(/Acceptance Test (\d+)/)?.[1])
  if (number <= 6) releaseWeekly = await acquireLock('weekly-seed')
  if (process.env.E2E_BASE_URL) return
  const php = number <= 6 ? loadSeed('weekly_competition', [CASEY.email]) : loadSeed('buddy_rankings', CREW_EMAILS)
  execFileSync('php', ['-r', php], { cwd: REPO_ROOT })
})

const sidebar = (page) => page.getByRole('navigation', { name: 'Primary' })
const phoneMenu = (page) => page.getByRole('navigation', { name: 'Mobile navigation' })
const menuButton = (page) => page.getByRole('button', { name: 'Open navigation menu' })
const drawerOpen = (page) => page.evaluate(() => Boolean(document.querySelector('dialog.app-drawer')?.open))
const highlighted = (nav) => nav.locator('[aria-current="page"], [aria-current="location"]')
const heading = (page) => page.getByRole('heading', { level: 1 })
const scope = (page) => page.getByRole('group', { name: 'Compare with' })
const pressed = (page) => scope(page).locator('[aria-pressed="true"]')
const rankRows = (page) => page.locator('.leaderboard-row').evaluateAll((rows) => rows.map((row) =>
  `${row.dataset.rank} ${row.querySelector('.leaderboard-name').textContent}${row.classList.contains('is-me') ? ' You' : ''} ${row.querySelector('.leaderboard-score').textContent}`))
const unranked = (page) => page.locator('.ranking-unranked li')
const goalTables = (page) => page.locator('.ranking-goal').evaluateAll((goals) => goals.map((goal) =>
  goal.querySelector('.ranking-goal__title').innerText.replace(/\s+/g, ' ') + ': ' +
  [...goal.querySelectorAll('.weekly-row')].map((row) => `#${row.dataset.rank} ${row.querySelector('.weekly-name').textContent}${row.classList.contains('is-me') ? ' You' : ''}`).join(', ')))

async function openRankings(page, board) {
  await sidebar(page).getByRole('link', { name: 'Rankings', exact: true }).click()
  await expect(page).toHaveURL(/#\/leaderboard\/weekly/)
  if (board === 'Strength') await page.getByRole('navigation', { name: 'Leaderboards' }).getByRole('link', { name: 'Strength' }).click()
}
async function chooseBuddies(page) {
  await scope(page).getByRole('button', { name: 'Buddies' }).click()
  await expect(pressed(page)).toHaveText('Buddies')
}
async function sidebarLogOut(page) {
  await sidebar(page).getByRole('button', { name: 'Log out' }).click()
  await expect(page.getByText('You are logged out.')).toBeVisible()
}

acceptanceTests('131-navigation-menu.md', {
  1: async ({ page }) => {
    await step('Setup: Casey logs in on a computer', () => logIn(page, CASEY))
    await step('Step 1: the menu groups the pages, with Dashboard highlighted', async () => {
      await expect(sidebar(page).getByRole('group', { name: 'Training' }).getByRole('link')).toHaveText(['Dashboard', 'Workouts', 'Plans', 'Progress'])
      await expect(sidebar(page).getByRole('group', { name: 'Community' }).getByRole('link')).toHaveText(['Rankings', 'Buddies'])
      await expect(sidebar(page).getByRole('link', { name: /Casey Lin\s*View profile/ })).toBeVisible()
      await expect(sidebar(page).getByRole('button', { name: 'Log out' })).toBeVisible()
      await expect(highlighted(sidebar(page))).toHaveText('Dashboard')
    })
    await step('Step 2: Workouts opens and is the only highlighted row; the menu stays put', async () => {
      const before = await sidebar(page).boundingBox()
      await sidebar(page).getByRole('link', { name: 'Workouts', exact: true }).click()
      await expect(page).toHaveURL(/#\/weekly-plan$/)
      await expect(highlighted(sidebar(page))).toHaveText('Workouts')
      expect(await sidebar(page).boundingBox()).toEqual(before)
    })
    await step('Step 3: Plans, Progress, Rankings and Buddies each open and are highlighted', async () => {
      for (const [name, title] of [['Plans', 'Plan library'], ['Progress', 'Your progress'], ['Rankings', "You're #2"], ['Buddies', 'Workout buddies']]) {
        await sidebar(page).getByRole('link', { name, exact: true }).click()
        await expect(heading(page).first()).toHaveText(title)
        await expect(highlighted(sidebar(page))).toHaveText(name)
      }
    })
    await step('Step 4: no bar of links across the top', async () => {
      await expect(page.locator('header nav a')).toHaveCount(0)
    })
  },

  2: async ({ page }) => {
    await step('Setup: Casey logs in on a computer', () => logIn(page, CASEY))
    await step('Step 1: plan details keep Plans highlighted', async () => {
      await sidebar(page).getByRole('link', { name: 'Plans', exact: true }).click()
      await page.getByRole('link', { name: /View plan/ }).click()
      await expect(heading(page)).toHaveText('Beginner Fundamentals')
      await expect(highlighted(sidebar(page))).toHaveText('Plans')
    })
    await step('Step 2: Back to plan library', async () => {
      await page.getByRole('link', { name: 'Back to plan library' }).click()
      await expect(heading(page)).toHaveText('Plan library')
    })
    await step('Step 3: Workout history keeps Progress highlighted', async () => {
      await sidebar(page).getByRole('link', { name: 'Progress', exact: true }).click()
      await page.locator('main').getByRole('link', { name: /Workout history/ }).click()
      await expect(heading(page)).toHaveText('Workout history')
      await expect(highlighted(sidebar(page))).toHaveText('Progress')
    })
    await step('Step 4: a workout keeps Workouts highlighted', async () => {
      await sidebar(page).getByRole('link', { name: 'Workouts', exact: true }).click()
      // "Resume …" with the seed's unfinished workout; "Start …" if story 124, running at the same time in a quick
      // parallel run, has just finished it (the watch run uses one worker, so this only matters there).
      await page.getByRole('button', { name: /^(Resume|Start)/ }).first().click()
      await expect(page).toHaveURL(/#\/workout\/active(\?.*)?$/)
      await expect(highlighted(sidebar(page))).toHaveText('Workouts')
    })
  },

  3: async ({ page }) => {
    await page.setViewportSize(PHONE)
    await step('Setup: on a phone, the Dashboard has Menu and no menu down the side', async () => {
      await logIn(page, CASEY)
      await expect(menuButton(page)).toBeVisible()
      await expect(sidebar(page)).toBeHidden()
    })
    await step('Step 1: Menu opens the same rows, Dashboard highlighted', async () => {
      await menuButton(page).click()
      await expect(phoneMenu(page).getByRole('link', { name: /^(Dashboard|Workouts|Plans|Progress|Rankings|Buddies)$/ })).toHaveText(['Dashboard', 'Workouts', 'Plans', 'Progress', 'Rankings', 'Buddies'])
      await expect(phoneMenu(page).getByRole('link', { name: /Casey Lin/ })).toBeVisible()
      await expect(highlighted(phoneMenu(page))).toHaveText('Dashboard')
    })
    await step('Step 2: Progress closes the menu and opens Your progress', async () => {
      await phoneMenu(page).getByRole('link', { name: 'Progress', exact: true }).click()
      await expect(heading(page)).toHaveText('Your progress')
      expect(await drawerOpen(page)).toBe(false)
    })
    await step('Step 3: Progress is highlighted', async () => {
      await menuButton(page).click()
      await expect(highlighted(phoneMenu(page))).toHaveText('Progress')
    })
    await step('Step 4: the × closes the menu', async () => {
      await page.getByRole('button', { name: 'Close navigation menu' }).click()
      expect(await drawerOpen(page)).toBe(false)
      await expect(heading(page)).toHaveText('Your progress')
    })
    await step('Step 5: the name opens Profile and closes the menu', async () => {
      await menuButton(page).click()
      await phoneMenu(page).getByRole('link', { name: /Casey Lin/ }).click()
      await expect(page).toHaveURL(/#\/profile$/)
      expect(await drawerOpen(page)).toBe(false)
    })
  },

  4: async ({ page }) => {
    await page.setViewportSize(PHONE)
    await step('Setup: a phone-width window, logged in as Casey', () => logIn(page, CASEY))
    await step('Step 1: Tab to Menu and Enter opens it', async () => {
      await menuButton(page).focus()
      await page.keyboard.press('Enter')
      await expect.poll(() => drawerOpen(page)).toBe(true)
    })
    await step('Step 2: Tab moves through the menu and never to the page behind it', async () => {
      // After the last row, Tab may leave for the browser's own controls (the page reports <body>), never the page.
      for (let i = 0; i < 14; i += 1) {
        await page.keyboard.press('Tab')
        expect(await page.evaluate(() => document.querySelector('dialog.app-drawer').contains(document.activeElement)
          || document.activeElement === document.body)).toBe(true)
      }
    })
    await step('Step 3: Escape closes it and returns to Menu', async () => {
      await page.keyboard.press('Escape')
      await expect.poll(() => drawerOpen(page)).toBe(false)
      await expect(menuButton(page)).toBeFocused()
    })
    await step('Step 4: Enter, Tab to Buddies, Enter opens Workout buddies', async () => {
      await page.keyboard.press('Enter')
      await expect.poll(() => drawerOpen(page)).toBe(true)
      for (let i = 0; i < 12 && await page.evaluate(() => document.activeElement?.textContent.trim()) !== 'Buddies'; i += 1) {
        await page.keyboard.press('Tab')
      }
      await page.keyboard.press('Enter')
      await expect(page.getByRole('heading', { level: 1, name: 'Workout buddies' })).toBeVisible()
      expect(await drawerOpen(page)).toBe(false)
    })
  },

  5: async ({ page }) => {
    await page.setViewportSize(PHONE)
    let exercise
    const exerciseLine = () => page.locator('main').getByText(/^Exercise 2 of 3/).first()
    await step('Setup: Casey logs in on a phone', () => logIn(page, CASEY))
    await step('Step 1: Menu, Workouts shows Resume workout', async () => {
      await menuButton(page).click()
      await phoneMenu(page).getByRole('link', { name: 'Workouts', exact: true }).click()
      await expect(page.getByRole('button', { name: 'Resume workout' })).toBeVisible()
    })
    await step('Step 2: the workout opens on Exercise 2 of 3 with 1 set on the first exercise', async () => {
      await page.getByRole('button', { name: 'Resume workout' }).click()
      await expect(page).toHaveURL(/#\/workout\/active(\?.*)?$/)
      await expect(page.locator('main').getByRole('button', { name: /1 set$/ }).first()).toBeVisible()
      exercise = (await page.locator('main').innerText()).match(/Exercise 2 of 3\s+([^\n]+)/)?.[1]
      expect(exercise).toBeTruthy()
    })
    await step('Step 3: the menu opens over the workout with Workouts highlighted', async () => {
      await menuButton(page).click()
      await expect(highlighted(phoneMenu(page))).toHaveText('Workouts')
    })
    await step('Step 4: Buddies opens', async () => {
      await phoneMenu(page).getByRole('link', { name: 'Buddies', exact: true }).click()
      await expect(page.getByRole('heading', { level: 1, name: 'Workout buddies' })).toBeVisible()
    })
    await step('Step 5: Workouts still shows Resume workout', async () => {
      await menuButton(page).click()
      await phoneMenu(page).getByRole('link', { name: 'Workouts', exact: true }).click()
      await expect(page.getByRole('button', { name: 'Resume workout' })).toBeVisible()
    })
    await step('Step 6: the same workout, same exercise, still 1 set', async () => {
      await page.getByRole('button', { name: 'Resume workout' }).click()
      await expect(exerciseLine()).toBeVisible()
      expect((await page.locator('main').innerText()).match(/Exercise 2 of 3\s+([^\n]+)/)?.[1]).toBe(exercise)
      await expect(page.locator('main').getByRole('button', { name: /1 set$/ })).toHaveCount(1)
      await expect(page.locator('main').getByRole('button', { name: /2 sets$/ })).toHaveCount(0)
    })
  },

  6: async ({ page }) => {
    await step('Setup: Casey logs in on a computer', () => logIn(page, CASEY))
    await step('Step 1: the name opens Profile', async () => {
      await sidebar(page).getByRole('link', { name: /Casey Lin/ }).click()
      await expect(page).toHaveURL(/#\/profile$/)
    })
    await step('Step 2: Log out opens the login page with no menu', async () => {
      await sidebarLogOut(page)
      await expect(sidebar(page)).toHaveCount(0)
    })
    await step('Step 3: Create an account has no menu either', async () => {
      await page.getByRole('link', { name: /Create an account/ }).click()
      await expect(page).toHaveURL(/#\/register$/)
      await expect(sidebar(page)).toHaveCount(0)
    })
  },

  7: async ({ page }) => {
    await step('Setup: Nora logs in', () => logIn(page, crew('nora')))
    await step('Step 1: Strength has Everyone and Buddies, no Friends', async () => {
      await openRankings(page, 'Strength')
      await expect(scope(page).getByRole('button')).toHaveText(['Everyone', 'Buddies'])
      await expect(pressed(page)).toHaveText('Everyone')
      await expect(page.locator('main')).not.toContainText('Friends')
    })
    await step('Step 2: Buddies', async () => {
      await chooseBuddies(page)
      await expect(page).toHaveURL(/#\/leaderboard\?scope=buddies$/)
    })
    await step('Step 3: your Buddies rank', async () => {
      await expect(page.locator('.leaderboard-me__label')).toHaveText('Buddies rank · Overall')
      await expect(page.locator('.leaderboard-me__rank')).toHaveText('#1 of 11 on Overall')
      await expect(page.locator('.leaderboard-me__score')).toHaveText('340.77 DOTS points')
    })
    await step('Step 4: the group header', async () => {
      await expect(page.locator('.ranking-group__name')).toHaveText('Northside Crew')
      await expect(page.locator('.ranking-group__line')).toHaveText('13 members · Group ranks for Overall')
      await expect(page.getByRole('link', { name: 'View group ›' })).toBeVisible()
    })
    await step('Step 5: 11 people, shared ranks, no gap', async () => {
      const rows = await rankRows(page)
      expect(rows).toHaveLength(11)
      expect(rows.slice(0, 5)).toEqual(['1 Nora V. You 340.77', '2 Eli M. 326.34', '3 Ana R. 308.31', '3 Ben R. 308.31', '5 Fay S. 283.07'])
      expect(rows[10]).toBe('11 Lea M. 218.16')
      await expect(page.locator('.leaderboard-gap')).toHaveCount(0)
    })
    await step('Step 6: unranked names, no numbers', async () => {
      await expect(page.locator('.ranking-unranked h3')).toHaveText(/^unranked on overall$/i)
      await expect(unranked(page)).toHaveText(['Cal D.', 'Dev S.'])
    })
    await step('Step 7: View group opens Workout buddies', async () => {
      await page.getByRole('link', { name: 'View group ›' }).click()
      await expect(heading(page)).toHaveText('Workout buddies')
      await expect(page.locator('main')).toContainText('Northside Crew')
    })
  },

  8: async ({ page }) => {
    await step('Setup: Tim logs in', () => logIn(page, crew('tim')))
    await step('Step 1: Eastside Lifters on Overall, Tim unranked', async () => {
      await openRankings(page, 'Strength')
      await chooseBuddies(page)
      await expect(page.locator('.ranking-group__name')).toHaveText('Eastside Lifters')
      expect(await rankRows(page)).toEqual(['1 Raf S. 373.19', '2 Ola F. 308.69', '3 Pia Q. 263.38'])
      await expect(unranked(page)).toHaveText(['Tim W.'])
      await expect(page.locator('.leaderboard-me')).toContainText('Overall needs all three lifts. Log a deadlift to get on it.')
    })
    await step('Step 2: Bench press ranks the group again, Buddies kept', async () => {
      await page.locator('.leaderboard-tabs').getByRole('button', { name: 'Bench press' }).click()
      await expect(pressed(page)).toHaveText('Buddies')
      await expect(page.locator('.leaderboard-me__rank')).toHaveText('#4 of 4 on Bench press')
      await expect(page.locator('.leaderboard-me__score')).toHaveText('64.74 DOTS points')
      expect((await rankRows(page))[3]).toBe('4 Tim W. You 64.74')
    })
    await step('Step 3: Weekly consistency keeps Buddies', async () => {
      await page.getByRole('navigation', { name: 'Leaderboards' }).getByRole('link', { name: 'Weekly consistency' }).click()
      await expect(pressed(page)).toHaveText('Buddies')
      await expect(page.locator('.weekly-standings .ranking-group__name')).toHaveText('Eastside Lifters')
    })
    await step('Step 4: a reload keeps Buddies', async () => {
      await page.reload()
      await expect(pressed(page)).toHaveText('Buddies')
    })
    await step('Step 5: Back returns to Bench press with Buddies', async () => {
      await page.goBack()
      await expect(page).toHaveURL(/#\/leaderboard\?board=bench&scope=buddies$/)
      await expect(pressed(page)).toHaveText('Buddies')
      await expect(page.locator('.leaderboard-me__rank')).toHaveText('#4 of 4 on Bench press')
    })
    await step('Step 6: Everyone shows the public board', async () => {
      await scope(page).getByRole('button', { name: 'Everyone' }).click()
      await expect(pressed(page)).toHaveText('Everyone')
      await expect(page.locator('main')).not.toContainText('Eastside Lifters')
    })
  },

  9: async ({ page }) => {
    await step('Setup: Nora logs in', () => logIn(page, crew('nora')))
    await step('Step 1: Weekly Buddies hero', async () => {
      await openRankings(page)
      await chooseBuddies(page)
      await expect(page.locator('.weekly-hero__eyebrow')).toHaveText(/^buddies · 3-day goal$/i)
      await expect(page.locator('#weekly-hero-title')).toHaveText("You're #1 of 7")
      await expect(page.locator('.weekly-hero__text')).toHaveText('Northside Crew')
      await expect(page.locator('.weekly-hero__days')).toHaveText('3/3 days · 100%')
    })
    await step('Steps 2-3: one table per goal, yours first, then the unranked names', async () => {
      expect(await goalTables(page)).toEqual([
        '3-day goal Your goal: #1 Eli M., #1 Lea M., #1 Nora V. You, #4 Ana R., #4 Ben R., #6 Fay S., #7 Kai L.',
        '4-day goal: #1 Gus H., #2 Hal D., #2 Ira C.',
        '5-day goal: #1 Jon P.',
      ])
      await expect(unranked(page)).toHaveText(['Cal D.', 'Dev S.'])
    })
    await step('Step 4: Gus sees his 4-day goal first', async () => {
      await sidebarLogOut(page)
      await logIn(page, crew('gus'))
      await openRankings(page)
      await chooseBuddies(page)
      await expect(page.locator('.weekly-hero__eyebrow')).toHaveText(/^buddies · 4-day goal$/i)
      await expect(page.locator('#weekly-hero-title')).toHaveText("You're #1 of 3")
      expect((await goalTables(page))[0]).toMatch(/^4-day goal Your goal: #1 Gus H\. You/)
    })
  },

  10: async ({ page }) => {
    const panel = page.locator('.home-rankings')
    await step('Setup: Nora logs in to the Dashboard', () => logIn(page, crew('nora')))
    await step('Step 1: Your rankings with Buddies', async () => {
      await panel.locator('select').selectOption('buddies')
      await expect(panel.locator('a.home-rankings__row').first()).toContainText('#1')
      await expect(panel.locator('a.home-rankings__row').nth(1)).toContainText('340.77 DOTS')
    })
    await step('Step 2: the Weekly row opens the Buddies weekly board', async () => {
      await panel.getByRole('link', { name: /Weekly consistency/ }).click()
      await expect(pressed(page)).toHaveText('Buddies')
      await expect(page.locator('#weekly-hero-title')).toHaveText("You're #1 of 7")
    })
    await step('Step 3: the Strength row opens the Buddies Strength board with the same numbers', async () => {
      await page.goBack()
      await panel.locator('select').selectOption('buddies')
      await panel.getByRole('link', { name: /Overall strength/ }).click()
      await expect(pressed(page)).toHaveText('Buddies')
      await expect(page.locator('.leaderboard-me__rank')).toHaveText('#1 of 11 on Overall')
      await expect(page.locator('.leaderboard-me__score')).toHaveText('340.77 DOTS points')
    })
  },

  11: async ({ page }) => {
    await step('Setup: Zed logs in', () => logIn(page, crew('zed')))
    await step('Step 1: Strength Buddies says there is no group', async () => {
      await openRankings(page, 'Strength')
      await chooseBuddies(page)
      await expect(page.locator('.ranking-no-group h2')).toHaveText("You haven't joined a buddy group yet")
      await expect(page.locator('.ranking-no-group p')).toHaveText('Create a group or enter an invite code to compare standings with your workout buddies.')
      await expect(page.locator('.leaderboard-row')).toHaveCount(0)
      await expect(page.locator('.leaderboard-me')).toContainText('No buddy group')
    })
    await step('Step 2: Weekly says No buddy group yet', async () => {
      await page.getByRole('navigation', { name: 'Leaderboards' }).getByRole('link', { name: 'Weekly consistency' }).click()
      await expect(page.locator('#weekly-hero-title')).toHaveText('No buddy group yet')
      await expect(page.locator('.ranking-no-group h2')).toHaveText("You haven't joined a buddy group yet")
    })
    await step('Step 3: Join or create a group opens Workout buddies', async () => {
      await page.getByRole('link', { name: 'Join or create a group ›' }).click()
      await expect(heading(page)).toHaveText('Workout buddies')
    })
    await step('Step 4: Cal has no rank, and is listed by name only', async () => {
      await sidebarLogOut(page)
      await logIn(page, crew('cal'))
      await openRankings(page, 'Strength')
      await chooseBuddies(page)
      await expect(page.locator('.leaderboard-steps-card h2')).toHaveText('How to get ranked')
      expect(await rankRows(page)).toHaveLength(11)
      await expect(unranked(page)).toHaveText(['Cal D.', 'Dev S.'])
    })
  },

  12: async ({ page }) => {
    await step('Setup: Nora on the Strength Buddies board', async () => {
      await logIn(page, crew('nora'))
      await openRankings(page, 'Strength')
      await chooseBuddies(page)
      await expect(page.locator('.leaderboard-row')).toHaveCount(11)
    })
    await step('Steps 1-2: offline, Bench press shows the error and keeps Buddies', async () => {
      await page.context().setOffline(true)
      await page.locator('.leaderboard-tabs').getByRole('button', { name: 'Bench press' }).click()
      await expect(page.locator('.leaderboard-error')).toContainText("Couldn't load the leaderboard. Check your connection and try again.")
      await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()
      await expect(page.locator('.leaderboard-row')).toHaveCount(0)
      await expect(pressed(page)).toHaveText('Buddies')
    })
    await step('Step 3: back online, Try again shows the Bench press group board', async () => {
      await page.context().setOffline(false)
      await page.getByRole('button', { name: 'Try again' }).click()
      await expect(page.locator('.leaderboard-me__rank')).toHaveText('#1 of 11 on Bench press')
    })
  },

  13: async ({ page, browser, baseURL }) => {
    const phoneContext = await browser.newContext({ baseURL, viewport: PHONE })
    const phone = await phoneContext.newPage()
    const eastside = ['Raf S.', 'Ola F.', 'Pia Q.', 'Tim W.']
    try {
      await step('Setup: Nora on a computer, Ola on a phone', async () => {
        await logIn(page, crew('nora'))
        await logIn(phone, crew('ola'))
      })
      await step('Step 1: the computer shows only Northside Crew', async () => {
        await openRankings(page, 'Strength')
        await chooseBuddies(page)
        await expect(page.locator('.leaderboard-row')).toHaveCount(11)
        for (const name of eastside) await expect(page.locator('main')).not.toContainText(name)
      })
      await step('Step 2: the phone shows only Eastside Lifters, full width, nothing cut off', async () => {
        await menuButton(phone).click()
        await phoneMenu(phone).getByRole('link', { name: 'Rankings', exact: true }).click()
        await phone.getByRole('navigation', { name: 'Leaderboards' }).getByRole('link', { name: 'Strength' }).click()
        await chooseBuddies(phone)
        expect(await rankRows(phone)).toEqual(['1 Raf S. 373.19', '2 Ola F. You 308.69', '3 Pia Q. 263.38'])
        await expect(unranked(phone)).toHaveText(['Tim W.'])
        expect(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
        expect((await scope(phone).boundingBox()).width).toBeGreaterThan(PHONE.width - 120)
        await expect(phone.locator('main')).not.toContainText('Northside')
      })
      await step('Step 3: the phone weekly board keeps Buddies, Eastside only', async () => {
        await phone.getByRole('navigation', { name: 'Leaderboards' }).getByRole('link', { name: 'Weekly consistency' }).click()
        await expect(pressed(phone)).toHaveText('Buddies')
        await expect(phone.locator('.weekly-standings .ranking-group__name')).toHaveText('Eastside Lifters')
        await expect(phone.locator('main')).not.toContainText('Northside')
      })
      await step('Step 4: on the computer, Tab and Enter choose Buddies', async () => {
        await scope(page).getByRole('button', { name: 'Everyone' }).click()
        await page.keyboard.press('Tab')
        await page.keyboard.press('Enter')
        await expect(scope(page).getByRole('button', { name: 'Buddies' })).toBeFocused()
        await expect(pressed(page)).toHaveText('Buddies')
        await expect(page.locator('.ranking-group__name')).toHaveText('Northside Crew')
      })
    } finally {
      await phoneContext.close()
    }
  },
})
