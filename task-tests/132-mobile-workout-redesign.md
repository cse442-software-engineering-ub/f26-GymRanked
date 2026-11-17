# Card 132: mobile workout redesign task tests

Use a phone-sized browser (375 × 812), a signed-in test account with a selected plan, and a local database with the workout migrations applied. Start each test from the link given. Use a fresh workout session for tests that log sets; the account must have a scheduled workout today. The app link is `http://localhost:5173/CSE442/2026-Fall/cse-442y/`.

## Test 1: Review the weekly workout page

1. Open the app link with `#/weekly-plan` appended and sign in to the prepared account.
2. Confirm the page says “Workouts”, shows today's workout with its plan, expected minutes, exercise count and exercise names, then shows “Your week” as seven rows with today marked by text.
3. Switch the account Appearance setting to Light, return to the same link, and confirm all text and controls remain legible without horizontal scrolling. Repeat in Dark.

## Test 2: Log, leave, and resume

1. Open the app link with `#/weekly-plan` appended and sign in to a prepared account with no session today.
2. Tap “Start workout”. Confirm “Log a set” appears above the exercise list, with Reps and Weight (lb) fields.
3. Enter `10` reps and `25` lb, then tap “Log set”. Confirm “Set 1 saved”, a saved row reading `25 lb × 10`, and a count of `1 set` for that exercise.
4. Tap “Leave and resume later”. Confirm Dashboard opens and offers to resume the workout.
5. Open Workouts from the menu. Confirm its action says “Resume workout” and describes one saved set. Tap it.
6. Confirm the same exercise is selected, its saved set and `1 set` count remain, and no duplicate session was started. Reload and confirm they still remain.

## Test 3: Keep an unfinished entry

1. Open the app link with `#/workout/active` appended and sign in to a prepared account with a workout available today.
2. Enter `8` in Reps but leave Weight empty. Tap “Leave and resume later”, then return from Workouts using “Resume workout”.
3. Confirm `8` is still in Reps and no new saved set was added. Enter `0` for Weight, then tap “Log set”. Confirm the bodyweight set is saved.

## Test 4: Invalid entry and save failure

1. Open the app link with `#/workout/active` appended and sign in to a prepared account with a workout available today.
2. Enter `0` reps and `-1` lb, then tap “Log set”. Confirm both fields show validation errors and the saved count does not change.
3. Enter `10` reps and `25` lb. In browser Network tools, block the `workout_sets.php` request, then tap “Log set”. Confirm an error appears and the entered values stay in place.
4. Unblock the request and tap “Log set” again. Confirm one set is saved.

## Test 5: Finish versus leave

1. Open the app link with `#/workout/active` appended and sign in to a prepared account with a workout available today.
2. Tap “Finish workout” before logging a set. Confirm the page explains that at least one set is required and the workout stays in progress.
3. Log `10` reps at `25` lb, then tap “Finish workout”. Confirm a completion prompt appears. Choose “Keep training”; confirm the active workout and set remain.
4. Tap “Finish workout” again and confirm. Confirm the saved summary opens.
5. Open Workouts and confirm it offers “View workout summary” instead of “Resume workout”.

## Test 6: Photo header and phone layout

1. Open the app link with `#/workout/active` appended in a 375 px wide browser and sign in to a prepared account with a workout available today.
2. Confirm the dumbbell photo appears behind the workout name, with the plan, expected time, logged-set count and exercise position readable below it.
3. Confirm the set form has two inputs side by side and a full-width “Log set” button below them; the exercise list and “Leave and resume later” action remain visible without sideways scrolling.
4. Switch Appearance to Light and revisit the same link. Confirm the photo, headings, fields, progress chips, exercise rows and both action buttons remain readable. Repeat at 320 px wide and in Dark.

## Test 7: Set timer survives leaving and switching exercises

1. Open the app link with `#/workout/active` appended in a phone-sized browser and sign in to a prepared account with a workout available today.
2. Tap “Start timer” in the set timer. Confirm the clock advances from `00:00` and says “In progress”.
3. Tap “Pause”, wait at least two seconds, and confirm the clock stays fixed and says “Paused”. Tap “Resume” and confirm it advances again.
4. Choose another exercise, then return to the first exercise. Confirm its timer still runs from the earlier elapsed time, while the other exercise has its own timer.
5. Tap “Leave and resume later”, return through Workouts, then tap “Finish set”. Confirm the elapsed time is retained and the clock stops. Tap “Restart timer” and confirm it starts again at `00:00`.

## Test 8: Rest starts only after a saved set

1. Open the app link with `#/workout/active` appended in a phone-sized browser and sign in to a prepared account with a workout available today and no sets logged.
2. Enter `10` reps and `25` lb, then tap “Log set”. Confirm “Set 1 saved” appears and the rest timer starts near `01:30` without another tap. Confirm the set timer is reset to `00:00`.
3. Tap “+15s” and confirm the rest time increases by about 15 seconds. Tap “−15s” and confirm it decreases by about 15 seconds.
4. Tap “Leave and resume later”, return through Workouts, and confirm the rest countdown has continued. Tap “Skip rest” and confirm the rest panel closes.
5. Enter `0` reps and `25` lb, then tap “Log set”. Confirm a validation error appears, the saved-set count does not increase, and no new rest countdown starts.
