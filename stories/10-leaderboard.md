# Story 10: As a competitive gym goer, I want to view my rank and compare my performance against others which is confirmed by seeing my current and others' positions on the leaderboard along with everyone's scores and performance statistics on the page.

- **Tasks:** #113 (Research leaderboard participation and ranking views), #114 (Leaderboard Ranking Rules and Data), #121 (Build Leaderboard Backend), #120 (Build the leaderboard page)
- **Automated in:** `tests/e2e/10-leaderboard.spec.js`

Test accounts: fake accounts loaded on the site by `database/seeds/leaderboard.sql` (#121). Scores are DOTS points from each person's best estimated 1RM in finished workouts; the numbers below are Mansur's expected scores on #121. Boards show people as first name and last initial.

- `Casey Morgan`, email `casey.morgan@example.com`, password `Casey-Deadlift330!`: has joined, 200 lb, 12 finished workouts. Best estimated 1RMs: bench press 140 lb, back squat 190 lb, deadlift 205 lb. #15 of 51 on Overall with 156.29.
- `Luis Ortega`, email `luis.ortega@example.com`, password `Luis-Squat285!`: has joined, #14 of 51 on Overall with 159.90, used to look at the board as someone else.
- `Robin Hale`, email `robin.hale@example.com`, password `Robin-Bench135!`: has joined, body weight saved, a bench press logged, but only 2 finished workouts.
- `Noor Haddad`, email `noor.haddad@example.com`, password `Noor-Bench150!`: has joined, 3 finished workouts, a bench press only (no back squat or deadlift).
- `Max Tester`, email `max.tester@example.com`, password `Max-Tester600!`: marked as a test account. Has joined and logged all three lifts, but must never be ranked.

## Acceptance Test 1: A new account is unranked, sees how to get ranked, and sees the community board

### Setup for this test:

1. Connect to the UB VPN or use the campus network. On a computer, open the [Login page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login) and select **Create account**. Create an account with the full name `Lead Tester`, an email with today's date (for example `lead-a-1028@example.com`) and the password `AcceptLead12!` in both password fields, then log in with it.
2. On **Personal details**, enter `180` in **Body weight (lb)**, select **Man** and select **Save and continue**. Select **Strength** and **Save goal**, **Beginner** and **Save and continue**, **Full gym access** and **Save and continue**, then **Choose plan** for `Beginner Fundamentals`. Confirm that the Dashboard opens.

### Steps:

1. Select **Leaderboard** in the top navigation. Confirm that the address ends in `#/leaderboard`, that **Leaderboard** is highlighted in the navigation, that the heading says `Leaderboard`, and that **Overall** is the selected one of the tabs **Overall**, **Bench press**, **Back squat** and **Deadlift**.
2. Confirm that a card titled `How to get ranked` lists four steps in this order: `Join the leaderboard`, not ticked, with the sentence `Others see your first name, last initial and scores. Never your body weight, gender, scoring table or lifts in lb.` and a **Join the leaderboard** button; `Add your body weight and gender`, ticked, with `Saved in Personal details · 180 lb`; `Finish 3 workouts`, not ticked, with `0 of 3 workouts finished`; and `Log a bench press, back squat or deadlift`, not ticked.
3. Confirm that the board below says `51 people ranked on Overall` and starts with `1` `Cy P.` `319.16`, `2` `Ana C.` `243.63`, `2` `Ben O.` `243.63`, `4` `Dee S.` `229.03`, and that no row is marked `You`.

## Acceptance Test 2: Joining is remembered, and you can leave again

### Setup for this test:

1. Create and set up a new account as in Acceptance Test 1 (use a different email, for example `lead-b-1028@example.com`). Confirm that the Dashboard opens, then select **Leaderboard**.

### Steps:

1. Select **Join the leaderboard**. Confirm that the first step is now ticked and says `You've joined`, that `Finish 3 workouts` and `Log a bench press, back squat or deadlift` are still not ticked, and that the board still says `51 people ranked on Overall` with no row marked `You` (you need 3 finished workouts and a lift first).
2. Open the account menu, select **Log out**, log back in with the same email and password, and select **Leaderboard**. Confirm that the first step is still ticked and says `You've joined`.
3. In the first step, select **Leave**. Confirm that the page says `You've left the leaderboard. Your workouts are kept.` and that the first step is not ticked again and shows the **Join the leaderboard** button.

## Acceptance Test 3: Nonbinary and Prefer not to say accounts choose which DOTS table scores them

### Setup for this test:

1. Create a new account as in Acceptance Test 1 (for example `lead-c-1028@example.com`), but on **Personal details** enter `160` and select **Prefer not to say**. Finish setup as in Acceptance Test 1 until the Dashboard opens, then select **Leaderboard**.

### Steps:

1. Confirm that the first step has a group titled `Scoring table` with the hint `DOTS has one table for men and one for women. Choose which one scores your lifts. Nobody else sees this choice.` and two choices, **Men's table** and **Women's table**, neither selected. Confirm that **Join the leaderboard** can't be selected and that `Choose a scoring table.` appears below it.
2. Select **Women's table**, then **Join the leaderboard**. Confirm that the first step is ticked and shows `You've joined` and `Scored with the women's table`.
3. Select **Change**, select **Men's table** and select **Save**. Confirm that the first step now shows `Scored with the men's table`.
4. Select **Leave**, then look at the first step. Confirm that it shows the **Join the leaderboard** button without the `Scoring table` group. Select **Join the leaderboard** and confirm that it shows `Scored with the men's table` again (the choice was kept).

## Acceptance Test 4: A ranked person finds their own place on the Overall board

### Setup for this test:

1. On a computer, log in on the [Login page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login) with `casey.morgan@example.com` and `Casey-Deadlift330!`. Confirm that the Dashboard opens.

### Steps:

1. Select **Leaderboard**. Confirm that your card shows `Casey Morgan`, `#15 of 51 on Overall`, `156.29` `DOTS points`, `Your best estimated 1RMs: Bench press 140 lb · Back squat 190 lb · Deadlift 205 lb` and a **Leave the leaderboard** button.
2. Confirm that the board says `51 people ranked on Overall` and starts with these 11 rows, in this order: `1` `Cy P.` `319.16`, `2` `Ana C.` `243.63`, `2` `Ben O.` `243.63`, `4` `Dee S.` `229.03`, `5` `Wes Z.` `197.65`, `6` `Nova L.` `188.85`, `7` `Grant G.` `170.89`, `8` `Milo Q.` `167.64`, `9` `Olive O.` `167.09`, `10` `Jude N.` `165.93`, `10` `Quinn R.` `165.93`. People with the same score share a rank, the rank after a tie is skipped, and both people tied at 10 are shown.
3. Confirm that a `· · ·` row comes next, then `14` `Luis O.` `159.90`, then your own row `15` `Casey M.` marked `You` with `156.29` and highlighted, then `16` `Dina D.` `155.52`.
4. Confirm that no row on the board shows a weight in lb or kg, a body weight, a gender or an email: only rank, name and score.

## Acceptance Test 5: The lift boards rank each lift on its own

### Setup for this test:

1. Log in as Casey as in Acceptance Test 4 and select **Leaderboard**.

### Steps:

1. Select **Bench press**. Confirm that the address ends in `#/leaderboard?board=bench`, that your card shows `#16 of 54 on Bench press` and `40.90`, and that the board says `54 people ranked on Bench press` and starts `1` `Cy P.` `72.54`, `2` `Eli F.` `70.11`, `3` `Noor H.` `65.32`, `4` `Ana C.` `61.35`, `4` `Ben O.` `61.35`, `4` `Rex T.` `61.35`, `7` `Dee S.` `60.76`.
2. Select **Back squat**. Confirm that your card shows `#19 of 51 on Back squat` and `55.50`, that the board starts with `1` `Cy P.` `130.56`, and that your row comes after `18` `Zoe D.` `55.78` and before `20` `Jude N.` `54.86`.
3. Select **Deadlift**. Confirm that your card shows `#16 of 51 on Deadlift` and `59.89`, that the board starts with `1` `Cy P.` `116.06`, and that your row comes after `15` `Milo Q.` `60.96` and before `17` `Bella B.` `59.09`.
4. Refresh the page. Confirm that **Deadlift** is still selected and shows the same board.

## Acceptance Test 6: People who shouldn't be ranked aren't, and are told why

### Setup for this test:

1. On a computer, open the [Login page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login).

### Steps:

1. Log in with `robin.hale@example.com` and `Robin-Bench135!` and select **Leaderboard**. Confirm that `How to get ranked` has `Join the leaderboard`, `Add your body weight and gender` and `Log a bench press, back squat or deadlift` ticked, and `Finish 3 workouts` not ticked with `2 of 3 workouts finished`, and that no row is marked `You`. Log out.
2. Log in with `noor.haddad@example.com` and `Noor-Bench150!` and select **Leaderboard**. Confirm that on **Overall** the card says `Overall needs all three lifts. Log a back squat and a deadlift to get on it.` and no row is marked `You`. Select **Bench press** and confirm that the card shows `#3 of 54 on Bench press` and `65.32` and that the row `3` `Noor H.` is marked `You`. Log out.
3. Log in with `max.tester@example.com` and `Max-Tester600!` and select **Leaderboard**. Confirm that the card says only `Test accounts aren't shown on the leaderboard.`, with no **Join the leaderboard** button, that the board still says `51 people ranked on Overall`, and that no row is named `Max T.`. Select **Bench press** and confirm that it still says `54 people ranked on Bench press` with no `Max T.` row.

## Acceptance Test 7: Leaving takes you off the board straight away, and joining puts you back

### Setup for this test:

1. Log in as Casey as in Acceptance Test 4 and select **Leaderboard**. Confirm that your card shows `#15 of 51 on Overall`.
2. In a new private (incognito) window, log in with `luis.ortega@example.com` and `Luis-Squat285!`.

### Steps:

1. In Casey's window, select **Leave the leaderboard**. Confirm that the page says `You've left the leaderboard. Your workouts are kept.`, that the card is now `How to get ranked` with only `Join the leaderboard` not ticked, that no row is marked `You`, and that the board says `50 people ranked on Overall`.
2. In Luis's window, select **Leaderboard**. Confirm that Luis's card shows `#14 of 50 on Overall` and that after the `· · ·` row come `13` `Rosa S.` `160.21`, `14` `Luis O.` marked `You` with `159.90`, and `15` `Dina D.` `155.52`, with no `Casey M.` row.
3. In Casey's window, select **Join the leaderboard**. Confirm that the card shows `#15 of 51 on Overall` and `156.29` again.

## Acceptance Test 8: The leaderboard needs a login, works on a phone in both themes, and recovers from an error

### Setup for this test:

1. Open a new private (incognito) browser window, so that you are not logged in.

### Steps:

1. Visit the [Leaderboard page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/leaderboard) directly. Confirm that the Login page opens (the address ends in `#/login`) and that no board is shown.
2. Use a phone, or open Chrome DevTools (F12), select the device toolbar button and choose **iPhone SE** (375 × 667). Log in as Casey, open the menu (the three lines, top right) and select **Leaderboard**. Confirm that the four tabs are in two rows of two, that the page does not need to be scrolled sideways, and that while the top of the board is on screen a bar pinned to the bottom shows `15` `Casey M.` `You` `156.29`.
3. Scroll down until your own row `15` `Casey M.` is on screen. Confirm that the pinned bar goes away.
4. Open the menu, select **Profile**, and in **Appearance** select **Light**. Return to **Leaderboard**. Confirm that the page is light, and that every tab, name, score, your highlighted row and the pinned bar are readable. In **Profile**, select **Dark** again.
5. On a computer, log in as Casey and select **Dashboard**. In DevTools, open Network request blocking (press Ctrl+Shift+P on Windows or Cmd+Shift+P on a Mac, type `Show Network request blocking`, and press Enter), check **Enable network request blocking**, and add the pattern `*leaderboard.php*`. Select **Leaderboard**. Confirm that the page says `Couldn't load the leaderboard. Check your connection and try again.` with a **Try again** button, and shows no board and no `How to get ranked` card.
6. Uncheck **Enable network request blocking** and select **Try again**. Confirm that the message disappears and your card shows `#15 of 51 on Overall`.
