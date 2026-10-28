# DESIGN.md

This is GymRank's design system: the colours, type, spacing, shapes, components and writing rules every screen should use, so pages built by different people look and behave like one app. The values are taken from the signed-in Home Dashboard on `dev` (commit `a27a98e`, 2026-10-06: Suryamur10's redesign with cirexlul's tweaks), measured from the running app and from `src/index.css`. The Dashboard is the reference because it is the newest and most complete screen.

**Status note:** the tokens are shared in code as CSS variables in `src/index.css` (see [CSS variables](#css-variables)), added with this file by task #93. Since the Persistent User Theme Preference task every stylesheet uses them and no page writes its own hex values, which is what lets every page switch between dark and light mode (see [Dark and light mode](#dark-and-light-mode)). Some older pages still use different sizes or layouts (see [Known differences in the current code](#known-differences-in-the-current-code)).

## How to use this guide

- Building or changing a screen: use the values and components here. Don't introduce a new colour, font size or radius without adding it to this file in the same task.
- Reviewing a pull request: check the UI against [Components](#components) and the [Accessibility checklist](#accessibility-checklist).
- A visual change that isn't a new feature (polish, consistency, new messaging) needs an upgrade task on the scrum board under the original story, with tests that check the new look (course rule: [PM Process Standards, FAQ](https://webdev.cse.buffalo.edu/cse404/scrumboard/)).
- The Figma [GymRank Prototype page](https://www.figma.com/design/JMSaaXvmkMfjxrQuQqQ7CV/GymRank?node-id=94-94) shows planned screens. Where it differs from this file, this file wins for colours, type and spacing, because it describes the shipped app.

## Principles

These come from the course [UI/UX checklist](https://webdev.cse.buffalo.edu/cse404/design/) and the Sprint 2 rubric, applied to GymRank.

1. **One app, one look.** Every page uses the same background, card, button and nav bar. A user should not be able to tell which teammate built a page.
2. **Always show where you are.** The top nav bar appears on every signed-in page, with the current page in white and bold. Onboarding shows a step indicator instead.
3. **Every action gets feedback.** Success and failure look different, and neither relies on colour alone: use text, an icon or a tick as well.
4. **Errors say what, why and how to fix.** Errors go next to the field they belong to, all at once, never one at a time.
5. **Empty is never blank.** An empty section says what is missing and offers the next step ("No workout selected yet" with "Browse workout plans ›").
6. **Usable at every size.** Phone, tablet and desktop all work: nothing is cut off, nothing needs sideways scrolling, and tap targets are at least 44px.

## Colour

Every screen supports two themes: **dark**, the default, and **light**. Text on any orange is dark, never white, in both.

### Dark and light mode

- **Colours come only from the `--gr-` variables** in `src/index.css`. Never write a hex, `rgb()`, `rgba()` or named colour (`white`) in a component's CSS, an inline `style`, or an SVG `fill`/`stroke`. Use `var(--gr-…)`, or `color-mix(in srgb, var(--gr-…) N%, transparent)` for a see-through tint. This is the rule that makes a new page work in light mode with no extra code.
- **How the switch works:** `<html data-theme="light">` turns on the `:root[data-theme="light"]` block in `src/index.css`, which gives every variable its light value. `src/theme/theme.js` sets the attribute, remembers it in the browser and saves it to the account through `api/theme.php`. Don't add per-page theme code or read the theme in a component to pick colours.
- **Always-dark pages:** sign-in, create account and the onboarding steps (personal details, training goal, experience, equipment, recommended plans) always show dark, whatever theme the account has saved. `isAlwaysDarkPath()` in `src/onboarding/onboardingRoute.js` lists them and `OnboardingGate` applies it, so these pages need no theme code; `index.html` repeats the list so they never flash light. They don't need checking in light mode.
- **Need a new colour?** Add a variable to BOTH blocks in `src/index.css`: the dark value in `:root` and the light value in `:root[data-theme="light"]`. Then add a row to the tables below with both values. A variable left out of the light block keeps its dark value in light mode.
- **Light-mode values:** pages are mid-light greys (page `#c9cdd4`, cards `#dde0e5`), never white. Orange *fills* (`brand`, `action`) are the same in both themes; orange and feedback *text* is darker in light mode so it keeps 4.5:1.
- **Check both themes.** Before opening a pull request for UI work, look at the page in light mode too: avatar menu → **Profile** → Appearance → **Light** (this saves to your account; select **Dark** to switch back). For a quick look without saving, run `document.documentElement.dataset.theme = 'light'` in the browser console.

### Backgrounds

| Token | Dark | Light | Use | Source |
|---|---|---|---|---|
| `bg-page` | `#0e1015` | `#c9cdd4` | Page background | `.dashboard-page`, `body` (auth.css) |
| `bg-nav` | `#14161b` | `#dde0e5` | Top nav bar | `.nav-bar` |
| `surface` | `#161820` | `#dde0e5` | Cards, metric tiles, panels, dialogs | `.dashboard-card`, `.dashboard-metric` |
| `surface-raised` | `#1d2029` | `#d3d7dd` | Icon tiles, numbered step markers, chips | `.dashboard-metric__icon`, `.dashboard-step__marker` |
| `surface-hover` | `#2a2e38` | `#c8ccd3` | Hover on a raised button (sign-in buttons) | `.social-buttons button:hover` |
| `surface-sunken` | `#12131a` | `#d6d9df` | Tip box, list inside a card | `.dashboard-tip`, `.dashboard-exercises` |
| `track` | `#2a2d38` | `#bfc4cc` | Empty part of a progress bar or meter | `.dashboard-progress` |
| `mobile-surface`, `mobile-raised`, `mobile-sunken` | `#162231`, `#243244`, `#101b29` | `#dde0e5`, `#d3d7dd`, `#d6d9df` | The phone Dashboard's navy cards, icon tiles and tip box | `index.css`, `@media (max-width: 640px)` |

### Text

| Token | Dark | Light | Use | Contrast (dark / light) |
|---|---|---|---|---|
| `text` | `#e8e9ec` | `#16181d` | Titles, values, item names | 14.6:1 / 13.4:1 on `surface` |
| `text-strong` | `#f4f6f9` | `#111318` | Phone headings and names | 15:1+ |
| `text-label` | `#b4b6bf` | `#3f444e` | Form field labels | 8:1+ |
| `text-subtle` | `#d2d3d7` | `#33373f` | Subtle buttons ("Cancel") | 9:1+ |
| `text-soft` | `#a2a5ad` | `#3f444e` | Body text inside cards | 7.2:1 / 6.1:1 on `bg-page` |
| `text-muted` | `#8b8d94` | `#4a4f59` | Eyebrow labels, hints, intro lines | 5.3:1 / 5.2:1 on `bg-page` |
| `nav-inactive` | `#8a8f99` | `#4a4f59` | Nav links that aren't the current page | 5.6:1 / 6.2:1 on `bg-nav` |
| `mobile-text-soft` | `#a6b4c7` | `#4a4f59` | Secondary text on the phone Dashboard | 7:1+ / 6.2:1 |
| `text-on-orange` | `#14161b` | `#14161b` | Text and ticks on `action` or `brand` | 5.7:1 |
| `on-brand` | `#ffffff` | `#ffffff` | Icons (not text) on the orange logo square | icon only, 3.1:1 |

### Brand and action

GymRank uses three oranges, each with one job. Don't swap them.

| Token | Dark | Light | Use | Text on it |
|---|---|---|---|---|
| `brand` | `#f2652e` | `#f2652e` | Logo square, "Start Workout" nav button, avatar, focus ring, today's day card border | `text-on-orange` (6.0:1) |
| `action` | `#e0703f` | `#e0703f` | Primary buttons, progress fill, completed step markers, selected borders | `text-on-orange` (5.7:1) |
| `action-text` | `#f2865a` | `#8a3410` | Orange text: text actions ("Choose goal"), accent values ("Getting started"), counts ("1 of 3") | n/a (7.0:1 on `surface` / 5.1:1 on `bg-page`) |
| `brand-text` | `#ff7035` | `#8a3410` | Orange eyebrows on the phone Dashboard | n/a |
| `link` | `#f2652e` | `#8a3410` | Links and text buttons on the sign-in pages ("Forgot password?", "Create an account"), the orange "rank." headline | n/a (5.1:1 on `bg-page` in light) |
| `brand-icon` | `#f2652e` | `#b8441a` | Orange icons, such as the current page in the phone menu | n/a (3:1+ for icons) |
| `mobile-icon` | `#f4f6f9` | `#8a3410` | Exercise icons on the phone Dashboard | n/a |
| `icon-invert` | `1` | `0` | Used as `filter: invert(var(--gr-icon-invert))` on single-colour black icons (the Apple logo) so they are white in dark mode and black in light | — |
| `selected-bg` | 16% `action` over `surface` | same formula | Selected option cards and chips | — |

White text on orange fails contrast (3.1:1 on `#f26a2e`), so it is not allowed.

### Borders and overlays

| Token | Dark | Light | Use |
|---|---|---|---|
| `border` | `rgba(255, 255, 255, 0.06)` | `rgba(17, 19, 24, 0.12)` | Card and tile outlines, dividers between list rows |
| `border-strong` | `rgba(255, 255, 255, 0.08)` | `rgba(17, 19, 24, 0.17)` | Nav bar bottom edge; outline of an unselected option card |
| `control-outline` | `#6b6f7a` | `#6a6f79` | Empty tick circle or checkbox ring (3:1+ on `surface` in both, the rule for controls) |
| `control-border`, `divider` | `#444958`, `#1e2027` | `#b4b9c2`, `#c0c5cc` | Sign-in button outlines, the "or" divider |
| `mobile-border`, `mobile-raised-border`, `mobile-line` | `#2c3b4c`, `#344558`, `#708196` | `#bfc4cc`, `#c0c5cc`, `#6a7079` | Lines on the phone Dashboard |
| `input-bg`, `input-text`, `input-placeholder`, `input-border` | white, `#1e1e1e`, `#aaaaaa`, `#d9d9d9` | `#e9ebee`, `#16181d`, `#555a64`, `#aeb3bc` | Sign-in and workout form inputs (white in dark mode, pale grey in light mode) |
| `neutral-button`, `neutral-button-hover`, `on-neutral` | `#2c2c2c`, `#3b3b3b`, `#f5f5f5` | `#16181d`, `#2e323a`, `#dde0e5` | The grey "Log in" button and its text |
| `backdrop`, `backdrop-strong` | `rgba(0, 0, 0, 0.5)`, `0.65` | `rgba(17, 19, 24, 0.35)`, `0.45` | Behind dialogs (`.modal-backdrop`) and the phone menu |
| `shadow-menu` | `0 12px 30px` `shadow-color` | same, lighter shadow | Account menu, dialogs (`shadow-color`, `shadow-soft`, `shadow-drawer` hold the shadow colours) |

### Feedback

From the login page's feedback messages (`.login-feedback`, cirexlul, PRs #37 and #40).

Dark values first, light values second.

| Token | Border | Background | Text | Use |
|---|---|---|---|---|
| `success` | `#63c792` / `#1f7547` | 8% / 10% tint | `#8de0ad` (11.3:1) / `#155a35` (5.2:1) | "Account setup saved. Log in to continue.", saved confirmations |
| `error` | `#ff968b` / `#b8302a` | 8% tint | `#ffb4aa` (10.4:1) / `#9a1d12` (5.1:1) | Form-level errors, failed requests |
| `danger` | n/a | hover: 12% `danger` | `#ff5c5c` (5.9:1) / `#9a1d12` (5.1:1); `danger-text` `#ff6670` / `#9a1d12` | Destructive actions: "Log out" |
| `warning` | `#f0cf65` / `#8a6300` | 8% / 10% tint | `#f5dc8c` (11.0:1) / `#634500` (5.5:1) | The "Intermediate" level badge on plan cards (Suryamur10, `.level-badge--intermediate`; Beginner uses `success`) |

Field-level errors use the `error` colours: a 2px `var(--gr-error)` outline on the input and `var(--gr-error-text)` text under it (`.input-wrap.invalid`, `.field-error`).

### Selected state (onboarding addition)

The Dashboard has no selectable cards, so the onboarding screens add one rule, based on the Dashboard's colours:

- Selected: 1.5px `action` border, background `action` at 16% over `surface` (`var(--gr-selected-bg)`), and a filled `action` circle with a dark tick.
- Not selected: 1.5px `border-strong` outline on `surface`, and an empty `control-outline` circle.
- Toggle buttons set `aria-pressed="true"` or `"false"`, so screen readers hear the state too.

## Typography

One family everywhere: `system-ui, sans-serif` (the device's own font: San Francisco on Apple, Segoe UI on Windows, Roboto on Android). It needs no download and matches the Dashboard.

| Role | Size / weight | Colour | Example | Source |
|---|---|---|---|---|
| Page title (`h1`) | 28px / 500 | `text` | "Welcome back, Jordan" | `.dashboard-header h1` |
| Big value | 24px / 600 | `text` or `action-text` | "0 of 5", "Getting started" | `.dashboard-metric__value` |
| Card title | 22px / 500 | `text` | "Your first-week checklist" | `.dashboard-card__title` |
| Option or item title | 15–16px / 500 | `text` | "Strength", "Log your first lift" | `.dashboard-step__text strong` |
| Intro line | 15px / 400 | `text-muted` | "Start by selecting a workout plan…" | `.dashboard-header p` |
| Body | 14px / 400 | `text-soft` | Card descriptions | `.dashboard-card__text` |
| Hint | 13px / 400 | `text-muted` | "Record weight and reps to track progress" | `.dashboard-metric__hint` |
| Text action | 13px / 600 | `action-text` | "Choose goal", "Browse plans" | `.dashboard-step__action` |
| Eyebrow | 12px / 500, uppercase, letter-spacing 0.1em | `text-muted` | "TODAY'S WORKOUT" | `.dashboard-card__heading h2` |
| Nav link | 14px / 500 (current: 600) | `nav-inactive` (current: `text`) | "Plans" | `.nav-bar__link` |
| Button | 15px / 600 | dark on orange | "Browse workout plans ›" | `.dashboard-primary-action` |

Rules:

- Use weights 400, 500 and 600 only.
- Sentence case everywhere ("Save and continue", not "Save And Continue"). Only eyebrow labels are uppercase, and the CSS does that, so write them in sentence case in the markup.
- Don't set fonts smaller than 12px.

## Spacing and layout

Spacing values in use: 2, 4, 6, 8, 10, 12, 16, 20, 24, 32, 48px. Prefer 8, 12, 16, 20 and 24.

| Where | Value |
|---|---|
| Page padding | 24px top and bottom, 48px sides (desktop); 20px at 900px wide or less |
| Between page sections and rows of cards | 16px |
| Between the two large cards side by side | 24px |
| Inside a card | 20px padding (metric tiles: 16px); 16px between items |
| List rows inside a card | 12px top and bottom, divided by a 1px `border` line |
| Nav bar | 20px 48px padding (16px 20px at 640px or less); links 32px apart (16px on phones) |

Layout patterns:

- **Metric row:** 3 equal columns (`repeat(3, minmax(0, 1fr))`), one column at 900px or less.
- **Overview:** 2 equal columns, one column at 900px or less.
- **Option cards** (onboarding): 3 columns on desktop, 2 at 960px or less, 1 at 640px or less.
- **Tile grid** (equipment): 4 columns on desktop and tablets, 2 columns on phones.

### Breakpoints

| Width | What changes | Source |
|---|---|---|
| 900px or less | Dashboard grids become one column; page padding 20px | index.css |
| 850px or less | Login and sign-up switch to the phone layout; the sign-up "×" appears | auth.css |
| 640px or less | Nav bar padding and link gaps shrink; plan rows wrap; weekly plan shows 2 days per row; onboarding goes to one column | index.css, onboarding.css |

New pages should use 900px and 640px. Test every page at 375×812 (phone) and 1440×900 (desktop), the sizes the Playwright tests use (`playwright.config.js`), and at a tablet width such as 768×1024.

## Shape and elevation

| Token | Value | Use |
|---|---|---|
| `radius-card` | 12px | Cards, metric tiles, panels, dialogs, option cards |
| `radius-inner` | 10px | Icon tiles, tip box, lists inside a card, day cards |
| `radius-button` | 8px | Buttons, inputs, feedback messages, account menu |
| `radius-pill` | 999px | Avatar, small badges ("Today") |
| circle | 50% | Step markers, tick circles |
| `radius-track` | 2px | Progress bar |

Elevation is flat: cards are separated by colour and a 1px `border`, not by shadows. Only floating things (account menu, dialogs) get `shadow-menu`.

## Components

Each entry lists the values and the class that implements it today.

### Nav bar (`src/NavBar.jsx`, `.nav-bar`)

- `bg-nav` background, `border-strong` bottom edge, 20px 48px padding.
- Left: 32px `brand` square with 8px corners, then "GymRank" in 16px / 500.
- Middle: Dashboard, Workouts, Plans, Progress, Leaderboard, Today. Current page: `text`, 600. Others: `nav-inactive`, 500. Pages that don't exist yet stay in the list with `aria-disabled="true"`.
- Right: "Start Workout" (`brand` background, dark text, 14px / 600, 8px corners, 8px 16px padding), then the 40px `brand` avatar with initials.
- On phones the bar wraps into rows: brand, links, actions. It never hides links behind a back button.

### Page header (`.dashboard-header`)

Eyebrow (optional), `h1` page title, one intro line in `text-muted`. 6px between them.

### Card (`.dashboard-card`)

`surface`, 1px `border`, 12px corners, 20px padding. Card heading row: eyebrow on the left, optional meta on the right (13px `text-muted`, or `action-text` 600 for counts like "1 of 3"). Then a 22px card title, 8px below the heading.

### Metric tile (`.dashboard-metric`)

Card styling with 16px padding: a 44px `surface-raised` icon tile (10px corners, inset 1px `border`), then eyebrow label, big value and hint.

### Buttons

| Kind | Look | Use | Class today |
|---|---|---|---|
| Primary | `action` background, `text-on-orange` text, 15px / 600, 12px padding, 8px corners, full width in cards | The one main action on a card or page | `.dashboard-primary-action` |
| Nav action | `brand` background, `text-on-orange` text, 14px / 600, 8px 16px padding | "Start Workout" only | `.nav-bar__start-workout` |
| Text action | No background, `action-text`, 13px / 600 | Secondary actions in lists ("Choose goal") | `.dashboard-step__action` |
| Subtle | No background, `text-subtle` text | "Cancel" in dialogs | `.button-subtle` |

- Forward-moving actions may end in " ›" ("Browse workout plans ›"), as on the Dashboard.
- Disabled: keep the shape, grey it out (`surface-raised` background, `nav-inactive` text) and use `cursor: not-allowed`. Also say why near the button ("Pick one goal to continue.").
- Buttons are real `<button>` elements (or `<Link>` for navigation), never clickable `<div>`s.

### Checklist and step markers (`.dashboard-steps`)

Rows with a 32px circle marker, a title (15px / 500) and a hint (13px), divided by `border` lines. Done: `action` circle with a dark tick (✓). To do: `surface-raised` circle with the step number in `text-muted`. An optional text action sits on the right.

### Progress bar (`.dashboard-progress`)

4px high, `track` background, `action` fill, 2px corners, with `role="progressbar"` and its `aria-value…` attributes.

### Tip box and inner list (`.dashboard-tip`, `.dashboard-exercises`)

`surface-sunken`, 10px corners, 12px padding. A bold lead-in ("**Beginner tip:**") in `text`, the rest in `text-soft`.

### Feedback message (`.login-feedback`)

A box above the form: 10px 12px padding, 8px corners, 1px border, 13px text, coloured with `success` or `error`. Success messages use `role="status"`; errors use `role="alert"`. Errors about one field go under that field instead.

### Form field (`src/auth/FormField.jsx`)

- Label above the input, 13px.
- Input: 42px minimum height, 8px corners, 16px text, so phones don't zoom.
- Focus: 4px `brand` outline.
- Invalid: 2px `error` outline, `aria-invalid="true"`, and the message in `error-text` under the field, linked with `aria-describedby`.
- Mark required fields as required, and show any format rule before the user submits (course checklist).

### Dialog (`src/SwitchPlanModal.jsx`)

`surface`, 12px corners, 24px padding, at most 380px wide, over the `backdrop`, which covers the whole page including the nav bar. Title 22px / 500, body 13px `text-muted`. Closes with Cancel, Escape, or a click on the backdrop. Uses `role="dialog"` and `aria-modal="true"`, and moves focus to its main button when it opens.

### Plan card (plan library, `.plan-list__item`)

- A `surface` card with 12px corners: "N days/wk" in `action-text`, the plan name, a coloured level badge (Beginner `success`, Intermediate `warning`, Advanced `error`) with the length, the equipment it needs as icons with labels, and a green or red dot for whether you have that equipment (Suryamur10, PR #44).
- The whole card opens the plan's details; its button, name link and dot keep their own actions.
- "Select" is a full-width primary button. Your current plan's card has an `action` border, and its button reads "Current plan" with a tick, greyed out.
- "Your setup" (`src/YourSetup.jsx`) sits under the heading of the plan library and of "Choose your workout plan": an eyebrow label, the saved goal · experience · equipment, and an "Edit" text action to the goal page.

### Day card (weekly plan, `.day-card`)

`surface`, 10px corners. Today: `brand` border, `brand` at 15% background, weekday and status in `action-text`, and the word "Today" (not colour alone). Rest days show "Rest day" in `text-muted`. Computers show seven cards in a row (four per row at 900px or less); phones show a stacked list, one row per day with the weekday, the workout and its status.

### Workout history row and set tables (`src/history/`, added by #106)

- The page is a 900px column centred under the nav (Figma "1 — Workout history"), with 20px between the breadcrumb, heading, rows and pager.
- Each finished workout is a `surface` card with 12px corners whose top is one button: the name (16/500) over the date in `text-soft` ("Friday, October 9, 2026", New York time) on the left, and the size in `text-muted` ("3 exercises · 9 sets") and a chevron that turns when open on the right. `aria-expanded` says whether it is open. Phones move the size under the date.
- Open, it shows one table per exercise on `surface-sunken` with 10px corners: the exercise name as the caption, then Set, Reps and Weight (right-aligned). A 0 lb set reads "Bodyweight". Computers fit up to three tables per row; phones show one.
- Pager: "Showing 1–4 of 6 workouts" in `text-muted`, then Previous, page numbers and Next, each at least 44 × 44px. The current page is an `action` button; disabled ends are at 40% opacity.

### Progress page (`src/progress/`, added by #110)

- The same 900px column as the history page (Figma "1 — Progress (30 days · Bench press)", narrowed to one exercise at a time). Heading "Your progress", then "<name> · All time" in `text-muted`.
- Range control: "30 days", "90 days" and "All time" in one `surface` box; the selected one is `surface-raised` with `aria-pressed="true"`. Each button is at least 44px tall and the three stay on one line on a phone.
- Four total tiles (Volume, Strength gain, New PRs, Workouts logged): `surface` cards with a 13px `text-muted` label over a 22px value, 4 across on a computer and 2 × 2 below 900px. A value that can't be worked out is "—".
- "Workout history" is a full-width `surface` link card with a caption and a chevron, opening `#/progress/history`.
- The "Exercise" drop-down lists every exercise A to Z. The chosen exercise is one `surface` card: metric tiles on `surface-sunken` (3 across, 2 on a phone), a line chart in `action-text` with one point per workout and a text label for screen readers, a table of its workouts (Date, Heaviest set, Est. 1RM, Volume; numbers right-aligned), and its personal records with the new best in `success-text`. A bodyweight exercise says so and shows reps instead of weights.
- Empty, loading and error states follow the history page: "No progress to track yet" with "Start a workout", "Loading your progress...", and the `error` box with "Try again".

### Leaderboard page (`src/leaderboard/`, added by #120)

Follows research task 113's frames D1, D4 and P1b without the tier parts (no sourced DOTS tier cutoffs yet).

- The same 900px column as the Progress page. Heading "Leaderboard", then one `text-muted` line on how DOTS scores are worked out.
- Your card (`surface`, 12px corners): a 48px `action` initials circle, your name (18/500) and "Body weight 200 lb · Leave the leaderboard" in `text-muted`; on the right "Rank · Overall" (12px), the rank in `action-text` 20/600 ("#15 of 51 on Overall") and the score ("156.29 DOTS points"). Under it, three lift tiles on `surface-sunken` (lift name, your estimated 1RM at 22px; the current board's lift outlined in `action`) and a 12px note. Only you see lb. Not ranked: an "Unranked" pill, "Not on any board yet" and Rank "—".
- "How to get ranked": its own `surface` card with an uppercase eyebrow, four steps with 28px numbered markers that become `success` ticks, a 4px `track`/`action` bar for workouts, and "Start a workout ›". Nonbinary and Prefer not to say accounts get a "Scoring table" radio group on `surface-sunken` in step 1.
- The board card (`surface`): an Everyone / Friends (Later, disabled) switch, then underlined lift tabs ("Overall", "Bench press", "Back squat", "Deadlift"; `aria-pressed`, `action` underline; on a phone one line of short labels, Overall · Bench · Squat · Deadlift, with the full name as the accessible name; the board is in the address, `#/leaderboard?board=bench`). While another board loads, the last one stays on screen at 55% opacity so the page keeps its scroll position. Uppercase Rank / Athlete / Score headers, 48px rows with a 28px initials circle and the score right-aligned with tabular figures. Your row has an `action` outline on `selected-bg`, an `action` initials circle and a "You" pill. A centred "· · ·" row marks the jump from the top 10 (plus anyone tied with 10th) to your place, and a 12px note explains ties. On a phone your row is pinned to the bottom (`surface-raised`, `action` outline, `shadow-menu`) while it is off screen.
- Empty, loading and error states sit inside the board card: "Nobody is ranked on Bench press yet.", "Loading the leaderboard...", and the `error` box with "Try again". After leaving, a `success` notice says the workouts are kept.

### Gym backdrop (`src/components/GymBackdrop.jsx`, added by #93)

A gym photo band for the top of a page, as one component so every page uses the same one.

- Props: `image`, the photo (a path under `public/`, such as `"backdrops/rack.webp"`; without one the band is plain dark); `height`, the band's height in px on computers (default 220); `phoneHeight`, its height at 640px wide or less (default 168); and `children`, the content on top. Children are stacked top to bottom with the space between them, so the first one (the logo) sits at the top and the last (a step indicator) on the lower edge.
- The photo is covered by a gradient that ends in `bg-page`, so the bottom of the band blends into the page. Put text only on the dark lower part, and check it with the contrast rule in [Photos and gym backdrops](#photos-and-gym-backdrops).
- The photo is decoration (a CSS background), and the page still makes sense if it fails to load.
- Styles live next to it in `src/components/GymBackdrop.css`. The onboarding pages get it through `OnboardingShell` (`src/onboarding/parts.jsx`, prop `backdrop`).

```jsx
import GymBackdrop from './components/GymBackdrop.jsx'

<GymBackdrop image="backdrops/rack.webp" height={220} phoneHeight={168}>
  <Link className="nav-bar__brand" to="/dashboard">…</Link>
  <nav aria-label="Setup progress">…</nav>
</GymBackdrop>
```

### Selectable option card (onboarding addition)

Used for training goal and experience level. The experience cards' icon is three bars lit up to the level (one for Beginner, three for Advanced).

- A `<button>` with `aria-pressed`, 12px corners (`ChoiceCard` in `src/onboarding/parts.jsx`).
- Computers: cards side by side, at least 180px tall with 20px padding. The 44px icon tile is top left and the tick circle top right; under them the title (16px / 500), the description (14px `text-soft`) and the "Select" / "Selected" pill at the bottom.
- Phones: full-width rows, at least 76px tall, 14px 16px padding: icon tile on the left, title, description and pill in the middle, tick circle on the right.
- Colours from [Selected state](#selected-state-onboarding-addition). One choice at a time.

### Equipment tile (onboarding addition)

- Square-ish button with `aria-pressed`, at least 84px tall (104px on desktop): a 28–32px stroke icon on top, the label underneath (15px / 500), and a 20px tick circle in the top-right corner. Selected: the same border, tint and filled tick as option cards, with the icon in `action-text`.
- Several can be selected.
- "Bodyweight only" is a full-width option row above the grid (icon tile, title 16px / 600 with a one-line description, tick circle on the right), then the divider "or pick what you have". Choosing it clears the others, and choosing any tile clears it.
- Every tile has a text label. Never show an icon without one.

### Onboarding page parts (`src/onboarding/parts.jsx`)

- `SaveBar`: the step's primary button ("Save goal", "Save and continue") with the reason it's greyed out under it ("Pick one goal to continue."). Top right next to the heading on computers; a full-width bar fixed to the bottom of the screen on phones, at least 48px tall.
- `BackLink`: "Back to …" with a chevron, above the heading, at least 44px tall.
- "Log out" sits at the top right of the photo band on every onboarding page (onboarding has no NavBar, and an unfinished account can't reach the Dashboard). It works like the NavBar's: the login page opens with "You are logged out.". `text` on a 70% `bg-page` backing, so it stays readable on any photo.
- The step indicator shows Personal details, Training goal, Experience, Equipment and Choose plan as bars with names on the photo band. The current step is `text` and bold; finished steps have an `action` bar.
- Personal details uses a centered form (720px maximum), a labelled weight input and four exclusive gender buttons. The choices use two columns on desktop and one on phones. Its save button stays in the document flow so it cannot cover fields. Existing accounts enter from the Dashboard with the shared navigation and a Back to Dashboard link instead of an onboarding stepper.

### Empty, loading and error states

| State | Pattern | Example |
|---|---|---|
| Empty | Card title saying what's missing, one line on what to do, a primary action | "No workout selected yet" / "Start by selecting a workout plan…" / "Browse workout plans ›" |
| Loading | A plain line in `text-muted` where the content will appear, with `aria-busy="true"` on the card | "Loading your dashboard..." |
| Error | A message in place of the content that names what failed; add what to do next | "Error loading your plan: …" (weekly plan); "Couldn't load your workout history. Check your connection and try again." with Try again (workout history) |

## Icons and imagery

### Icons

- Inline SVG on a 24×24 grid, 1.8–2px stroke, round line caps and joins, no fill, colour from the surrounding text (`stroke="currentColor"`).
- Sizes: 14–16px next to small text, 24px in icon tiles, 28–32px on equipment tiles.
- Decorative icons get `aria-hidden="true"`. An icon-only button needs an `aria-label`.

### Brand assets

Third-party logos live in `public/brand/`, with their source and usage rules in `public/brand/SOURCES.md` (cirexlul, PR #40). Follow the same pattern for every image.

### Photos and gym backdrops

- Use only photos the team took or ones with a free licence that allows use in an app (for example the Unsplash or Pexels licence). Record each one in a `SOURCES.md` next to it, with the link and licence.
- Never use screenshots or images from other apps or from design galleries such as Mobbin.
- Photos sit behind a gradient that fades into `bg-page`, so text over them still meets 4.5:1. Measure the contrast on the lightest part of the photo under the text.
- Photos are decoration: `alt=""` unless the image carries meaning.

## Writing

- Short and direct. Talk to the user ("Your first-week checklist").
- Buttons say what happens next: "Save and continue", "Browse workout plans ›", "Switch plan". Avoid "Submit" or "OK".
- Error messages answer what went wrong, why, and what to do ("Use 12+ characters with letters, numbers & symbols.").
- Confirmations say what was saved: "Account setup saved. Log in to continue."
- Placeholder text is never the only instruction, because it disappears when you type.
- Use the same words for the same thing on every page: "workout plan", "training goal", "experience", "equipment", "Dashboard".

## Accessibility checklist

- [ ] Text contrast at least 4.5:1 (3:1 for 24px and larger). Controls and focus rings at least 3:1. The token tables list the measured ratios.
- [ ] Focus is always visible: the app-wide focus ring is a 3px `brand` outline, 3px out (`:focus-visible` in auth.css). Don't remove outlines without replacing them.
- [ ] Tap targets are at least 44×44px on phones.
- [ ] State isn't shown by colour alone: selected items also get a tick, errors also get text, and today also says "Today".
- [ ] Toggles use `aria-pressed`. The current nav link uses `aria-current="page"`. Messages use `role="status"` or `role="alert"`.
- [ ] Every input has a visible `<label>`.
- [ ] Animations are short (120ms for colour changes in onboarding) and sit inside `@media (prefers-reduced-motion: no-preference)`.
- [ ] The page works at 375px wide with no sideways scrolling.
- [ ] The page looks right in both dark and light mode, at desktop and phone width, and its CSS has no hex, rgb or named colours (see [Dark and light mode](#dark-and-light-mode)).

## Known differences in the current code

As of task #95 (2026-10-09). These pages predate the Dashboard redesign and should move to the tokens above through upgrade tasks.

| Area | What it uses now | Should use | File | Task |
|---|---|---|---|---|
| Login and sign-up | Grey "Log in" / "Create account" button (`neutral-button`) on desktop; white input fields; brand square 24px; sign-up card 16px corners | `action` primary; 32px brand square; 12px corners | `src/auth/auth.css` | #97, #99 |
| Font setup | `:root` in auth.css still names Inter. `body` in index.css sets system-ui, so Inter shows nowhere (onboarding moved to `--gr-font` in #93), but the rule is misleading | Drop Inter from `:root` | `src/auth/auth.css` | #99 |
| Breakpoints | 960, 900, 850, 640 and 480px | 900px and 640px | all three stylesheets | as each page is upgraded |

## CSS variables

Defined once in `src/index.css` (task #93; light values added by the Persistent User Theme Preference task), so every stylesheet shares them. Use `var(--gr-…)` instead of writing a colour. Names use a `--gr-` prefix so they can't clash with the onboarding's older `--ob-` variables while both exist.

`src/index.css` is the source of truth for the full list; the tables above give each one's dark and light value and its use. The file has two blocks, and every colour variable appears in both:

```css
:root {                      /* dark, the default */
  --gr-bg-page: #0e1015;
  --gr-text: #e8e9ec;
  /* …every other --gr- variable… */
}

:root[data-theme="light"] {  /* light: the same names with light values */
  --gr-bg-page: #c9cdd4;
  --gr-text: #16181d;
  /* … */
}
```

Variables that are the same in both themes (`brand`, `action`, `text-on-orange`, `on-brand`, the radii and the font) are only in the first block.

## References

- Course [UI/UX checklist](https://webdev.cse.buffalo.edu/cse404/design/) and [Sprint 2 rubric](https://webdev.cse.buffalo.edu/cse404/442rubric2/) (Usability, Sizing).
- Figma [GymRank Prototype page](https://www.figma.com/design/JMSaaXvmkMfjxrQuQqQ7CV/GymRank?node-id=94-94).
- Pattern references on Mobbin (a free account is needed to open them; use them for ideas only, never copy screens or images):
  - Goal choice as full-width cards with a radio tick: [Tonal](https://mobbin.com/screens/a0bb4e2e-0082-4b57-b943-0600d062256d), [WHOOP](https://mobbin.com/screens/3dd64dce-3e4b-4603-92f6-cdaf5e38ac1f).
  - Experience level cards with one-line descriptions: [Strava](https://mobbin.com/screens/9abe1e4c-91ff-46bd-8304-247f8ff09446), [Bevel](https://mobbin.com/screens/ca012035-d801-42fb-bf6b-89954314cfe6).
  - Equipment tiles with icons, plus a separate "no equipment" option: [Peloton](https://mobbin.com/screens/222b1212-1f9e-4ccf-a4c1-351e9dd47144), [Future](https://mobbin.com/screens/4d08977f-bcee-4881-a6b1-6df84287ebb9).
  - Plan cards showing level, length and days per week: [Tempo](https://mobbin.com/screens/3b6166f4-9ea0-46a3-b1c0-5c27047344d4), [Hevy](https://mobbin.com/screens/e9573e72-406e-476d-9218-b7902620154a).
- Source files: `src/index.css` (colour variables for both themes, nav bar, Dashboard, plans, weekly plan, dialog), `src/theme/theme.js` (switching, remembering and saving the theme), `src/auth/auth.css` (login, sign-up, form fields, feedback), `src/onboarding/onboarding.css` (goal and setup steps).

## Changing this guide

Update this file in the same task and pull request as the UI change it describes, and keep the tables in step with the stylesheets. If you find a page that disagrees with this guide, either fix the page in an upgrade task or add a row to [Known differences in the current code](#known-differences-in-the-current-code).
