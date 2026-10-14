# Story 13: As a gym goer I want to be able to select a training goal, such as strength, fat lose or aerobic fitness, which is confirmed by this goal being added to my subsquent workout plan.

- **Tasks:** #63 (training goal selection), #76 (Playwright checks), #93 (goal screen redesign), #94 (separate experience and equipment pages)
- **Automated in:** `tests/e2e/13-select-training-goal.spec.js`

## Acceptance Test 1: Choose a training goal and save it

**Setup for this test:**
1. Connect to the UB VPN, or use the campus network.
2. Create an account at https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/register with these details,
   then log in with them on the login page that opens ("Account created. Log in to continue."):
   - Full name: Goldie Tester
   - Email: goal-a-0930@example.com
   - Password and Confirm password: AcceptGoal12!

**Steps:**
1. Open https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/goal. The page should show:
   - a progress bar with "Training goal" (the current step), "Experience", "Equipment" and "Choose plan"
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
4. Click "Save goal". The next step should open: "How experienced are you?", with "Experience" as the current step
   in the progress bar.

## Acceptance Test 2: Your saved goal is remembered and belongs to your account

**Setup for this test:**
1. Complete Acceptance Test 1 first. Stay logged in as goal-a-0930@example.com with "Strength" saved.

**Steps:**
1. Open https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/goal. "Strength" should already say
   "Selected", and the preview should show "Strength".
2. Click "Aerobic fitness", then "Save goal". The experience step should open.
3. Click "Log out" in the top-right corner, log back in as goal-a-0930@example.com, and open the #/goal link
   again. "Aerobic fitness" should be selected.
4. Click "Log out" in the top-right corner. Create a second account (Full name: Goldie Second, Email:
   goal-b-0930@example.com, password AcceptGoal12!), log in with it, and open the #/goal link. No card should be selected, the preview should show
   "No goal yet", and "Save goal" should be greyed out.

## Acceptance Test 3: You must be logged in to choose a goal

**Setup for this test:**
1. Connect to the UB VPN, or use the campus network. If you're logged in, log out ("Log out" in the top-right
   corner of an onboarding page, or the account menu on the Dashboard).

**Steps:**
1. Open https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/goal. The login page should open instead,
   showing "Log in to GymRank".

## Notes

Changed on 2026-10-09 for cards #93 and #94 and the onboarding check from PR #45: "Create account" now opens the
login page first, the progress bar has four steps (the experience and equipment pages are separate), "Save goal"
opens "How experienced are you?", and the onboarding pages have their own "Log out" in the top-right corner (an
account that hasn't finished setup can't reach the Dashboard's account menu).
