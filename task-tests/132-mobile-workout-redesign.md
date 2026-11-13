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
