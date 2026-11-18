# Story 131: As a lifter, I want to move between pages from a menu grouped by activity and switch the rankings between everyone and my workout buddies, which is confirmed by seeing the chosen page open with its section highlighted and, with Buddies chosen, my group's members ranked with my own place among them.

- **Tasks:** #133 (the navigation menu: desktop sidebar and phone menu, Samuel), #139 (Buddies rankings on the Strength and Weekly Consistency boards, Samuel)
- **Automated in:** not automated yet (`tests/e2e/131-navigation-menu.spec.js`)

These tests are for someone who has never used GymRank. They run on Cattle and use no developer tools.

Rules these tests check:

- **One menu everywhere.** Every signed-in page has the same menu: down the left side on a computer, behind a "Menu" button on a phone. The row for the open section is highlighted, including on pages inside a section (plan details, workout history, a workout).
- **Everyone or Buddies.** Both Rankings boards (Weekly consistency and Strength) have an "Everyone | Buddies" switch. Buddies ranks only the members of your own workout buddies group, with the same rules as the public boards.
- **Names only for people without a rank.** Group members who haven't earned a rank are listed under "Unranked" by name only, with no numbers.
- **The choice sticks.** Buddies stays chosen when you change the lift, switch boards, reload the page or press Back.
- **Only your own group.** Nobody sees another group's members.

Test accounts: fake accounts loaded by two seed files. Ask the team to load `weekly_competition.sql` and `buddy_rankings.sql` on Cattle on the day of the test (any day, but not between 12:00 AM and 1:00 AM New York time). Boards show people as first name and last initial.

- `Casey Lin`, `week-casey@example.com`, password `Weekly-Test-Compete!`: has a workout plan and an unfinished workout started today with one saved set.
- Password `Crew-Test-78!` for every account below.
- **Northside Crew** (13 members):
  - `Nora Vale`, `crew-nora@example.com`, is ranked #1 of 11 on Overall strength (340.77) and #1 of 7 in the 3-day weekly goal.
  - `Cal Dixon`, `crew-cal@example.com`, hasn't joined the leaderboard, so has no rank.
  - `Gus Hart`, `crew-gus@example.com`, has a 4-day weekly goal.
- **Eastside Lifters** (4 members):
  - `Ola Finch`, `crew-ola@example.com`.
  - `Tim Webb`, `crew-tim@example.com`, has no deadlift logged, so isn't ranked on Overall but is ranked #4 of 4 on Bench press.
- `Zed Nolan`, `crew-zed@example.com`, is in no group.
- The crew accounts are test accounts, so the public (Everyone) boards don't list them and say "Test accounts aren't shown on the leaderboard." for them. Buddies ranks them inside their own group.
- Test order: Acceptance Test 5 opens Casey's workout but saves nothing, so any order works.

## Acceptance Test 1: Choose a page from the menu on a computer

### Setup for this test:

1. Connect to the UB VPN or use the campus network. On a computer, open the [Login page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login) and log in with `week-casey@example.com` and `Weekly-Test-Compete!`. Confirm that the Dashboard opens.

### Steps:

1. Look at the left side of the page. Confirm that a menu runs down it: under `TRAINING` it lists **Dashboard**, **Workouts**, **Plans** and **Progress**, under `COMMUNITY` it lists **Rankings** and **Buddies**, and `Casey Lin` with `View profile` and **Log out** are at the bottom. Confirm that **Dashboard** is the highlighted row.
2. Click **Workouts**. Confirm that the Workouts page opens, that **Workouts** is now the highlighted row and **Dashboard** is not, and that the menu stayed where it was.
3. Click **Plans**, then **Progress**, then **Rankings**, then **Buddies**. Confirm each time that the page opens (`Plan library`, `Your progress`, the Weekly consistency board, `Workout buddies`) and that its row is the only highlighted one.
4. Confirm that none of these pages has a bar of links across the top.

## Acceptance Test 2: A page inside a section keeps its section highlighted

### Setup for this test:

1. On a computer, open the [Login page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login) and log in with `week-casey@example.com` and `Weekly-Test-Compete!`.

### Steps:

1. Click **Plans** in the menu, then click **View plan →**. Confirm that `Beginner Fundamentals` opens and that **Plans** is still highlighted.
2. Click **Back to plan library**. Confirm that `Plan library` opens.
3. Click **Progress** in the menu, then click **Workout history**. Confirm that `Workout history` opens and that **Progress** is still highlighted.
4. Click **Workouts** in the menu, then click the orange button that starts with **Resume** (for example `Resume Full body B`). Confirm that the workout opens and that **Workouts** is highlighted.

## Acceptance Test 3: Choose a page from the menu on a phone

### Setup for this test:

1. On a phone held upright (or a browser window about 390 pixels wide), open the [Login page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login) and log in with `week-casey@example.com` and `Weekly-Test-Compete!`. Confirm that the Dashboard opens with a **Menu** button at the top and no menu down the side.

### Steps:

1. Tap **Menu**. Confirm that the menu opens from the side with the same rows as on a computer (Dashboard, Workouts, Plans, Progress, Rankings, Buddies, `Casey Lin` with `View profile`, and Log out), and that **Dashboard** is highlighted.
2. Tap **Progress**. Confirm that the menu closes by itself and `Your progress` opens.
3. Tap **Menu**. Confirm that **Progress** is now highlighted.
4. Tap the close button (the **×**) at the top of the menu. Confirm that the menu closes and `Your progress` is still open.
5. Tap **Menu**, then tap `Casey Lin`. Confirm that the menu closes and the Profile page opens.

## Acceptance Test 4: Use the phone menu with a keyboard

### Setup for this test:

1. On a computer, make the browser window as narrow as it goes (about the width of a phone), so the **Menu** button shows. Open the [Login page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login) and log in with `week-casey@example.com` and `Weekly-Test-Compete!`.

### Steps:

1. Press the Tab key until **Menu** has an orange outline, then press the Enter key. Confirm that the menu opens.
2. Press Tab several times. Confirm that the orange outline moves through the rows of the menu and never jumps to the page behind it.
3. Press the Escape key (Esc, top left of the keyboard). Confirm that the menu closes and the orange outline is back on **Menu**.
4. Press Enter, press Tab until **Buddies** is outlined, and press Enter. Confirm that the menu closes and `Workout buddies` opens.

## Acceptance Test 5: Visit Buddies during a workout and come back to the same workout

### Setup for this test:

1. On a phone held upright, open the [Login page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login) and log in with `week-casey@example.com` and `Weekly-Test-Compete!`.

### Steps:

1. Tap **Menu**, then **Workouts**. Confirm that the page shows a **Resume workout** button.
2. Tap **Resume workout**. Confirm that the workout opens, that the first exercise in the list shows `1 set`, and that it says `Exercise 2 of 3` followed by the exercise's name. Write down that name.
3. Tap **Menu**. Confirm that the menu opens over the workout and that **Workouts** is highlighted.
4. Tap **Buddies**. Confirm that `Workout buddies` opens.
5. Tap **Menu**, then **Workouts**. Confirm that the page still shows **Resume workout**.
6. Tap **Resume workout**. Confirm that the same workout opens on `Exercise 2 of 3` with the name you wrote down, and that the first exercise still shows `1 set` (not 2).

## Acceptance Test 6: Profile and Log out are easy to reach, and pages before login have no menu

### Setup for this test:

1. On a computer, open the [Login page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login) and log in with `week-casey@example.com` and `Weekly-Test-Compete!`.

### Steps:

1. Click `Casey Lin` at the bottom of the menu. Confirm that the Profile page opens.
2. Click **Log out** at the bottom of the menu. Confirm that the Login page opens and says `You are logged out.`, and that it shows no menu.
3. Click **Create an account**. Confirm that this page shows no menu either.

## Acceptance Test 7: See your buddies group on the Strength board

### Setup for this test:

1. On a computer, open the [Login page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login) and log in with `crew-nora@example.com` and `Crew-Test-78!`.

### Steps:

1. Click **Rankings** in the menu, then **Strength**. Confirm that above the lift tabs there is a switch with **Everyone** (selected) and **Buddies**, and no "Friends" button.
2. Click **Buddies**. Confirm that the address ends in `#/leaderboard?scope=buddies` and **Buddies** is now selected.
3. Confirm that your card says `Buddies rank · Overall`, `#1 of 11 on Overall` and `340.77 DOTS points`.
4. Confirm that the board says `Northside Crew` and `13 members · Group ranks for Overall`, with a **View group ›** link.
5. Confirm that the board lists 11 people with no "· · ·" gap: `1` `Nora V.` (outlined, with `You`) `340.77`, `2` `Eli M.` `326.34`, `3` `Ana R.` `308.31`, `3` `Ben R.` `308.31` (the same score shares a rank), `5` `Fay S.` `283.07`, and so on down to `11` `Lea M.` `218.16`.
6. Confirm that under the list, `UNRANKED ON OVERALL` shows `Cal D.` and `Dev S.` with no numbers next to them.
7. Click **View group ›**. Confirm that `Workout buddies` opens with `Northside Crew`.

## Acceptance Test 8: Changing the lift ranks the group again, and Buddies stays chosen across pages, reloads and Back

### Setup for this test:

1. On a computer, open the [Login page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login) and log in with `crew-tim@example.com` and `Crew-Test-78!`.

### Steps:

1. Click **Rankings**, then **Strength**, then **Buddies**. Confirm that the board says `Eastside Lifters` and lists `1` `Raf S.`, `2` `Ola F.` and `3` `Pia Q.`, that `UNRANKED ON OVERALL` shows `Tim W.`, and that your card says `Overall needs all three lifts. Log a deadlift to get on it.`
2. Click the **Bench press** tab. Confirm that **Buddies** is still selected, that your card says `#4 of 4 on Bench press` and `64.74 DOTS points`, and that `Tim W.` is now the 4th row with `You`.
3. Click **Weekly consistency** at the top. Confirm that **Buddies** is still selected on this board and it says `Eastside Lifters`.
4. Reload the page (press Cmd+R on a Mac or Ctrl+R on Windows). Confirm that **Buddies** is still selected.
5. Click the browser's Back button. Confirm that the Strength board comes back on **Bench press** with **Buddies** selected and `#4 of 4 on Bench press`.
6. Click **Everyone**. Confirm that the public board appears and `Eastside Lifters` is gone.

## Acceptance Test 9: The weekly board shows one table per weekly goal, your own goal first

### Setup for this test:

1. On a computer, open the [Login page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login) and log in with `crew-nora@example.com` and `Crew-Test-78!`.

### Steps:

1. Click **Rankings** in the menu, then click **Buddies** in the standings card. Confirm that the top card says `BUDDIES · 3-DAY GOAL`, `You're #1 of 7` and `Northside Crew`, with `3/3 days · 100%`.
2. Confirm that the first table is `3-day goal`, marked `Your goal`: `#1` `Eli M.`, `#1` `Lea M.`, `#1` `Nora V.` (outlined, with `You`), `#4` `Ana R.`, `#4` `Ben R.`, `#6` `Fay S.`, `#7` `Kai L.`
3. Confirm that it is followed by a `4-day goal` table (`#1` `Gus H.`, `#2` `Hal D.`, `#2` `Ira C.`) and a `5-day goal` table (`#1` `Jon P.`), and that `UNRANKED THIS WEEK` shows `Cal D.` and `Dev S.` with no numbers.
4. Click **Log out**, log in with `crew-gus@example.com` and `Crew-Test-78!`, click **Rankings**, then **Buddies**. Confirm that the top card says `BUDDIES · 4-DAY GOAL` and `You're #1 of 3`, and that the first table is now `4-day goal`, marked `Your goal`.

## Acceptance Test 10: The Dashboard's rankings open the matching board

### Setup for this test:

1. On a computer, open the [Login page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login) and log in with `crew-nora@example.com` and `Crew-Test-78!`. Confirm that the Dashboard opens.

### Steps:

1. Find `Your rankings` on the Dashboard and choose **Buddies** in its menu. Confirm that the Weekly consistency row shows `#1` and the Overall strength row shows `340.77 DOTS` and `#1`.
2. Click the **Weekly consistency** row. Confirm that the weekly board opens with **Buddies** selected and `You're #1 of 7`.
3. Click the browser's Back button, choose **Buddies** again, and click the **Overall strength** row. Confirm that the Strength board opens with **Buddies** selected, `#1 of 11 on Overall` and `340.77 DOTS points`, the same numbers as on the Dashboard.

## Acceptance Test 11: Someone in no group, and someone without a rank in their own group

### Setup for this test:

1. On a computer, open the [Login page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login) and log in with `crew-zed@example.com` and `Crew-Test-78!`.

### Steps:

1. Click **Rankings**, then **Strength**, then **Buddies**. Confirm that the board says `You haven't joined a buddy group yet` and `Create a group or enter an invite code to compare standings with your workout buddies.`, shows no list of people, and that your card shows `No buddy group`.
2. Click **Weekly consistency** at the top. Confirm that the top card says `No buddy group yet` and the standings show the same `You haven't joined a buddy group yet` message.
3. Click **Join or create a group ›**. Confirm that `Workout buddies` opens.
4. Click **Log out**, log in with `crew-cal@example.com` and `Crew-Test-78!`, click **Rankings**, then **Strength**, then **Buddies**. Confirm that your card shows `How to get ranked`, that the board lists the 11 ranked Northside Crew members, and that `UNRANKED ON OVERALL` shows `Cal D.` and `Dev S.` with no numbers.

## Acceptance Test 12: Losing the connection shows Try again and keeps Buddies chosen

### Setup for this test:

1. On a computer, open the [Login page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login) and log in with `crew-nora@example.com` and `Crew-Test-78!`. Click **Rankings**, then **Strength**, then **Buddies**, and wait for the list.

### Steps:

1. Turn off the computer's internet connection (switch off Wi-Fi or unplug the network cable) and keep this page open.
2. Click the **Bench press** tab. Confirm that the board says `Couldn't load the leaderboard. Check your connection and try again.` with a **Try again** button, that no list of people is shown, and that **Buddies** is still selected.
3. Turn the internet connection back on, and reconnect to the UB VPN if you use it. Click **Try again**. Confirm that the Bench press group board appears with your card saying `#1 of 11 on Bench press`.

## Acceptance Test 13: Only your own group is shown, on a computer and a phone

### Setup for this test:

1. Use two browsers or devices, for example Chrome on a computer and a phone. On the computer, log in with `crew-nora@example.com` and `Crew-Test-78!`. On the phone, held upright, log in with `crew-ola@example.com` and `Crew-Test-78!`.

### Steps:

1. On the computer, click **Rankings**, then **Strength**, then **Buddies**. Confirm that the list shows only Northside Crew members (Nora V. to Lea M., plus Cal D. and Dev S. under Unranked) and none of `Raf S.`, `Ola F.`, `Pia Q.` or `Tim W.`
2. On the phone, tap **Menu**, **Rankings**, **Strength**, then **Buddies**. Confirm that the switch fills the width, nothing is cut off at the sides, and the list shows only `Raf S.`, `Ola F.` (with `You`) and `Pia Q.`, with `Tim W.` under Unranked, and no Northside Crew name.
3. On the phone, tap **Weekly consistency**. Confirm that **Buddies** is still selected, the board says `Eastside Lifters`, and no Northside Crew name appears.
4. On the computer, click **Everyone** on the switch. Then press Tab once and press Enter. Confirm that the orange outline is on **Buddies** and the Northside Crew board is shown again.
