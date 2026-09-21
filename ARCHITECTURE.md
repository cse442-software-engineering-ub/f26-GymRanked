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
| `src/index.css` | Global and component styles for the current proof of concept. |
| `index.html` | Vite HTML entry point. |

- Built with **React** function components and JSX, using **Vite** as the dev server and bundler.
- `WorkoutList.jsx` is currently the only component that talks to the backend; it owns its own loading/error/empty/success UI state rather than lifting that state into `App.jsx`.
- No router is in place yet. As navigation grows to cover dashboard, workouts, plans, and leaderboard screens, a client-side routing library (e.g. React Router) should be introduced rather than hand-rolling view switching in `App.jsx`.
- No modal/dialog components exist yet; when added, their state should live with the feature that owns them, not in the root component.
- All URLs to backend endpoints must be built from `import.meta.env.BASE_URL`, not hardcoded, so requests resolve correctly both in local dev (proxied) and in production (same-path).

## Backend

| Path | Purpose |
|---|---|
| `api/workouts.php` | PHP JSON endpoint that queries the `workouts` MySQL table. |
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
| New global style | `src/index.css`, matching existing formatting; the repo has no formatter/linter, so avoid unrelated reformatting elsewhere while you're in the file. |

For anything not covered above, or for the day-to-day mechanics of branching, committing, and testing a change, follow `AGENTS.md`'s "Instructions for coding agents" section and `GitAndScrumDocumentation.md` (when available) rather than duplicating that process here.
