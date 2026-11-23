# Story 4: Active workout

<!-- Replace the title above with the story's exact title from the scrum card. -->

- **Tasks:** #132 (workout redesign) and the Playwright task card
- **Automated in:** none yet (no Playwright spec exists for this story)

(Note: the orange start button is in the Today's workout section at the top of the Workouts page, above the list of days. It reads "Start today's workout" on a computer and "Start workout" on a phone and on the Dashboard. On a phone the finish button reads "Finish workout"; on a computer it reads "Complete workout". Weights are in pounds. The tests save sets to the database you are testing.)

## Acceptance Test 1: Follow and log sets in an active workout on desktop

1. Use the provided `active4-start@example.com` account, password `Active-Test-4!`. This account must already have onboarding complete, Push Pull Legs selected, a Push workout available today with Bench press first and at least one other exercise, and no workout or saved sets today. Use a desktop browser signed out of GymRank, and connect to UB campus Wi-Fi or the UB VPN.
2. Click the browser's address bar, enter `https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login`, and press Enter. Enter the account email and password in the login form and select the sign-in button. Pass this step if the signed-in Dashboard opens.
3. In the navigation menu, select Workouts. Find the Today's workout section at the top of the page. Pass this step if it names Push and lists Bench press first, and today's day in the week list below is marked Today.
4. In that section, select the orange Start today's workout button. Pass this step if the active workout opens on the same page with Push in the header, an exercise list, and the Bench press logger.
5. Look at the exercise list and Log a set card. Pass this step if Bench press is visibly selected, the logger identifies it as exercise 1, and it shows Set 1, a set timer, Weight (lb), Reps, and Log set.
6. In the set timer area, select Start timer and wait about three seconds. Pass this step if the displayed time counts upward.
7. Select Pause and wait about three seconds. Pass this step if the displayed time does not increase.
8. Select Resume. Pass this step if the displayed time starts increasing again.
9. Select Finish set in the timer controls. Pass this step if a rest timer appears automatically and counts down from about 1:30.
10. In the Log a set card, enter `25` in Weight (lb) and `10` in Reps, then select the orange Log set button. Pass this step if Set 1 — 25 lb × 10 appears once in Saved sets and the logger advances to Set 2.
11. In the exercise list, select another exercise, then select Bench press again. Pass this step if Bench press's saved Set 1 reappears, its count says 1 set, and its logger still allows another set.
12. Enter `30` in Weight (lb) and `8` in Reps, then select Log set. Pass this step if Bench press shows Set 1 — 25 lb × 10 and Set 2 — 30 lb × 8 once each, and the logger advances to Set 3.

## Acceptance Test 2: Read and use the active workout on a phone

1. Use the provided `active4-phone@example.com` account, password `Active-Test-4!`. It must have the same prepared Push workout described in Test 1 and no workout or saved sets today. Use a phone or set the browser viewport to 375 × 812, sign out of GymRank, and connect to UB campus Wi-Fi or the UB VPN.
2. Enter `https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login` in the browser's address bar, press Enter, and sign in. Pass this step if the Dashboard opens.
3. Open the navigation menu, select Workouts, and in the Today's workout section select the orange Start workout button. Pass this step if the active workout opens with Push in the header and Bench press selected.
4. Scroll down the active workout page. Find the exercise selector, Set 1 label, set timer, Weight (lb) and Reps fields, orange Log set button, and Finish workout button near the workout actions. Pass this step if all are readable and reachable by vertical scrolling without leaving the page.
5. Look across the page at the top, middle, and bottom. Pass this step if text and controls do not overlap, nothing is cut off, and the page does not require horizontal scrolling.
6. In the set timer area, select Start timer, wait until it counts upward, then select Finish set. Pass this step if the rest timer appears only after finishing the set and counts down from about 1:30.
7. Enter `25` in Weight (lb) and `10` in Reps, then select Log set. Pass this step if Set 1 — 25 lb × 10 appears once and the logger advances to Set 2.
8. Scroll to the workout actions and back to the logger. Pass this step if the workout name, selected exercise, current set, and saved set remain readable and reachable.

## Acceptance Test 3: Keep saved sets and typed values when leaving

1. Use the provided `active4-resume@example.com` account, password `Active-Test-4!`, prepared with the Push workout and no workout or saved sets today. Use the same browser for the whole test, sign out of GymRank, and connect to UB campus Wi-Fi or the UB VPN.
2. Enter `https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login` in the address bar and sign in. Open Workouts, select the orange start button (it reads Start today's workout on a computer and Start workout on a phone), and select Bench press. Pass this step if the active Push workout shows the Bench press Set 1 logger.
3. Enter `25` in Weight (lb) and `10` in Reps, then select Log set. Pass this step if Set 1 — 25 lb × 10 appears once.
4. In the next set's fields, type `30` for weight and `8` for reps. Do not select Log set. Select another exercise in the exercise list, then return to Bench press. Pass this step if Set 1 remains saved, the fields still show 30 and 8, and there is no saved Set 2.
5. Near the workout actions, select Save and return later. Pass this step if Workouts opens. Then go to Dashboard and select Resume workout. Return to Bench press if another exercise is selected. Pass this step if Push resumes with one saved Bench press set and the unsaved fields still show 30 and 8.
6. Refresh the browser page. Select Bench press again if needed. Pass this step if Set 1 and both unsaved values remain.
7. Select Log set once. Pass this step if exactly one Set 2 — 30 lb × 8 row appears and the logger advances to Set 3.

## Acceptance Test 4: Reject invalid set values

1. Use the provided `active4-validation@example.com` account, password `Active-Test-4!`, prepared with the Push workout and no workout or saved sets today. Sign out of GymRank and connect to UB campus Wi-Fi or the UB VPN.
2. Enter `https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login` in the address bar and sign in. Open Workouts, select the orange start button (it reads Start today's workout on a computer and Start workout on a phone) on the Today's workout section, and select Bench press. Pass this step if Set 1 has empty Weight (lb) and Reps fields.
3. Leave both fields empty and select the orange Log set button. Pass this step if the page shows "Enter a weight (0 for bodyweight)." and "Enter your reps." and does not add a saved set.
4. Enter `25` in Weight (lb) and `0` in Reps, then select Log set. Pass this step if the page shows "Reps must be between 1 and 100." and no set is saved.
5. Replace the values with `-5` in Weight (lb) and `10` in Reps (the minus sign stays visible in the box), then select Log set. Pass this step if the page shows "Weight must be between 0 and 1500 lb." and no set is saved.
6. Replace the values with `25` and `10`, then select Log set. Pass this step if exactly one Set 1 — 25 lb × 10 row appears.

## Acceptance Test 5: Confirm before finishing with exercises that have no sets

1. Use the provided `active4-unfinished@example.com` account, password `Active-Test-4!`, prepared with the Push workout and no workout or saved sets today. Sign out of GymRank and connect to UB campus Wi-Fi or the UB VPN.
2. Open `https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login`, sign in, open Workouts, and select the orange start button (it reads Start today's workout on a computer and Start workout on a phone). Pass this step if Bench press is selected in the active workout.
3. Enter `25` in Weight (lb) and `10` in Reps, then select Log set. Pass this step if Bench press shows 1 set, another exercise shows 0 sets, and Bench press remains selectable for additional sets.
4. Scroll to the workout actions and select Complete workout on desktop or Finish workout on phone. Pass this step if a first dialog titled "Complete this workout?" appears.
5. Select Cancel in that dialog. Pass this step if the active workout remains open and the Bench press set remains saved.
6. Select the finish control again and confirm the first dialog (its button reads Complete workout). Pass this step if a second dialog titled "Some exercises have no logged sets" names the exercises with no logged sets and offers Keep logging and Save partial workout.
7. In the second dialog, select Keep logging. Pass this step if the dialog closes, the active workout remains open, Bench press still shows its saved set, and the other exercise still shows 0 sets.
8. Repeat the two confirmations and choose Save partial workout. Pass this step if the workout summary opens.

## Acceptance Test 6: Finish without the extra warning after logging every exercise

1. Use the provided `active4-complete@example.com` account, password `Active-Test-4!`, prepared with the Push workout and no workout or saved sets today. Sign out of GymRank and connect to UB campus Wi-Fi or the UB VPN.
2. Open `https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login`, sign in, open Workouts, and start today's Push workout with the orange start button (it reads Start today's workout on a computer and Start workout on a phone). Pass this step if the exercise list and Bench press logger appear.
3. For Bench press, enter `25` in Weight (lb) and `10` in Reps, then select Log set. Pass this step if Bench press shows 1 saved set.
4. Select each other exercise in the exercise list. For each, enter `25` in Weight (lb) and `10` in Reps and select Log set. Pass this step if every exercise shows at least 1 saved set.
5. Return to Bench press, enter `30` in Weight (lb) and `8` in Reps, then select Log set. Pass this step if both Bench press sets appear once and its count shows 2 sets.
6. Select Complete workout on desktop or Finish workout on phone, then confirm the completion dialog. Pass this step if the summary opens without a second warning about exercises with no sets.

## Acceptance Test 7: See accurate comparisons on the completed summary

1. Use the provided `active4-summary@example.com` account, password `Active-Test-4!`. It must have the prepared Push workout for today and two earlier completed workouts in this order: an older Bench press top set of 100 lb × 5, then a more recent Bench press top set of 90 lb × 8. Neither earlier workout may contain Overhead press. Today must have no workout or saved sets. Sign out of GymRank and connect to UB campus Wi-Fi or the UB VPN.
2. Open `https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login`, sign in, open Workouts, and start today's Push workout with the orange start button (it reads Start today's workout on a computer and Start workout on a phone). Pass this step if Bench press is selected.
3. Log Bench press at `95 lb × 6`. Select Overhead press in the exercise list and log `50 lb × 8`. Pass this step if each exercise shows exactly one saved set.
4. Select the finish control and confirm completion. If the app warns that another exercise has no set, choose Save partial workout. Pass this step if the summary opens, names Push, and shows today's completion date.
5. In Session highlights, find Bench press. Pass this step if its Top set column is 95 lb × 6 and its Vs last column is 90 lb × 8.
6. Check Bench press's record label. Pass this step if it has no Weight PR label, because the earlier best weight was 100 lb.
7. Find Overhead press. Pass this step if its Top set is 50 lb × 8, its Vs last is blank, it carries the label First result, and it has no Weight PR label.
8. Select the Workout history link, then reopen this Push summary. Pass this step if its date, top sets, previous Bench press result, and record labels match what appeared immediately after completion.

## Acceptance Test 8: Return to the page where the workout was started

1. Use the provided `returnto-15@example.com` account, password `SetEntry-Test-4!`. It must have onboarding complete, Push Pull Legs selected, a workout available today, no workout in progress, and no saved sets today. Use one private browser window, connect to UB campus Wi-Fi or the UB VPN, and remain in that window for the whole test.
2. Click the browser address bar, enter `https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login`, and press Enter. Sign in with the provided account. Pass this step if Dashboard opens.
3. In the navigation menu, select Workouts. Pass this step if the address ends in `#/weekly-plan` and today's day card is marked Today.
4. In the Today's workout section, select the orange start button. In the exercise list, select the first exercise. Pass this step if the active workout opens and identifies that exercise as selected.
5. Enter `135` in Weight (lb) and `8` in Reps, then select Log set. Pass this step if Set 1 — 135 lb × 8 appears once.
6. In the Set 2 fields, type `140` and `6` without selecting Log set. Near the workout actions, select Save and return later. Pass this step if Workouts opens, the address starts with `#/weekly-plan` (it may include a `?day=...` query), Workouts is highlighted in navigation, and today's card is visible and marked Today.
7. In navigation, select Dashboard, then select Resume workout. Select the first exercise if needed. Pass this step if Set 1 — 135 lb × 8 appears once and the unsaved Set 2 fields still show 140 and 6.
8. Select Save and return later again. Pass this step if Dashboard opens, the address ends in `#/dashboard`, and Resume workout is offered.
