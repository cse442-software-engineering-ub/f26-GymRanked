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
| `src/theme/theme.js` | The colour theme: applies `data-theme` on `<html>`, remembers it in the browser (`gymrank.theme`), and loads/saves it for the account through `api/theme.php`. `useTheme.js` gives components the current theme. `ThemeToggle.jsx` is the Dark / Light control in the Profile page's Appearance card, opened from **Account Settings** in the account menu. |
| `index.html` | Vite HTML entry point; a small inline script applies the remembered theme before the app loads, so a light page never flashes dark. |

- Built with **React** function components and JSX, using **Vite** as the dev server and bundler.
- `WorkoutList.jsx` is currently the only component that talks to the backend; it owns its own loading/error/empty/success UI state rather than lifting that state into `App.jsx`.
- No router is in place yet. As navigation grows to cover dashboard, workouts, plans, and leaderboard screens, a client-side routing library (e.g. React Router) should be introduced rather than hand-rolling view switching in `App.jsx`.
- No modal/dialog components exist yet; when added, their state should live with the feature that owns them, not in the root component.
- **Dark and light mode:** every colour comes from a `--gr-` variable, and `<html data-theme="light">` swaps in the light values, so pages need no theme code of their own. `OnboardingGate` calls `syncAccountTheme()` after it confirms the session, so the account's saved theme replaces the browser's remembered one (once per signed-in user). Rules for colours are in `DESIGN.md`, "Dark and light mode".
- All URLs to backend endpoints must be built from `import.meta.env.BASE_URL`, not hardcoded, so requests resolve correctly both in local dev (proxied) and in production (same-path).

## Backend

| Path | Purpose |
|---|---|
| `api/workouts.php` | PHP JSON endpoint that queries the `workouts` MySQL table. |
| `api/workout_session.php` | Starts today's workout session (or reopens the current one) and reads a session back, with its sets and, once completed, its summary. |
| `api/workout_sets.php` | Saves or corrects one set (weight in pounds, reps) in the user's session. |
| `api/complete_workout.php` | Marks a session completed, once. |
| `api/workout_history.php` | The user's completed workouts, newest first. |
| `api/theme.php` | GET/POST the signed-in account's colour theme (`dark` or `light`, default `dark`), stored in `user_theme`. |
| `api/workout_common.php` | Shared helpers for the four endpoints above (login check, set validation, JSON shapes); not an endpoint. |
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
