# GymRank coding agent guide

This file guides coding agents working in the GymRanked repository. The current application on `dev` is a proof of concept: a React/Vite frontend reads workout data from a PHP endpoint backed by MySQL. Check the branch and working tree before making changes; an older or uncommitted local checkout may not match `dev`.

## Repository structure

| Path | Purpose |
| --- | --- |
| `src/main.jsx`, `src/App.jsx` | React entry point and root component. |
| `src/WorkoutList.jsx` | Fetches `api/workouts.php` and renders loading, error, empty, and data states. |
| `src/index.css` | Global and component styles for the current proof of concept. |
| `api/workouts.php` | PHP JSON endpoint that queries the `workouts` MySQL table. |
| `api/config.example.php` | Template for local database settings. Copy to ignored `api/config.php`; never commit real credentials. |
| `vite.config.js` | React plugin, deployment base path, and local proxy for `/api`. |
| `index.html` | Vite HTML entry point. |
| `README.md` | Setup, database, build, and deployment details. |
| `package.json`, `package-lock.json` | npm scripts and locked dependencies. |

The Figma [GymRank Prototype page](https://www.figma.com/design/JMSaaXvmkMfjxrQuQqQ7CV/GymRank?node-id=94-94) is a design reference for future features. Its screens are not evidence that those features already exist in code.

## Setup and commands

Use Node 20+ and npm. The README reports testing with Node 20.20.0. PHP and MySQL are needed to exercise the real API query.

```bash
npm ci
cp api/config.example.php api/config.php
# Edit api/config.php with local database credentials.
npm run dev
```

In a second terminal, start PHP from the repository root:

```bash
php -S localhost:8000 -t api
```

`vite.config.js` proxies requests under `/CSE442/2026-Fall/cse-442y/api` to that PHP server. The configured base path is also baked into production builds; preserve it unless a deployment change explicitly requires otherwise. The README has optional local MySQL setup and the `workouts` table schema. Without MySQL, the frontend and proxy can be checked, but the real query cannot pass.

## Validation

There is no `test` or `lint` script in the current `package.json`. Do not report an automated suite as passing. For relevant changes, run:

```bash
npm run build
php -l api/workouts.php
php -l api/config.example.php
```

For frontend or API behavior changes, also run the Vite and PHP servers, load the app, and verify the affected loading, success, empty, and error behavior as applicable. Testing the successful API response requires a configured MySQL instance and `workouts` table. Record exactly what was checked and any environment limitation.

## Coding conventions

- Follow the existing React function-component and JSX style. Keep imports at the top, use relative `.jsx` imports, and keep UI state close to the component that owns it.
- Keep the frontend/API contract explicit: `WorkoutList` expects JSON rows with `id`, `exercise`, `reps`, and `weight`. Use `import.meta.env.BASE_URL` for URLs served under the configured deployment path.
- When a feature needs data beyond the proof-of-concept `workouts` table (such as set order, effort, timestamps, user ranks, or leaderboard data), update the API contract and document the required SQL schema change in a dedicated, versioned file such as `database.sql` or a migration script. Include how existing local and shared databases should be updated; do not rely on an undocumented manual change.
- Keep PHP responses JSON and use appropriate HTTP status codes for errors. Keep database settings in `api/config.php`, which is ignored by Git; update the example file only with placeholders.
- Build new views and dialogs as focused, reusable components instead of growing `App.jsx` or `WorkoutList.jsx` into a single large component. As navigation expands across the dashboard, workouts, plans, and leaderboard, use a routing approach appropriate to the app; introduce a library such as React Router when client-side routes are needed. Keep modal state and behavior in the relevant feature rather than the root component.
- Match the formatting and naming of nearby code. The repo has no formatter or linter configuration, so avoid unrelated reformatting.
- Do not commit secrets, personal credentials, `node_modules/`, or `dist/`. Check `git status` and the diff before committing.

## Instructions for coding agents

1. Read `README.md`, inspect the target branch, and check `git status` before editing. Preserve unrelated or uncommitted work.
2. Work from `dev` on a task-specific branch; do not commit directly to `dev` or `main`. Follow the team's Scrum-card, branch, commit, and testing workflow documented in `GitAndScrumDocumentation.md` when it is available. Use the card number and a short description in the branch name, and keep commit subjects at 50 characters or fewer.
3. Make focused changes that satisfy the task's stated tests. For UI work, compare against the relevant Figma frame and note any intentional deviation.
4. Do not put credentials or tokens in source, logs, screenshots, commits, or task comments. Do not deploy or modify shared server data unless the task explicitly calls for it.
5. Run the applicable checks above, review the final diff, and report the changed behavior, verification results, and any remaining limitations. Do not claim unrun checks passed.
