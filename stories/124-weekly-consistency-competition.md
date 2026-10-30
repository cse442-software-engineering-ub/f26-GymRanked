# Story 124: As a gym goer, I want to compete each week with people who have the same training-day goal, which is confirmed by seeing my rank, my progress toward the goal, the other people's progress, and the time left until the competition resets on Monday.

- **Tasks:** #125 (Display weekly consistency standings, Sam), #126 (Calculate weekly consistency standings, Mansur)
- **Automated in:** `tests/e2e/124-weekly-consistency-competition.spec.js`

This is separate from the lifetime Strength / DOTS leaderboard in story #10, which stays as it is on its own tab. It reuses the saved weekly goal and the count of completed training days from story #87 (Surya's #89), so Home, the weekly goal page and the competition always show the same count. Nothing here recounts workouts.

Rules these tests check:

- **Same target, same group.** People compare only with others who have the same target this week, so "The 3-day circle" holds everyone whose target for the week is 3.
- **One date counts once.** Progress is distinct training days, capped at 100%. Extra sets, heavier weights and extra sessions on one date earn nothing.
- **Shared ranks.** People with the same progress share a rank and the next rank skips: two people at 3 of 3 are both `#1` and the next person is `#3`. People who share a rank are listed by name, A to Z.
- **Fresh each Monday.** The week runs Monday to Sunday and resets Monday at 12:00 AM New York time. Workout history is kept. A goal changed during the week starts next Monday.
- **The first week is practice.** Your first ranked week is the Monday after you join. Until then you see your own progress but have no rank and aren't listed, and the page names the Monday you start.
- **No divisions or promotion.** There are no leagues, tiers or promotion to a higher group.

Test accounts: fake accounts loaded by the backend task's seed file. Load the seed on the day of the test, on a Thursday, Friday or Saturday, because workouts are dated in the current week (Monday to Sunday, New York time), Maya needs 4 different days, and two of the accounts have a workout started today. Every account has finished setup and chosen Beginner Fundamentals, and the password is `Weekly-Test-Compete!`. Boards show people as first name and last initial.

- `Casey Lin`, `week-casey@example.com`: joined last week, target 3, 2 distinct training days this week before today, and an unfinished workout started today with one saved set. Finishing it makes 3 of 3.
- `Maya Rios`, `week-maya@example.com`: joined last week, target 3, 4 distinct training days this week (more than the goal).
- `Pat Moss`, `week-pat@example.com`: joined last week, target 3, three finished sessions this week on two different dates before today, each with at least two sets.
- `Jordan K.`, `Alex T.`, `Riley S.` and `Sam L.`: joined last week, target 3, with 2, 1, 1 and 0 training days this week.
- `Nia Cole`, `week-nia@example.com`: joined two weeks ago, target 3, finished workouts on 3 days last week and none this week.
- `Dana Fox`, `week-dana@example.com`: joined last week, target 5, 1 of 5. The only person in the 5-day circle.
- `Ivy Park`, `week-ivy@example.com`: target 3, has not joined, 2 distinct training days this week.
- `Lee Ford`, `week-lee@example.com`: joined this week, target 3, 1 training day this week before today, and an unfinished workout started today with one saved set. This is the practice week.
- `Tess Tester`, `week-tess@example.com`: a test account with target 3 and 3 training days this week, which must never be listed.
- The 3-day circle at the start (Ivy hasn't joined and Lee is in the practice week, so neither is listed): `#1` `Maya R.` 3 of 3, `#2` `Casey L.`, `#2` `Jordan K.` and `#2` `Pat M.` 2 of 3, `#5` `Alex T.` and `#5` `Riley S.` 1 of 3, `#7` `Nia C.` and `#7` `Sam L.` 0 of 3.
- Test order: Acceptance Tests 2 and 6 finish workouts. Run Tests 1, 8, 9 and 10 before Test 2, and load the seed again before running Test 2 or Test 6 a second time.

## Acceptance Test 1: Open the Weekly consistency tab and see your place, the deadline and the circle

### Setup for this test:

1. Connect to the UB VPN or use the campus network. On a computer, open the [Login page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login) and log in with `week-casey@example.com` and `Weekly-Test-Compete!`. Confirm that the Dashboard opens.

### Steps:

1. Select **Leaderboard** in the top navigation. Confirm that the address ends in `#/leaderboard/weekly`, and that the tabs **Weekly consistency** and **Strength** are shown, with **Weekly consistency** selected.
2. Confirm that the top card says `THE 3-DAY CIRCLE` and `Show up. Move up. Start fresh.`, and a countdown that ends with `Resets Monday, 12:00 AM New York time`. Confirm that the countdown shows the days, hours and minutes left until the coming Monday (for example `2d 9h 12m left` on a Friday at 2:48 PM, or `2d 10h 12m left` in a week when the clocks go back on Sunday).
3. Confirm that the top card says `You're #2` and `2/3 days · 67%`, and that the board has the columns `RANK`, `MEMBER`, `TRAINING DAYS` and `GOAL REACHED`.
4. Confirm that the board lists, in this order: `#1` `Maya R.` `3 of 3 days` `100%`; `#2` `Casey L.` marked `You` `2 of 3 days` `67%`; `#2` `Jordan K.` `2 of 3 days` `67%`; `#2` `Pat M.` `2 of 3 days` `67%`; `#5` `Alex T.` `1 of 3 days` `33%`; `#5` `Riley S.` `1 of 3 days` `33%`; `#7` `Nia C.` `0 of 3 days` `0%`; `#7` `Sam L.` `0 of 3 days` `0%`. Confirm that the line `Shared progress = shared rank. Everyone here has the same 3-day goal.` appears below it, and that `Dana F.`, `Ivy P.`, `Lee F.` and `Tess T.` are not listed.

## Acceptance Test 2: Finishing a workout moves you up and the shared rank appears

### Setup for this test:

1. Log in on the [Login page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login) with `week-casey@example.com` and `Weekly-Test-Compete!`. Confirm that the weekly card on the Dashboard shows `2/3` and `training days logged`. Select **Leaderboard** and confirm that `You're #2` and `2/3 days · 67%` appear.

### Steps:

1. Select **Dashboard**, then **Resume workout**. Select **Complete workout**, then **Complete workout** in the box that opens. Confirm that the summary says `Workout complete`. Select **Return to dashboard** and confirm that the weekly card shows `3/3` and `training days logged`.
2. Select **Leaderboard** and confirm that **Weekly consistency** is selected. Confirm that the top card now says `You're #1`, `3/3 days · 100%` and `Goal reached`.
3. Confirm that the board starts with `#1` `Casey L.` marked `You` and `#1` `Maya R.`, both with `3 of 3 days` and `100%`, followed by `#3` `Jordan K.` and `#3` `Pat M.` with `2 of 3 days` and `67%`, and that `Alex T.` and `Riley S.` both show `#5`.
4. Refresh the page and confirm that the same ranks, counts and `You're #1` remain. The workout must not be counted a second time.

## Acceptance Test 3: Extra sessions on one date and extra days earn no extra points

### Setup for this test:

1. Log in with `week-pat@example.com` and `Weekly-Test-Compete!`. Confirm that the weekly card on the Dashboard shows `2/3` and `training days logged`, although three sessions were finished this week.

### Steps:

1. Select **Leaderboard**. Confirm that the top card says `2/3 days · 67%` and that your row, marked `You`, says `2 of 3 days` and `67%`.
2. Confirm that `Maya R.` shows `3 of 3 days` and `100%`, although she trained on 4 different days this week: no row goes above `100%` or past `3 of 3 days`.

## Acceptance Test 4: Only people with the same target are compared

### Setup for this test:

1. Log in with `week-dana@example.com` and `Weekly-Test-Compete!`. Confirm that the weekly card on the Dashboard shows `1/5` and `training days logged`.

### Steps:

1. Select **Leaderboard**. Confirm that the top card says `THE 5-DAY CIRCLE`, `You're #1` and `1/5 days · 20%`, and that the board lists only `#1` `Dana F.` marked `You` with `1 of 5 days` and `20%`.
2. Confirm that `Maya R.`, `Casey L.` and the other 3-day people do not appear, and that the line below the board says `Shared progress = shared rank. Everyone here has the same 5-day goal.`
3. Log out, log in with `week-maya@example.com` and `Weekly-Test-Compete!`, and select **Leaderboard**. Confirm that the top card says `THE 3-DAY CIRCLE` and that `Dana F.` does not appear.

## Acceptance Test 5: Joining starts a practice week, and join and leave are remembered

### Setup for this test:

1. Log in with `week-ivy@example.com` and `Weekly-Test-Compete!`. Confirm that the weekly card on the Dashboard shows `2/3` and `training days logged`.

### Steps:

1. Select **Leaderboard**. Confirm that **Weekly consistency** is selected, that the top card says `Join the weekly competition` with your progress `2/3 days · 67%` and a **Join the weekly competition** button instead of a rank, and that no row is marked `You`.
2. Select **Join the weekly competition**. Confirm that the top card now says `Practice week`, `Your ranked weeks start Monday,` followed by the date of the coming Monday, `2/3 days · 67%` and a **Leave** button, and that `Ivy P.` is not listed.
3. Open the account menu, select **Log out**, log back in, and select **Leaderboard**. Confirm that the top card still says `Practice week`.
4. Select **Leave**. Confirm that the page says `You've left the weekly competition. Your workouts are kept.` and that the **Join the weekly competition** button is shown again. Select **Dashboard** and confirm that the weekly card still shows `2/3`.

## Acceptance Test 6: The practice week shows your progress without a rank

### Setup for this test:

1. Log in with `week-lee@example.com` and `Weekly-Test-Compete!`. This account joined this week. Confirm that the weekly card on the Dashboard shows `1/3` and `training days logged`.

### Steps:

1. Select **Leaderboard**. Confirm that the top card says `Practice week`, `1/3 days · 33%`, and `Your ranked weeks start Monday,` followed by the date of the coming Monday.
2. Confirm that the top card doesn't say `You're #` and that no row on the board is marked `You`.
3. Select **Dashboard**, then **Resume workout**. Select **Complete workout**, then **Complete workout** in the box that opens. Select **Leaderboard**. Confirm that the top card says `2/3 days · 67%` and still `Practice week`, with no rank.

## Acceptance Test 7: A new week starts from zero and keeps the history

### Setup for this test:

1. Log in with `week-nia@example.com` and `Weekly-Test-Compete!`. Nia trained on 3 days last week and has not trained this week.

### Steps:

1. Open the Dashboard. Confirm that the weekly card shows `0/3` and `training days logged`, that no day this week says `Logged`, and that the **Weekly milestone** card says `This week: 3 training days.`
2. Select **Leaderboard**. Confirm that the top card says `You're #7` and `0/3 days · 0%`, and that last week's days are not counted.
3. Select **Progress**, then **Workout history**. Confirm that last week's three finished workouts are still listed.

## Acceptance Test 8: The Strength tab and its leaderboard are unchanged

### Setup for this test:

1. Log in with `week-casey@example.com` and `Weekly-Test-Compete!`. Select **Leaderboard**.

### Steps:

1. Select **Strength**. Confirm that the address ends in `#/leaderboard`, that the Strength / DOTS leaderboard from story #10 opens with its **Overall**, **Bench press**, **Back squat** and **Deadlift** tabs and its `How to get ranked` card, and that it doesn't show `THE 3-DAY CIRCLE`.
2. Select **Weekly consistency**. Confirm that the address ends in `#/leaderboard/weekly` and that the top card shows the same rank as before.

## Acceptance Test 9: Home and the standings agree, and a failed request says so

### Setup for this test:

1. Log in with `week-casey@example.com` and `Weekly-Test-Compete!`. Confirm that the weekly card on the Dashboard shows `2/3` and `training days logged`.

### Steps:

1. Select **Leaderboard**. Confirm that the page opens on **Weekly consistency** and shows `You're #2` and `2/3 days · 67%`, the same count as Home.
2. In Chrome DevTools, open Network request blocking (press Cmd+Shift+P on a Mac or Ctrl+Shift+P on Windows, type `Show Network request blocking` and press Enter), check **Enable network request blocking**, add the pattern `*weekly_standings.php*` and reload the page. Confirm that the page says `Couldn't load this week's standings. Check your connection and try again.` with a **Try again** button, and that it doesn't show `0/3 days` or a rank.
3. Uncheck **Enable network request blocking** and select **Try again**. Confirm that the same rank and progress as before return.

## Acceptance Test 10: The weekly competition works on a phone

### Setup for this test:

1. On a phone held upright (or a browser window 390 pixels wide), open the [Login page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login) and log in with `week-casey@example.com` and `Weekly-Test-Compete!`.

### Steps:

1. Open the menu button at the top left and select **Leaderboard**. Confirm that **Weekly consistency** and **Strength** are both visible and tappable, and that the page doesn't scroll sideways.
2. Confirm that the top card with `You're #2`, `2/3 days · 67%` and the countdown is visible without scrolling down, and that each board row shows the rank, name, `of 3 days` count and percentage.
3. Open the menu, select **Profile**, find **Appearance** and select **Light**. Return to **Leaderboard** and confirm that the top card, the board and the countdown are still readable, then switch back to **Dark**.
