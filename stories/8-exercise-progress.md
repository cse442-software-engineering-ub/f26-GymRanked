# Story 8: As a gym goer, I want to view my progress dashboard which is confirmed by seeing metrics on the page such as strength gains, PRs, and progress trend charts.

- **Tasks:** #109 (Exercise Progress Backend), #110 (Build exercise-specific Progress views)
- **Automated in:** `tests/e2e/8-exercise-progress.spec.js`

Test accounts: these are fake accounts loaded on the site. The Marcus and Dana numbers come from Mansur's expected results on #109.

- `Marcus Malone`, email `marcus.malone@example.com`, password `Marcus-Bench225!`: seven finished workouts from August 31 to October 14, 2026 (Back squat, Bench press and Pull-up), plus one unfinished workout that must never count.
- `Dana Lee`, email `dana.lee@example.com`, password `Dana-Squat315!`: two finished workouts in September 2026.
- `Taylor Reed`, email `taylor.reed@example.com`, password `Taylor-Lift265!`: three finished Deadlift workouts, 1, 50 and 150 days before the site's test data was last loaded. The 30-day and 90-day numbers below hold for 4 weeks after each load, so this test does not depend on today's date.

## Acceptance Test 1: Progress shows your all-time totals and one exercise's numbers

### Setup for this test:

1. Connect to the UB VPN or use the campus network. On a computer, open the [Login page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login).
2. Log in with `marcus.malone@example.com` and `Marcus-Bench225!`. Confirm that the Dashboard opens.

### Steps:

1. Select **Progress** in the top navigation. Confirm that the address ends in `#/progress`, that **Progress** is highlighted in the navigation, that the heading says `Your progress`, that the line under it says `Marcus Malone · All time`, and that **All time** is the selected one of the three buttons **30 days**, **90 days** and **All time**.
2. Confirm that four boxes show `Volume` `21,420 lb`, `Strength gain` `+16.7%`, `New PRs` `9`, and `Workouts logged` `7`.
3. Open the **Exercise** list. Confirm that it offers exactly `Back squat`, `Bench press` and `Pull-up`, in that order, and that `Back squat` is selected.
4. Confirm that the `Back squat` section shows `Heaviest weight` `260 lb`, `Latest estimated 1RM` `300 lb`, `Strength change` `+36 lb (+13.6%)`, `Workouts` `7`, `Volume` `9,240 lb`, and `New PRs` `4`, and a line chart of estimated 1RM with seven points.
5. Confirm that its table of workouts starts with `October 14, 2026`, `250 lb × 6`, `300 lb`, `1,500 lb` and ends with `August 31, 2026`, `220 lb × 6`, `264 lb`, `1,320 lb`, with seven rows in all, and that no workout dated `October 5, 2026` appears (that one was never finished).
6. Confirm that `Personal records` lists, in this order: `October 9, 2026` `260 lb × 3`, `September 21, 2026` `250 lb × 3`, `September 9, 2026` `240 lb × 6`, `September 2, 2026` `230 lb × 3`.

## Acceptance Test 2: Choosing another exercise changes the numbers, including a bodyweight exercise

### Setup for this test:

1. Log in as Marcus as in Acceptance Test 1, then select **Progress**. Confirm that `Back squat` is selected in the **Exercise** list.

### Steps:

1. Choose `Bench press` in the **Exercise** list. Confirm that the section changes to `Bench press` with `Heaviest weight` `220 lb`, `Latest estimated 1RM` `260 lb`, `Strength change` `+44 lb (+20.4%)`, `Workouts` `7`, `Volume` `12,180 lb`, and `New PRs` `4`, and that the four boxes at the top still show `21,420 lb`, `+16.7%`, `9` and `7`.
2. Confirm that the Bench press table has seven rows, starting with `October 14, 2026`, `200 lb × 9`, `260 lb`, `1,800 lb`, and that its row for `September 2, 2026` shows `190 lb × 6`, `234 lb`, `2,760 lb`.
3. Confirm that `Personal records` now lists `October 9, 2026` `220 lb × 3`, `September 30, 2026` `210 lb × 3`, `September 21, 2026` `200 lb × 6`, `September 2, 2026` `190 lb × 6`.
4. Choose `Pull-up`. Confirm that the section says `Bodyweight exercise: progress is counted in reps.` and shows `Most reps` `10 reps`, `Total reps` `33`, `Workouts` `3`, and `New PRs` `1`, with no heaviest weight, estimated 1RM or strength change.
5. Confirm that its table has three rows: `September 30, 2026` `Bodyweight × 9`, `September 21, 2026` `Bodyweight × 10`, `September 2, 2026` `Bodyweight × 8`, and that `Personal records` lists only `September 21, 2026` `Bodyweight × 10`.

## Acceptance Test 3: 30 days, 90 days and All time show only the workouts in that range

### Setup for this test:

1. On the [Login page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login), log in with `taylor.reed@example.com` and `Taylor-Lift265!`. Confirm that the Dashboard opens.

### Steps:

1. Select **Progress**. Confirm that **All time** is selected, the line under the heading says `Taylor Reed · All time`, and the boxes show `Volume` `3,675 lb`, `Strength gain` `+17.8%`, `New PRs` `2`, and `Workouts logged` `3`. Confirm that `Deadlift` is selected, with `Strength change` `+46.7 lb (+17.8%)` and three rows in its table.
2. Select **90 days**. Confirm that the line says `Taylor Reed · Last 90 days`, the boxes show `2,550 lb`, `+8.2%`, `2` and `2`, `Deadlift` shows `Strength change` `+23.4 lb (+8.2%)` and `Workouts` `2`, and its table has two rows.
3. Select **30 days**. Confirm that the line says `Taylor Reed · Last 30 days`, the boxes show `1,325 lb`, `—`, `1` and `1`, `Deadlift` shows `Heaviest weight` `265 lb`, `Latest estimated 1RM` `309.2 lb`, `Strength change` `—` with `Needs 2 workouts in this range`, and its table has one row with `265 lb × 5`.
4. Select **All time** again. Confirm that the numbers from step 1 return.

## Acceptance Test 4: Your progress is still there after refreshing and logging back in

### Setup for this test:

1. Log in as Marcus as in Acceptance Test 1, then select **Progress**. Confirm that `Workouts logged` shows `7`.

### Steps:

1. Refresh the page. Confirm that `Your progress`, `Marcus Malone · All time`, and the four boxes from Acceptance Test 1, step 2 appear again, with `Back squat` selected.
2. Open the account menu (the round `MM` button, top right) and select **Log out**. Confirm that the Login page says `You are logged out.`
3. Log in again with `marcus.malone@example.com` and `Marcus-Bench225!` and select **Progress**. Confirm that the boxes still show `21,420 lb`, `+16.7%`, `9` and `7`, and that choosing `Pull-up` still shows `Most reps` `10 reps`.

## Acceptance Test 5: Each account sees only its own progress, and a new account sees an empty page

### Setup for this test:

1. Open the [Login page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login) in a private (incognito) window.

### Steps:

1. Log in with `dana.lee@example.com` and `Dana-Squat315!` and select **Progress**. Confirm that the boxes show `Volume` `3,930 lb`, `Strength gain` `-2.2%`, `New PRs` `1`, and `Workouts logged` `2`, that the **Exercise** list offers only `Back squat` and `Bench press`, and that `Back squat` shows `Heaviest weight` `320 lb` and `Strength change` `-8 lb (-2.2%)`. Confirm that `Pull-up` and Marcus's `21,420 lb` appear nowhere.
2. Log out. Register `Casey Progress` on the [Registration page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/register) with a unique email such as `progress-empty+YOUR_INITIALS-TIMESTAMP@example.com` and `TaskTestPass12!` in both password fields, then log in.
3. Select **Strength** and **Save goal**, **Beginner** and **Save and continue**, then **Full gym access** and **Save and continue**. On `Choose your workout plan`, select **Choose plan** for **Beginner Fundamentals**. Confirm that the Dashboard opens.
4. Select **Progress**. Confirm that the page says `No progress to track yet` and `Log your first workout and your volume, personal records, and strength trends will start showing up here.` with a **Start a workout** button, and that it shows no numbers, no **Exercise** list, and none of Marcus's or Dana's exercises.
5. Select **Start a workout**. Confirm that the weekly plan opens with the heading `Beginner Fundamentals — Week 1`.

## Acceptance Test 6: Progress works on a phone

### Setup for this test:

1. Use a phone, or Chrome on a computer with DevTools open (F12): select the device toolbar button and choose **iPhone SE** (375 × 667).
2. Log in as Marcus on the [Login page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login). Confirm that the Dashboard opens.

### Steps:

1. Open the menu (the three lines, top right) and select **Progress**. Confirm that `Your progress` and the four boxes from Acceptance Test 1, step 2 appear, and that the page does not need to be scrolled sideways.
2. Choose `Bench press` in the **Exercise** list. Confirm that its numbers from Acceptance Test 2, step 1, its chart, and its seven-row table fit the screen width without sideways scrolling.
3. Select **30 days**, then **All time**. Confirm that the three buttons stay on one line and the numbers return to those in step 1.

## Acceptance Test 7: Loading and a failed request show clear messages

### Setup for this test:

1. On a computer, log in as Marcus as in Acceptance Test 1. Confirm that the Dashboard opens.
2. Open Chrome DevTools with F12 and select the **Network** tab.

### Steps:

1. In Network, check **Disable cache** and choose **Slow 3G** throttling. Select **Progress**. Confirm that `Loading your progress...` appears before the numbers, and then the boxes from Acceptance Test 1, step 2 appear. Return to **No throttling**.
2. Select **Dashboard**. In DevTools, open Network request blocking (press Ctrl+Shift+P on Windows or Cmd+Shift+P on a Mac, type `Show Network request blocking`, and press Enter), check **Enable network request blocking**, and add the pattern `*exercise_progress.php*`.
3. Select **Progress**. Confirm that the page says `Couldn't load your progress. Check your connection and try again.` with a **Try again** button, and that it shows no numbers and does not say `No progress to track yet`.
4. Uncheck **Enable network request blocking** and select **Try again**. Confirm that the message disappears and the boxes from Acceptance Test 1, step 2 appear.

## Acceptance Test 8: Workout history is still one click away, and Progress needs you to be logged in

### Setup for this test:

1. Open a new private (incognito) browser window, so that you are not logged in.

### Steps:

1. Visit the [Progress page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/progress) directly. Confirm that the Login page opens (the address ends in `#/login`) and that no numbers are shown.
2. Log in with `marcus.malone@example.com` and `Marcus-Bench225!` and select **Progress**. Select **Workout history**. Confirm that the address ends in `#/progress/history`, that **Progress** is still highlighted in the navigation, and that the page says `Workout history` and `7 completed workouts`, with `Wednesday, October 14, 2026` first.
3. In the path above the heading, select **Progress**. Confirm that `Your progress` opens again.
