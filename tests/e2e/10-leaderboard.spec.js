import { expect, test } from '@playwright/test'
import { step } from './banner.js'
import { resetLocalCounters } from './global-setup.js'
import { createAccount, logIn, logOut } from './helpers.js'
import { acceptanceTests } from './stories.js'

// Story 10 uses the accounts in database/seeds/leaderboard.sql (#121); the expected scores are Mansur's on #121.
// Login allows 10 attempts per email every 15 minutes, so tests reuse one session per seeded account. Acceptance
// Test 7 takes Casey off the board and always puts Casey back, so the other tests keep their numbers.
const CASEY = { email: 'casey.morgan@example.com', password: 'Casey-Deadlift330!' }
const LUIS = { email: 'luis.ortega@example.com', password: 'Luis-Squat285!' }
const ROBIN = { email: 'robin.hale@example.com', password: 'Robin-Bench135!' }
const NOOR = { email: 'noor.haddad@example.com', password: 'Noor-Bench150!' }
const MAX = { email: 'max.tester@example.com', password: 'Max-Tester600!' }
const sessions = {}

// A full run logs in more than 50 times from one address, so local runs reset this machine's counters again here.
test.beforeAll(() => {
  if (!process.env.E2E_BASE_URL) resetLocalCounters()
})

const OVERALL_TOP = [
  ['1', 'Cy P.', '319.16'], ['2', 'Ana C.', '243.63'], ['2', 'Ben O.', '243.63'], ['4', 'Dee S.', '229.03'],
  ['5', 'Wes Z.', '197.65'], ['6', 'Nova L.', '188.85'], ['7', 'Grant G.', '170.89'], ['8', 'Milo Q.', '167.64'],
  ['9', 'Olive O.', '167.09'], ['10', 'Jude N.', '165.93'], ['10', 'Quinn R.', '165.93'],
]
const PRIVACY = 'Others see your first name, last initial and scores. Never your body weight, gender, scoring table or lifts in lb.'

const main = (page) => page.locator('main')
const card = (page) => main(page).locator('.leaderboard-me')
const rows = (page) => main(page).locator('.leaderboard-list > li')
const boardRows = (page) => main(page).locator('.leaderboard-row')
const tab = (page, label) => main(page).getByRole('group', { name: 'Board' }).getByRole('button', { name: label, exact: true })
const steps = (page) => card(page).locator('.leaderboard-step')
const fitsWidth = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)

async function logInAs(page, account) {
  try {
    await logIn(page, account)
  } catch (error) {
    if (await page.getByText('Invalid email or password.').isVisible()) {
      throw new Error(`${account.email} is not in this database. Load database/seeds/leaderboard.sql (see database/seeds/README.md).`)
    }
    throw error
  }
  sessions[account.email] = await page.context().cookies()
}

// Signs in with the account's saved session when it still works, else logs in through the login page.
async function as(page, account) {
  if (sessions[account.email]) {
    await page.context().addCookies(sessions[account.email])
    if ((await page.request.get('api/session.php')).ok()) {
      await page.goto('#/dashboard')
      await expect(page).toHaveURL(/#\/dashboard$/)
      return
    }
  }
  await logInAs(page, account)
}

// Acceptance Test 1's setup: a new account logs in, saves Personal details, finishes setup and chooses a plan.
// (helpers.js logIn() doesn't expect Personal details as the first step yet, so this logs in itself.)
async function newAccount(page, name, weight, gender) {
  const account = await createAccount(page, name)
  await page.goto('#/login')
  await page.getByLabel('Email').fill(account.email)
  await page.getByLabel('Password', { exact: true }).fill(account.password)
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(page).toHaveURL(/#\/personal-details$/)
  await page.getByLabel('Body weight (lb)').fill(weight)
  await page.getByRole('button', { name: gender, exact: true }).click()
  await page.getByRole('button', { name: 'Save and continue' }).click()
  for (const [heading, choice, save] of [
    ['Choose your training goal', /^Strength/, 'Save goal'],
    ['How experienced are you?', /^Beginner/, 'Save and continue'],
    ['What equipment can you use?', 'Full gym access', 'Save and continue'],
  ]) {
    await expect(page.getByRole('heading', { name: heading })).toBeVisible()
    await expect(page.locator('.ob-step')).toHaveAttribute('aria-busy', 'false')
    await page.getByRole('button', { name: choice }).click()
    await page.getByRole('button', { name: save }).click()
  }
  await expect(page.getByRole('heading', { name: 'Choose your workout plan' })).toBeVisible()
  const plan = page.locator('.ob-plan').filter({ has: page.getByText('Beginner Fundamentals', { exact: true }) })
  await plan.getByRole('button', { name: 'Choose plan' }).click()
  await expect(page).toHaveURL(/#\/dashboard$/)
  return account
}

// "Select Leaderboard": the top navigation on a computer, the menu (three lines) on a phone.
async function openLeaderboard(page) {
  const menu = page.getByRole('button', { name: 'Open navigation menu' })
  const topLink = page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Leaderboard' })
  await menu.or(topLink).filter({ visible: true }).waitFor()
  if (await menu.isVisible()) {
    await menu.click()
    await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'Leaderboard' }).click()
  } else {
    await topLink.click()
  }
  await expect(page).toHaveURL(/#\/leaderboard$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Leaderboard' })).toBeVisible()
  await expect(main(page)).toHaveAttribute('aria-busy', 'false')
}

// The board's rows as [rank, name, score], with "· · ·" for the gap row.
async function boardText(page) {
  return rows(page).evaluateAll((items) => items.map((item) => (item.classList.contains('leaderboard-gap')
    ? '· · ·'
    : [item.dataset.rank, item.querySelector('.leaderboard-name').textContent, item.querySelector('.leaderboard-score').textContent])))
}

async function expectSteps(page, expected) {
  await expect(steps(page).locator('h3')).toHaveText(expected.map(([title, done]) => `${title} (${done ? 'done' : 'not done'})`))
}

async function expectRanked(page, line, score) {
  await expect(card(page).locator('.leaderboard-me__rank')).toHaveText(line)
  await expect(card(page).locator('.leaderboard-me__score strong')).toHaveText(score)
}

async function expectMyRow(page, rank, name, score) {
  const mine = main(page).locator('.leaderboard-row.is-me')
  await expect(mine).toHaveCount(1)
  await expect(mine).toHaveAttribute('data-rank', rank)
  await expect(mine.locator('.leaderboard-name')).toHaveText(name)
  await expect(mine.locator('.leaderboard-you')).toHaveText('You')
  await expect(mine.locator('.leaderboard-score')).toHaveText(score)
}

const count = (page) => main(page).locator('.leaderboard-board__count')

acceptanceTests('10-leaderboard.md', {
  1: async ({ page }) => {
    await step('Setup: create Lead Tester, save 180 lb and Man, finish setup', () => newAccount(page, 'Lead Tester', '180', 'Man'))
    await step('Step 1: Leaderboard opens with Overall selected', async () => {
      await openLeaderboard(page)
      await expect(page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Leaderboard' })).toHaveAttribute('aria-current', 'page')
      await expect(tab(page, 'Overall')).toHaveAttribute('aria-pressed', 'true')
      for (const label of ['Bench press', 'Back squat', 'Deadlift']) await expect(tab(page, label)).toHaveAttribute('aria-pressed', 'false')
    })
    await step('Step 2: How to get ranked lists the four steps', async () => {
      await expect(card(page).getByRole('heading', { name: 'How to get ranked' })).toBeVisible()
      await expectSteps(page, [['Join the leaderboard', false], ['Add your body weight and gender', true], ['Finish 3 workouts', false], ['Log a bench press, back squat or deadlift', false]])
      await expect(steps(page).nth(0)).toContainText(PRIVACY)
      await expect(steps(page).nth(0).getByRole('button', { name: 'Join the leaderboard' })).toBeEnabled()
      await expect(steps(page).nth(1)).toContainText('Saved in Personal details · 180 lb')
      await expect(steps(page).nth(2)).toContainText('0 of 3 workouts finished')
    })
    await step('Step 3: the community board, with no row marked You', async () => {
      await expect(count(page)).toHaveText('51 people ranked on Overall')
      expect((await boardText(page)).slice(0, 4)).toEqual(OVERALL_TOP.slice(0, 4))
      await expect(main(page).locator('.leaderboard-row.is-me')).toHaveCount(0)
    })
  },

  2: async ({ page }) => {
    let account
    await step('Setup: create a new account and open Leaderboard', async () => {
      account = await newAccount(page, 'Lead Joiner', '180', 'Man')
      await openLeaderboard(page)
    })
    await step('Step 1: Join ticks the first step only', async () => {
      await steps(page).nth(0).getByRole('button', { name: 'Join the leaderboard' }).click()
      await expectSteps(page, [['Join the leaderboard', true], ['Add your body weight and gender', true], ['Finish 3 workouts', false], ['Log a bench press, back squat or deadlift', false]])
      await expect(steps(page).nth(0)).toContainText("You've joined")
      await expect(count(page)).toHaveText('51 people ranked on Overall')
      await expect(main(page).locator('.leaderboard-row.is-me')).toHaveCount(0)
    })
    await step('Step 2: still joined after logging out and back in', async () => {
      await logOut(page)
      await logIn(page, account)
      await openLeaderboard(page)
      await expect(steps(page).nth(0)).toContainText("You've joined")
    })
    await step('Step 3: Leave undoes it', async () => {
      await steps(page).nth(0).getByRole('button', { name: 'Leave', exact: true }).click()
      await expect(main(page).getByRole('status')).toHaveText("You've left the leaderboard. Your workouts are kept.")
      await expect(steps(page).nth(0).locator('h3')).toHaveText('Join the leaderboard (not done)')
      await expect(steps(page).nth(0).getByRole('button', { name: 'Join the leaderboard' })).toBeVisible()
    })
  },

  3: async ({ page }) => {
    await step('Setup: create an account with 160 lb and Prefer not to say', async () => {
      await newAccount(page, 'Lead Chooser', '160', 'Prefer not to say')
      await openLeaderboard(page)
    })
    const group = () => steps(page).nth(0).getByRole('group', { name: 'Scoring table' })
    const join = () => steps(page).nth(0).getByRole('button', { name: 'Join the leaderboard' })
    await step('Step 1: a scoring table must be chosen before joining', async () => {
      await expect(group()).toContainText('DOTS has one table for men and one for women. Choose which one scores your lifts. Nobody else sees this choice.')
      await expect(group().getByLabel("Men's table", { exact: true })).not.toBeChecked()
      await expect(group().getByLabel("Women's table", { exact: true })).not.toBeChecked()
      await expect(join()).toBeDisabled()
      await expect(steps(page).nth(0)).toContainText('Choose a scoring table.')
    })
    await step("Step 2: Women's table, then Join", async () => {
      await group().getByLabel("Women's table", { exact: true }).check()
      await join().click()
      await expect(steps(page).nth(0).locator('h3')).toHaveText('Join the leaderboard (done)')
      await expect(steps(page).nth(0)).toContainText("You've joined")
      await expect(steps(page).nth(0)).toContainText("Scored with the women's table")
    })
    await step("Step 3: Change to the men's table", async () => {
      await steps(page).nth(0).getByRole('button', { name: 'Change' }).click()
      await group().getByLabel("Men's table", { exact: true }).check()
      await steps(page).nth(0).getByRole('button', { name: 'Save' }).click()
      await expect(steps(page).nth(0)).toContainText("Scored with the men's table")
    })
    await step('Step 4: leaving keeps the choice, and joining again uses it', async () => {
      await steps(page).nth(0).getByRole('button', { name: 'Leave', exact: true }).click()
      await expect(join()).toBeEnabled()
      await expect(group()).toHaveCount(0)
      await join().click()
      await expect(steps(page).nth(0)).toContainText("Scored with the men's table")
    })
  },

  4: async ({ page }) => {
    await step('Setup: log in as Casey', () => as(page, CASEY))
    await step('Step 1: Casey’s card', async () => {
      await openLeaderboard(page)
      await expect(card(page).getByRole('heading', { name: 'Casey Morgan' })).toBeVisible()
      await expectRanked(page, '#15 of 51 on Overall', '156.29')
      await expect(card(page)).toContainText('DOTS points')
      await expect(card(page)).toContainText('Your best estimated 1RMs: Bench press 140 lb · Back squat 190 lb · Deadlift 205 lb')
      await expect(card(page).getByRole('button', { name: 'Leave the leaderboard' })).toBeVisible()
    })
    await step('Steps 2 and 3: the top 11 with the tie at 10, the gap, then Casey ±1', async () => {
      await expect(count(page)).toHaveText('51 people ranked on Overall')
      expect(await boardText(page)).toEqual([...OVERALL_TOP, '· · ·', ['14', 'Luis O.', '159.90'], ['15', 'Casey M.', '156.29'], ['16', 'Dina D.', '155.52']])
      await expectMyRow(page, '15', 'Casey M.', '156.29')
    })
    await step('Step 4: rows show only rank, name and score', async () => {
      await expect(main(page).locator('.leaderboard-list')).not.toContainText(/\d ?lb|kg|@/)
    })
  },

  5: async ({ page }) => {
    await step('Setup: log in as Casey and open Leaderboard', async () => {
      await as(page, CASEY)
      await openLeaderboard(page)
    })
    await step('Step 1: Bench press', async () => {
      await tab(page, 'Bench press').click()
      await expect(page).toHaveURL(/#\/leaderboard\?board=bench$/)
      await expectRanked(page, '#16 of 54 on Bench press', '40.90')
      await expect(count(page)).toHaveText('54 people ranked on Bench press')
      expect((await boardText(page)).slice(0, 7)).toEqual([
        ['1', 'Cy P.', '72.54'], ['2', 'Eli F.', '70.11'], ['3', 'Noor H.', '65.32'], ['4', 'Ana C.', '61.35'],
        ['4', 'Ben O.', '61.35'], ['4', 'Rex T.', '61.35'], ['7', 'Dee S.', '60.76'],
      ])
    })
    await step('Step 2: Back squat', async () => {
      await tab(page, 'Back squat').click()
      await expectRanked(page, '#19 of 51 on Back squat', '55.50')
      const text = await boardText(page)
      expect(text[0]).toEqual(['1', 'Cy P.', '130.56'])
      expect(text.slice(-3)).toEqual([['18', 'Zoe D.', '55.78'], ['19', 'Casey M.', '55.50'], ['20', 'Jude N.', '54.86']])
    })
    await step('Step 3: Deadlift', async () => {
      await tab(page, 'Deadlift').click()
      await expectRanked(page, '#16 of 51 on Deadlift', '59.89')
      const text = await boardText(page)
      expect(text[0]).toEqual(['1', 'Cy P.', '116.06'])
      expect(text.slice(-3)).toEqual([['15', 'Milo Q.', '60.96'], ['16', 'Casey M.', '59.89'], ['17', 'Bella B.', '59.09']])
    })
    await step('Step 4: a refresh keeps Deadlift', async () => {
      await page.reload()
      await expect(tab(page, 'Deadlift')).toHaveAttribute('aria-pressed', 'true')
      await expectRanked(page, '#16 of 51 on Deadlift', '59.89')
    })
  },

  6: async ({ page }) => {
    await step('Step 1: Robin has only 2 of 3 workouts', async () => {
      await as(page, ROBIN)
      await openLeaderboard(page)
      await expectSteps(page, [['Join the leaderboard', true], ['Add your body weight and gender', true], ['Finish 3 workouts', false], ['Log a bench press, back squat or deadlift', true]])
      await expect(steps(page).nth(2)).toContainText('2 of 3 workouts finished')
      await expect(main(page).locator('.leaderboard-row.is-me')).toHaveCount(0)
    })
    await step('Step 2: Noor is on Bench press only', async () => {
      await logOut(page)
      await as(page, NOOR)
      await openLeaderboard(page)
      await expect(card(page)).toContainText('Overall needs all three lifts. Log a back squat and a deadlift to get on it.')
      await expect(main(page).locator('.leaderboard-row.is-me')).toHaveCount(0)
      await tab(page, 'Bench press').click()
      await expectRanked(page, '#3 of 54 on Bench press', '65.32')
      await expectMyRow(page, '3', 'Noor H.', '65.32')
    })
    await step('Step 3: Max is a test account and on no board', async () => {
      await logOut(page)
      await as(page, MAX)
      await openLeaderboard(page)
      await expect(card(page)).toHaveText("Test accounts aren't shown on the leaderboard.")
      await expect(main(page).getByRole('button', { name: 'Join the leaderboard' })).toHaveCount(0)
      await expect(count(page)).toHaveText('51 people ranked on Overall')
      await expect(boardRows(page).filter({ hasText: 'Max T.' })).toHaveCount(0)
      await tab(page, 'Bench press').click()
      await expect(count(page)).toHaveText('54 people ranked on Bench press')
      await expect(boardRows(page).filter({ hasText: 'Max T.' })).toHaveCount(0)
    })
  },

  7: async ({ page, browser }) => {
    const luisContext = await browser.newContext({ baseURL: test.info().project.use.baseURL, viewport: page.viewportSize() })
    const luis = await luisContext.newPage()
    try {
      await step('Setup: Casey is #15 of 51, and Luis is logged in in a second window', async () => {
        await as(page, CASEY)
        await openLeaderboard(page)
        await expectRanked(page, '#15 of 51 on Overall', '156.29')
        await as(luis, LUIS)
      })
      await step('Step 1: Casey leaves', async () => {
        await card(page).getByRole('button', { name: 'Leave the leaderboard' }).click()
        await expect(main(page).getByRole('status')).toHaveText("You've left the leaderboard. Your workouts are kept.")
        await expectSteps(page, [['Join the leaderboard', false], ['Add your body weight and gender', true], ['Finish 3 workouts', true], ['Log a bench press, back squat or deadlift', true]])
        await expect(main(page).locator('.leaderboard-row.is-me')).toHaveCount(0)
        await expect(count(page)).toHaveText('50 people ranked on Overall')
      })
      await step('Step 2: Luis sees the board without Casey', async () => {
        await openLeaderboard(luis)
        await expectRanked(luis, '#14 of 50 on Overall', '159.90')
        expect((await boardText(luis)).slice(-4)).toEqual(['· · ·', ['13', 'Rosa S.', '160.21'], ['14', 'Luis O.', '159.90'], ['15', 'Dina D.', '155.52']])
        await expectMyRow(luis, '14', 'Luis O.', '159.90')
        await expect(boardRows(luis).filter({ hasText: 'Casey M.' })).toHaveCount(0)
      })
      await step('Step 3: Casey joins again', async () => {
        await steps(page).nth(0).getByRole('button', { name: 'Join the leaderboard' }).click()
        await expectRanked(page, '#15 of 51 on Overall', '156.29')
      })
    } finally {
      // Whatever happened above, put Casey back on the board for the other tests.
      await page.request.post('api/leaderboard.php', { data: { join: true } })
      await luisContext.close()
    }
  },

  8: async ({ page }) => {
    await step('Step 1: the Leaderboard address opens the Login page when logged out', async () => {
      await page.goto('#/leaderboard')
      await expect(page).toHaveURL(/#\/login$/)
      await expect(page.locator('.leaderboard-list')).toHaveCount(0)
    })
    // The story asks for an iPhone SE (375 × 667). The mobile project is 375 wide already; desktop resizes.
    if (page.viewportSize().width > 375) await page.setViewportSize({ width: 375, height: 667 })
    const pinned = () => main(page).locator('.leaderboard-pinned')
    await step('Step 2: on a phone, two rows of tabs, no sideways scrolling, and Casey’s row pinned', async () => {
      await as(page, CASEY)
      await openLeaderboard(page)
      await expectRanked(page, '#15 of 51 on Overall', '156.29')
      const tops = await main(page).locator('.leaderboard-tabs button').evaluateAll((buttons) => buttons.map((b) => Math.round(b.getBoundingClientRect().top)))
      expect(tops[0]).toBe(tops[1])
      expect(tops[2]).toBe(tops[3])
      expect(tops[2]).toBeGreaterThan(tops[0])
      expect(await fitsWidth(page)).toBe(true)
      await expect(pinned()).toBeVisible()
      await expect(pinned()).toHaveText(/^15Casey M\.You156\.29$/)
    })
    await step('Step 3: the pinned bar goes away once Casey’s own row is on screen', async () => {
      await main(page).locator('.leaderboard-row.is-me').scrollIntoViewIfNeeded()
      await expect(pinned()).toBeHidden()
    })
    await step('Step 4: Light mode from Profile, then Dark again', async () => {
      const themeButton = (label) => page.getByRole('group', { name: 'Color theme' }).getByRole('button', { name: label })
      await page.goto('#/profile')
      await themeButton('Light').click()
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
      await openLeaderboard(page)
      await expectRanked(page, '#15 of 51 on Overall', '156.29')
      await page.goto('#/profile')
      await themeButton('Dark').click()
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    })
    await step('Step 5: a failed request shows the error and Try again, with no board', async () => {
      await page.setViewportSize({ width: 1280, height: 900 })
      await page.goto('#/dashboard')
      await page.route('**/api/leaderboard.php**', (route) => route.abort())
      await openLeaderboard(page)
      await expect(main(page).getByRole('alert')).toHaveText(/Couldn't load the leaderboard\. Check your connection and try again\./)
      await expect(main(page).getByRole('button', { name: 'Try again' })).toBeVisible()
      await expect(main(page).locator('.leaderboard-list')).toHaveCount(0)
      await expect(main(page)).not.toContainText('How to get ranked')
    })
    await step('Step 6: Try again shows the board', async () => {
      await page.unroute('**/api/leaderboard.php**')
      await main(page).getByRole('button', { name: 'Try again' }).click()
      await expect(main(page).getByRole('alert')).toHaveCount(0)
      await expectRanked(page, '#15 of 51 on Overall', '156.29')
    })
  },
}, { mobile: [8] })
