# Card 104: workout completion summary updates

Use a signed-in test account and a local database with the workout session and weekly-goal migrations applied. The app link is `http://localhost:5173/CSE442/2026-Fall/cse-442y/`. Each test starts from its own completed workout; use the saved session ID in `#/workouts/<id>/summary`. Run the visual tests in both Dark and Light appearance at 375 px and 1440 px.

## Test 1: Completed workout heading and actions

1. Start from the app link with `#/workouts/<id>/summary` appended, using a completed workout named `Pull` with a known completion time of Tuesday, November 17, 2026 in New York.
2. Confirm the heading says `Workout complete - Pull`. Beneath it, confirm the workout duration and `Tuesday, November 17, 2026` appear, without repeating `Pull`.
3. Confirm `Return to dashboard`, `Workout history`, and `Share summary` are all available. Select `Workout history` and confirm it opens `#/progress/history`.

## Test 1a: Reps completed metric

1. Start from the app link with `#/workouts/<id>/summary` appended, using a completed workout with two Bench press sets of `25 lb × 10` and one Squat set of `50 lb × 8`.
2. At 1440 px width, confirm the third statistic card says `Reps completed` and shows `28`, rather than the number of exercises.
3. At 375 px width, confirm the same card still says `Reps completed` and shows `28` without clipping.

## Test 2: Weekly goal card

1. Start from the app link with `#/workouts/<id>/summary` appended, using a completed workout that received one new training day of weekly-goal credit.
2. Confirm the Weekly goal card has no `Saved at completion` or week-range eyebrow. Confirm `Weekly goal` and the training-day count fit on the same header row without overlap at 375 px and 1440 px.
3. Confirm the text below the goal bar says `This workout was saved at completion and added one training day toward your weekly goal.`

## Test 3: Last set and weight PR

1. For the same test account, complete an earlier Push workout with Bench press `185 lb × 9` and Cable fly `40 lb × 12`. Complete a later Push workout with Bench press `165 lb × 10` and Cable fly `45 lb × 8`. Open the later workout's summary from `#/workouts/<id>/summary`.
2. In Session highlights, confirm the third column is `Vs last`, with `185 lb × 9` beside Bench press and `40 lb × 12` beside Cable fly. Confirm the top sets are `165 lb × 10` and `45 lb × 8` respectively.
3. Confirm Cable fly has a small `Weight PR` badge beside its top set and Bench press does not. Confirm `New PRs` is `1`. More reps at a lower weight must not count as a weight PR.

## Test 4: First exercise, equal weight, and older best

1. For a test account, complete a workout with a new exercise, an exercise whose earlier best is `100 lb`, and an exercise whose last workout was `90 lb` but whose older best was `110 lb`. Open its summary from `#/workouts/<id>/summary`.
2. Confirm the new exercise's `Vs last` cell is blank, its top set says `First result`, and `New PRs` is `0` if no other exercise set a record. A first result is a baseline, not a PR.
3. Confirm a `100 lb` top set has no PR badge even if it has more reps than before. Confirm a `100 lb` top set following the `90 lb` last workout also has no PR badge because the older `110 lb` best is higher.

## Test 5: Bodyweight record uses reps

1. For a test account, complete an earlier workout with one bodyweight Pull-up set of `10` reps. Complete a later workout with a bodyweight Pull-up set of `12` reps and open its summary at `#/workouts/<id>/summary`.
2. Confirm Pull-up shows `Bodyweight × 12` as its top set, `Bodyweight × 10` under `Vs last`, and a small `Rep PR` badge. Confirm `New PRs` is `1`.
3. Repeat with `10` reps in the later workout. Confirm no PR badge and `New PRs` is `0`.

## Test 6: Records failure leaves the saved summary available

1. Open a completed workout at the app link with `#/workouts/<id>/summary` appended and block only `api/workout_records.php` in browser Network tools.
2. Reload. Confirm the saved workout title, date, totals, and top sets still appear, with `New PRs` shown as unavailable, a message that records are unavailable, and no unverified PR badges.
3. Unblock the request and select `Try again`. Confirm `Vs last` values, baseline or PR labels, and the `New PRs` count appear without completing the workout again.

## Test 7: Plain-language exercise comparisons

1. Start from the app link with `#/workouts/<id>/summary` appended, using a completed workout whose previous Bench press top set was `100 lb × 5` and today's top set is `105 lb × 5`. Include a second exercise whose weight decreased while reps increased, and a first-ever exercise result.
2. At 1440 px, confirm Bench press keeps its Top set, Vs last, and PR badge in the existing columns. Confirm a full-width line below says `Last time: 100 lb × 5. Today: 105 lb × 5. That's 5 lb more.`
3. Confirm the second exercise's line shows both complete sets and explains both the weight and rep changes. Confirm the first-ever exercise says it is the first recorded result without inventing a previous set.
4. Repeat at 375 px. Confirm the explanations wrap below their exercises without clipping the badges or requiring horizontal page scrolling.
