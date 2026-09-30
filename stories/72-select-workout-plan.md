# Story 72: As a new or existing user, I want to be able to select a workout plan and change my current workout plan, which is confirmed by having an option to save current workout plan and change current workout plan

- **Tasks:** #67 (workout-plan library), #73 (Playwright checks)
- **Automated in:** `tests/e2e/72-select-workout-plan.spec.js`

## Acceptance Test 1: Browse the plan library and view a plan's details

**Setup for this test:**
1. Connect to the UB VPN, or use the campus network.
2. The end-of-sprint release, with its plan data (migrations 004-006), must already be on cattle.
3. Open https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/plans in a browser.

**Steps:**
1. The page should show the heading "Workout plan library" and "Browse all training programs.", with a list of
   10 plans. Each plan should show its name, level, and length (e.g. "Intermediate · 6-8 weeks"), days per week
   (e.g. "5 days/wk"), and a Select button.
2. Click the "Push Pull Legs" plan (the row itself, not its Select button). A details page for that plan should
   open, showing "Push Pull Legs", "5 days/wk", "Intermediate · 6-8 weeks", and a description starting "A
   balanced strength split rotating push, pull, and leg days".
3. Under "Weekly split", the page should list three training days, each with its focus and length: "Push"
   (Chest, shoulders, triceps, ~45 min), "Pull" (Back, biceps, ~45 min), and "Legs" (Quads, hamstrings, glutes,
   ~50 min). A "Start this plan" button should appear below them.
4. Click "Plans" in the breadcrumb at the top. This should return to the workout plan library.
5. Click "Bodyweight Basics". Its details page should show "Beginner · 4 weeks", "3 days/wk", and "Push",
   "Pull", and "Legs", each ~30 min.

## Acceptance Test 2: Select a plan and see it as your weekly plan

**Setup for this test:**
1. Connect to the UB VPN, or use the campus network.
2. Open https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login. If it says "You're logged in", click
   Log out.
3. Create an account at https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/register:
   Full name: Plans Tester A
   Email: plans-a-0929@example.com
   Password and Confirm password: AcceptPlans12!
   Then log in with it.

**Steps:**
1. Open https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/plans. The Select buttons should be
   clickable, and there should be no login message.
2. Click Select next to "Push Pull Legs". No warning should appear. You should go straight to your weekly plan
   page, which shows:
   - The title "Push Pull Legs — Week 1", with this week's dates underneath (e.g. "Week of Sept 28 – Oct 4").
   - "Workouts" highlighted in the top navigation.
   - Seven day cards from MON to SUN, with today's card highlighted in orange and labelled "Today". Training
     days show Push, Pull, or Legs; the other days show "Rest day".
   - A "Today's workout" section showing today's workout, or "Rest day".
3. Click "Plans" in the top navigation. The button next to "Push Pull Legs" should now read "Current plan" and
   be greyed out.
4. Click "Push Pull Legs" to open its details. The bottom button should read "This is your current plan" and be
   greyed out.
5. Click "Workouts" in the top navigation. This should return to the "Push Pull Legs — Week 1" weekly plan.

## Acceptance Test 3: Switching plans warns you first

**Setup for this test:**
1. Complete Acceptance Test 2 first. Stay logged in as plans-a-0929@example.com with "Push Pull Legs" as your
   plan.

**Steps:**
1. Open https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/plans and click Select next to "Full Body
   Strength". A dialog should appear with:
   - "Switch to Full Body Strength?"
   - "You're partway through Week 1 of Push Pull Legs. Switching plans now will reset this week's progress."
   - "Your finished workouts stay in your history."
   - "Switch plan" and "Cancel" buttons.
2. Click Cancel. The dialog should close, and "Push Pull Legs" should still show "Current plan".
3. Click Select next to "Full Body Strength" again, then press the Escape key. The dialog should close without
   changing your plan.
4. Click Select next to "Full Body Strength" again, then click the dark area outside the dialog. The dialog
   should close without changing your plan.
5. Click "Full Body Strength" to open its details, then click "Start this plan". The same "Switch to Full Body
   Strength?" dialog should appear.
6. Click Switch plan. You should go to your weekly plan page, now showing "Full Body Strength — Week 1" with its
   training days (Full body A, Full body B, Full body C).
7. Click "Plans" in the top navigation. "Full Body Strength" should now show "Current plan", and "Push Pull
   Legs" should show a clickable Select button.

## Acceptance Test 4: Your chosen plan is saved to your account

**Setup for this test:**
1. Complete Acceptance Test 3 first. Stay logged in as plans-a-0929@example.com with "Full Body Strength" as
   your plan.

**Steps:**
1. Open https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/weekly-plan and refresh the page. It should
   still show "Full Body Strength — Week 1".
2. Close the browser completely, reopen it, and open the same link. If you're asked to log in, log in as
   plans-a-0929@example.com, then open the link again. It should still show "Full Body Strength — Week 1".
3. Open https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login and click Log out. Then open the
   weekly plan link again. It should show "Log in to see your weekly plan."
4. Log back in as plans-a-0929@example.com and open the weekly plan link. It should show "Full Body Strength —
   Week 1".
5. Log out. Create a second account at https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/register:
   Full name: Plans Tester B
   Email: plans-b-0929@example.com
   Password and Confirm password: AcceptPlans12!
   Log in with it and open the weekly plan link. It should show "You haven't picked a plan yet." with a link to
   "Browse the plan library". The first account's plan must not appear here.
6. Click "Browse the plan library" and click Select next to "Glute Focus". The weekly plan should show "Glute
   Focus — Week 1".
7. Log out, log back in as plans-a-0929@example.com, and open the weekly plan link. It should still show "Full
   Body Strength — Week 1". The second account's choice must not have changed the first account's plan.

## Notes

Copied from card #72 on 2026-09-29. These lines were fixed while copying; the card should get the same fixes:

- Test 1 was titled "Test 1"; renamed "Acceptance Test 1" to match the others.
- Test 1, step 3: the card's text was garbled ("Puceps, ~45 min)"). Restored from the plan data as "Push"
  (Chest, shoulders, triceps, ~45 min), and finished the cut-off sentence about the "Start this plan" button.
- Test 1, step 4: the card read "Click "Plans" in the b should return…". Restored as the breadcrumb.
- Test 1, step 5: the card listed only "Pull" and "Legs". Bodyweight Basics also has "Push" (all ~30 min).
- Test 2, setup step 3 is new. The card logs you out and then expects working Select buttons, but never logs
  anyone in, while Tests 3 and 4 assume you're logged in as plans-a-0929@example.com. The step creates that
  account the same way Test 4 step 5 creates the second one.

The automated version uses a new `e2e-…@example.com` account for each test instead of the fixed
plans-a/plans-b accounts, so it can be run again and again.
