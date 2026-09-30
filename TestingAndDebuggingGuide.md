# Testing and Debugging Guide

How to test GymRank locally, on aptitude (test), and on cattle (production), write task tests, record failures, read logs, and verify a fix.

Every command and quoted output below was run on 2026-09-21 against `dev` at `b15cebe`: macOS, Node 24.11.1,
npm 11.6.2, PHP 8.5.10, MySQL 26.7.0 (Homebrew), Chrome. The aptitude and cattle checks were run the same day over
the UB VPN. Anything that needs SSH access or would break a shared server is marked **[VERIFY]**. Run it once, then
replace the marker with the real result. Error messages are quoted from Chrome. Safari and Firefox word them
differently.

Never put real credentials in this file, in commits, or in task comments. Use `UBIT_USERNAME` and
`<PERSON_NUMBER>` as placeholders.

Automated checks: `npm test` runs the auth validation unit tests, and `npm run test:e2e:watch` runs the Playwright
acceptance tests in a visible browser (`npm run test:e2e` for a quick headless run), as described in
[section 8](#8-automated-acceptance-tests-playwright). There is no linter or CI. Every
other test is a manual task test or acceptance test on the scrum board. Don't report a suite as passing unless you
ran it.

## Contents

1. [Local testing](#1-local-testing)
2. [Testing on aptitude and cattle (production)](#2-testing-on-aptitude-and-cattle-production)
3. [Common failures](#3-common-failures)
4. [Reading logs](#4-reading-logs)
5. [Writing task tests](#5-writing-task-tests)
6. [Recording a failure](#6-recording-a-failure)
7. [Verifying a fix](#7-verifying-a-fix)
8. [Automated acceptance tests (Playwright)](#8-automated-acceptance-tests-playwright)

## 1. Local testing

### Prerequisites

| Tool | Version | Check |
| --- | --- | --- |
| Node | `^20.19.0` or `>=22.12.0` (required by Vite 8) | `node -v` |
| PHP | with the `mysqli` extension | `php -m \| grep mysqli` prints `mysqli` |
| MySQL | any local server | `mysql -u root -e "SELECT 1"` |

On a Mac, `brew install php mysql` installs PHP and MySQL. Then `brew services start mysql` starts MySQL. It
takes a few seconds before `mysql -u root -e "SELECT 1"` works.

### Set up (first time)

Run everything from the repo root.

```bash
npm ci --legacy-peer-deps
cp api/config.example.php api/config.php
```

- Plain `npm ci` or `npm install` fails with `npm error code ERESOLVE`, because `@vitejs/plugin-react@4.7.0` does
  not list Vite 8 as a supported peer. `--legacy-peer-deps` installs exactly what `package-lock.json` specifies
  and changes no tracked files.
- Fill in `api/config.php` with your credentials. Create the local database, table, sample rows, and MySQL user
  with the SQL in [README.md → Optional: local MySQL](README.md#optional-local-mysql-for-testing-the-real-query).
  The sample rows are the test data the checks below expect.

### Run it

Use two terminals, both in the repo root:

```bash
php -S localhost:8000 -t api     # terminal 1: PHP API
npm run dev                      # terminal 2: Vite
```

Open `http://localhost:5173/CSE442/2026-Fall/cse-442y/`. (`http://localhost:5173/` redirects there.) Vite forwards
`/CSE442/2026-Fall/cse-442y/api/*` to the PHP server on port 8000.

### Checks

| Check | Command or action | Pass |
| --- | --- | --- |
| PHP syntax | `php -l api/workouts.php` | `No syntax errors detected in api/workouts.php` |
| PHP syntax | `php -l api/config.example.php` | `No syntax errors detected in api/config.example.php` |
| API directly | `curl -s http://localhost:8000/workouts.php` | `[{"id":"1","exercise":"Squat","reps":"5","weight":"225"},{"id":"2","exercise":"Bench Press","reps":"8","weight":"135"},{"id":"3","exercise":"Deadlift","reps":"3","weight":"315"}]` |
| API through Vite | `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173/CSE442/2026-Fall/cse-442y/api/workouts.php` | `200` |
| Page | Open the URL above in Chrome | Heading "GymRank" and three cards: "Squat — 5 reps @ 225 lbs", "Bench Press — 8 reps @ 135 lbs", "Deadlift — 3 reps @ 315 lbs" |
| Build | `npm run build` | Ends with `✓ built in …ms` and creates `dist/index.html` |
| Built app | `npm run preview` (PHP still running), then open `http://localhost:4173/CSE442/2026-Fall/cse-442y/` | Same page as above |

Notes:

- The API returns every value as a string (`"reps":"5"`), not a number. Expect strings when writing tests
  against the JSON.
- `npm run build` prints deprecation warnings (`esbuild` option, `optimizeDeps.rollupOptions`,
  `@vitejs/plugin-react-oxc`). They come from the React plugin and do not fail the build.
- In `npm run dev`, the page requests `workouts.php` **twice** on every load. React's `StrictMode` in
  `src/main.jsx` runs effects twice in development only. The built app (`npm run preview` or the server) requests
  it once. Two identical lines in the PHP terminal per reload is normal in dev.
- `npm run preview` serves the exact files that get deployed and forwards `/api` to port 8000 like the dev
  server. Use it to test a build before copying it to aptitude.

## 2. Testing on aptitude and cattle (production)

| Server | Role | Which tests run here |
| --- | --- | --- |
| `aptitude.cse.buffalo.edu` | Test: updated and used within a sprint | **Task tests** that need a server. Write their URLs against aptitude |
| `cattle.cse.buffalo.edu` | Production: holds the latest release, updated only at the end of a sprint | **Acceptance tests** on user stories. Write their URLs against cattle |

This split comes from the course instructor's server setup email. On each server the team's shared folder is
`/data/web/CSE442/2026-Fall/cse-442y/` (the leading slash is required), served at `/CSE442/2026-Fall/cse-442y/`.
Deploy with [ServerOperationsGuide.md → Deployment](ServerOperationsGuide.md#2-deployment). Both servers are
behind UB's firewall, so you must be on the UB VPN or campus network, even just to view pages.

The checks below work on either server. Run them on aptitude after every deploy during a sprint, and on cattle
after the end-of-sprint release and before a sprint demo.

Set `SITE` to the server you are testing, then run the checks:

```bash
SITE=https://aptitude.cse.buffalo.edu/CSE442/2026-Fall/cse-442y   # test
SITE=https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y     # production
```

| Check | Command or action | Pass |
| --- | --- | --- |
| Site responds | `curl -s -o /dev/null -w "%{http_code}\n" "$SITE/"` | `200` |
| API responds | `curl -s "$SITE/api/workouts.php"` | `[{"id":"1","exercise":"Squat","reps":"5","weight":"225"},{"id":"2","exercise":"Bench Press","reps":"8","weight":"135"},{"id":"3","exercise":"Deadlift","reps":"3","weight":"315"}]` while that server's table still holds the sample rows. If the data has changed, compare with the `workouts` table in that server's phpMyAdmin instead |
| Page | Open the site URL in Chrome | Heading "GymRank" and the three cards: "Squat — 5 reps @ 225 lbs", "Bench Press — 8 reps @ 135 lbs", "Deadlift — 3 reps @ 315 lbs" |
| Desktop layout | Chrome at 1440×900 | The three cards side by side in one row |
| Mobile layout | Chrome DevTools device toolbar (`Cmd+Shift+M` on Mac, `Ctrl+Shift+M` on Windows) at 375×812 | The three cards stacked in a single column, no horizontal scroll |
| Wrong endpoint | `curl -s -o /dev/null -w "%{http_code}\n" "$SITE/api/doesnotexist.php"` | `404` (Apache's "Not Found" page) |

Every check above passed on both aptitude and cattle on 2026-09-21. The CSS in `src/index.css` switches to one
column at 480px and below. On the servers, the page requests `workouts.php` once per load, not twice as in
`npm run dev`.

**Which build is deployed?** Vite puts a content hash in each asset file name, so compare the server's asset
names with a local `npm run build` of the branch you expect:

```bash
curl -s "$SITE/" | grep -o 'assets/[^"]*'
ls dist/assets
```

If the names match, the server has that build. On 2026-09-21, aptitude, cattle, and a local build of `dev` at
`b15cebe` all printed `index-DM-Gnhfr.js` and `index-pKauxic3.css`. Run this on cattle before a sprint demo to
confirm production has the release you expect.

- **Not on the VPN:** `curl -m 10 "$SITE/"` prints nothing, and exits with code `28` (timed out) after 10 seconds.
  Connect to the VPN first.
- **Database errors on the servers [VERIFY]:** locally, a database failure returns status `200` with a PHP error
  page (see [Common failures](#3-common-failures)). The servers' PHP error settings may differ, so they could
  return status `500` or an empty body instead. Record what you see the first time it happens.
- Use phpMyAdmin to check the data itself:
  [ServerOperationsGuide.md → Check the database](ServerOperationsGuide.md#check-the-database-phpmyadmin).
  cattle has its own at `https://cattle.cse.buffalo.edu/phpmyadmin/`.

## 3. Common failures

All of these were reproduced locally. The page message is what `src/WorkoutList.jsx` shows as
`Error loading workouts: <message>`.

| Cause | Page shows | Network tab (`workouts.php`) | PHP terminal | Fix |
| --- | --- | --- | --- | --- |
| PHP server not running | `Error loading workouts: Failed to execute 'json' on 'Response': Unexpected end of JSON input` | Status `502`, empty body | Nothing (not running). The Vite terminal shows `[vite] http proxy error: /workouts.php` and `ECONNREFUSED` | Start `php -S localhost:8000 -t api` from the repo root |
| Wrong DB username or password in `api/config.php` | `Error loading workouts: Unexpected token '<', "<br /> <b>"... is not valid JSON` | Status `200`, HTML body starting `<br />` and `<b>Fatal error</b>` | `PHP Fatal error:  Uncaught mysqli_sql_exception: Access denied for user 'UBIT_USERNAME'@'localhost' (using password: YES)` | Fix `api/config.php`, or create the matching MySQL user (README) |
| MySQL not running | Same message as the row above | Status `200`, HTML body | `PHP Fatal error:  Uncaught mysqli_sql_exception: No such file or directory` | `brew services start mysql` |
| `workouts` table is empty | `No workouts found` | Status `200`, body `[]` | `[200]: GET /workouts.php` | Insert rows (README) |
| Wrong endpoint name | (only if the code requests it) | Status `404`, HTML "404 Not Found" page | `[404]: GET /doesnotexist.php - No such file or directory` | Fix the file name or path |
| `npm ci` / `npm install` fails | n/a | n/a | n/a | Use `npm ci --legacy-peer-deps` ([Set up](#set-up-first-time)) |

Two things to know:

- **A `200` status does not mean the API worked.** Since PHP 8.1, mysqli reports errors as exceptions by default
  ([PHP manual](https://www.php.net/manual/en/mysqli-driver.report-mode.php)), so `new mysqli(...)` throws when it
  cannot connect (tested on PHP 8.5). The script dies with a fatal error, so its
  `{"error":"Database connection failed"}` branch never runs, and the status stays `200`. Always read the response
  body.
- **Wrong credentials and MySQL being down show the same page message.** Only the PHP terminal tells them apart:
  `Access denied for user` means credentials, and `No such file or directory` means MySQL isn't running.

## 4. Reading logs

Work through these in order and stop when you find the cause.

1. **The page.** Read the exact message and match it in [Common failures](#3-common-failures).
2. **Chrome DevTools** (`Cmd+Option+I` on Mac, `F12` on Windows):
   - **Network** tab: reload the page, filter by **Fetch/XHR**, and click `workouts.php`. **Headers** shows the
     status code and request URL, and **Response** shows the body. A healthy response is a JSON array. An HTML body
     means PHP crashed.
   - **Console** tab: red errors from the frontend code.
3. **PHP terminal** (the one running `php -S`). One line per request, like `[200]: GET /workouts.php`.
   PHP fatal errors, including the exact MySQL error, print here as `PHP Fatal error: …`.
4. **Vite terminal** (the one running `npm run dev`). JSX compile errors and `http proxy error` lines when it
   cannot reach the PHP server.
5. **MySQL error log** (Homebrew). Use it when MySQL won't start or connections are refused:

   ```bash
   tail -n 20 "/opt/homebrew/var/mysql/$(hostname).err"
   ```

On aptitude or cattle, use the Network tab and phpMyAdmin: [ServerOperationsGuide.md → Logs](ServerOperationsGuide.md#4-logs).
Where the server writes PHP errors is not known yet **[VERIFY]**.

## 5. Writing task tests

Task tests go in the task card's description, before the card moves to In Progress. They are run by developers,
so technical detail is fine. The course rules are in the
[Development Standards](https://webdev.cse.buffalo.edu/cse404/guidelines/) (Tasks → description).

Every test needs:

- **A title** saying what must work: `Test N: <what must be true>`.
- **Numbered steps** with every input spelled out: exact URL, command, file, field value, and screen size.
- **An `Expected outcome:` paragraph** with exact results: quoted text, status codes, and command output. Not
  "works" or "loads correctly".
- **Edge cases**, not just the working path: empty data, a stopped server, wrong input. Use
  [Common failures](#3-common-failures) for exact messages.
- For documentation tasks, the phrase **"Using only the doc's instructions"**, so the tester can't fill gaps from
  memory.
- If a test needs an input file, its path in the repo. If it uses unit tests, the test file names.
- If the test needs a deployed server, use **aptitude** URLs. cattle is for acceptance tests
  (see [Testing on aptitude and cattle](#2-testing-on-aptitude-and-cattle-production)).

Use this template, with a blank line between tests:

```text
Test N: <what must be true>
1. <exact action, with every input>
2. <exact action>

Expected outcome: <exact text, status code, or output for each step this task implemented>
```

Example, testing the empty state of the workout list:

```text
Test 3: Page shows a message when there are no workouts
1. Start both servers as in TestingAndDebuggingGuide.md → Local testing.
2. Run: mysql -u root -e "DELETE FROM cse442_2026_fall_team_y_db.workouts;"
3. Open http://localhost:5173/CSE442/2026-Fall/cse-442y/ in Chrome.
4. Open DevTools → Network and reload the page.
5. Re-add the sample rows with the INSERT statement in README.md.

Expected outcome: step 3 shows the heading "GymRank" and the text "No workouts found", and no workout cards.
Step 4 shows workouts.php with status 200 and response body []. After step 5, reloading shows the three sample cards.
```

Acceptance tests on **user stories** are different. They are run by an untrained user against **cattle**
(`https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/`), so they use no technical terms or DevTools, just
what the user types, clicks, and sees.

## 6. Recording a failure

When a task test fails, follow [GitAndScrumDocumentation.md → 5](GitAndScrumDocumentation.md#5-moving-the-card-to-testing):
move the card back to In Progress and fix it on the same branch. Then add a comment to the card with:

1. The test that failed (`Test N: <title>`) and the step it failed on.
2. What you expected and what you actually got, pasting the exact error text from the page, Network tab, or
   terminal.
3. What you have tried: each search you ran, and the URL and a one-line summary of each page you used.
4. Any new or different errors those attempts produced.

Leave out credentials, including any `api/config.php` values. If an error message contains your username, replace
it with `UBIT_USERNAME`.

A documented attempt matters for grading. Per the course standards, only comments that show you spent the time
working the problem let the PM or instructor mark you prepared when the task isn't finished.

Example:

```text
Test 2 failed at step 6. Expected three workout cards; got
"Error loading workouts: Unexpected token '<', "<br /> <b>"... is not valid JSON".
Network: workouts.php status 200, HTML body. PHP terminal:
"PHP Fatal error:  Uncaught mysqli_sql_exception: Access denied for user 'UBIT_USERNAME'@'localhost' (using password: YES)".
Tried: searched "mysqli_sql_exception Access denied for user" and found
https://www.php.net/manual/en/mysqli-driver.report-mode.php (since PHP 8.1, mysqli throws exceptions on errors by default).
Next: checking DB_USER/DB_PASS in api/config.php against the MySQL user from README.
```

## 7. Verifying a fix

1. Re-run the failed test first, exactly as written. It must now give the exact expected outcome.
2. Re-run **every** task test on the card in order. A fix can break a test that passed before.
3. Re-run the checks in [Local testing → Checks](#checks) that touch what you changed. For example,
   `php -l api/workouts.php` after a PHP change, or `npm run build` after a frontend change.
4. If you deploy to aptitude or cattle, repeat the [server checks](#2-testing-on-aptitude-and-cattle-production) there.
5. Add a comment to the card with the result of each test (pass/fail), then move it through Testing as in
   [GitAndScrumDocumentation.md → 5](GitAndScrumDocumentation.md#5-moving-the-card-to-testing).

If the bug was found after the card reached Completed or Closed, first add a task test that fails until the bug is
fixed, then fix it on the existing branch and open a second pull request. See
[GitAndScrumDocumentation.md → 7](GitAndScrumDocumentation.md#7-bugs-found-after-moving-a-card-to-completed).

## 8. Automated acceptance tests (Playwright)

[Playwright](https://playwright.dev/) runs the user stories' acceptance tests in a real Chromium browser. Checked
on 2026-09-29 on macOS with Node 24, PHP 8.5 and MySQL 26.7 (Homebrew), Playwright 1.63.

| Path | What it holds |
| --- | --- |
| `stories/` | One file per user story with its acceptance tests, copied from the card. Format: [stories/README.md](stories/README.md) |
| `tests/e2e/<story>.spec.js` | The code for each story's tests, one spec per story file with the same name |
| `tests/e2e/stories.js`, `banner.js`, `helpers.js` | Reads the story files; names each step and draws the watch-mode banner; shared actions like creating an account and logging in |
| `tests/e2e/summary-reporter.js` | Writes the plain-language results page, `e2e-report/index.html` |
| `playwright.config.js` | Browser sizes, the site to test, and the servers Playwright starts |

Each `## Acceptance Test N: …` heading in a story file becomes one test with the same title. A heading that has
no code yet is listed as skipped and marked "not automated yet", so owners can add tests without breaking the run.

### Set up (first time)

1. Set up the local site as in [1. Local testing](#1-local-testing), including `api/config.php`.
2. Apply every file in `database/migrations/` to your local database, in order (see
   [database/seeds/README.md](database/seeds/README.md)).
3. Install the dependencies and Playwright's browser:

   ```bash
   npm ci --legacy-peer-deps
   npx playwright install chromium
   ```

### Run the tests

Watch mode is the standard way to run them:

```bash
npm run test:e2e:watch
```

The tests run one at a time in a visible Chromium window, at a human pace: Playwright waits 1.2 seconds before each
click and page load, and types logins one key at a time. A banner in the top-left corner of the page shows what's
running: the story, which acceptance test out of how many (e.g. "Story 72 · Acceptance Test 3 of 4 · desktop"),
its title, and the current step. A full run takes about two and a half minutes.

When the run finishes, a **results page** opens in your browser (`e2e-report/index.html`). It starts with one
line saying whether everything passed, e.g. "All 6 checks passed" or "1 of 6 checks failed". Below that, each
story lists its acceptance tests with a Desktop and a Phone result and the steps that ran. A failed test shows:

- the step it failed at, e.g. Failed at "Step 1: selecting "Full Body Strength" shows the switch warning"
- what went wrong in one sentence, e.g. Expected to see the "Switch plan" button in the dialog, but it wasn't on
  the page
- a screenshot of the page at that moment
- which later steps didn't run
- a "Technical details" section with Playwright's exact error

For a quick check while you're working, `npm run test:e2e` runs the same tests without showing the browser,
at full speed and in parallel, in about 10 seconds. It writes the same results page but doesn't open it; open
`e2e-report/index.html` yourself.

You don't need to start the servers first. Both commands start `php -S localhost:8000 -t api` and `npm run dev`,
and stop them when the tests finish. If they're already running, they're used instead. Before the run, Playwright
checks the database connection and tables. It also clears this machine's login and sign-up counters, so repeated
runs don't hit the API's limit of 50 logins and 50 sign-ups per IP address every 15 minutes.

Each test creates new accounts named `e2e-<timestamp>-<random>@example.com`, so you can run the tests again
straight away. They build up in your local `users` table and are safe to delete.

A passing run ends like this:

```text
  6 passed (2.3m)

  Results page: e2e-report/index.html (opening in your browser)
```

Every test runs on `desktop` (1440×900). The ones a spec marks as layout-sensitive also run on `mobile`
(375×812).

Both commands take the same extra options after `--`:

| To… | Watch mode | Quick check |
| --- | --- | --- |
| Run everything | `npm run test:e2e:watch` | `npm run test:e2e` |
| Run one story | `npm run test:e2e:watch -- 72-select-workout-plan` | `npm run test:e2e -- 72-select-workout-plan` |
| Run desktop only | `npm run test:e2e:watch -- --project=desktop` | `npm run test:e2e -- --project=desktop` |
| See the results page | Opens by itself | Open `e2e-report/index.html` |

To step through tests one action at a time, use Playwright's UI: `npm run test:e2e -- --ui`.

When a test fails and you need more than the results page, Playwright's technical report has the full log and a
trace of the failed test that you can step through: run `npx playwright show-report`, or the
`npx playwright show-trace …` command printed in the terminal. The `e2e-report/`, `playwright-report/` and
`test-results/` folders are gitignored. The request log from the PHP server is hidden during the run;
to see PHP errors, start both servers yourself first (Playwright then reuses them) and watch that terminal.

### Run against aptitude or cattle

Set `E2E_BASE_URL` to the deployed site. Playwright then starts no servers and skips the database check.

```bash
E2E_BASE_URL=https://aptitude.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/ npm run test:e2e:watch
```

This needs the UB VPN. The run creates `e2e-…@example.com` accounts in that server's database, and it counts
toward that server's limit of 50 logins and 50 sign-ups per IP address every 15 minutes. A full run uses 8 logins
and 5 sign-ups, so about six runs fit in 15 minutes.
Use aptitude for task tests. Use cattle only to check a release, since it's production. Not yet run against
either server **[VERIFY]**.

### Adding tests for a story

Story owners only write the plain-English tests in `stories/` (see [stories/README.md](stories/README.md)). These
steps are for the owner of the story's Playwright task card, who writes the code:

1. Add or update the story's file in `stories/`, as in [stories/README.md](stories/README.md). Paste the same tests
   onto the card.
2. Create `tests/e2e/<same name>.spec.js` if it doesn't exist, and give each test's code a number matching its
   heading. `tests/e2e/72-select-workout-plan.spec.js` is the example to copy:

   ```js
   acceptanceTests('72-select-workout-plan.md', {
     1: async ({ page }) => {
       await step('Step 1: the library lists 10 plans', async () => {
         /* the actions and checks of step 1 */
       })
     },
   }, { mobile: [1] })
   ```

3. Wrap each written step in `step('Step N: …', …)` from `tests/e2e/banner.js`, using the story's numbering, so
   the banner and the results page show which step is running or failed. Follow the steps in order, and check the exact
   text each one names. Prefer finding elements by
   role and visible text (`getByRole('button', { name: 'Select' })`), as a user would.
4. Run the story with `npm run test:e2e:watch -- <story file name>` and watch the browser follow each step.

### Common failures

| Output | Cause and fix |
| --- | --- |
| `The local database is missing tables: …` | Apply the listed migrations from `database/migrations/` |
| `Can't connect to the local database (MySQL error 2002)` | MySQL isn't running. On macOS: `brew services start mysql` |
| `Can't connect to the local database (MySQL error 1045)` | Wrong user or password in `api/config.php` |
| `browserType.launch: Executable doesn't exist at …` | Run `npx playwright install chromium` |
| `Acceptance Test N has code but no matching heading in stories/…` | The spec has code for a test the story file doesn't have. Fix the number, or add the heading |
| `The API allows 50 logins and 50 sign-ups per IP address every 15 minutes…` | Wait 15 minutes, or on a local database run `mysql -u root cse442_2026_fall_team_y_db -e "DELETE FROM auth_attempts;"` |
