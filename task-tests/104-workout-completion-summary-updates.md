# Card 104: workout completion summary updates

Use a signed-in test account and a local database with the workout session and weekly-goal migrations applied. The app link is `http://localhost:5173/CSE442/2026-Fall/cse-442y/`. Each test starts from its own completed workout; use the saved session ID in `#/workouts/<id>/summary`. Run the visual tests in both Dark and Light appearance at 375 px and 1440 px.

## Test 1: Completed workout heading and actions

1. Start from the app link with `#/workouts/<id>/summary` appended, using a completed workout named `Pull` with a known completion time of Tuesday, November 17, 2026 in New York.
2. Confirm the heading says `Workout complete - Pull`. Beneath it, confirm the workout duration and `Tuesday, November 17, 2026` appear, without repeating `Pull`.
3. Confirm `Return to dashboard`, `Workout history`, and `Share summary` are all available. Select `Workout history` and confirm it opens `#/progress/history`.

## Test 2: Weekly goal card

1. Start from the app link with `#/workouts/<id>/summary` appended, using a completed workout that received one new training day of weekly-goal credit.
2. Confirm the Weekly goal card has no `Saved at completion` or week-range eyebrow. Confirm `Weekly goal` and the training-day count fit on the same header row without overlap at 375 px and 1440 px.
3. Confirm the text below the goal bar says `This workout was saved at completion and added one training day toward your weekly goal.`

## Test 3: Last set and weight PR

1. For the same test account, complete an earlier Push workout with Bench press `185 lb × 9` and Cable fly `40 lb × 12`. Complete a later Push workout with Bench press `165 lb × 10` and Cable fly `45 lb × 8`. Open the later workout's summary from `#/workouts/<id>/summary`.
2. In Session highlights, confirm the third column is `Vs last`, with `185 lb × 9` beside Bench press and `40 lb × 12` beside Cable fly. Confirm the top sets are `165 lb × 10` and `45 lb × 8` respectively.
3. Confirm Cable fly has a small `Weight PR` badge beside its top set and Bench press does not. More reps at a lower weight must not count as a weight PR.

## Test 4: First exercise, equal weight, and older best

1. For a test account, complete a workout with a new exercise, an exercise whose earlier best is `100 lb`, and an exercise whose last workout was `90 lb` but whose older best was `110 lb`. Open its summary from `#/workouts/<id>/summary`.
2. Confirm the new exercise's `Vs last` cell is blank and its top set has a `Weight PR` badge.
3. Confirm a `100 lb` top set has no PR badge even if it has more reps than before. Confirm a `100 lb` top set following the `90 lb` last workout also has no PR badge because the older `110 lb` best is higher.

## Test 5: Comparison failure leaves the saved summary available

1. Open a completed workout at the app link with `#/workouts/<id>/summary` appended and block only `api/workout_summary_comparison.php` in browser Network tools.
2. Reload. Confirm the saved workout title, date, totals, and top sets still appear, with a message that previous sets are unavailable and no unverified PR badges.
3. Unblock the request and select `Try again`. Confirm `Vs last` values and weight PR badges appear without completing the workout again.
