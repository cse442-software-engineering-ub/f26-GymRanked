# Task tests: Exercise alternatives screen (#82, story #80)

Task #82, Sprint 4. Frontend for story #80 on Surya's backend #81 (`api/exercise_alternatives.php`). The story's acceptance tests are in `stories/80-exercise-alternatives.md`; these task tests use the same wording as the screen.

**Status: package for early review.** This file is the screen's exact behavior, the data agreement with #81, the test data and the task tests. No screen code is written yet. After review, the first checkpoint (proposed for November 11) is one connected example on Surya's real response: open an exercise, see suitable alternatives, and see the explanation when nothing matches. That checkpoint does not finish every exercise and does not count as these task tests passing.

## Card checks before review

- **Blocking:** on PMTool, card #82's dependencies must show that it **blocks story #80**, and story #80 must show it is **blocked by #82** (and by #81 and the Playwright task card). #82 must block no other card and must not be blocked by a task. Fix it on the board if not; this file can't confirm it.
- **Tags:** #80 has "User Story" and the Sprint 4 tag; #82 has one task tag and the Sprint 4 tag.
- **Branch:** `82-exercise-alternatives-screen`, made from `dev`, attached to #82 when it moves to In Progress.

## What the screen does

### Where it opens

On the exercise page of the active workout (`#/workout/active/:exerciseIndex`, `src/ExerciseSession.jsx`), a **See alternatives** button sits under the exercise heading, beside **How to perform it** when that button is shown. It appears for every exercise, whether or not #81 covers it, because the answer ("not covered yet") is itself useful. Pressing it opens a dialog and sends one request. Nothing is fetched before the button is pressed.

### The dialog

Same dialog pattern as `SwitchPlanModal` and `ExerciseGuide` (`DESIGN.md`, "Dialog"): `role="dialog"`, `aria-modal="true"`, `aria-labelledby` on the title, backdrop over the whole page, closes with **Close**, Escape or a click on the backdrop. At most 380px wide on a computer, as `DESIGN.md` sets for dialogs; on a phone, the screen width minus 16px on each side. The header (title and Close) stays at the top while the list scrolls inside the dialog.

From top to bottom:

1. Title: `Alternatives to {exercise}`.
2. "You're doing" box (eyebrow `You're doing`, shown uppercase by CSS): the exercise name; `{Level} · {Equipment}` of the current exercise; its muscles from `src/exerciseMuscles.js` (`Chest · Shoulders · Triceps`). Below it: `Your setup: {Level} · {equipment list}`. The name and muscles show at once; the level, equipment and setup lines appear with the response.
3. Content, one of the states in the table below.
4. Footer line, at the end of the scrolling area: `Suggestions only. Your plan, saved sets and workout history stay the same.` The only **Close** button is in the header, beside the title.

Each alternative is one list item (an `<ol>`, so the order is announced) with:

- the name (h3), and two tags: the level (`Beginner`, `Intermediate`, `Advanced`) and the equipment;
- the muscles, from `src/exerciseMuscles.js`;
- a reason sentence: a difficulty part, then an equipment part.

The items have no buttons. The first version offers no "Swap" action.

### Exact text

| Part | Rule | Example |
|---|---|---|
| Intro | `These work the same {movement} movement with equipment you have, at your level or easier. Closest in difficulty first.` | `…the same pressing movement…` |
| Movement words | `horizontal_push` pressing, `squat` squatting, `horizontal_pull` rowing, `vertical_pull` pulling-down | |
| Count | `1 alternative`, `{n} alternatives` | `4 alternatives` |
| Level tag | beginner `Beginner`, intermediate `Intermediate`, advanced `Advanced` | |
| Equipment tag | bodyweight `No equipment`; full_gym `Gym machine`; others as `EQUIPMENT_LABELS` in `src/planEquipment.js` (`Dumbbells`, `Barbell`, `Cable machine`, `Pull-up bar`, …) | |
| Setup line | `Your setup: {Level} · {labels from EQUIPMENT_LABELS joined with ", "}`; experience missing: `Not saved`; equipment empty: `No equipment saved` | `Your setup: Intermediate · Dumbbells` |
| Difficulty part | same level `Same difficulty as {source}.`; easier by 1 or 2 `One level easier than {source}.` / `Two levels easier than {source}.`; harder (possible when the source is easier than the user's level) `One level harder than {source}, within your level.` | |
| Equipment part | bodyweight `Needs no equipment.`; user has the item `Uses {item}, which you have.`; covered only by full gym `Uses {item}, which your full gym access covers.` | items: `a barbell`, `dumbbells`, `kettlebells`, `resistance bands`, `a cable machine`, `a pull-up bar`, `gym machines` |
| Footer | `Suggestions only. Your plan, saved sets and workout history stay the same.` | |

### States

| State | When | Shows |
|---|---|---|
| Loading | Request sent, no answer yet | `Finding alternatives to {exercise}...` in `text-muted`, `aria-busy="true"` on the content area, no list |
| Alternatives | 200 with one or more `alternatives` | Intro, count and the list, in the order #81 sends (never re-sorted) |
| No match | 200 with `alternatives: []` | Title `No alternative fits your setup`, text `None of the other {movement} exercises we list fit your equipment ({equipment labels}) and experience ({Level}). Keep doing {exercise}, or add equipment you have in your training preferences.` and a link **Update training preferences ›** to `#/profile/training-preferences` |
| Not covered | 404 | Title `No alternatives listed for {exercise} yet`, text `Alternatives cover pressing, squatting, rowing and pulling-down exercises so far. Keep doing {exercise} as planned.` |
| Failed | No connection, 500, a body that isn't JSON, or a 200 without an `alternatives` array | `Couldn't load alternatives. Check your connection and try again.` with `role="alert"` and a **Try again** button. Never shows the no-match or not-covered text |
| Logged out | 401 | `Your login has expired. Log in again to see alternatives.` with a **Log in** link |

- **Try again** sends the same request again, shows Loading, and then whichever state the new answer gives. Focus moves to the dialog title when the new state appears.
- A successful answer is kept in memory per exercise name until the page reloads, like `ExerciseGuide`, so reopening shows it at once. Failures are never kept, so reopening after a failure always sends a new request.
- If the dialog is closed while a request is out, the late answer is ignored.
- Nothing about the set in progress changes: the dialog sits over the page and never unmounts it, so the timer, the typed weight and reps (`setDraft.js`), the rest countdown and the saved sets are untouched. A 401 or a link away keeps the typed set too, because `setDraft.js` already stores it per session and exercise.
- The screen only sends `GET`. It never calls `workout_sets.php`, `workout_session.php` (POST), `plan.php` or anything that writes.

### Keyboard

- **See alternatives** is a real `<button>`. Enter or Space opens the dialog and moves focus to the title (`tabIndex={-1}`).
- Tab order inside the dialog: **Close**, then the content's focusable parts (the list area, **Update training preferences ›**, **Try again** or **Log in**, whichever the state has). Tab and Shift+Tab stay inside: from the last one Tab returns to **Close**, and the page behind is `inert` while the dialog is open.
- In the alternatives state the list area is focusable (`tabIndex={0}`, `aria-label="Alternatives"`), so arrow keys and Page Down scroll it when it is taller than the dialog.
- Escape closes. After closing by any route, focus returns to **See alternatives**.
- Every focusable part has the app's visible focus outline in both themes.

### Phone

- At 375px wide (the `DESIGN.md` and Playwright phone size) and at 320px, the page never scrolls sideways (`document.documentElement.scrollWidth` equals the window width).
- The dialog is the window width minus 32px. Long names wrap; nothing is cut off with an ellipsis.
- **See alternatives**, **Try again** and **Close** are at least 44px tall.
- The tags sit on one line under the name and wrap if needed.

## Data agreement with #81 (Surya)

The screen uses `GET api/exercise_alternatives.php?exercise={name}`, where `{name}` is `exercise.name` from the session exactly as stored (URL encoded). Names, equipment values and levels are the ones in `database/migrations/016_exercise_alternatives.sql`; the screen keeps no copy of that table.

Today's response:

```json
{"exercise": "Bench press", "movement": "horizontal_push",
 "alternatives": [{"name": "Incline dumbbell press", "level": "intermediate", "equipment": "dumbbells"}, …]}
```

To show what the story asks, the screen needs three more fields, all additions that do not break today's shape:

| Field | Why | Example |
|---|---|---|
| `level` | Show `Intermediate · Barbell` for the current exercise and work out "same difficulty" or "easier". | `"intermediate"` |
| `equipment` | Same, for the current exercise. | `"barbell"` |
| `you` | The experience and equipment the rules used, so the no-match text can name them and each reason can say "which you have" or "which your full gym access covers". `experience` is `null` when none is saved (the rules then use beginner). | `{"experience": "intermediate", "equipment": ["dumbbells"]}` |

Fallback if #81 does not add them by the checkpoint: the screen also sends `GET api/setup.php` (same `experience` and `equipment` shape) and leaves out the current exercise's level and equipment line and the difficulty part of each reason. The list and the no-match text still work.

Points to settle with Surya, the PM and Eric:

1. **The three fields above** (Surya). Proposed final example for Alex and Bench press is in "Expected responses" below.
2. **"Cable row" vs "Seated cable row"** (Surya, PM). Beginner Fundamentals day 3 (`007_plan_day_exercises.sql`) has `Cable row`, which isn't in the exercises table, so it gets a 404 ("not covered yet"). Either add `Cable row` to the table or rename it in the plan.
3. **Most plan exercises are not covered yet** (PM). 16 of the 59 plan exercise names are in the table. Not covered: Romanian deadlift, Overhead press, Deadlift, Walking lunge, Glute bridge and 38 others. The "not covered" state handles them, but story #80's title promises alternatives; the PM decides whether that is acceptable for this sprint.
4. **What to log after doing an alternative** (PM). Sets typed on this page save under the planned exercise's name. A user who does Dumbbell press instead of Bench press would record it as Bench press. The first version leaves this alone, as the card says; the footer line is worded so it doesn't promise otherwise.
5. **Bodyweight-only users** (Surya). Onboarding stores "Bodyweight only" as `bodyweight`. The rules already treat bodyweight moves as always available, so this works; the setup line shows `Bodyweight only`.

## Files (planned, written after review)

| File | What it holds |
|---|---|
| `src/workoutLog/ExerciseAlternatives.jsx` | The button, the dialog and its states. Takes `exercise` (name). |
| `src/workoutLog/exerciseAlternatives.js` | `fetchAlternatives(name)` (one request; maps 200, 404, 401 and failures to a state) and the in-memory cache. |
| `src/workoutLog/exerciseAlternativesFormat.js` | All text: tags, setup line, count, intro, reasons, no-match and not-covered messages. |
| `src/workoutLog/exerciseAlternatives.css` | Styles, only `--gr-` variables. |
| `src/ExerciseSession.jsx` | One line: `<ExerciseAlternatives exercise={exercise.name} />` beside `ExerciseGuide`. |
| `tests/exerciseAlternatives.test.js` | Unit tests for the format and state functions (Test 10). |
| `database/seeds/exercise_alternatives.sql` | Test accounts (already in this package). |

## Test data (`database/seeds/exercise_alternatives.sql`)

Both accounts finished onboarding, selected Full Body Strength and saved personal details. The seed gives each an unfinished workout started one minute before it was loaded, with Bench press, Pull-up and Romanian deadlift and no sets, so the tests work on any day, including rest days. Reload it on the day you test and before each full run.

- Alex Alternatives, `alt.alex@example.com`, password `Alt-Alex-82!`: Intermediate, Dumbbells only. Also one finished workout two days ago: Bench press 135 lb × 5.
- Gio Gym, `alt.gio@example.com`, password `Alt-Gio-82!`: Advanced, Full gym access.

## Expected responses

Worked out by running `pick_alternatives()` from `api/exercise_alternatives_common.php` on the 16 exercises in migration 016. `you`, `level` and `equipment` are the proposed additions.

| Account | Exercise | Status | `alternatives`, in order |
|---|---|---|---|
| Alex | Bench press | 200 | Incline dumbbell press (intermediate, dumbbells), Dumbbell press (beginner, dumbbells), Incline push-up (beginner, bodyweight), Push-up (beginner, bodyweight) |
| Alex | Pull-up | 200 | `[]` (Lat pulldown needs cable_machine) |
| Alex | Romanian deadlift | 404 | `{"error": "No alternatives for this exercise."}` |
| Gio | Bench press | 200 | Close-grip bench press (intermediate, barbell), Incline dumbbell press (intermediate, dumbbells), Dumbbell press (beginner, dumbbells), Incline push-up (beginner, bodyweight), Push-up (beginner, bodyweight) |
| Gio | Pull-up | 200 | Lat pulldown (beginner, cable_machine) |

Alex and Bench press with the additions:

```json
{"exercise": "Bench press", "movement": "horizontal_push", "level": "intermediate", "equipment": "barbell",
 "you": {"experience": "intermediate", "equipment": ["dumbbells"]},
 "alternatives": [
   {"name": "Incline dumbbell press", "level": "intermediate", "equipment": "dumbbells"},
   {"name": "Dumbbell press", "level": "beginner", "equipment": "dumbbells"},
   {"name": "Incline push-up", "level": "beginner", "equipment": "bodyweight"},
   {"name": "Push-up", "level": "beginner", "equipment": "bodyweight"}]}
```

## Setup for all tests

Step 1: Connect to the UB VPN or the campus network.

Step 2: On aptitude, make sure migration `database/migrations/016_exercise_alternatives.sql` is applied (Surya's #81), then load the seed: `mysql --default-character-set=utf8mb4 -u UBIT_USERNAME -p cse442_2026_fall_team_y_db < database/seeds/exercise_alternatives.sql`. The last lines should show `Alex Alternatives intermediate dumbbells 2` and `Gio Gym advanced full_gym 1`.

Step 3: Build branch `82-exercise-alternatives-screen` with `npm run build` and copy `dist/` and `api/` to aptitude as `README.md` describes.

Step 4: Open https://aptitude.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/ in Chrome, in dark mode unless a test says otherwise. "Open Bench press" means: open `#/workout/active`, then press **Begin exercise** on **Bench press** (likewise for the other exercises).

## Test 1: The list matches #81's response exactly

Setup: Log in as `alt.alex@example.com` / `Alt-Alex-82!`. Open DevTools (F12) → Network, filter `exercise_alternatives`. Open Bench press.

Step 1: Confirm no request to `exercise_alternatives.php` has been sent yet.

Step 2: Press **See alternatives**. Confirm exactly one request: `GET …/api/exercise_alternatives.php?exercise=Bench%20press`, status 200.

Step 3: In the request's Response tab, confirm the four names and their order match the "Expected responses" table for Alex and Bench press.

Step 4: Confirm the dialog shows `Alternatives to Bench press`, `Your setup: Intermediate · Dumbbells`, `4 alternatives`, and the four items in the same order as the response, each with the tags, muscles and reason in story #80, Acceptance Test 1, step 5.

Step 5: Press **Close**, then **See alternatives** again. Confirm the list appears straight away and no second request is sent.

Expected outcome: one GET per exercise per page load, and the screen shows the response's items in its order with the text rules above.

## Test 2: Loading state

Setup: As Test 1, but in Network set throttling to **Slow 3G** and tick **Disable cache**. Reload the page (so the in-memory copy is gone) and open Bench press.

Step 1: Press **See alternatives**. While the request is pending, confirm the dialog shows `Alternatives to Bench press`, the "You're doing" box with `Bench press` and `Chest · Shoulders · Triceps`, and `Finding alternatives to Bench press...`, and no list.

Step 2: In Elements, confirm the content area has `aria-busy="true"` while loading and `aria-busy="false"` (or no attribute) after the list appears.

Step 3: Set throttling back to **No throttling** and untick **Disable cache**.

Expected outcome: a clear loading line in place of the list while the request is out.

## Test 3: No match and not covered are different states

Setup: Log in as Alex.

Step 1: Open Pull-up and press **See alternatives**. In Network, confirm 200 with `"alternatives": []`. Confirm the dialog shows `No alternative fits your setup` and the no-match text naming `Dumbbells` and `Intermediate`, the **Update training preferences ›** link, and no list.

Step 2: Close, return to the workout, open Romanian deadlift and press **See alternatives**. Confirm 404 in Network, and the dialog shows `No alternatives listed for Romanian deadlift yet` and the not-covered text, with no link and no list.

Step 3: Log out and log in as `alt.gio@example.com` / `Alt-Gio-82!`. Open Pull-up and press **See alternatives**. Confirm `1 alternative` and `Lat pulldown` with `Beginner`, `Cable machine`, `Back · Biceps` and `One level easier than Pull-up. Uses a cable machine, which your full gym access covers.`

Expected outcome: an empty 200 and a 404 give their own explanations; neither is shown as an error.

## Test 4: Failed requests show an error and Try again recovers without losing the set

Setup: Load the seed again. Log in as Alex and open Bench press. Press **Start set**, wait 3 seconds, **Finish set**, type `140` and `4`, and do not log it.

Step 1: In DevTools → Network, right-click and choose **Block request URL** for the `exercise_alternatives.php` pattern (or open the Network request blocking panel and add `*exercise_alternatives.php*`). Press **See alternatives**. Confirm `Couldn't load alternatives. Check your connection and try again.`, a **Try again** button, no list, and no no-match or not-covered text.

Step 2: Press **Try again** twice. Confirm a new blocked request appears in Network each time and the same message stays.

Step 3: Press **Close**. In Application → Local Storage, confirm the key `gymrank.setDraft.{session id}.Bench press` still holds `"weight":"140"` and `"reps":"4"`, and the page still shows `140`, `4` and `Set finished`.

Step 4: Remove the block. Press **See alternatives**. Confirm the four alternatives appear (failures are not kept, so a new request is sent).

Step 5: In Network set throttling to **Offline**. Reload is not needed: close the dialog, open Pull-up and press **See alternatives**. Confirm the same error message. Set **No throttling** and press **Try again**. Confirm the no-match state from Test 3, step 1.

Step 6: Return to Bench press and press **Log set**. Confirm `Set 1` `140 lb × 4` in `Saved sets`.

Expected outcome: a blocked or offline request gives the error with Try again, never a wrong "nothing fits" message, and the typed set survives.

## Test 5: Server error and broken response

Setup: Log in as Alex and open Bench press. Have DevTools open.

Step 1: In Sources → Overrides (or by temporarily editing the response with a local override), make `exercise_alternatives.php` return status 500 with `{"error":"Database error"}`. Press **See alternatives**. Confirm the failed state from Test 4.

Step 2: Change the override to status 200 with the body `<html>Not JSON</html>`. Press **Try again**. Confirm the failed state again.

Step 3: Change the override to status 200 with `{"exercise":"Bench press"}` (no `alternatives`). Press **Try again**. Confirm the failed state, not the no-match state.

Step 4: Remove the override. Press **Try again**. Confirm the four alternatives.

Expected outcome: any answer the screen can't use is treated as a failure that can be retried.

## Test 6: Logged out

Setup: Log in as Alex and open Bench press. Type `120` in the weight box after finishing a set, without logging it.

Step 1: In a second tab, open the app and log out. Return to the first tab.

Step 2: Press **See alternatives**. Confirm `Your login has expired. Log in again to see alternatives.` and a **Log in** link.

Step 3: Press **Log in**, log in as Alex, open the workout and press **Continue exercise** or **Begin exercise** on Bench press. Confirm the weight box still holds `120`.

Expected outcome: a 401 is explained, and logging back in keeps the typed set.

## Test 7: Nothing is written

Setup: Load the seed again. Log in as Alex, open Bench press and log one set of `100` × `8`, then **Skip rest**. In Network, clear the log and choose **All**.

Step 1: Press **See alternatives**, wait for the list, press **Close**. Open and close it once more. Open Pull-up and Romanian deadlift and do the same.

Step 2: Confirm every request in the log is a GET. Confirm none went to `workout_sets.php`, `complete_workout.php`, `plan.php`, `setup.php` (POST) or `workout_session.php` (POST was only sent when each exercise page opened, before **See alternatives**).

Step 3: Run story #80, Acceptance Test 6, steps 2 to 5.

Expected outcome: the screen sends only GET requests and the plan, sets and history are unchanged.

## Test 8: Keyboard and screen reader

Setup: Log in as Alex and open Bench press. Use only the keyboard.

Step 1: Tab to **See alternatives**. Confirm a visible outline. Press Space. Confirm the dialog opens and focus is on `Alternatives to Bench press` (`document.activeElement` in the console is the h2).

Step 2: Press Tab. Confirm focus goes to **Close**, then to the list area (outlined). Press Tab again; confirm focus wraps to **Close**. Press Shift+Tab on **Close**; confirm it goes to the list area. At no point does focus reach the nav bar or the set card behind the dialog.

Step 3: Press Escape. Confirm the dialog closes and `document.activeElement` is **See alternatives**.

Step 4: Open Pull-up by keyboard and open the dialog. Tab to **Update training preferences ›** and confirm the outline. Escape, then open Romanian deadlift and confirm Tab only ever reaches **Close**.

Step 5: With Network blocking from Test 4 on, open the dialog on Bench press. Confirm Tab reaches **Try again**, and that pressing Enter on it puts focus back on the title once the new state shows. Remove the block.

Step 6: With the Accessibility pane or a screen reader (NVDA or VoiceOver), confirm the dialog is announced as a dialog named `Alternatives to Bench press`, the list as a list of 4 items, and the failed message as an alert.

Expected outcome: every control is reachable, focus is trapped in the open dialog and returns to the button on close, and the states are announced.

## Test 9: Measured phone widths and light mode

Setup: Log in as Gio. In DevTools, turn on the device toolbar (Ctrl+Shift+M), choose **Responsive** and type width `375`, height `812`.

Step 1: Open Bench press and tap **See alternatives**. In the console run `document.documentElement.scrollWidth`. Confirm `375`. Confirm the dialog is `343` px wide in the Elements box model (375 minus 16 on each side).

Step 2: Confirm `Close-grip bench press` wraps fully with no ellipsis, the `Intermediate` and `Barbell` tags are readable, and the title and **Close** stay visible while scrolling the list to `Push-up` and the footer line.

Step 3: In Elements, select **See alternatives** and **Close** and confirm each is at least `44` px tall in the box model.

Step 4: Change the width to `320`. Repeat steps 1 and 2. Confirm `scrollWidth` is `320` and the dialog `288` px wide.

Step 5: Turn the device toolbar off. Switch to light mode (avatar → Profile → Appearance → Light). As Gio, open the dialog on Bench press. Confirm all text is readable on the light cards and the tags have visible borders. Log out, log in as Alex and open the dialog on Pull-up (no match) and on Bench press with the Test 4 block on (failed). Confirm both are readable. Remove the block and switch back to Dark.

Expected outcome: no sideways scrolling at 375px or 320px, nothing cut off, tap targets at least 44px, and both themes readable.

## Test 10: Unit tests

Run `npm test` from the repo root. Confirm every test passes, including `tests/exerciseAlternatives.test.js`, which checks:

1. Tag text for every level and equipment value in migration 016.
2. The setup line for `{intermediate, [dumbbells]}`, `{advanced, [full_gym]}`, `{null, []}` and `{beginner, [bodyweight]}`: `Intermediate · Dumbbells`, `Advanced · Full gym access`, `Not saved · No equipment saved`, `Beginner · Bodyweight only`.
3. Reasons for each row of story #80, Acceptance Tests 1 and 2, plus `Push-up` → `Incline dumbbell press` for an intermediate user: `One level harder than Push-up, within your level. Uses dumbbells, which you have.`
4. `1 alternative` and `4 alternatives`.
5. The state chosen for: 200 with items, 200 with `[]`, 404, 401, 500, a network error, non-JSON, and 200 without `alternatives` (alternatives, noMatch, notCovered, loggedOut, failed, failed, failed, failed).
6. The no-match and not-covered texts for Alex's Pull-up and Romanian deadlift, word for word.

Expected outcome: `npm test` reports 0 failures.
