# ARCHITECTURE.md

This document describes the current architecture of the GymRanked repository: how the frontend, backend, and database fit together, how data flows through the app, what governs configuration, and where new code belongs. It is derived from `AGENTS.md`, `vite.config.js`, `package.json`, and the source files listed below — treat it as a map, not a replacement for reading the actual code before making changes.

**Status note:** the current app on `dev` is a proof of concept — a single React view that reads workout rows from one PHP endpoint backed by one MySQL table. Nothing described here should be assumed to cover features shown only in the Figma prototype; those are design references for future work, not evidence of existing code.

## Overview

```
Browser (React/Vite frontend)
        │  fetch(`${BASE_URL}api/workouts.php`)
        ▼
Vite dev proxy  (local only, /CSE442/2026-Fall/cse-442y/api → localhost:8000)
        ▼
PHP built-in server  (api/workouts.php)
        │  mysqli/PDO query
        ▼
MySQL  (workouts table)
```

In production, the proxy is not involved — the built frontend and the PHP API are both served under the same deployment base path, and the browser talks to `api/workouts.php` directly at that path.

## Frontend

| Path | Purpose |
|---|---|
| `src/main.jsx` | React entry point — mounts the app into `index.html`. |
| `src/App.jsx` | Root component. |
| `src/WorkoutList.jsx` | Fetches `api/workouts.php` and renders loading, error, empty, and data states. |
| `src/index.css` | Global and component styles, and the `--gr-` colour variables for both themes (dark `:root`, light `:root[data-theme="light"]`). |
| `src/theme/theme.js` | The colour theme: applies `data-theme` on `<html>`, remembers it in the browser (`gymrank.theme`), and loads/saves it for the account through `api/theme.php`. `useTheme.js` gives components the current theme. `ThemeToggle.jsx` is the Dark / Light control in the Profile page's Appearance card, opened from **Profile** in the account menu. |
| `src/progress/` | The Progress page at `#/progress` (story #8): totals for 30 days, 90 days or all time, an Exercise drop-down, and the chosen exercise's numbers, trend chart, workouts and personal records, all from `api/exercise_progress.php` through `workoutLogApi.getExerciseProgress`. `progressFormat.js` holds the display text (unit tested in `tests/progressFormat.test.js`). It links to the workout history at `#/progress/history`. Test data: `database/seeds/exercise_progress.sql` and `exercise_progress_ranges.sql`. |
| `src/leaderboard/` | The Strength leaderboard at `#/leaderboard` (story #10, card #120): all-time DOTS boards for Overall, bench press, back squat and deadlift, your standing, the "How to get ranked" steps, and joining or leaving, all through `leaderboardApi.js` (`api/leaderboard.php`, Mansur's #121). `leaderboardFormat.js` holds the display text and which standing card to show (unit tested in `tests/leaderboardFormat.test.js`). Body weight and gender are edited on Personal details (`#/personal-details`), not here. `LeaderboardSwitch.jsx` is the Weekly consistency / Strength switch at the top of both leaderboard views. |
| `src/weeklyGoal/` | The weekly training-day goal (story #87, task #88) on Surya's `api/weekly_goal.php` (#89). `WeeklyGoalDisplay.jsx` is the reusable display (progress, this week's goal and next week's saved change as separate boxes, and the seven days with green, labelled completed dates); give it the JSON from GET or POST, or `status="loading"`/`"error"`. `WeeklyGoalPage.jsx` is `#/weekly-goal` (opened from Home's Weekly milestone card and from Profile): choose 1 to 7 days, review, "Confirm and save". `weeklyGoalApi.js` makes the requests and `weeklyGoalFormat.js` holds the text and week rules (unit tested in `tests/weeklyGoal.test.js`). Nothing is kept in the browser, so a refresh shows the saved goal. Test data: `database/seeds/weekly_goals.sql`. |
| `src/weekly/` | The Weekly consistency view at `#/leaderboard/weekly`, where Leaderboard in the navigation opens: this week's standings among people with the same weekly training-day goal, your rank, days against your goal, the time left before the Monday reset (New York time), the practice week after joining, and joining or leaving, through `weeklyApi.js` (`api/weekly_standings.php`, Mansur's backend, which uses Surya's `api/weekly_goal.php` calculation). Reloads when the tab comes back into view so a finished workout shows. `weeklyFormat.js` holds the display text and countdown (unit tested in `tests/weeklyFormat.test.js`). |
| `index.html` | Vite HTML entry point; a small inline script applies the remembered theme before the app loads, so a light page never flashes dark. |

- Built with **React** function components and JSX, using **Vite** as the dev server and bundler.
- `WorkoutList.jsx` is currently the only component that talks to the backend; it owns its own loading/error/empty/success UI state rather than lifting that state into `App.jsx`.
- No router is in place yet. As navigation grows to cover dashboard, workouts, plans, and leaderboard screens, a client-side routing library (e.g. React Router) should be introduced rather than hand-rolling view switching in `App.jsx`.
- No modal/dialog components exist yet; when added, their state should live with the feature that owns them, not in the root component.
- **Dark and light mode:** every colour comes from a `--gr-` variable, and `<html data-theme="light">` swaps in the light values, so pages need no theme code of their own. `OnboardingGate` calls `syncAccountTheme()` after it confirms the session, so the account's saved theme replaces the browser's remembered one (once per signed-in user). Rules for colours are in `DESIGN.md`, "Dark and light mode".
- All URLs to backend endpoints must be built from `import.meta.env.BASE_URL`, not hardcoded, so requests resolve correctly both in local dev (proxied) and in production (same-path).

## Backend

### Personal details frontend (task #117)

`src/onboarding/PersonalDetailsPage.jsx` serves `#/personal-details`. The shared
`OnboardingGate` reads `personal_details.php` alongside training preferences and
setup, and supplies the saved details through the router outlet context. Missing
details send unfinished accounts to this first step, including after refresh or
direct navigation. Accounts with a saved goal, experience and equipment retain
their existing access and can add details voluntarily from the Dashboard. Saving
returns those accounts to the Dashboard without writing any training or plan data.
The Profile reads the same fresh account details on each visit. Failed account
checks offer retry rather than treating an unavailable API as an empty profile.

`personalDetails.js` holds gender labels and input validation, matching migration
012's 50–700 lb range and one-decimal precision. Empty and nonpositive weights have
the specific guidance required by card 117. The form prevents repeat submissions
and keeps entered values when saving fails. Existing databases need migration 012
before deploying this frontend; see its local/shared-database instructions.

| Path | Purpose |
|---|---|
| `api/workouts.php` | PHP JSON endpoint that queries the `workouts` MySQL table. |
| `api/workout_session.php` | Starts today's workout session (or reopens the current one), reads a session back, and looks up the signed-in user's unfinished current-plan session without starting one. |
| `api/workout_sets.php` | Saves or corrects one set (weight in pounds, reps) in the user's session. |
| `api/complete_workout.php` | Marks a session completed, once. |
| `api/workout_history.php` | The user's completed workouts, newest first. |
| `api/exercise_progress.php` | The user's performance totals and trends over their completed workouts (volume, estimated 1RM, strength change, personal records, per-exercise points). See [Exercise progress API](#exercise-progress-api-story-8). |
| `api/theme.php` | GET/POST the signed-in account's colour theme (`dark` or `light`, default `dark`), stored in `user_theme`. |
| `api/personal_details.php` | GET/POST the signed-in account's body weight (lb, 50 to 700, one decimal) and gender (`woman`, `man`, `nonbinary`, `prefer_not_to_say`), stored in `user_profile` (`database/migrations/012_user_profile.sql`). An account that never saved them reads as `null`, `null`, `complete: false`. |
| `api/leaderboard.php` | GET the story #10 rankings (`board=overall|bench|squat|deadlift`), POST `{"join":true[,"scoring_table":"men"|"women"]}` to join, DELETE to leave. See [Leaderboard API](#leaderboard-api-story-10). |
| `api/weekly_standings.php` | GET the story #124 weekly consistency standings, POST `{"join":true}` to join, DELETE to leave. See [Weekly standings API](#weekly-standings-api-story-124). |
| `api/workout_common.php` | Shared helpers for the workout endpoints above (login check, set validation, JSON shapes); not an endpoint. |
| `api/config.example.php` | Template for local database settings — copy to `api/config.php` (gitignored) and edit there. Never commit real credentials; the example file must only ever contain placeholders. |

- The backend is plain PHP, run locally via `php -S localhost:8000 -t api` — no framework in place.
- `workouts.php` is the only endpoint today. It returns JSON and should use appropriate HTTP status codes for error conditions.
- Database credentials are read from `api/config.php`, which is git-ignored. Local setup requires copying `api/config.example.php` to that path and filling in real values there.

## Database

- **Engine:** MySQL.
- **Current schema:** one table, `workouts`. Column-level schema and local setup steps are documented in `README.md` (not duplicated here to avoid drift — check `README.md` for the authoritative column list).
- **Frontend/API contract:** `WorkoutList` expects each row to include `id`, `exercise`, `reps`, and `weight`. Any change to the shape of this data must update both `workouts.php`'s query/output and the frontend consumer together.
- **Schema changes:** any feature needing data beyond this proof-of-concept table (set order, effort ratings, timestamps, user ranks, leaderboard stats, etc.) requires:
  1. Updating the API contract (endpoint output shape).
  2. Recording the required SQL change in a dedicated, versioned file (e.g. `database.sql` or a migration script) — never as an undocumented manual edit to a live database.
  3. Documenting how existing local and shared databases must be brought up to date with that change.

## Workout logging API (story #7)

Saves what a user lifts. Migration `database/migrations/009_workout_sessions.sql` adds two tables: `workout_sessions` (one row per workout, with the plan, day and exercises copied from the user's plan when it starts) and `workout_sets` (one row per set: `exercise`, `set_number`, `weight_lb`, `reps`, `logged_at`, `updated_at`). Deleting a user deletes their sessions and sets. The step-by-step checks are in `task-tests/7-workout-session-backend.md`; `node tests/workout-session-api.mjs` runs them against a local server.

| Endpoint | Request | Success |
|---|---|---|
| `POST api/workout_session.php` | `{}` or `{"day_position": 1}` | 201 `{"session": {...}}` for a new session, 200 for the current one |
| `GET api/workout_session.php?id=N` | | 200 `{"session": {...}}` |
| `GET api/workout_session.php?current=1` | | 200 `{"session": {...}}` for the signed-in user's unfinished session in the selected plan from the past 24 hours, or `{"session": null}`; no session is created |
| `POST api/workout_sets.php` | `{session_id, exercise, set_number, weight_lb, reps}` | 201 `{"set": {...}}` |
| `POST api/workout_sets.php` | `{id, weight_lb, reps}` (correction) | 200 `{"set": {...}}` |
| `POST api/complete_workout.php` | `{session_id}` | 200 `{session_id, completed_at}` |
| `GET api/workout_history.php` | | 200 `{"sessions": [...]}` |

- `session` = `{id, plan, name, focus, started_at, completed_at, exercises: [{name, sets: [{id, set_number, weight_lb, reps, logged_at, updated_at}]}], summary}`. `summary` is `null` until the workout is completed, then `{exercise_count, set_count, total_reps, total_volume_lb, duration_seconds}`. A history item is `{id, name, plan, started_at, completed_at, duration_seconds, exercise_count, set_count, total_volume_lb}`.
- **Units and times:** weight is pounds (0 to 1500, at most 2 decimal places, 0 = bodyweight), reps 1 to 100. All times are UTC (`2026-10-13T19:27:47Z`) written by the server; times sent by the client are ignored.
- **Current session:** the user's most recent session started in the last 24 hours, finished or not. Starting returns it (200) instead of creating another, which is how an unfinished workout is reopened. Without `day_position`, today's scheduled plan day is used (Eastern time, the same schedule as `src/weeklySchedule.js`; a rest day answers 409).
- **Accounts:** every query is scoped to the logged-in user; another user's session or set is a 404.
- **Completion:** done once under a row lock (two requests at once give one 200 and one 409). After it, sets can't be saved or corrected (409).
- **Errors:** JSON `{"error": "..."}`, plus `errors.weight_lb` / `errors.reps` on a 400 for a bad set. The wording matches `src/workoutLog/setValidation.js`. 401 not logged in, 404 not found, 405 wrong method, 409 conflict, 500 `{"error":"Database error"}`.
- **Frontend contract:** `src/workoutLog/workoutLogApi.js` uses `workout_sets.php` and `complete_workout.php`. The extra fields (`logged_at`, `updated_at`, `summary`) are additions, so it keeps working.
- **Workout history (story #9):** `src/history/` reads `workout_history.php` for the list and `workout_session.php?id=` for one workout's sets, through `workoutLogApi.js` (`getHistory`, `getSession`), for the page at `#/progress/history`. Test data: `database/seeds/workout_history.sql`.

## Exercise progress API (story #8)

`GET api/exercise_progress.php` reads every completed workout and set of the logged-in user (the tables from migration 009; no new migration) and returns totals and trends for the progress dashboard. The step-by-step checks and the expected values are in `task-tests/8-exercise-progress-backend.html`; test data is `database/seeds/exercise_progress.sql`.

- **Request:** optional `from` and `to` (`YYYY-MM-DD`, both inclusive; neither means all history) and `bucket` (`week` or `month`, default `week`). Any other parameter is ignored, so a user id can never come from the URL. Errors: 400 `{"error":"Invalid request.","errors":{"from"|"to"|"bucket": "..."}}`, 401 not logged in, 405 not GET.
- **Response:** `{from, to, bucket, summary: {workouts, sets, total_volume_lb, new_prs, strength_gain_pct}, exercises: [{exercise, sessions, sets, total_reps, volume_lb, best_weight_lb, best_reps, first_e1rm_lb, last_e1rm_lb, strength_change_lb, strength_change_pct, new_prs, points: [{date, best_weight_lb, reps, e1rm_lb, best_reps, volume_lb}]}], volume_trend: [{period_start, volume_lb, workouts}], prs: [{exercise, date, weight_lb, reps}]}`.
- **Units and days:** weight is pounds. Every date (`from`, `to`, buckets, PR and point dates) is an America/New_York calendar day, converted from the stored UTC `completed_at` in PHP with `DateTimeZone` (not MySQL `CONVERT_TZ`, which needs time zone tables). Weeks start on Monday.
- **Definitions:** volume is the sum of weight x reps (a 0 lb bodyweight set adds 0). Estimated 1RM is Epley, weight x (1 + reps / 30), rounded half up to 1 decimal. Strength change is the last minus the first workout's 1RM in the range (null with fewer than two weighted workouts). A weight PR is a workout whose heaviest weight beats every earlier workout's, of any date; a bodyweight exercise (heaviest weight 0 lb) has a rep PR instead (most reps in one set). The first time an exercise is logged and ties are not PRs. The full list is the header comment of `api/exercise_progress.php`.
- **No cut-off:** unlike `workout_history.php` (100 workouts), every completed workout is read. Totals are computed in PHP from whole cents and tenths of a pound, so rounding never depends on floats. Unfinished workouts are never counted.

## Leaderboard API (story #10)

`api/leaderboard.php` ranks the people who joined, from their finished workouts, on every request (nothing but the join and the scoring table is stored). The checks and expected scores are in `task-tests/10-leaderboard-backend.html`; test data is `database/seeds/leaderboard.sql`; the schema change is `database/migrations/013_leaderboard.sql`.

- **Request:** `GET ?board=overall|bench|squat|deadlift` (default `overall`; any other value is a 400, any other parameter is ignored, and the user always comes from the session cookie). `POST {"join": true}` joins, with `"scoring_table": "men"|"women"` for a nonbinary or prefer-not-to-say member (required until one is saved; ignored for a man or woman). `DELETE` leaves and keeps the workouts, personal details and chosen table. Errors are JSON: 400 `{"error":"Invalid request.","errors":{...}}`, 401, 405 with `Allow: GET, POST, DELETE`, 500.
- **Response:** `{board, ranked_count, workouts_needed, rows: [{rank, name, score, lift, is_me, gap_before}], me: {ranked, rank, score, reason, joined, bodyweight_lb, gender, scoring_table, lifts, workouts_done}}`. `rows` is the top 10 plus everyone tied with 10th place, then the caller and one person either side; `name` is shortened to "Ana C." on the server and a row never carries an email, id, body weight, gender, table or estimated 1RM. `reason` is the first of `test_account`, `not_joined`, `no_bodyweight`, `needs_scoring_table`, `too_few_workouts`, `no_lift`, `missing_lifts`.
- **Scoring:** DOTS, `lift_kg x 500 / (a + b*x + c*x^2 + d*x^3 + e*x^4)` with the men's or women's coefficients and body weight limits of the OpenPowerlifting implementation (`crates/coefficients/src/dots.rs`), fed estimated 1RMs (Epley, sets of 1 to 10 reps of exactly Bench press, Back squat and Deadlift in finished workouts), not meet lifts. A lift board scores that lift alone; Overall scores the sum of the three and needs all three. Scores are rounded half up to 2 decimals and ties are decided on the rounded score. The PM confirmed that DOTS is the method (USAPL uses it for Open Best Lifter); the formula and sources are in the header comment of the PHP file.
- **Data:** `users.is_test` (set only by seeds or SQL, hides test accounts), `user_profile.leaderboard_joined_at` (UTC; NULL = not on the board) and `user_profile.scoring_table`. Ranked people must also have a saved body weight and gender (`api/personal_details.php`), a known table and at least 3 finished workouts.


## Weekly standings API (story #124)

`api/weekly_standings.php` ranks the people who joined the weekly consistency competition by their training days this Monday-Sunday week (New York time), on every request. Only who joined is stored; the days and targets are read from finished workouts and `user_weekly_goals` with the same rule as `api/weekly_goal.php`, so Home, the weekly goal page and the standings agree. It is separate from the all-time strength leaderboard. The checks are in `task-tests/124-weekly-standings-backend.html`; test data is `database/seeds/weekly_competition.sql`; the schema change is `database/migrations/015_weekly_competition.sql`.

- **Request:** `GET` (any parameter is ignored; the user always comes from the session cookie), `POST {"join": true}` to join, `DELETE` to leave (workouts and goals are kept). POST and DELETE return the same body as GET.
- **Response:** `{time_zone, week_start, week_end, resets_at, now, target_days, member_count, rows: [{rank, name, progress_days, progress_percent, is_me, gap_before}], me: {joined, ranked, reason, ranked_from, rank, completed_count, progress_days, progress_percent, goal_reached}}`. `rows` is everyone ranked this week with the viewer's `target_days` (no cut-off, so `gap_before` is always false). `me.reason` is `null`, `test_account`, `not_joined` or `practice_week`.
- **Rules:** progress is capped at 100% and a date counts once; people with the same days share a rank (1, 1, 3), ties listed by full name; people who join mid-week are in a practice week and are ranked from the next Monday (`me.ranked_from`); test accounts (`users.is_test`) are never listed. `resets_at` is next Monday 00:00 New York time in UTC, worked out in `api/weekly_standings_time.php` (checked by `php tests/weekly_standings_time.php`).
- **Errors:** JSON `{"error": ...}`: 400 for a POST body that is not `{"join": true}`, 401, 405 with `Allow: GET, POST, DELETE`, 415/413/403 as the other POST endpoints, 500 `Database error`.

## Data flow

Walking a single request end-to-end, using the one flow that currently exists:

1. **Frontend mount:** `WorkoutList.jsx` renders, sets its state to "loading," and calls `fetch` against `${import.meta.env.BASE_URL}api/workouts.php`.
2. **Local dev only — proxy:** `vite.config.js` proxies requests under `/CSE442/2026-Fall/cse-442y/api` to `localhost:8000`, where the PHP built-in server is running. (In production, no proxy exists — the request goes straight to the deployed PHP endpoint at the same base path.)
3. **Backend:** `api/workouts.php` reads connection settings from `api/config.php`, queries the `workouts` table, and returns the result set as JSON with an appropriate status code.
4. **Frontend response handling:** `WorkoutList.jsx` transitions to one of four states based on the response — **loading** (in flight), **error** (request failed or non-2xx), **empty** (successful response, zero rows), or **data** (successful response, rows present) — and renders accordingly.

There is no caching, client-side state management library, or write path (POST/PUT) yet — this is a read-only display of one table through one component.

## Configuration

| File | Controls |
|---|---|
| `vite.config.js` | React plugin, deployment base path, and the local dev proxy for `/api`. |
| `api/config.example.php` | Placeholder template for DB credentials — safe to commit, contains no real values. |
| `api/config.php` | Real local DB credentials — gitignored, created locally by copying the example file. |
| `package.json` / `package-lock.json` | npm scripts and locked dependency versions. |

- **Base path:** the deployment base path (`/CSE442/2026-Fall/cse-442y/`) is configured once in `vite.config.js` and is baked into production builds. It must be preserved unless a deployment change explicitly requires otherwise — changing it without updating both the Vite config and the proxy target will break either local dev or production, not both.
- **Local dev requires two processes:** `npm run dev` (Vite) in one terminal and `php -S localhost:8000 -t api` (PHP) in a second. Without a configured MySQL instance, the frontend and proxy can still be exercised, but the real database query cannot succeed — this is an expected, documented limitation, not a bug to "fix" by faking a response.
- **Node version:** 20+ (README reports testing with 20.20.0).
- **No test or lint script exists** in `package.json`. Do not report an automated suite as passing when none exists to run.

## Where new code should be added

| Kind of change | Goes in |
|---|---|
| New frontend page/view | A new file under `src/`, following the existing function-component + JSX style; wire it up via a router once one is introduced rather than branching inside `App.jsx`. |
| New reusable UI (modal, dialog, card, etc.) | A focused, standalone component — do not grow `App.jsx` or `WorkoutList.jsx` into a single large component. Keep the component's own state and behavior with it. |
| New API endpoint | A new PHP file under `api/`, returning JSON with appropriate HTTP status codes, reading credentials from `api/config.php`. |
| New/changed database schema | A versioned migration file (e.g. `database.sql`) documenting the exact SQL change and the steps to apply it to existing local and shared databases — never an undocumented manual database edit. |
| New colour | A `--gr-` variable in `src/index.css` with a dark value in `:root` and a light value in `:root[data-theme="light"]`, listed in `DESIGN.md`. Never a hex or rgb value in a component. |
| New global style | `src/index.css`, matching existing formatting; the repo has no formatter/linter, so avoid unrelated reformatting elsewhere while you're in the file. |

For anything not covered above, or for the day-to-day mechanics of branching, committing, and testing a change, follow `AGENTS.md`'s "Instructions for coding agents" section and `GitAndScrumDocumentation.md` (when available) rather than duplicating that process here.
