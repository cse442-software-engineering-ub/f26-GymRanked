# Story 14: As a gym goer I want to be able to log my experience and available equipment, which is confirmed by a prompt allowing selection of different experience and equipment.

- **Tasks:** #64 (experience and equipment), #77 (Playwright checks), #96 (save experience and equipment separately)
- **Automated in:** `tests/e2e/14-experience-and-equipment.spec.js`

## Acceptance Test 1: Choose your experience and equipment and save them

**Setup for this test:**
1. Connect to the UB VPN, or use the campus network.
2. Create an account at https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/register with these details,
   then log in with it:
   - Full name: Sam Setup
   - Email: setup-a-0930@example.com
   - Password and Confirm password: AcceptSetup12!

**Steps:**
1. Open https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/setup. The page should show:
   - a progress bar with "Training goal", "Experience" (the current step) and "Choose plan"
   - the heading "Tell us about your training setup" and "This helps tailor your workout plan to your
     experience and available equipment."
   - under "Training experience", three cards: "Beginner", "Intermediate" and "Advanced", each with a short
     description
   - under "Available equipment", eight buttons: "Bodyweight only", "Dumbbells", "Barbell", "Kettlebells",
     "Resistance bands", "Cable machine", "Pull-up bar" and "Full gym access"
   - "Plan impact" reading "Pick your experience and at least one equipment option to see how your plan will be
     built."
   - a "Save setup" button, greyed out
2. Click "Intermediate". It should say "Selected", and "Save setup" should still be greyed out, because no
   equipment is chosen yet.
3. Click "Dumbbells" and "Barbell". Both should be highlighted, Plan impact should read "Intermediate
   programming using dumbbells and barbell.", and "Save setup" should become clickable.
4. Click "Save setup". The workout plan library should open ("Workout plan library").

## Acceptance Test 2: "Bodyweight only" can't be combined with equipment

**Setup for this test:**
1. Complete Acceptance Test 1's setup (log in as setup-a-0930@example.com), and open
   https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/setup.

**Steps:**
1. Click "Beginner". If any equipment is highlighted, click it to turn it off. "Save setup" should be greyed out,
   and Plan impact should read "Pick your experience and at least one equipment option to see how your plan will
   be built."
2. Click "Dumbbells", then "Bodyweight only". "Bodyweight only" should be highlighted and "Dumbbells" should turn
   off. Plan impact should read "Beginner programming using bodyweight only."
3. Click "Kettlebells". "Kettlebells" should be highlighted and "Bodyweight only" should turn off. Plan impact
   should read "Beginner programming using kettlebells."
4. Click "Kettlebells" again to turn it off. "Save setup" should be greyed out again.

## Acceptance Test 3: Your saved setup is remembered and belongs to your account

**Setup for this test:**
1. Log in as setup-a-0930@example.com (from Acceptance Test 1) and open
   https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/setup.

**Steps:**
1. Choose "Advanced", turn off any other equipment, and turn on "Pull-up bar" and "Full gym access". Click
   "Save setup". The workout plan library should open.
2. Open the #/setup link again. "Advanced" should say "Selected", only "Pull-up bar" and "Full gym access" should
   be highlighted, and Plan impact should read "Advanced programming using pull-up bar and full gym access."
3. Log out from the account menu, log back in as setup-a-0930@example.com, and open the #/setup link. The same
   choices should still be selected.
4. Log out. Create a second account (Full name: Sam Second, Email: setup-b-0930@example.com, password
   AcceptSetup12!), log in with it, and open the #/setup link. No experience or equipment should be selected,
   and "Save setup" should be greyed out.

## Acceptance Test 4: You must be logged in to enter your setup

**Setup for this test:**
1. Connect to the UB VPN, or use the campus network. If you're logged in, log out from the account menu.

**Steps:**
1. Open https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/setup. The login page should open instead,
   showing "Log in to GymRank".

## Acceptance Test 5: Changing your experience keeps your equipment, and changing your equipment keeps your experience

**Setup for this test:**
1. Log in as setup-a-0930@example.com (from Acceptance Test 1) and open
   https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/setup.

**Steps:**
1. Choose "Beginner", turn off any other equipment, and turn on "Dumbbells" and "Kettlebells". Plan impact should
   read "Beginner programming using dumbbells and kettlebells." Click "Save setup". The login page should open
   showing "Account setup saved. Log in to continue."
2. Log in as setup-a-0930@example.com and open the #/setup link. "Beginner" should say "Selected", only
   "Dumbbells" and "Kettlebells" should be highlighted, and Plan impact should read "Beginner programming using
   dumbbells and kettlebells."
3. Click "Advanced" and change nothing else. Plan impact should read "Advanced programming using dumbbells and
   kettlebells." Click "Save setup", log in again, and open the #/setup link. "Advanced" should say "Selected" and
   "Dumbbells" and "Kettlebells" should still be the only highlighted equipment.
4. Click "Dumbbells" to turn it off and click "Barbell" to turn it on. Do not click an experience card. Plan impact
   should read "Advanced programming using barbell and kettlebells." Click "Save setup", log in again, and open the
   #/setup link. "Advanced" should still say "Selected" and only "Barbell" and "Kettlebells" should be highlighted.
5. Click "Beginner", then turn off "Barbell" and "Kettlebells" so no equipment is highlighted. "Save setup" should be
   greyed out. Reload the page. The saved choices from step 4 ("Advanced", "Barbell" and "Kettlebells") should be
   shown again, because nothing was saved.
