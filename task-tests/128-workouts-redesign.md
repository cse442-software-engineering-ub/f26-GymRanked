# 128 Workouts page redesign

## Test 1: Scheduled workout
1. Sign in with an account that has a selected workout plan and no workout completed today.
2. Open Workouts.
3. Confirm the plan name, week number, and date range appear above a featured card with a gym photo distinct from the Dashboard and active workout photos, today's workout name, duration, plan name, exercises, and Start workout button.
4. Confirm seven dated day tiles appear below the card, followed by View plan details. Open that link and confirm it shows the selected plan.

## Test 2: Completed workout summary remains accessible
1. Sign in with an account that completed a workout earlier this week.
2. Open Workouts.
3. Find the completed day's tile and select View summary. Confirm the saved workout summary opens.
4. Return to Workouts. If today is also completed, confirm the featured button opens today's saved summary rather than starting a second workout.

## Test 3: Phone and light theme
1. Sign in with a selected plan and open Workouts on a phone-sized screen.
2. Confirm the featured card, seven day tiles, and plan details link fit without horizontal scrolling and every action is usable.
3. Select Light in Account Settings → Appearance and repeat step 2. Confirm text, cards, orange accents, and the photo remain readable.

## Test 4: Unfinished workout
1. Sign in with an account that has started but not finished today's workout.
2. Open Workouts. Confirm the featured card says In progress and shows Resume workout.
3. Select Resume workout and confirm the saved session and sets reopen.

## Test 5: Desktop active workout cards align
1. Sign in with an account with a scheduled workout and open it on a desktop screen at least 1000px wide.
2. Confirm the Exercises card sits above a separate Saved sets card. Together they fill the space beside Log a set, with no page-background gap above Ready to wrap up.
3. Log a set with 25 lb and 10 reps. Confirm the Saved sets card shows the exercise, Set 1, 25 lb × 10, exercise volume 250 lb, and total volume 250 lb.
4. Select another exercise. Confirm the Saved sets card switches to that exercise and shows no saved sets and exercise volume 0 lb, while total volume remains 250 lb.
5. Log a set for the second exercise. Confirm only that exercise's set appears, its exercise volume increases, and total volume includes both exercises.
6. Select the first exercise again. Confirm its saved set and exercise volume return without losing the second exercise's contribution to total volume.
7. Log enough sets to fill the Saved sets card. Confirm the list scrolls inside the card while both volume fields and Ready to wrap up stay visible.

## Test 6: Phone active workout header
1. Sign in with a scheduled workout and open the active workout on a phone-sized screen.
2. Confirm the photo has a consistent dark overlay through its rounded edges, including the top and bottom borders.
3. Confirm the card is compact, the workout title sits near the top, and the plan, duration, and progress chips remain visible without clipping.
4. Switch to the light theme and repeat steps 2 and 3.

## Test 7: Phone week tiles have equal heights
1. Sign in with an account that completed a workout on Monday and has a rest day on Tuesday.
2. Open Workouts on a phone-sized screen.
3. Confirm all seven day tiles have the same height, including Monday with View summary and Tuesday with Recovery.
4. Confirm View summary remains fully visible and opens Monday's saved summary.

## Test 8: Workout summary card proportions and PR color
1. Open a completed workout summary with zero new PRs on a phone-sized screen.
2. Confirm the four statistic cards are compact, the Weekly goal card is taller, and its larger Weekly goal title stays on one line above the smaller training-days-completed text.
3. Confirm the New PRs card is gray. Repeat at desktop width and confirm it is still gray.
4. Open a completed workout summary with at least one new PR. Confirm the New PRs card has an orange accent at phone and desktop widths.
