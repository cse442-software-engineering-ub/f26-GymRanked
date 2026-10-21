# Story TBD: As a gym goer who has already entered my training goal, experience, and available equipment, I want to be able to choose a workout plan designed for me based on these, which is confirmed by a few custom made plan options presented to me.

- **Tasks:** Surya's recommended plans page (PR #44), and the Playwright task card
- **Automated in:** none yet (no Playwright spec exists for this story)

(Note: rename this file to `<card number>-recommended-plans.md` and replace "TBD" in the title once the card has a number.
Plans are recommended from the plan library, so the end-of-sprint release with its plan data (migrations 004-008) must
already be on cattle. "Recommended" means plans that match all three of your answers: they suit your goal, are at or below your
experience level, and need only equipment you have. Plans that need other equipment are never recommended; the
plan library still lists them after the recommended ones, with a red dot.)

## Acceptance Test 1: See recommended plans that match your goal, experience and equipment

**Setup for this test:**
1. Connect to the UB VPN, or use the campus network. If you're logged in, log out.
2. Open https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login and click "Create an account". Create an account
   with these details, then click the "Create account" button:
   Full name: Rec Tester A
   Email: rec-a-1020@example.com
   Password and Confirm password: AcceptRec12!
3. The login page opens with "Account created. Log in to continue.". Type your password and click "Log in".
4. On "Choose your training goal", click "Strength" and "Save goal". On "How experienced are you?", click
   "Intermediate" and "Save and continue". On "What equipment can you use?", click "Full gym access" and
   "Save and continue".

**Steps:**
1. "Choose your workout plan" should open with a green box saying "Your setup is saved." and "Pick a plan to start your
   first week.". Under the heading the page should say "Plans for strength that fit your experience and equipment. Pick one to start.",
   and "Your setup" should read "Strength · Intermediate · Full gym access" with an "Edit" link.
2. The page should list 5 plan cards, in this order: "Push Pull Legs", "Upper/Lower Hypertrophy", "Athletic
   Performance", "Full Body Strength", "Beginner Fundamentals".
3. Look at the "Push Pull Legs" card. It should show "5 days/wk", the name, "Intermediate · 6-8 weeks", a green dot
   (hover over it: "Sufficient equipment"), and an orange "Choose plan" button. Every other card should also have a green
   dot and a "Choose plan" button.
4. Check that no plan is shown that doesn't fit: "5/3/1 Strength Cycle" and "Powerlifting Peak" (both Advanced), and
   "Glute Focus", "Bodyweight Basics" and "Marathon Strength Support" (none of them is a strength plan) must NOT appear.
5. At the bottom, a "Browse all plans" link should be shown.

## Acceptance Test 2: Different answers give different plans

**Setup for this test:**
1. Connect to the UB VPN, or use the campus network. If you're logged in, log out.
2. Create an account on the login page's "Create an account" link with these details, then log in with it:
   Full name: Rec Tester B
   Email: rec-b-1020@example.com
   Password and Confirm password: AcceptRec12!
3. On "Choose your training goal", click "Aerobic fitness" and "Save goal". On "How experienced are you?", click
   "Beginner" and "Save and continue". On "What equipment can you use?", click "Bodyweight only" and
   "Save and continue".

**Steps:**
1. "Choose your workout plan" should open. The page should say "Plans for aerobic fitness that fit your experience and
   equipment. Pick one to start.", and "Your setup" should read "Aerobic fitness · Beginner · Bodyweight only".
2. The page should list only 1 plan card: "Bodyweight Basics". "Beginner Fundamentals" needs equipment you don't have, so it must NOT appear, and neither should "Push Pull Legs" or any other Intermediate or Advanced plan.
3. "Bodyweight Basics" should show "3 days/wk", "Beginner · 4 weeks" and a green dot (hover: "Sufficient equipment").
4. Click "Edit" next to "Your setup". "Choose your training goal" should open with "Aerobic fitness" still selected. Click "Strength" and "Save goal", click "Save and continue" on the experience page (Beginner stays selected), then "Save and continue" on the equipment page. No plan cards should appear, because every Beginner strength plan needs equipment you don't have. The page should say "No plans match your goal, level and equipment yet." with a "Browse all plans" link.

## Acceptance Test 3: Choose a recommended plan

**Setup for this test:**
1. Complete Acceptance Test 1 first, so that you are logged in as rec-a-1020@example.com on "Choose your workout plan"
   with the 5 recommended plans showing. (If you left the page, log in and open
   https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/recommended.)

**Steps:**
1. Click the name "Upper/Lower Hypertrophy". Its details page should open, showing "Upper/Lower Hypertrophy", "4 days/wk"
   and "Intermediate · 10 weeks". Use the browser's back button to return to the recommended plans.
2. Click "Choose plan" on the "Push Pull Legs" card. No warning should appear, because you don't have a plan yet. The
   Dashboard should open, and its "Getting started" checklist should say "You're following Push Pull Legs".
3. Click "Workouts" in the top navigation. The weekly plan page should show "Push Pull Legs — Week 1".
4. Open https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/recommended again. Click "Choose plan" on "Full Body
   Strength". A dialog should appear with "Switch to Full Body Strength?" and "Switch plan" and "Cancel" buttons. Click
   "Cancel". The dialog should close, and the weekly plan should still be "Push Pull Legs — Week 1".

## Acceptance Test 4: Recommendations need your setup and a login

**Setup for this test:**
1. Connect to the UB VPN, or use the campus network. If you're logged in, log out.
2. Create an account with these details and log in with it, but stop on "Choose your training goal":
   Full name: Rec Tester C
   Email: rec-c-1020@example.com
   Password and Confirm password: AcceptRec12!

**Steps:**
1. Open https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/recommended before you have saved a goal. No plan
   cards should appear: "Choose your training goal" should open instead.
2. Click "Log out" in the top-right corner. Open the same link again. The login page should open instead, showing "Log in
   to GymRank".

## Acceptance Test 5: The plan library lists recommended plans first

**Setup for this test:**
1. Log in as rec-a-1020@example.com (Strength · Intermediate · Full gym access) from Acceptance Test 1.

**Steps:**
1. Click "Plans" in the top navigation. "Workout plan library" should open with "Your setup" reading "Strength · Intermediate · Full gym access".
2. Under the label "Recommended for you", these 5 plans should be listed in this order: "Push Pull Legs", "Upper/Lower Hypertrophy", "Athletic Performance", "Full Body Strength", "Beginner Fundamentals".
3. Under the label "More plans", the other 5 plans should be listed in this order: "5/3/1 Strength Cycle", "Powerlifting Peak", "Bodyweight Basics", "Glute Focus", "Marathon Strength Support".
4. All 10 plans should appear exactly once. Each card should still show its name, level and length, days per week, its green or red equipment dot, and a Select button.

## Acceptance Test 6: Changed settings change the order

**Setup for this test:**
1. Log in as rec-b-1020@example.com (Aerobic fitness · Beginner · Bodyweight only), or finish the last step of Acceptance Test 2 first and use the setup it leaves you with.

**Steps:**
1. Open "Plans". Under "Recommended for you", only "Bodyweight Basics" should be listed. Under "More plans" should be the other 9 plans in the normal order, starting with "Push Pull Legs" and ending with "Marathon Strength Support". "Beginner Fundamentals" is among them with a red dot (hover: "Needs Dumbbells and Cable machine").
2. Click "Edit" next to "Your setup", choose "Strength" and "Save goal", then "Save and continue" on the experience page, and "Save and continue" on the equipment page. Open "Plans" again. "Your setup" should now read "Strength · Beginner · Bodyweight only". Nothing matches, so there should be no "Recommended for you" or "More plans" labels, and all 10 plans should be listed in the normal order ("Push Pull Legs" first, "Marathon Strength Support" last), the strength ones with red dots.
3. Click "Edit", choose "Full gym access" on the equipment page (and keep Strength and Beginner), and save. Open "Plans". "Recommended for you" should list "Full Body Strength" then "Beginner Fundamentals", both with green dots.

## Acceptance Test 7: Without a finished setup the library keeps its normal order

**Setup for this test:**
1. Log out. Create and log in with Full name: Rec Tester D, Email: rec-d-1020@example.com, Password and Confirm password: AcceptRec12!. Stop on "Choose your training goal".

**Steps:**
1. Open https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/plans. Because setup isn't finished, "Choose your training goal" opens instead of the library.
2. Log out and open the same link again. The login page should open, showing "Log in to GymRank".
3. (Matching with no plans is covered in Acceptance Test 6, step 2.)

## Acceptance Test 8: Plan details, selecting, switching and cancelling still work from the library

**Setup for this test:**
1. Log in as rec-a-1020@example.com with no plan selected yet (a fresh account from Acceptance Test 1, before Acceptance Test 3).

**Steps:**
1. Open "Plans". Click the "Upper/Lower Hypertrophy" card (not its Select button). Its details page should open with "4 days/wk" and "Intermediate · 10 weeks". Go back with the "Plans" breadcrumb.
2. Click Select on "Push Pull Legs". No warning should appear. The Dashboard should open, with "You're following Push Pull Legs" in its "Getting started" checklist.
3. Open "Plans". "Push Pull Legs" should still be first, with an orange border and a greyed-out "Current plan" button.
4. Click Select on "Full Body Strength". A dialog should appear: "Switch to Full Body Strength?" with "Switch plan" and "Cancel". Click "Cancel", then repeat and press Escape, then repeat and click outside the dialog. Each time the dialog should close and "Push Pull Legs" should stay your current plan.
5. Click Select on "Full Body Strength" and click "Switch plan". The Dashboard should say "You're following Full Body Strength". Open "Plans": "Full Body Strength" should show "Current plan" and still sit under "Recommended for you".
