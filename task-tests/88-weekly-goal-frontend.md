# Task tests: Weekly goal page and reusable weekly goal display (#88, story #87)

Task #88, Sprint 3. Frontend for story #87 (weekly goals and completed days), on Surya's backend #89 (api/weekly_goal.php). The pasteable version is `88-weekly-goal-frontend.html`; this file is the same text.

Ready for PM review. Run the tests in order on aptitude, on a Wednesday to Sunday (the seed places workouts on Monday, the day before today and today, which are three different days only from Wednesday). Load the seed again before each full run. The page needs no backend change: it uses api/weekly_goal.php exactly as Surya's #89 describes it.

Points for the PM, Surya and Eric: (1) Home already has Eric's "Weekly milestone" card (#123), which saves without a confirmation step. This card adds the confirmation on the Weekly goal page and the shared display; Eric decides whether Home keeps its own form or links here (Eric, PM). (2) Days that were not trained read "No workout", not "Missed", to keep the tone encouraging (PM). (3) The story #87 acceptance tests are not in stories/ yet; these task tests use the same wording as the page, so the story's tests can reuse it (story owner).

## What this card adds

A Weekly goal page at #/weekly-goal (src/weeklyGoal/WeeklyGoalPage.jsx), opened from the "Set weekly goal ›" link in the Dashboard's "Your weekly mission" card and from Profile → "Set weekly goal". The user chooses 1 to 7 training days, presses "Review goal ›", reads what will happen, and presses "Confirm and save" (or "Go back", which saves nothing). The page sends POST api/weekly_goal.php and shows the saved goal from the response; after a refresh it shows the same goal from GET, because nothing is kept in the browser.

Before this week's goal is locked the user chooses "This week" or "Next week". It is locked once it is saved or a workout day is earned (the API's target_locked); after that only next week's goal can be chosen.

The page shows this week's goal and next week's change in two separate boxes: "This week's goal" and "Next week's goal". A saved next-week change has an orange border and a "Change saved" badge; without one the box says next week starts with this week's goal.

The seven days (Monday to Sunday, New York time) come only from completed_dates in the API. A completed day is green with a tick and the text "Completed". The other days read "Today", "No workout" (an earlier day with nothing finished) or "Upcoming". Each day also has a full sentence for screen readers, for example "Monday, October 26: Completed".

The reusable display is src/weeklyGoal/WeeklyGoalDisplay.jsx, which Eric can place on Home: `<WeeklyGoalDisplay goal={data} />` with the JSON from GET or POST api/weekly_goal.php, plus status="loading" or status="error" with onRetry. The comment at its top lists every option. Its styles are in src/weeklyGoal/weeklyGoal.css and use only the --gr- colour variables, so light mode works. Its text comes from src/weeklyGoal/weeklyGoalFormat.js, checked by tests/weeklyGoal.test.js.

## Test data (database/seeds/weekly_goals.sql)

Each account has finished onboarding, has the Beginner Fundamentals plan and saved personal details, so logging in opens the Dashboard. The seed changes no other account. Days are New York dates; "today" is the day the seed is loaded.

Wes Fresh, weekly.fresh@example.com, password Weekly-Fresh-88! No weekly goal saved ever and no workout this week (one last Sunday, which belongs to the previous week). This week's goal is the default 3 and can still be changed.

Lena Locked, weekly.locked@example.com, password Weekly-Locked-88! A goal of 4 saved last week and nothing saved this week, so this week starts at 4. Workouts finished on Monday and today, so this week is locked. The day before today has an unfinished workout and a finished workout with no sets; neither counts.

Nia Next, weekly.next@example.com, password Weekly-Next-88! This week's goal of 2 and next week's goal of 5 are both saved. Workouts finished on Monday, the day before today and today.

## Setup for all tests

Step 1: Connect to the UB VPN or the campus network.

Step 2: Make sure migration database/migrations/014_weekly_goals.sql is applied on aptitude (Surya's #89), then load database/seeds/weekly_goals.sql, following ServerOperationsGuide.md and database/seeds/README.md (for example mysql --default-character-set=utf8mb4 -u UBIT_USERNAME -p cse442_2026_fall_team_y_db < database/seeds/weekly_goals.sql). The last lines it prints should show Wes with 0 counted workouts, Lena with 2 and Nia with 3, and Nia with 2 saved for this week and 5 for next week.

Step 3: Build this branch with npm run build and copy dist/ and api/ to aptitude as README.md describes.

Step 4: Open https://aptitude.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/ in Chrome. Use dark mode unless a test says otherwise. "Open the Weekly goal page" means: click the avatar at the top right, click "Profile", and in the "Weekly goal" card click "Set weekly goal".

## Test 1: Confirm and save this week's goal, and see it after a refresh

Setup: Load the seed again. Log in as weekly.fresh@example.com with the password Weekly-Fresh-88!

Step 1: The Dashboard should open. In the "Your weekly mission" card, under "Log a workout on 3 different days this week.", click "Set weekly goal ›". The Weekly goal page should open at #/weekly-goal. (Profile → "Set weekly goal" opens the same page.) The page title should be "Weekly goal". The display should read "Weekly goal · " followed by this week's dates (for example "Oct 26 – Nov 1"), then "This week", then "0 of 3 training days" with an empty progress bar and "3 more days to reach this week's goal."

Step 2: The "This week's goal" box should say "3 training days. Not saved yet: you can change it until you save it or log a workout day." The "Next week's goal" box should say "No change saved. Next week starts" followed by next Monday's date ("Mon, Nov 2" style) and "with this week's goal of 3 training days." No day should be green; today should read "Today" with an orange border.

Step 3: Under "Set your weekly goal", "Which week?" should have "This week" selected (with a tick) and "Next week (from Mon, …)". Click "4" under "This week's training days". The line under the numbers should say "4 training days per week. Pick a pace you can keep."

Step 4: Click "Review goal ›". A box should appear with "Set this week's goal to 4 training days?" and "This week runs" this week's dates "… Once saved, this week's goal is locked until Monday, so your progress stays fair.", with "Confirm and save" and "Go back".

Step 5: Click "Go back". The box should close and nothing should change in the display ("0 of 3 training days"). Refresh the page; it should still say 3 and "Not saved yet".

Step 6: Click "4", "Review goal ›", then "Confirm and save". A green message should say "✓ Saved. This week's goal is 4 training days." The display should change to "0 of 4 training days" and the "This week's goal" box to "4 training days." with a "Locked until Monday" badge.

Step 7: The form should now be titled "Choose next week's goal" with the text "This week's goal of 4 training days is locked. A new goal starts Mon, …". "Which week?" should no longer appear.

Step 8: Refresh the page (F5). The display should still say "0 of 4 training days", "4 training days." and "Locked until Monday", and the "Next week's goal" box should say next week starts "with this week's goal of 4 training days."

Expected outcome: the goal is saved only after "Confirm and save", is shown from the server after a refresh, and locks this week.

## Test 2: A change for next week is shown separately from this week's goal

Setup: Continue from Test 1, logged in as weekly.fresh@example.com.

Step 1: On the Weekly goal page, under "Next week's training days", click "6", then "Review goal ›". The box should say "Save 6 training days as next week's goal?" and "It starts Monday, " next Monday's date ". This week's goal stays 4 training days. You can change next week's goal until it starts."

Step 2: Click "Confirm and save". The message should say "✓ Saved. Next week's goal is 6 training days."

Step 3: The "This week's goal" box should still say "4 training days." with "Locked until Monday", and the progress should still be "0 of 4 training days". The "Next week's goal" box should now say "6 training days, starting Mon, …. You can change it until then." with an orange border and a "Change saved" badge.

Step 4: "6" should be selected and "Review goal ›" should be greyed out, with the line "6 training days is already saved for next week. Choose a different number to change it."

Step 5: Click "2", "Review goal ›", "Confirm and save". The "Next week's goal" box should say "2 training days, starting …" and this week's box should still say 4.

Step 6: Refresh the page. Both boxes should show the same values as in step 5.

Expected outcome: this week's target and the change for next week are two separate values, both saved and both shown after a refresh, and changing next week never changes this week.

## Test 3: Real completed days are green and labelled, and the rest do not count

Setup: Load the seed again. Log in as weekly.locked@example.com with the password Weekly-Locked-88!

Step 1: Open the Weekly goal page. The display should say "2 of 4 training days" with the bar half full and "2 more days to reach this week's goal."

Step 2: In the row of days, Monday and today should be green with a white tick in a green circle and the word "Completed". Every other day before today should say "No workout", and every day after today "Upcoming".

Step 3: The day before today should say "No workout", although it has an unfinished workout and a finished workout with no sets.

Step 4: The "This week's goal" box should say "4 training days." with "Locked until Monday" (the goal comes from last week and is locked because days are logged). The form should be titled "Choose next week's goal" with "4" selected and no "Which week?" choice.

Step 5: Check that colour is not the only signal: each green day also has a tick and the word "Completed", and each other day has its own word.

Step 6: Turn on a screen reader (VoiceOver: Cmd+F5 on a Mac; NVDA on Windows) and move to the list of days. It should be announced as "Training days, " this week's dates, and Monday as "Monday, " its date ": Completed"; today as "…: Completed (today)".

Expected outcome: only finished workouts with at least one logged set count, each counted day is shown once in green with a text label, and the count matches the green days.

## Test 4: A goal that is reached, with extra days

Setup: Load the seed again. Log in as weekly.next@example.com with the password Weekly-Next-88!

Step 1: Open the Weekly goal page. The display should say "2 of 2 training days" with a full bar and, in green, "✓ Goal reached. You trained on 3 days, 1 more than your goal."

Step 2: Monday, the day before today and today should be green and say "Completed".

Step 3: The "This week's goal" box should say "2 training days." with "Locked until Monday". The "Next week's goal" box should say "5 training days, starting Mon, …. You can change it until then." with "Change saved".

Step 4: "5" should be selected under "Next week's training days" and "Review goal ›" should be greyed out.

Expected outcome: the count never goes above the goal, and the extra day is still shown and explained.

## Test 5: Finishing a workout turns today green

Setup: Load the seed again. Log in as weekly.fresh@example.com with the password Weekly-Fresh-88!

Step 1: Open the Weekly goal page. It should say "0 of 3 training days" and today should say "Today".

Step 2: Click "Start Workout" in the top bar, log one set of the first exercise (any weight and reps), and complete the workout. Confirm when asked.

Step 3: Open the Weekly goal page again. It should say "1 of 3 training days", today should be green with "Completed", and the "This week's goal" box should say "3 training days." with "Locked until Monday".

Step 4: The form should now be "Choose next week's goal" without "Which week?".

Expected outcome: the page shows real progress from workouts finished in the app, and earning a day locks the week.

## Test 6: Two windows, one saves first

Setup: Load the seed again. Log in as weekly.fresh@example.com with the password Weekly-Fresh-88! in one Chrome window, and open the Weekly goal page in two tabs.

Step 1: In tab 1, click "2", "Review goal ›" and leave the confirmation open.

Step 2: In tab 2, click "5", "Review goal ›", "Confirm and save". It should say "✓ Saved. This week's goal is 5 training days."

Step 3: In tab 1, click "Confirm and save". A red message should say "This week's goal was locked before your change was saved. It may have been saved in another window, or a workout day was logged. You can still choose next week's goal."

Step 4: Tab 1 should now show "0 of 5 training days", "5 training days." with "Locked until Monday", and the form "Choose next week's goal", without a refresh.

Expected outcome: the second save never replaces the first, and the page explains what happened and shows the saved goal.

## Test 7: Errors keep the choice and say what to do

Setup: Log in as weekly.fresh@example.com with the password Weekly-Fresh-88! and open the Weekly goal page.

Step 1: Under "Next week's training days" click "3" if another number is saved, or "4" otherwise, then "Review goal ›".

Step 2: Open Chrome DevTools (F12) → Network, right-click any request and choose "Block request URL", or open the "Network request blocking" panel and add the pattern weekly_goal.php with blocking turned on. Click "Confirm and save". A red message should say "Can't reach the server. Check your connection and try again. Your goal was not saved." The chosen number should still be selected.

Step 3: Turn the blocking off and refresh. The page should show the goal that was saved before step 2.

Step 4: Turn the blocking on again and refresh. The display should show a red box "Can't reach the server. Check your connection and try again." with a "Try again" button, and no form. Turn the blocking off and click "Try again". The goal and the form should appear.

Step 5: In a second tab, click "Log out". Back in the first tab, choose a different number, click "Review goal ›" and "Confirm and save". A red message should say "Your session has ended. Log in again to save your goal." with a "Log in" link that opens the login page.

Step 6: While logged out, change the end of the address to #/weekly-goal. The login page should open.

Expected outcome: no failure is silent, nothing is saved on a failed request, and a signed-out user can't open the page.

## Test 8: Keyboard, phone width and light mode

Setup: Log in as weekly.locked@example.com with the password Weekly-Locked-88! (load the seed again first if Test 3 changed anything).

Step 1: Open the Weekly goal page and use only the keyboard. Press Tab until a number under "Next week's training days" has an orange outline. The arrow keys should move the choice between 1 and 7. Tab to "Review goal ›" and press Enter. Focus should move to the question "Save … as next week's goal?".

Step 2: Press Tab to "Go back" and press Enter. The box should close and focus should be on "Review goal ›".

Step 3: Open DevTools, turn on the device toolbar (Ctrl+Shift+M) and pick a 375 px wide phone. The page should not scroll sideways. The days should be a list, one per line, such as "MON 26 ✓ Completed", and the two goal boxes should be stacked. The numbers 1 to 7 should be in two rows.

Step 4: Turn the device toolbar off. Click the avatar → "Profile" → Appearance → "Light". Open the Weekly goal page. Text should be readable on the grey cards, completed days should be dark green with "Completed", and "Next week's goal" should keep its orange border. Switch back to "Dark".

Expected outcome: the page works with the keyboard, on a phone and in both themes.

## Test 9: The display is ready for Home, and the code is checked

Setup: On this branch in a terminal at the repo root.

Step 1: Open src/weeklyGoal/WeeklyGoalDisplay.jsx. The comment at the top should show how to use it (goal, status="loading", status="error" with onRetry) and list the options title, headingLevel, showNextWeek and action.

Step 2: Run npm test. All tests should pass, including the 10 in tests/weeklyGoal.test.js (dates across the end of daylight saving time, the New York date late at night, completed days and labels, progress text, which week can be saved, the next-week text, the confirmation text and the error messages).

Step 3: Run npm run build. It should finish without errors.

Step 4: Search src/weeklyGoal/ for "#" followed by hex digits, "rgb(" and "rgba(". There should be none: every colour comes from a --gr- variable.

Step 5: Open DESIGN.md and ARCHITECTURE.md. DESIGN.md should describe the weekly goal display and page; ARCHITECTURE.md should list src/weeklyGoal/ and the #/weekly-goal route; database/seeds/README.md should list the three weekly goal accounts.

Expected outcome: Eric can place `<WeeklyGoalDisplay goal={data} />` on Home with no other code, and the checks pass.
