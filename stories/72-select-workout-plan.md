# Story 72: As a new or existing user, I want to be able to select a workout plan and change my current workout plan, which is confirmed by having an option to save current workout plan and change current workout plan

- **Tasks:** #67 (workout-plan library), #73 (Playwright checks), #95 (plan cards and onboarding-to-plan handoff)
- **Automated in:** `tests/e2e/72-select-workout-plan.spec.js`

(Note: in each test, a plan is a set of exercises. On a phone, "the top navigation" is the menu behind the three lines
at the top left.)

## Acceptance Test 1: Browse the plan library and view a plan's details

**Setup for this test:**
1. Connect to the UB VPN, or use the campus network.
2. The end-of-sprint release, with its plan data (migrations 004-008), must already be on cattle.
3. Open https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login and click "Create an account". Create an account with these details, then click the
   "Create account" button:
   Full name: Plans Viewer
   Email: plans-v-1009@example.com
   Password and Confirm password: AcceptPlans12!
4. The login page opens with "Account created. Log in to continue.". Type your password and click "Log in".
5. On "Choose your training goal", click "Strength" and "Save goal". On "How experienced are you?", click
   "Intermediate" and "Save and continue". On "What equipment can you use?", click "Full gym access" and
   "Save and continue".
6. "Choose your workout plan" should open with a green box saying "Your setup is saved." and "Pick a plan to start
   your first week.", and under the heading "Your setup" reading "Strength · Intermediate · Full gym access" with
   an "Edit" link. Click "Browse all plans". It should open the workout plan library, with the same "Your setup"
   line. The Select buttons should be clickable, and there should be no login message.

**Steps:**
1. The page should show the heading "Workout plan library" and "Browse all training programs.", with a list of
   10 plans. Each plan should show its name, level, and length (e.g. "Intermediate · 6-8 weeks"), days per week
   (e.g. "5 days/wk"), and a Select button.
2. Click the "Push Pull Legs" card (anywhere on it except its Select button). A details page for that plan should
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
2. Open https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login. If the Dashboard opens instead, you're still logged in: log out from the account menu.
3. Click "Create an account". Create an account with these details, then click the "Create account" button:
   Full name: Plans Tester A
   Email: plans-a-1009@example.com
   Password and Confirm password: AcceptPlans12!
4. The login page opens with "Account created. Log in to continue.". Type your password and click "Log in".
5. On "Choose your training goal", click "Strength" and "Save goal". On "How experienced are you?", click
   "Intermediate" and "Save and continue". On "What equipment can you use?", click "Full gym access" and
   "Save and continue".
6. "Choose your workout plan" should open.

**Steps:**
1. Click "Browse all plans". It should open the workout plan library. The Select buttons should be clickable, and
   there should be no login message.
2. Click Select next to "Push Pull Legs". No warning should appear. The Dashboard should open, and its "Getting
   started" checklist should say "You're following Push Pull Legs". Then click "Workouts" in the top navigation.
   Your weekly plan page should show:
   - The title "Push Pull Legs — Week 1", with this week's dates underneath (e.g. "Week of Sept 28 – Oct 4").
   - "Workouts" highlighted in the top navigation.
   - Seven day cards from MON to SUN, with today's card highlighted in orange and labelled "Today". Training
     days show Push, Pull, or Legs; the other days show "Rest day".
   - A "Today's workout" section showing today's workout, or "Rest day".
3. Click "Plans" in the top navigation. The "Push Pull Legs" card should now have an orange border, and its
   button should read "Current plan" with a tick and be greyed out.
4. Click "Push Pull Legs" to open its details. The bottom button should read "This is your current plan" and be
   greyed out.
5. Click "Workouts" in the top navigation. This should return to the "Push Pull Legs — Week 1" weekly plan.

## Acceptance Test 3: Switching plans warns you first

**Setup for this test:**
1. Complete Acceptance Test 2 first. Stay logged in as plans-a-1009@example.com with "Push Pull Legs" as your
   plan.

**Steps:**
1. Click "Plans" in the top navigation to open the workout plan library, and click Select next to "Full Body
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
6. Click Switch plan. The Dashboard should open, and its "Getting started" checklist should say "You're
   following Full Body Strength". Then click "Workouts" in the top navigation. Your weekly plan page should show
   "Full Body Strength — Week 1" with its training days (Full body A, Full body B, Full body C).
7. Click "Plans" in the top navigation. "Full Body Strength" should now show "Current plan", and "Push Pull
   Legs" should show a clickable Select button.

## Acceptance Test 4: Your chosen plan is saved to your account

**Setup for this test:**
1. Complete Acceptance Test 3 first. Stay logged in as plans-a-1009@example.com with "Full Body Strength" as
   your plan.

**Steps:**
1. Click "Workouts" in the top navigation, then refresh the page. It should still show "Full Body Strength —
   Week 1".
2. Close the browser completely, reopen it, and open the weekly plan link: https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/weekly-plan. If you're asked to
   log in, log in as plans-a-1009@example.com, then open the weekly plan link again. It should still show "Full
   Body Strength — Week 1".
3. Open the account menu and click "Log out". Then open the weekly plan link again. The login page should open
   instead, showing "Log in to GymRank".
4. Log back in as plans-a-1009@example.com and open the weekly plan link. It should show "Full Body Strength —
   Week 1".
5. Log out. On the login page, click "Create an account" and create a second account with these details, then
   click the "Create account" button:
   Full name: Plans Tester B
   Email: plans-b-1009@example.com
   Password and Confirm password: AcceptPlans12!
   Log in with the new account, finish the goal, experience and equipment pages as in Test 2's setup, and open
   the weekly plan link. It should show "No workout plan selected yet" with a "Browse workout plans" button. The first
   account's plan must not appear here.
6. Click "Browse workout plans" and click Select next to "Glute Focus". The Dashboard should open, and its
   "Getting started" checklist should say "You're following Glute Focus". Then open the weekly plan link. It
   should show "Glute Focus — Week 1".
7. Log out, log back in as plans-a-1009@example.com, and open the weekly plan link. It should still show "Full
   Body Strength — Week 1". The second account's choice must not have changed the first account's plan.

## Notes

Changed on 2026-10-06 (Sam) to match the app after PRs #36 and #39 (cards #86 and #98): selecting or switching a
plan now opens the Dashboard instead of the weekly plan, and the weekly plan without a plan says "No workout plan
selected yet" with a "Browse workout plans" button. Test 2 step 2, Test 3 step 6 and Test 4 steps 5–6 now check
the Dashboard's "Getting started" checklist, then open the weekly plan with "Workouts" or its link.

Changed on 2026-10-03 (Sam) after Suryamur10 rewrote card #72 on 2026-10-02. Kept from that rewrite: the note that a
plan is a set of exercises, creating each account through the sign-up, goal and setup pages and then logging in on
the login page that follows, and opening the library with "Plans" in the top navigation (Tests 1–3). Fixed:

- Every link points to cattle again; the rewrite had switched most of them to aptitude. Acceptance tests are
  written for cattle (course rule).
- Test 4, step 1 opened the plan library but expected "Full Body Strength — Week 1", which only the weekly plan
  shows, and no longer refreshed. It now clicks "Workouts" and refreshes. Step 2 names the weekly plan link that
  later steps reopen.
- Test 4, step 5 creates the second account the same way as the first (sign-up, goal and setup pages, then
  log in), since signing up no longer leaves you on the login page.

The automated version creates its accounts through the API and logs in, instead of going through the goal and
setup pages, which story #13's and #14's tests cover.

Copied from card #72 on 2026-09-29. These lines were fixed while copying; the card should get the same fixes:

- Test 1 was titled "Test 1"; renamed "Acceptance Test 1" to match the others.
- Test 1, step 3: the card's text was garbled ("Puceps, ~45 min)"). Restored from the plan data as "Push"
  (Chest, shoulders, triceps, ~45 min), and finished the cut-off sentence about the "Start this plan" button.
- Test 1, step 4: the card read "Click "Plans" in the b should return…". Restored as the breadcrumb.
- Test 1, step 5: the card listed only "Pull" and "Legs". Bodyweight Basics also has "Push" (all ~30 min).
- Test 2, setup step 3 is new. The card logs you out and then expects working Select buttons, but never logs
  anyone in, while Tests 3 and 4 assume you're logged in as plans-a-0929@example.com. The step creates that
  account the same way Test 4 step 5 creates the second one.

Changed on 2026-10-02 to match the app after PR #28 (card #70), which sends logged-out visitors on any page with
the top navigation to the login page (Sam's decision: being logged in is required). Card #72 gets the same changes:

- Test 1, setup step 3 is new: create an account and log in before opening the plan library.
- Test 4, step 3: after logging out, the weekly plan link now opens the login page ("Log in to GymRank") instead
  of showing "Log in to see your weekly plan.". Logging out is done from the account menu, since opening the
  login page while logged in goes straight to the Dashboard.
- Test 2, setup step 2: the card said to click Log out if the login page says "You're logged in", but the app
  never shows that; a logged-in visitor goes straight to the Dashboard. It now says to log out from the account
  menu in that case.

The automated version uses a new `e2e-…@example.com` account for each test instead of the fixed
plans-a/plans-b accounts, so it can be run again and again.

Changed on 2026-10-09 for card #95 and the onboarding changes before it (PR #45, card #94): "Create account" now
opens the login page, onboarding is the goal, experience and equipment pages, and it ends on "Choose your workout
plan", which shows "Your setup is saved." and a "Your setup" line; the setups choose "Full gym access" so no
equipment warning appears, and reach the library with "Browse all plans". The current plan's card now has an
orange border, and clicking anywhere on a card opens its details. Emails end in 1009 so the cattle accounts are
new. The tests themselves are otherwise unchanged.
