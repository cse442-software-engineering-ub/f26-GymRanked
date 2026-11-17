# Task tests: Consistent page widths and no breadcrumb trails (upgrade task under story #86)

Upgrade task under story #86 (*view my home dashboard after logging in*, the signed-in app shell). Card #130, Sprint 4, owner Mansur. Frontend only: no API, database or seed change.

**Status: draft for review. Nothing is implemented.** After review the card gets its own branch from `dev` (`130-Consistent-page-widths-no-breadcrumbs`), separate from #71 (Buddies backend) and from the Plans layout card (#129, `129-plans-layout-more-plans.md`).

## What this card adds

### 1. One page width

Every signed-in page chooses its own width today, so the page jumps when you switch tabs:

| Page group | Today on a 1440 px screen |
| --- | --- |
| Dashboard, Workouts (weekly plan), Active workout, Today's logger, Plan library, Onboarding steps | Full width: 48 px side padding, nothing limits it (`.dashboard-content`, `.weekly-plan`, `.plan-library__content`, `.onboarding`) |
| Progress, Workout history, Leaderboard, Weekly consistency rankings, Weekly goal | 900 px column with wide grey margins (`.progress-page__content`, `.history-page__content`, `.leaderboard-page__content`, `.weekly-page__content`, `.weekly-goal-page__content`) |
| Plan details | 796 px column (`.plan-details`) |
| Individual exercise | 640 px column (`.exercise-session`) |
| Profile and its edit pages | 1000 px column (`.profile-content`) |
| Saved summary | 1320 px column (`.workout-summary`) |

This card gives all of them one shared column:

- **1200 px wide at most, side padding included, centred.** On a 1440 px screen the page title therefore starts 168 px from the left edge (120 px margin + 48 px padding) and the content is 1104 px wide; on a screen 1200 px or narrower it uses the whole width. On a phone (640 px or less) the side padding is 20 px. The values are two variables in `src/index.css` (`--gr-page-width: 1200px`, `--gr-page-gutter: 48px`; 20 px on a phone) that each page wrapper uses, so a future page gets the same width by using them.
- **Same top spacing.** The page title starts the same distance under the navigation bar on every page (32 px on a computer, 24 px on a phone) and the gap between the sections of a page is the same.
- **Narrow pages are a narrow column, centred in the page column.** Edit personal details, Edit training preferences (720 px), Weekly goal (852 px), Plan details (796 px) and the Individual exercise page (640 px) keep their own narrow width, and that whole column (back link, title and content together) is centred in the page, with a popup always covering the full screen. Pages that are not narrow use the full column and their title starts at the shared left edge.
- The photo band on Active workout (and on the onboarding pages) stays full width, but its text now sits on the same column as the page below it.
- Sign-in and Create account are full-screen landing pages with no navigation bar. They keep their own two-sided layout and are only checked for spacing.

### 2. No breadcrumb trails

The breadcrumb ("Weekly plan › Plans") is removed from the four pages that show it: Plan library, Plan details, Individual exercise and Workout history. `src/Breadcrumb.jsx`, `src/assets/crumb-separator.svg` and the `.breadcrumb*` CSS are deleted.

Where the user still needs a way back, the page gets one clear action in the place the trail was, a "‹ Back to …" link (the existing `BackLink` from `src/onboarding/parts.jsx` is reused, moved to a shared place so non-onboarding pages can use it):

| Page | Back action | Goes to |
| --- | --- | --- |
| Plan details (`#/plans/:id`) | Back to plan library | `#/plans` |
| Individual exercise (`#/workout/active/:index`) | Back to workout | `#/workout/active` |
| Workout history (`#/progress/history`) | Back to progress | `#/progress` |
| Plan library (`#/plans`) | none: it is a top-level page reached from the navigation bar | |

Existing "Back to …" links (Active workout after finishing, the onboarding steps) are unchanged.

### 3. Spacing pass

The five page groups on the review list are checked page by page in Task Tests 6 to 10: no sideways scrolling, nothing cut off, the title and content on the shared left edge, the same gap under the navigation bar, and a phone side gutter of 20 px.

Files expected to change: `src/index.css`, `src/progress/progress.css`, `src/history/history.css`, `src/leaderboard/leaderboard.css`, `src/weekly/weekly.css`, `src/weeklyGoal/weeklyGoal.css`, `src/profile/profile.css`, `src/workoutLog/workoutSummary.css`, `src/onboarding/onboarding.css`, `src/PlanDetails.jsx`, `src/WorkoutPlanLibrary.jsx`, `src/ExerciseSession.jsx`, `src/history/WorkoutHistoryPage.jsx`, `src/onboarding/parts.jsx` (the onboarding back link now uses the shared one), `src/onboarding/personalDetails.css`, `src/components/GymBackdrop.css` (the photo band's text sits on the page column), new `src/BackLink.jsx`, `DESIGN.md` (a "Page layout" section and the history/progress paragraphs that say "900px column" and "breadcrumb"). Deleted: `src/Breadcrumb.jsx`, `src/assets/crumb-separator.svg`.

## What this card does not change

- Colours (everything keeps using the `--gr-` variables; no new colour is added).
- The navigation bar, the Plans page order and "More plans" toggle (the Plans layout card owns those; both cards edit `src/WorkoutPlanLibrary.jsx`, this one only the breadcrumb line and the width class, so whichever merges second merges `dev` first).
- Page content, API calls and the Buddies page (#79).

## Open questions for review

1. Is 1200 px the right width? The Dashboard is 1344 px of content at 1440 today and Progress is 900 px, so 1200 is a middle choice. Say so before implementation if you want a different number; it is one variable.
2. Saved summary is 1320 px wide today and is brought down to the same 1200 px. Its two-column layout needs checking at 1200 (Task Test 9).
3. Buddies: it is checked only once Sam's #79 is on `dev` (Task Test 10). Until then that part is "not run".

## Setup (do this once before the Task Tests)

1. Connect to the UB VPN or campus network.
2. Test account: on https://aptitude.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login click "Create an account" and create `layout-86@test.com` with the password `ABC12345678@` (Full name: Layout Eightysix). Log in and finish the onboarding (body weight 180 and Man, "Strength", "Intermediate", "Full gym access") and choose "Push Pull Legs". Log one set in "Today" and finish that workout, so Progress, Workout history, Saved summary and the rankings have data.
3. Use Chrome DevTools device mode. The two review sizes are **1440 x 900** (desktop) and **375 x 812** (phone). Switch with the Dimensions box at the top of the viewport and reload after switching.
4. Page addresses all start with `https://aptitude.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/` and end with:

   | Page | Ends with |
   | --- | --- |
   | Log in / Create account | `#/login` / `#/register` |
   | Personal details, Training goal, Experience, Equipment, Recommended plans | `#/personal-details`, `#/goal`, `#/experience`, `#/equipment`, `#/recommended` |
   | Dashboard, Workouts, Plan library | `#/dashboard`, `#/weekly-plan`, `#/plans` |
   | Plan details, Weekly goal | `#/plans/` + a plan, `#/weekly-goal` |
   | Active workout, Individual exercise | `#/workout/active`, `#/workout/active/0` |
   | Today's logger, Saved-session logger, Saved summary | `#/workouts/today`, `#/workouts/` + session id, `#/workouts/` + session id + `/summary` |
   | Progress, Workout history | `#/progress`, `#/progress/history` |
   | Weekly consistency rankings, Strength rankings | `#/leaderboard/weekly`, `#/leaderboard` |
   | Profile, Edit personal details, Edit training preferences | `#/profile`, `#/profile/personal-details`, `#/profile/training-preferences` |
   | Buddies | the address of Sam's page (#79), once it exists |

   Onboarding addresses open only for an account that has not finished that step; use "Edit" on "Your setup" or Profile to reach them, or a second fresh account.
5. To measure a page, paste this in the DevTools console. It prints where the title and the first block of the page start, how wide the page content is, how far the first block is under the navigation bar, and whether the page scrolls sideways:

   ```js
   (() => { const m = document.querySelector('main'), h = document.querySelector('h1'), n = document.querySelector('.nav-bar'), first = m.firstElementChild;
     const r = (e) => e.getBoundingClientRect();
     return { titleLeft: h ? Math.round(r(h).left) : null, firstBlockLeft: Math.round(r(first).left), contentWidth: Math.round(r(m).width),
       topGap: n && m.previousElementSibling === n ? Math.round(r(first).top - r(n).bottom) : null,
       sidewaysScroll: document.documentElement.scrollWidth > innerWidth } })()
   ```

   Expected on every signed-in page at 1440 x 900: `firstBlockLeft` 168, `contentWidth` 1200 and `sidewaysScroll` false. At 375 x 812: `firstBlockLeft` 20, `contentWidth` 375. `titleLeft` is the same number as `firstBlockLeft`, except where the title sits inside a card (Weekly consistency rankings, Saved summary) so it starts a little to the right of the card's own edge. `topGap` is 32 on a computer and 24 on a phone on every page that starts straight under the navigation bar; it is `null` on Active workout, which starts with a photo band (its title is still at 168 / 20).

## Task Test 1: Dashboard and Progress line up on a computer

Steps:
1. Sign in as layout-86@test.com. In DevTools set 1440 x 900.
2. Open the Dashboard (`#/dashboard`) in one browser window and Progress (`#/progress`) in a second window of the same size, side by side (or two tabs of the same window, switching between them with Ctrl+Tab). Take a screenshot of each at 1440 x 900 and attach both to the card.
3. The page title ("Welcome back, Layout" on the Dashboard, "Your progress" on Progress) should start at the same distance from the left edge. Measure each: `titleLeft` and `firstBlockLeft` should be 168 on both.
4. The main content should start and end at the same two points on both pages: each should be 1104 px wide, with 120 px of margin on each side (use the console measurement, or hold a ruler to the screenshots). The Dashboard should no longer reach the screen edges, and Progress should no longer leave a wide grey margin beside it.
5. Switch between the two tabs several times. The title and the left and right edges of the content should not move.
6. Set the screen to 1920 x 1080 and repeat the measurement. `contentWidth` should be 1200 on both pages and `firstBlockLeft` 408 (720 px of margin split 360 + 360, plus 48 px of padding; the column does not keep growing).

## Task Test 2: Dashboard and Progress line up on a phone

Steps:
1. Set 375 x 812 and reload. Open the Dashboard, then Progress.
2. `firstBlockLeft` should be 20 on both and `contentWidth` 375 (the full width) on both. There should be no sideways scroll on either.
3. Switch between the two pages. The page titles should stay at the same distance from the left edge, and the cards should reach the same left and right edges (20 px from each side). Take a screenshot of each and attach both to the card.

## Task Test 3: Narrow pages are centred in the page

Steps:
1. At 1440 x 900, open "Edit personal details", "Edit training preferences", "Weekly goal", "Plan details" (click any plan card) and "Individual exercise" (from Workouts, open any exercise).
2. On each, the whole narrow column (the back link, the title and the form or content) should sit in the middle of the page, with the same amount of empty space on its left and its right. It should not be pushed against the left with empty space on the right. Paste this in the console on each page: it prints the space left of and right of the main content block, and the two numbers should be within 2 px of each other:

   ```js
   (() => { const m = document.querySelector('main'); const kids = [...m.children].filter((e) => !e.classList.contains('back-link') && e.getBoundingClientRect().width); const l = Math.min(...kids.map((e) => e.getBoundingClientRect().left)), r = Math.max(...kids.map((e) => e.getBoundingClientRect().right)); return { left: Math.round(l), right: Math.round(innerWidth - r) } })()
   ```
3. At 1920 x 1080 the same two numbers should still match.
4. At 375 x 812 each page should use the full width of the 20 px gutters, with no sideways scroll.

## Task Test 4: Breadcrumb trails are gone from every page

Steps:
1. At 1440 x 900, open each of these pages and look above the page title: Plan library, Plan details (click any plan card), Active workout, Individual exercise, Workout history, Progress, Weekly consistency rankings, Strength rankings, Weekly goal, Profile, Edit personal details, Edit training preferences.
2. No page should show a trail of linked page names separated by arrows (for example "Weekly plan › Plans" or "Progress › Workout history").
3. On each page run `document.querySelector('.breadcrumb, [aria-label="Breadcrumb"]')` in the console. It should return `null`.
4. Repeat on Plan library, Plan details and Workout history at 375 x 812. No trail should appear, and the title should not have an empty gap above it where the trail used to be.

## Task Test 5: Where a way back is needed, there is one clear "Back to ..." action

Steps:
1. Open the Plan library, click any plan card (not its button). Above the plan name there should be one link, "Back to plan library", with an arrow. Click it. The Plan library (`#/plans`) should open.
2. Open Workouts, then "Start workout" (or Resume workout) to reach Active workout, then open one exercise. Above the exercise name there should be one link, "Back to workout". Click it. Active workout (`#/workout/active`) should open.
3. Open Progress, then "Workout history". Above "Workout history" there should be one link, "Back to progress". Click it. Progress (`#/progress`) should open.
4. On each of the three pages there should be exactly one back link: only the "Back to ..." one, with no second trail or link going to the same place.
5. Plan library, Dashboard and Progress are top-level pages and should have no "Back to ..." link.
6. At 375 x 812 each back link should be at least 44 px tall and reachable with the Tab key with a visible focus ring. Press Enter on it: it should go to the same page as in steps 1 to 3.
7. Open Profile > Appearance > "Light" and check that the three links are readable in light mode too; then choose "Dark" again.

## Task Test 6: Spacing, onboarding pages

Steps (run at 1440 x 900, then at 375 x 812; these pages are always dark):
1. Open each page: Log in, Create account, Personal details, Training goal, Experience, Equipment, Recommended plans.
2. On Log in and Create account: the card is fully visible and not cut off, it does not touch the screen edges (at least 20 px on a phone), and nothing scrolls sideways. On the other five pages: `firstBlockLeft` and `titleLeft` are 168 on a computer and 20 on a phone (Personal details is the exception: it is a narrow 720 px column centred in the page like the other narrow pages, so it starts further in on a computer), the logo in the photo band lines up with them, and the cards and buttons are not squeezed against the edges.
3. On each page the Back link (where there is one, such as "Back to experience") sits above the title in the same place and is at least 44 px tall.

## Task Test 7: Spacing, Dashboard, Workouts, Plan library, Plan details and Weekly goal

Steps (run at 1440 x 900 and 375 x 812, in Dark and in Light mode):
1. Open each of the five pages.
2. On every page `titleLeft` should be 168 on a computer and 20 on a phone, and `sidewaysScroll` false. Plan details and Weekly goal are narrow pages, so they are centred instead (Task Test 3): check that the space left and right of the content matches. `topGap` should be 32 on a computer and 24 on a phone on every one of them.
3. Scroll to the bottom of each page. The last card should have space below it (at least 32 px) and not stop at the screen edge.
4. The gap between sections should look even: no section should sit noticeably closer to its neighbour than the others.

## Task Test 8: Spacing, Active workout, Individual exercise, Today's logger, Saved-session logger and Saved summary

Steps (run at 1440 x 900 and 375 x 812, in Dark and in Light mode):
1. Open Active workout, one Individual exercise, Today's logger, the Saved-session logger (`#/workouts/` + the id of the workout finished in Setup) and its Saved summary.
2. The same measurements as Task Test 7 apply to all five, except that Individual exercise is a narrow page and is centred (Task Test 3): `firstBlockLeft` 168 on a computer and 20 on a phone for the other four, no sideways scroll, `topGap` 32 / 24, space below the last card.
3. Saved summary at 1440 px should now use the 1200 px column. Its two columns (if shown) should not overlap, and no table should be cut off.
4. In the set logger, the weight and reps boxes, the buttons and the rest timer should not be pressed against the edge of the screen on a phone.

## Task Test 9: Spacing, Progress, Workout history, Weekly consistency rankings and Strength rankings

Steps (run at 1440 x 900 and 375 x 812, in Dark and in Light mode):
1. Open Progress, Workout history, Weekly consistency rankings (`#/leaderboard/weekly`) and Strength rankings (`#/leaderboard`).
2. `firstBlockLeft` 168 on a computer and 20 on a phone, no sideways scroll, `topGap` 32 / 24. Progress, Workout history and the two rankings pages should now be exactly as wide as the Dashboard.
3. On Progress the metric tiles, the chart and the workouts table should fill the wider column, with no tile touching another and nothing cut off. On Workout history open one workout: the exercise tables should fit and the pager should stay on one line at 375 px.

## Task Test 10: Spacing, Profile, Edit personal details, Edit training preferences and Buddies

Steps (run at 1440 x 900 and 375 x 812, in Dark and in Light mode):
1. Open Profile, Edit personal details and Edit training preferences. Profile: `firstBlockLeft` 168 on a computer and 20 on a phone, no sideways scroll, `topGap` 32 / 24, and its cards fill the column. The two edit pages are narrow, so they are centred (Task Test 3); on a phone they use the full width, `firstBlockLeft` 20, and `topGap` is 24.
2. Buddies: only when Sam's #79 page is on `dev` and deployed. Open it and run the same measurements. If it is not ready, write "Buddies: not run, #79 not on dev yet" in the card comment. This is not a failure of this card.

## Task Test 11: Nothing else breaks

Steps:
1. Click through the navigation bar on a computer and a phone (Dashboard, Workouts, Plans, Progress, Leaderboard, Today, Profile). Each page should open without a console error, and the current page should still be highlighted in the navigation bar.
2. Log out. The Log in page should open, and opening `#/dashboard` while signed out should return to Log in.
3. Run `npm run build`. It should finish without errors (a deleted `Breadcrumb.jsx` must not leave a missing import).

## Task Test 12: Plan cards fit their text at every screen width (added after the first release)

Found after #130 was merged: with the 1200 px page column the Plans page still used five fixed card columns, so on a 1440 px screen each card was only 208 px wide and the stats row ("Schedule 3 days/wk", "Session 40 min", "Intensity Moderate") spilled out of the card. The grid is now as many columns as fit at 250 px or more, and the stats row wraps.

Setup for this test: sign in as `layout-86@test.com` (or any account with a plan selected, so "Your current plan" shows one card and "Recommended plans" shows several), and open the Plans page (`#/plans`).

Steps:
1. In Chrome DevTools device mode set 1440 x 900 and reload. Look at every plan card, including "Your current plan". All the text in each card (the name, the description, "Schedule", "Session", "Intensity" and their values, the equipment names, "Equipment ready" and the button) should be inside the card's rounded border, with nothing touching or crossing its right edge.
2. Each card should be at least 250 px wide. Paste this in the console. It should print `[]` (no card has anything outside its right edge) and a width of 250 or more:

   ```js
   [...document.querySelectorAll('article.plan-list__item')].filter((c) => { const r = c.getBoundingClientRect(); return [...c.querySelectorAll('*')].some((e) => e.getBoundingClientRect().width && e.getBoundingClientRect().right > r.right + 0.5) }).length + ' cards overflow, first card ' + Math.round(document.querySelector('article.plan-list__item').getBoundingClientRect().width) + 'px wide'
   ```

   It should print `0 cards overflow, first card 264px wide` (or another width of 250 or more).
3. Repeat steps 1 and 2 at 1920 x 1080, 1280 x 800, 1000 x 800, 768 x 1024 and 375 x 812. At every size the result should be `0 cards overflow`. On a computer the cards are in rows of as many as fit (4 across at 1440); on a phone the cards are a swipeable row.
4. Open "More plans" and repeat step 2. The cards inside it should also print `0 cards overflow`.
5. Choose "Light" in Profile > Appearance and repeat step 1 at 1440 x 900. The text should still sit inside every card. Choose "Dark" again afterwards.

## Task Test 13: Popups cover the whole screen (added after the first release)

Found after #130 was merged: a popup that is a direct child of a narrow page was squeezed to the narrow width, so on the Individual exercise page the dark backdrop of "How to perform it" covered only the left part of the screen and the popup sat off-centre. The same was true of the "Switch plan" popup on Plan details.

Steps:
1. At 1440 x 900 (and again at 1920 x 1080), open an Individual exercise and click "How to perform it". The dark backdrop should cover the whole window (the navigation bar and both sides), and the popup should be in the middle of the screen. Paste this in the console: it should print `0 1440` at 1440 wide (left edge 0, width equal to the window width):

   ```js
   (() => { const r = document.querySelector('.modal-backdrop').getBoundingClientRect(); return Math.round(r.left) + ' ' + Math.round(r.width) })()
   ```
2. Click "Close". The popup and backdrop should disappear.
3. Open Plans, click a plan that is not your current plan, click "Choose plan" on Plan details (or, from the library, "Choose plan" on a plan while you follow another), and when the "Switch to ...?" popup opens, run the same console line. It should again print `0 1440`, with the popup in the middle. Click "Cancel".
4. At 375 x 812 repeat step 1: the popup should fit the phone screen.

## Existing tests and documents this changes

Removing the breadcrumb breaks these checks. They belong to other owners (stories to the story owners, Playwright code to the Playwright task owners, per AGENTS.md), so this card lists them and does not edit them unless asked:

- `stories/72-select-workout-plan.md`, Acceptance Test 1, step 4 ("Click "Plans" in the breadcrumb at the top") and `tests/e2e/72-select-workout-plan.spec.js` line 172. Becomes: click "Back to plan library".
- `tests/e2e/9-workout-history.spec.js` line 151 (expects the crumbs "Progress" and "Workout history"). Becomes: the "Back to progress" link is shown.
- `tests/e2e/8-exercise-progress.spec.js` line 353 (clicks the "Progress" breadcrumb link). Becomes: click "Back to progress".
- `stories/TBD-recommended-plans.md` line 127 (goes back "with the Plan..." breadcrumb). Becomes: "Back to plan library".
- `DESIGN.md`: the "900px column" wording for Workout history and Progress, and "breadcrumb" in the history paragraph (updated in this card).
- All other Playwright specs should still pass: after the change run `npm run test:e2e:watch` and report which specs fail and why.
