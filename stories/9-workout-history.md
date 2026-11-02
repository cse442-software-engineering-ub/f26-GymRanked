# Story 9: As a gym goer, I want to view my existing workout history which is confirmed by seeing a list of my previously completed workouts along with their exercises, sets, reps, weights and dates for each workout on the page.

- **Tasks:** #106 (Implement Workout History Page)
- **Automated in:** `tests/e2e/9-workout-history.spec.js`

Test account: `Riley Brooks`, email `riley.brooks@example.com`, password `Riley-Curl95!`. It is a fake account loaded on the site with six finished workouts.

## Acceptance Test 1: Workout history lists finished workouts, newest first

### Setup for this test:

1. Connect to the UB VPN or use the campus network. On a computer, open the [Login page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login).
2. Log in with `riley.brooks@example.com` and `Riley-Curl95!`. Confirm that the Dashboard opens.

### Steps:

1. Select **Progress** in the top navigation, then **Workout history**. Confirm that the address ends in `#/progress/history`, that **Progress** is highlighted in the navigation, that the path above the heading reads `Progress › Workout history`, that the heading says `Workout history`, and that the line under it says `6 completed workouts`.
2. Confirm that four workouts are listed in this order, each closed, showing its name, date, and size:
   - `Full body C`, `Friday, October 9, 2026`, `3 exercises · 9 sets`
   - `Full body B`, `Wednesday, October 7, 2026`, `3 exercises · 8 sets`
   - `Full body A`, `Monday, October 5, 2026`, `3 exercises · 9 sets`
   - `Full body C`, `Friday, October 2, 2026`, `3 exercises · 9 sets`
3. Below the list, confirm that it says `Showing 1–4 of 6 workouts`, with page buttons **1** and **2**, **1** highlighted, and **Previous** greyed out.

## Acceptance Test 2: Open a workout to review its exercises, sets, reps, and weights

### Setup for this test:

1. Log in as Riley as in Acceptance Test 1, then select **Progress** in the top navigation, then **Workout history**. Confirm that `Workout history` opens.

### Steps:

1. Select **Full body C**, **Friday, October 9, 2026**. Confirm that it opens and shows three exercises in this order, each with a table of `Set`, `Reps`, and `Weight`:
   - `Split squat`: Set 1, 10 reps, 25 lb. Set 2, 10 reps, 25 lb. Set 3, 8 reps, 30 lb.
   - `Incline push-up`: Set 1, 12 reps, Bodyweight. Set 2, 12 reps, Bodyweight. Set 3, 10 reps, Bodyweight.
   - `Cable row`: Set 1, 10 reps, 70 lb. Set 2, 10 reps, 70 lb. Set 3, 10 reps, 70 lb.
2. Select **Full body B**, **Wednesday, October 7, 2026**. Confirm that it opens with `Hip hinge`, `Dumbbell press`, and `Lat pulldown`, and that `Lat pulldown` shows Set 1, 10 reps, 80 lb and Set 2, 8 reps, 90 lb. Confirm that **Full body C** (October 9) has closed.
3. Select **Full body B** again. Confirm that it closes and all four workouts are closed.

## Acceptance Test 3: Move between pages of workouts

### Setup for this test:

1. Log in as Riley as in Acceptance Test 1, then select **Progress** in the top navigation, then **Workout history**. Confirm that `Showing 1–4 of 6 workouts` appears.

### Steps:

1. Select page **2**. Confirm that it says `Showing 5–6 of 6 workouts`, that **2** is highlighted, that **Next** is greyed out, and that two workouts are listed in this order:
   - `Full body B`, `Wednesday, September 30, 2026`, `3 exercises · 9 sets`
   - `Full body A`, `Monday, September 28, 2026`, `3 exercises · 9 sets`
2. Select **Full body A**, **Monday, September 28, 2026**. Confirm that it shows:
   - `Goblet squat`: Set 1, 10 reps, 25 lb. Set 2, 10 reps, 25 lb. Set 3, 10 reps, 25 lb.
   - `Push-up`: Set 1, 8 reps, Bodyweight. Set 2, 8 reps, Bodyweight. Set 3, 6 reps, Bodyweight.
   - `Dumbbell row`: Set 1, 10 reps, 25 lb. Set 2, 10 reps, 25 lb. Set 3, 10 reps, 25 lb.
3. Select **Previous**. Confirm that `Showing 1–4 of 6 workouts` returns with **Full body C**, **Friday, October 9, 2026** first.

## Acceptance Test 4: Workouts are still there after logging out and back in

### Setup for this test:

1. Log in as Riley as in Acceptance Test 1, then select **Progress** in the top navigation, then **Workout history**. Confirm that `6 completed workouts` appears.

### Steps:

1. Open the account menu (the round `RB` button, top right) and select **Log out**. Confirm that the Login page says `You are logged out.`
2. Log in again with `riley.brooks@example.com` and `Riley-Curl95!`, then select **Progress**, then **Workout history**. Confirm that it still says `6 completed workouts` and lists the same four workouts as in Acceptance Test 1, step 2, in the same order.
3. Refresh the page. Confirm that the same heading, count, and four workouts appear again.

## Acceptance Test 5: A new account has an empty history and can't see anyone else's workouts

### Setup for this test:

1. Open the [Registration page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/register). Register `Casey Fresh` with a unique email such as `history-empty+YOUR_INITIALS-TIMESTAMP@example.com` and `TaskTestPass12!` in both password fields. Confirm that the Login page says `Account created. Log in to continue.`
2. Log in. Select **Strength** and **Save goal**, **Beginner** and **Save and continue**, then **Full gym access** and **Save and continue**. On `Choose your workout plan`, select **Choose plan** for **Beginner Fundamentals**. Confirm that the Dashboard opens.

### Steps:

1. Select **Progress** in the top navigation, then **Workout history**. Confirm that `Workout history` and `0 completed workouts` appear, followed by `No workouts logged yet`, `Finish your first workout and it will show up here with every exercise, set, and weight you logged.`, and a **Start a workout** button.
2. Confirm that there is no list of workouts and no page buttons, and that none of Riley's workouts (such as `Full body C` or `Friday, October 9, 2026`) appear.
3. Select **Start a workout**. Confirm that the weekly plan opens with the heading `Beginner Fundamentals — Week 1`.
4. Log out. Log in with `riley.brooks@example.com` and `Riley-Curl95!` and select **Progress**, then **Workout history**. Confirm that Riley still has `6 completed workouts`.

## Acceptance Test 6: Workout history works on a phone

### Setup for this test:

1. Use a phone, or Chrome on a computer with DevTools open (F12): select the device toolbar button and choose **iPhone SE** (375 × 667).
2. Log in as Riley on the [Login page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login). Confirm that the Dashboard opens.

### Steps:

1. Open the menu (the three lines, top right) and select **Progress**, then **Workout history**. Confirm that `Workout history` and `6 completed workouts` appear.
2. Confirm that each of the four workouts shows its name, date, and size (for example `3 exercises · 9 sets`), and that the page does not need to be scrolled sideways.
3. Select **Full body C**, **Friday, October 9, 2026**. Confirm that its three exercise tables, with every set's reps and weight from Acceptance Test 2, fit the screen width without sideways scrolling.
4. Scroll down and select page **2**. Confirm that `Showing 5–6 of 6 workouts` appears.

## Acceptance Test 7: Loading and a failed request show clear messages

### Setup for this test:

1. On a computer, log in as Riley as in Acceptance Test 1. Confirm that the Dashboard opens.
2. Open Chrome DevTools with F12 and select the **Network** tab.

### Steps:

1. In Network, check **Disable cache** and choose **Slow 3G** throttling. Select **Progress**, then **Workout history**. Confirm that `Loading your workout history...` appears before the workouts, and then the list from Acceptance Test 1 appears. Return to **No throttling**.
2. Select **Dashboard**. In DevTools, open Network request blocking (press Ctrl+Shift+P on Windows or Cmd+Shift+P on a Mac, type `Show Network request blocking`, and press Enter), check **Enable network request blocking**, and add the pattern `*workout_history.php*`.
3. Select **Progress**, then **Workout history**. Confirm that, instead of the list, the page says `Couldn't load your workout history. Check your connection and try again.` with a **Try again** button, and that it does not say `No workouts logged yet`.
4. Uncheck **Enable network request blocking** and select **Try again**. Confirm that the message disappears and `6 completed workouts` and the four workouts appear.

## Acceptance Test 8: Workout history needs you to be logged in

### Setup for this test:

1. Open a new private (incognito) browser window, so that you are not logged in.

### Steps:

1. Visit the [Workout history page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/progress/history) directly. Confirm that the Login page opens (the address ends in `#/login`) and that no workouts are shown.
2. Log in with `riley.brooks@example.com` and `Riley-Curl95!`, then select **Progress**, then **Workout history**. Confirm that `6 completed workouts` appears.
