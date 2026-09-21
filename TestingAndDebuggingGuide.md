# Testing and Debugging Guide

How to test GymRank locally, on aptitude (test), and on cattle (production), write task tests, record failures, read logs, and verify a fix.

Every command and quoted output below was run on 2026-09-21 against `dev` at `b15cebe`: macOS, Node 24.11.1,
npm 11.6.2, PHP 8.5.10, MySQL 26.7.0 (Homebrew), Chrome. The aptitude and cattle checks were run the same day over
the UB VPN. Anything that needs SSH access or would break a shared server is marked **[VERIFY]**. Run it once, then
replace the marker with the real result. Error messages are quoted from Chrome. Safari and Firefox word them
differently.

Never put real credentials in this file, in commits, or in task comments. Use `UBIT_USERNAME` and
`<PERSON_NUMBER>` as placeholders.

There is no automated test suite: no `npm test` script, no test framework, and no linter or CI. Every test in this
repo is a manual task test or acceptance test on the scrum board. Do not report an automated suite as passing.

## Contents

1. [Local testing](#1-local-testing)
2. [Testing on aptitude and cattle (production)](#2-testing-on-aptitude-and-cattle-production)
3. [Common failures](#3-common-failures)
4. [Reading logs](#4-reading-logs)
5. [Writing task tests](#5-writing-task-tests)
6. [Recording a failure](#6-recording-a-failure)
7. [Verifying a fix](#7-verifying-a-fix)

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

| Server | Role | When to test it |
| --- | --- | --- |
| `aptitude.cse.buffalo.edu` | Test | After every deploy during a sprint |
| `cattle.cse.buffalo.edu` | Production (the team's released code) | After the end-of-sprint release, and before a sprint demo |

Both serve the app at `/CSE442/2026-Fall/cse-442y/` and use the same checks. Deploy with
[ServerOperationsGuide.md → Deployment](ServerOperationsGuide.md#2-deployment). cattle is only updated at the end
of a sprint. You must be on the UB VPN or campus network.

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

Acceptance tests on **user stories** are different. They are run by an untrained user, so they use no technical
terms or DevTools, just what the user types, clicks, and sees.

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
