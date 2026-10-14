# Story 7: As a user at the gym, I want to log my daily session, which is confirmed by seeing a sequential list of today's exercises with input fields to enter weight and reps, along with a "Complete Workout" button.

- **Tasks:** #102 (daily logging frontend), and the backend and Playwright task cards
- **Automated in:** `tests/e2e/7-log-daily-workout.spec.js`

(Note: the real "Today" screen is not built yet, so these tests use the page for today's workout at #/dev/workout-log. It always shows the Push day of Push Pull Legs, so the exercises are the same on any weekday. Weights are in pounds. Nothing on the test page is saved to the database.)

Test account used below (from the seeded test users): name "Marcus Malone", email marcus.malone@example.com, password Marcus-Bench225!. Before you start, the seed in database/seeds/README.md must be loaded into the database you are testing.

## Acceptance Test 1: Today's exercises appear in order with weight and reps boxes

Before you start: Connect to the UB VPN, or use the campus network. If you are logged in, log out. Open https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login, type marcus.malone@example.com and Marcus-Bench225!, and press "Log in". The Dashboard should open.

1. Open https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/dev/workout-log.
2. Look at the top of the page. You should see the words "TODAY'S WORKOUT", the heading "Push", and the line "Push Pull Legs · Chest, shoulders, triceps · About 45 min".
3. Look at the list under it. You should see three exercises, from top to bottom, in this order: "Bench press", "Overhead press", "Triceps pushdown". Each one shows "0 sets".
4. Look inside each exercise. You should see "Set 1" with a box labelled "Weight (lb)", a box labelled "Reps", and a "Save set" button.
5. Look at the very bottom of the list. You should see one "Complete Workout" button.

Test passes if: All three exercises appear in the order above, each with a "Weight (lb)" box, a "Reps" box and a "Save set" button, and one "Complete Workout" button sits below them.
Test fails if: Any of these happen:

* an exercise is missing or the order is different;
* an exercise has no weight box or no reps box;
* there is no "Complete Workout" button, or one for each exercise instead of one at the bottom.

## Acceptance Test 2: Logging a set for each exercise

Before you start: Log in as in Test 1 and open https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/dev/workout-log.

1. Under "Bench press", click the "Weight (lb)" box and type 135. Click the "Reps" box and type 8. Press "Save set".
2. Look under "Bench press". You should see "Set 1" with "135 lb × 8" next to it, a green "Set 1 saved", and the count change to "1 set". A new "Set 2" form should appear below it, with the 135 and 8 shown as faint grey hints.
3. In the "Set 2" form, type 135 and 6, then press "Save set". You should see "Set 2" listed under "Set 1", and the count change to "2 sets".
4. Under "Overhead press", type 65 in "Weight (lb)" and 10 in "Reps", then press "Save set". You should see "Set 1" with "65 lb × 10".
5. Under "Triceps pushdown", type 0 in "Weight (lb)" and 12 in "Reps", then press "Save set". You should see "Set 1" listed (0 means a bodyweight set).
6. Check that the sets stay under the exercise they were typed into, and that the page did not flash white and reload.

Test passes if: Each saved set is listed under its own exercise, in the order it was saved, with the right numbers, and the exercise's count goes up each time.
Test fails if: A set is missing, appears under the wrong exercise, shows different numbers from the ones typed, or the page reloads.

## Acceptance Test 3: Empty or invalid weight and reps are refused

Before you start: Log in as in Test 1 and open https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/dev/workout-log.

1. Under "Bench press", leave both boxes empty and press "Save set".
2. Look under "Bench press". You should see "Enter a weight (0 for bodyweight)." in red under "Weight (lb)" and "Enter your reps." in red under "Reps". The count should still say "0 sets".
3. Type 135 in "Weight (lb)" and 0 in "Reps", then press "Save set". You should see "Reps must be between 1 and 100." and "0 sets".
4. Type 1501 in "Weight (lb)" and 8.5 in "Reps", then press "Save set". You should see "Weight must be between 0 and 1500 lb." and "Reps must be a whole number."
5. Type 135.555 in "Weight (lb)" and 8 in "Reps", then press "Save set". You should see "Use at most 2 decimal places, like 137.25."
6. Type 137.25 in "Weight (lb)" and 8 in "Reps", then press "Save set". You should see "Set 1" with "137.25 lb × 8" and the count change to "1 set".

Test passes if: Each wrong value shows its exact red message and nothing is saved, and the correct values in step 6 are saved.
Test fails if: A wrong value is saved, a message is missing or worded differently, or the correct values in step 6 are refused.

## Acceptance Test 4: Complete Workout needs at least one logged set

Before you start: Log in as in Test 1 and open https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/dev/workout-log. Do not log any sets.

1. Press the "Complete Workout" button.
2. Look under the button. You should see "Log at least one set before completing." in red, and every exercise should still show "0 sets".
3. Under "Bench press", type 135 in "Weight (lb)" and 8 in "Reps", but do not press "Save set". Press "Complete Workout" again.
4. Look under the button. You should see "Save or clear the set you're still editing before completing."
5. Check that the "Complete Workout" button is still there and the boxes are still editable.

Test passes if: Both exact red messages appear, and the workout is not completed.
Test fails if: "Workout completed" appears, or a message is missing or worded differently.

## Acceptance Test 5: Completing the workout locks the logged sets

Before you start: Log in as in Test 1 and open https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/dev/workout-log.

1. Under "Bench press", type 135 and 8 and press "Save set". Under "Overhead press", type 65 and 10 and press "Save set". Leave "Triceps pushdown" empty.
2. Press the "Complete Workout" button once.
3. Look at the bottom of the page. The button should be replaced by "Workout completed".
4. Look under "Bench press" and "Overhead press". You should see "Set 1" with "135 lb × 8" and "Set 1" with "65 lb × 10", the words "Workout completed — these sets can no longer be changed.", and no "Weight (lb)" box, "Reps" box or "Save set" button.
5. Look under "Triceps pushdown". You should see "No sets logged." and no boxes.

Test passes if: "Workout completed" replaces the button, the saved sets stay on screen, and every box and "Save set" button is gone.
Test fails if: The button is still there, a saved set disappears or changes, or you can still type in a weight or reps box.

## Acceptance Test 6: Logging fails clearly when the connection drops

Before you start: Log in as in Test 1. Open https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/dev/workout-log?simulate=offline (this makes every save fail, as if the connection dropped).

1. Under "Bench press", type 135 and 8 and press "Save set".
2. Look under "Bench press". You should see a red error message and a "Retry" button. The count should still say "0 sets", and the 135 and 8 should still be in the boxes.
3. Press the "Complete Workout" button. You should see "Log at least one set before completing.", because nothing was saved.
4. Remove "?simulate=offline" from the address and press Enter. Press "Retry". You should see "Set 1" with "135 lb × 8" and the count change to "1 set".

Test passes if: The failed save shows an error without losing what you typed, and "Retry" saves it once the connection is back.
Test fails if: The set shows as saved while offline, the typed numbers disappear, or "Retry" does not save it.
