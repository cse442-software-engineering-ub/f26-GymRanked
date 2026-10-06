# GymRank coding agent guide

This file guides coding agents working in the GymRanked repository. The current application on `dev` is a proof of concept: a React/Vite frontend reads workout data from a PHP endpoint backed by MySQL. Check the branch and working tree before making changes; an older or uncommitted local checkout may not match `dev`.

Follow the [CSE Software Development Standards](https://webdev.cse.buffalo.edu/cse404/guidelines/) for Scrum cards, task and acceptance tests, branches, pull requests, and commits. Read the relevant standards before starting work; use `GitAndScrumDocumentation.md` for this repository's workflow details.

## Documentation map

Read `README.md` for initial setup and the current proof-of-concept overview, then use the guide that matches the work:

| Document | Use it for |
| --- | --- |
| `ARCHITECTURE.md` | Current frontend, backend, database, configuration, data flow, and guidance on where new code belongs. |
| `GitAndScrumDocumentation.md` | Required Scrum-card, branching, commit, testing-state, and pull-request workflow. |
| `ServerOperationsGuide.md` | Aptitude/cattle access, deployment, server checks, logs, recovery, database backup, and troubleshooting. |
| `TestingAndDebuggingGuide.md` | Local and server testing, task-test authoring, common failures, debugging, failure reporting, and fix verification. |

Treat these documents as companion guides to this file. Read the relevant guide before changing architecture, starting workflow, testing or debugging behavior, or performing server operations.

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
| `ARCHITECTURE.md` | System structure, data flow, configuration, and code-placement guidance. |
| `GitAndScrumDocumentation.md` | Required Git and Scrum-board workflow. |
| `ServerOperationsGuide.md` | Deployment, server administration, recovery, and troubleshooting. |
| `TestingAndDebuggingGuide.md` | Local/server checks, task tests, and debugging procedures. |
| `package.json`, `package-lock.json` | npm scripts and locked dependencies. |
| `stories/` | One file per user story with its acceptance tests, copied from the scrum card. See `stories/README.md`. |
| `tests/e2e/`, `playwright.config.js`, `playwright.watch.config.js` | Playwright acceptance tests: one spec per story file. `npm run test:e2e:watch` (the standard way) shows the browser at a human pace and opens the results page (`e2e-report/index.html`); `npm run test:e2e` is a quick headless run. |

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

`npm test` runs the auth validation unit tests. `npm run test:e2e:watch` runs the Playwright acceptance tests in a visible browser and opens a plain-language results page, which is how the team runs them; `npm run test:e2e` is the same tests headless, for quick checks (see `TestingAndDebuggingGuide.md` section 8). There is no `lint` script. Do not report a suite as passing unless you ran it. For relevant changes, run:

```bash
npm run build
php -l api/workouts.php
php -l api/config.example.php
```

For frontend or API behavior changes, also run the Vite and PHP servers, load the app, and verify the affected loading, success, empty, and error behavior as applicable. Testing the successful API response requires a configured MySQL instance and `workouts` table. Follow `TestingAndDebuggingGuide.md` for detailed local and server procedures, task-test expectations, debugging, and fix verification. Record exactly what was checked and any environment limitation.

## User stories and acceptance tests

Every user story on the scrum board has a file in `stories/` named `<card number>-<short-name>.md`, holding the story's title and its acceptance tests under `## Acceptance Test N: <title>` headings. The format is in `stories/README.md`.

- Story owners write only the story file: its title and acceptance tests in plain English, then paste the tests onto the card, which is what the course grades. They don't write code, and nothing converts the English into code automatically.
- When a new user story is created, add its file in the same task that starts work on it. Leave the tests for the story's owner if they aren't written yet.
- Keep the file and the card the same.
- The owner of the story's Playwright task card creates its spec with the same name in `tests/e2e/` and writes the code for each test. The spec reads the story file and runs one Playwright test per heading. A heading without code is reported as "not automated yet" and doesn't fail the run; code for a number with no heading stops the run. A story file with no spec isn't run at all.
- If you add or change an acceptance test heading and aren't the Playwright task owner, leave the code to them unless the user asks you to write it.
- After a change that affects a story, run the Playwright tests and report the result. Use `npm run test:e2e:watch` when the user wants to watch, which is the default for this team; it opens a browser window on their screen. Point the user to the results page, `e2e-report/index.html`, which says what passed and, for a failure, the step, the reason and a screenshot. Use `npm run test:e2e` for repeated quick checks.

## Coding conventions

- Follow the existing React function-component and JSX style. Keep imports at the top, use relative `.jsx` imports, and keep UI state close to the component that owns it.
- Keep the frontend/API contract explicit: `WorkoutList` expects JSON rows with `id`, `exercise`, `reps`, and `weight`. Use `import.meta.env.BASE_URL` for URLs served under the configured deployment path.
- When a feature needs data beyond the proof-of-concept `workouts` table (such as set order, effort, timestamps, user ranks, or leaderboard data), update the API contract and document the required SQL schema change in a dedicated, versioned file such as `database.sql` or a migration script. Include how existing local and shared databases should be updated; do not rely on an undocumented manual change.
- Keep PHP responses JSON and use appropriate HTTP status codes for errors. Keep database settings in `api/config.php`, which is ignored by Git; update the example file only with placeholders.
- Build new views and dialogs as focused, reusable components instead of growing `App.jsx` or `WorkoutList.jsx` into a single large component. As navigation expands across the dashboard, workouts, plans, and leaderboard, use a routing approach appropriate to the app; introduce a library such as React Router when client-side routes are needed. Keep modal state and behavior in the relevant feature rather than the root component.
- Match the formatting and naming of nearby code. The repo has no formatter or linter configuration, so avoid unrelated reformatting.
- Do not commit secrets, personal credentials, `node_modules/`, or `dist/`. Check `git status` and the diff before committing.

## Instructions for coding agents

1. Read `README.md` and the relevant companion documentation from the map above, inspect the target branch, and check `git status` before editing. Preserve unrelated or uncommitted work.
2. Work from `dev` on a task-specific branch; do not commit directly to `dev` or `main`. Follow the team's required Scrum-card, branch, commit, testing-state, and pull-request workflow in `GitAndScrumDocumentation.md`. Use the card number and a short description in the branch name, and keep commit subjects at 50 characters or fewer.
3. Make focused changes that satisfy the task's stated tests. For UI work, compare against the relevant Figma frame and note any intentional deviation.
4. Consult `ARCHITECTURE.md` before changing system boundaries, data flow, configuration, API contracts, database structure, or code organization.
5. Do not put credentials or tokens in source, logs, screenshots, commits, or task comments. Do not deploy or modify shared server data unless the task explicitly calls for it; when authorized, follow `ServerOperationsGuide.md`.
6. Run the applicable checks above and the relevant procedures in `TestingAndDebuggingGuide.md`, review the final diff, and report the changed behavior, verification results, and any remaining limitations. Do not claim unrun checks passed.
