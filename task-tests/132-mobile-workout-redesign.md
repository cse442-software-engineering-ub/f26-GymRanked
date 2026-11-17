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
4. Tap “Leave and return later”. Confirm Dashboard opens and offers to resume the workout.
5. Open Workouts from the menu. Confirm its action says “Resume workout” and describes one saved set. Tap it.
6. Confirm the same exercise is selected, its saved set and `1 set` count remain, and no duplicate session was started. Reload and confirm they still remain.

## Test 3: Keep an unfinished entry

1. Open the app link with `#/workout/active` appended and sign in to a prepared account with a workout available today.
2. Enter `8` in Reps but leave Weight empty. Tap “Leave and return later”, then return from Workouts using “Resume workout”.
3. Confirm `8` is still in Reps and no new saved set was added. Enter `0` for Weight, then tap “Log set”. Confirm the bodyweight set is saved.

## Test 4: Invalid entry and save failure

1. Open the app link with `#/workout/active` appended and sign in to a prepared account with a workout available today.
2. Enter `0` reps and `-1` lb, then tap “Log set”. Confirm both fields show validation errors and the saved count does not change.
3. Enter `10` reps and `25` lb. In browser Network tools, block the `workout_sets.php` request, then tap “Log set”. Confirm an error appears and the entered values stay in place.
4. Unblock the request and tap “Log set” again. Confirm one set is saved.

## Test 5: Finish versus leave

1. Open the app link with `#/workout/active` appended and sign in to a prepared account with a workout available today.
2. Tap “Finish workout” before logging a set. Confirm the page explains that at least one set is required and the workout stays in progress.
3. Log `10` reps at `25` lb, then tap “Finish workout”. Confirm the first completion prompt appears. Choose “Keep training”; confirm the active workout and set remain.
4. Tap “Finish workout” again and confirm. Confirm a second prompt names the two exercises with no saved sets. Choose “Keep logging” and confirm the active workout remains open.
5. Repeat the two confirmations and choose “Save partial workout”. Confirm the saved summary opens and includes the one logged set.
6. Open Workouts and confirm it offers “View workout summary” instead of “Resume workout”.

## Test 6: Photo header and phone layout

1. Open the app link with `#/workout/active` appended in a 375 px wide browser and sign in to a prepared account with a workout available today.
2. Confirm the dumbbell photo appears behind the workout name, with the plan, expected time, logged-set count and exercise position readable below it.
3. Confirm the set form has two inputs side by side and a full-width “Log set” button below them; the exercise list and “Leave and return later” action remain visible without sideways scrolling. Confirm “Finish workout” is orange.
4. Switch Appearance to Light and revisit the same link. Confirm the photo, headings, fields, progress chips, exercise rows and both action buttons remain readable. Repeat at 320 px wide and in Dark.

## Test 7: Set timer survives leaving and switching exercises

1. Open the app link with `#/workout/active` appended in a phone-sized browser and sign in to a prepared account with a workout available today.
2. Tap “Start timer” in the set timer. Confirm the clock advances from `00:00` and says “In progress”.
3. Tap “Pause”, wait at least two seconds, and confirm the clock stays fixed and says “Paused”. Tap “Resume” and confirm it advances again.
4. Choose another exercise, then return to the first exercise. Confirm its timer still runs from the earlier elapsed time, while the other exercise has its own timer.
5. Tap “Leave and return later”, return through Workouts, then tap “Finish set”. Confirm the elapsed time is retained, the set clock stops, and the rest timer appears. Tap “Skip rest” and confirm the set clock resets to `00:00`.

## Test 8: Rest starts after finishing a set

1. Open the app link with `#/workout/active` appended in a phone-sized browser and sign in to a prepared account with a workout available today and no sets logged.
2. Confirm no rest timer appears yet. Start the set timer, wait at least two seconds, then tap “Finish set”. Confirm the rest timer appears near `01:30` without tapping “Log set”. Confirm the set timer stops at its elapsed value.
3. Enter `10` reps and `25` lb, then tap “Log set”. Confirm “Set 1 saved”, the rest timer keeps counting, and the saved row and exercise volume read `25 lb × 10` and `250 lb`. Confirm total volume reads `250 lb`.
4. Tap “+15s” and confirm the rest time increases by about 15 seconds. Tap “−15s” and confirm it decreases by about 15 seconds.
5. Tap “Leave and return later”, return through Workouts, and confirm the rest countdown has continued. Tap “Skip rest” and confirm the rest panel closes and the set clock resets to `00:00`.
6. Enter `0` reps and `25` lb, then tap “Log set”. Confirm a validation error appears, the saved-set count does not increase, and no new rest countdown starts.

## Test 9: All exercises remain revisitable

1. Open the app link with `#/workout/active` appended and sign in to a prepared account with a fresh three-exercise workout today.
2. Log `10` reps at `25` lb for the first exercise. Select the second exercise and log `8` reps at `20` lb. Select the third exercise and log `6` reps at `30` lb.
3. Return to the first exercise. Confirm it remains selectable, shows its saved set, and accepts another set. Confirm no exercise is labeled complete.
4. Tap “Finish workout” and confirm the first prompt. Confirm the workout opens its summary without a second warning about missing exercises.

## Test 10: Desktop timers and draft persistence

1. Open the app link with `#/workout/active` appended in a 1440 px wide browser and sign in to a prepared account with a fresh workout today.
2. Enter `10` reps and `25` lb, tap “Leave and return later”, then resume the workout from Dashboard. Confirm both entries remain and the photo header is visible.
3. Start the set timer, wait at least two seconds, and tap “Finish set”. Confirm the rest timer appears beside the set timer. Log the set and confirm the set timer remains frozen at the elapsed value while rest counts down.
4. Tap “Skip rest” and confirm the set timer returns to `00:00`. Confirm the orange “Complete workout” action and “Leave and return later” link are visible.

## Test 11: Exercise guide and alternatives stay on the workout

1. Open the app link with `#/workout/active` appended in a 1440 px wide browser and sign in to a prepared account with a fresh workout today.
2. Tap “How to perform it”. Confirm a side panel opens with the exercise demonstration clip and any available steps or form tips. Confirm the URL remains `#/workout/active` and the set form stays available. Close the panel.
3. Tap “See alternatives”. Confirm a side panel opens with matching alternatives or an explanation that none are available, while the URL remains `#/workout/active`. Close it.
4. Repeat steps 2 and 3 in a 375 px wide browser. Confirm each panel fits the screen, can be closed, and the values already typed in Reps and Weight remain in place.
