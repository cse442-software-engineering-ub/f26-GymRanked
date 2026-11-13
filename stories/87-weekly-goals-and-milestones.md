# Story 87: As a gym goer, I want to set weekly goals and milestones, which is confirmed by seeing each target I set with a progress bar showing how close I am to reaching it.

- **Tasks:** #88, #89, #123

These acceptance tests run on cattle over UB campus Wi-Fi or the UB VPN. The login page is https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login and the Dashboard is https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/dashboard. Each test starts with its own prepared account, completed setup, and the Beginner Fundamentals plan. Use the dedicated test password on card #87 for each account. The week is Monday through Sunday in New York time. Tests 3, 4, and 10 require at least two earlier distinct dates in the current week, as the Scrum card states.

## Acceptance Test 1: Save a weekly goal and see it on Home

1. Open the Login page, enter goal87-new@example.com and the dedicated test password on card #87, and select Log in.
2. Confirm Home greets Goal and shows the default target 3, 0 of 3 training days, and an empty progress indicator. This account has no current-week workout; its earlier-week lift makes the Weekly milestone card visible.
3. Find Weekly milestone. Confirm This week’s training days and Save milestone are available. Select 3 days and Save milestone.
4. Confirm This week’s milestone is 3 training days., 0 of 3, and no Logged dates. Rest days on or before today may show Complete and a check.
5. Refresh, log out, and sign in with the same account. Confirm the saved target and 0 of 3 remain.

## Acceptance Test 2: A saved goal shows two completed days and the remaining day

1. Open the Login page and sign in as goal87-progress@example.com with the dedicated test password on card #87. This account has target 3 and completed workouts on Monday and Wednesday of the current week.
2. Confirm Home greets Goal, shows the current Monday–Sunday range, 2 of 3, and a two-thirds progress indicator.
3. Confirm Monday and Wednesday have a check and Logged label; no other date is labelled as a completed workout. Confirm One more day. A week well earned. appears, without Weekly goal complete.
4. Refresh and return to Dashboard. Confirm the target, two dates, and 2 of 3 remain.

## Acceptance Test 3: Completing a workout updates a goal that has not yet been reached

1. Open the Login page and sign in as goal87-one@example.com with the dedicated test password on card #87. This account has target 3, one earlier training day this week, and an unfinished workout today with a saved 135 lb × 8 set.
2. Confirm Home shows 1 of 3 and Resume workout. Select Resume workout, verify the saved set, select Complete workout, and confirm completion.
3. Confirm the saved Summary says Workout complete, 2 of 3 training days, and 1 day to go. Refresh and confirm the same result.
4. Return to Dashboard. Confirm 2 of 3, a two-thirds indicator, and two distinct completed dates. Refresh, open Weekly goal, and confirm 2 of 3 training days and 1 day to go. Reopening either page must not add another day.

## Acceptance Test 4: Reaching the weekly target is celebrated and remembered

1. Open the Login page and sign in as goal87-finish@example.com with the dedicated test password on card #87. This account has target 3, two earlier completed dates this week, and an unfinished workout today with a saved 135 lb × 8 set.
2. Confirm Home shows 2 of 3. Resume the workout, select Complete workout, and confirm completion.
3. Confirm the Summary says Workout complete, 3 of 3 training days, and Weekly goal complete. The indicator is full and today has a check and Completed label.
4. Return to Dashboard. Confirm 3 of 3, a full indicator, three distinct completed dates, and goal-complete feedback. Refresh twice and open Weekly goal; confirm the same target, dates, and result.
5. Log out and sign back in. Confirm Home still shows 3 of 3 and goal-complete feedback.

## Acceptance Test 5: Several workouts on the same date count as one training day

1. Open the Login page and sign in as goal87-duplicate@example.com with the dedicated test password on card #87. This account has target 3 and three completed workouts this week: two Monday, one Wednesday, each with at least two saved sets.
2. Confirm Home shows 2 of 3, a two-thirds indicator, Monday and Wednesday marked as logged, 1 day to go, and no Weekly goal complete message.
3. Open Weekly goal. Confirm 2 of 3 training days; neither the extra workout nor extra sets add a day.
4. Refresh Weekly goal and Dashboard. Confirm the same count and dates.

## Acceptance Test 6: Cancelling completion does not advance the goal

1. Open the Login page and sign in as goal87-cancel@example.com with the dedicated test password on card #87. This account has target 3, one earlier completed day, and an unfinished workout today with a saved 135 lb × 8 set.
2. Confirm Home shows 1 of 3. Resume the workout, verify the saved set, select Complete workout, then Cancel in the confirmation box.
3. Confirm the box closes and the workout remains open. Return to Dashboard and confirm 1 of 3, no logged workout today, and no goal-complete message.
4. Refresh, resume the workout, and confirm the same saved set remains unfinished.

## Acceptance Test 7: Rest days do not remove completed progress

1. Open the Login page and sign in as goal87-rest@example.com with the dedicated test password on card #87. This account has target 3 and two logged workout dates with a rest day between them.
2. Confirm Home shows 2 of 3 and Logged with checks on the two workout dates.
3. Confirm the intervening date says Rest day and Complete with a check, without adding a logged training day or lowering progress.
4. Refresh and confirm the same two workout dates, rest label, and 2 of 3.

## Acceptance Test 8: A locked target keeps this week unchanged

1. Open the Login page and sign in as goal87-change@example.com with the dedicated test password on card #87. This account has saved target 3 and two completed dates this week.
2. Confirm Home shows 2 of 3. In Weekly milestone confirm this week is locked, select 4 for Next week’s training days, and Save milestone.
3. Confirm Next week’s milestone is 4 training days. and this week remains 2 of 3 toward 3.
4. Refresh and confirm the next-week selector still shows 4. Log out and sign back in; confirm both values persist.

## Acceptance Test 9: Next week’s target offers valid training-day choices

1. Open the Login page and sign in as goal87-invalid@example.com with the dedicated test password on card #87. This account has a locked target of 3, no current-week completed dates, and an earlier-week lift.
2. Open Next week’s training days in Weekly milestone. Confirm the choices are 1 through 7, without 0, 8, negatives, fractions, or blank.
3. Select 4 and Save milestone. Confirm Next week’s milestone is 4 training days. Refresh and confirm this week remains 0 of 3 and next week remains 4.

## Acceptance Test 10: A new week starts at zero while the saved goal stays

1. Open the Login page and sign in as goal87-boundary@example.com with the dedicated test password on card #87. This account has target 3, three different completed dates last week, and none in the current week.
2. Confirm Home shows the current Monday–Sunday range, 0 of 3, an empty indicator, no current-week logged workout dates, and no goal-complete message.
3. Open Weekly goal and confirm target 3 and 0 of 3 training days.
4. Open Progress then Workout history. Confirm last week's three workouts remain. Return to Dashboard, refresh, and confirm current-week 0 of 3.

## Acceptance Test 11: One user's goal does not appear in another user's account

1. Open the Login page and sign in as goal87-progress@example.com with the dedicated test password on card #87. Confirm Home greets Goal Progress and shows 2 of 3, then log out.
2. Sign in as goal87-other@example.com with the dedicated test password on card #87. This account has target 2 and no current-week workout. Confirm Home greets Goal Other, shows 0 of 2 with an empty indicator and no logged dates, and does not show 2 of 3.
3. Refresh and open Weekly goal. Confirm 0 of 2. Log out, sign back in as goal87-progress@example.com, and confirm its 2 of 3 remains.

## Acceptance Test 12: Weekly goal feedback is usable on a phone

1. On an upright phone with UB campus Wi-Fi or VPN, open the Login page and sign in as goal87-phone@example.com with the dedicated test password on card #87. This account has target 3, two earlier completed dates this week, and an unfinished workout today with a saved 135 lb × 8 set.
2. Confirm Home shows 2 of 3, two labelled completed dates, and 1 day to go. Scroll through the page: numbers, indicator, labels, and Resume workout must remain readable and tappable without sideways scrolling or overlap.
3. Resume and complete the workout. Confirm the Summary shows 3 of 3 training days, Weekly goal complete, a full indicator, today's completed label, and no sideways scrolling.
4. Return to Dashboard and confirm 3 of 3 and goal-complete feedback. In Profile → Appearance switch to Light, then Dark, and confirm progress and labels remain readable in both themes.

## Acceptance Test 13: Signed-out visitors cannot see the previous user's goal

1. Open the Login page and sign in as goal87-progress@example.com with the dedicated test password on card #87. Confirm Home shows 2 of 3.
2. Open the account circle and select Log out. Confirm the Login page says You are logged out.
3. Open the Dashboard URL directly. Confirm Login opens without the previous account's target, dates, or progress.
4. Sign back in as goal87-progress@example.com with the dedicated test password on card #87. Confirm Home shows its saved target and 2 of 3.
