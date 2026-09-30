# Story 13: As a gym goer I want to be able to select a training goal, such as strength, fat lose or aerobic fitness, which is confirmed by this goal being added to my subsquent workout plan.

- **Tasks:** #63 (training goal selection), #76 (Playwright checks)
- **Automated in:** `tests/e2e/13-select-training-goal.spec.js`

## Acceptance Test 1: Choose a training goal and save it

**Setup for this test:**
1. Connect to the UB VPN, or use the campus network.
2. Create an account at https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/register with these details,
   then log in with it:
   - Full name: Goldie Tester
   - Email: goal-a-0930@example.com
   - Password and Confirm password: AcceptGoal12!

**Steps:**
1. Open https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/goal. The page should show:
   - a progress bar with "Training goal" (the current step), "Experience" and "Choose plan"
   - the heading "Choose your training goal" and "This appears on your profile and shapes your training plan."
   - three cards: "Strength", "Fat loss" and "Aerobic fitness", each with a short description and "Select"
   - a "Profile preview" showing "GT", "Goldie Tester" and "No goal yet"
   - a "Plan impact" panel reading "Pick a goal to see how it shapes your plan."
   - a "Save goal" button, greyed out
2. Click "Fat loss". Its card should now say "Selected", the preview should show "Fat loss" instead of "No goal
   yet", Plan impact should read "Shorter rests, more volume, calorie burn per session.", and "Save goal" should
   become clickable.
3. Click "Strength". Only "Strength" should say "Selected" now, the preview should show "Strength", and Plan
   impact should read "Heavier sets, longer rests, focus on the big lifts."
4. Click "Save goal". The next step should open: "Tell us about your training setup", with "Experience" as the
   current step in the progress bar.

## Acceptance Test 2: Your saved goal is remembered and belongs to your account

**Setup for this test:**
1. Complete Acceptance Test 1 first. Stay logged in as goal-a-0930@example.com with "Strength" saved.

**Steps:**
1. Open https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/goal. "Strength" should already say
   "Selected", and the preview should show "Strength".
2. Click "Aerobic fitness", then "Save goal". The experience step should open.
3. Log out from the account menu, log back in as goal-a-0930@example.com, and open the #/goal link again.
   "Aerobic fitness" should be selected.
4. Log out. Create a second account (Full name: Goldie Second, Email: goal-b-0930@example.com, password
   AcceptGoal12!), log in with it, and open the #/goal link. No card should be selected, the preview should show
   "No goal yet", and "Save goal" should be greyed out.

## Acceptance Test 3: You must be logged in to choose a goal

**Setup for this test:**
1. Connect to the UB VPN, or use the campus network. If you're logged in, log out from the account menu.

**Steps:**
1. Open https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/goal. The login page should open instead,
   showing "Log in to GymRank".
