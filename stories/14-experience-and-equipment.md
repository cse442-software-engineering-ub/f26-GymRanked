# Story 14: As a gym goer I want to be able to log my experience and available equipment, which is confirmed by a prompt allowing selection of different experience and equipment.

- **Tasks:** #64 (experience and equipment), #77 (Playwright checks), #96 (save experience and equipment separately), #94 (separate experience and equipment pages)
- **Automated in:** `tests/e2e/14-experience-and-equipment.spec.js`

## Acceptance Test 1: Choose your experience and equipment and save them

**Setup for this test:** (this account does not exist yet; you create it here)
1. Connect to the UB VPN, or use the campus network.
2. If you're logged in, log out. On an onboarding page, click "Log out" in the top-right corner. On the Dashboard, click the round orange circle with your initials in the top-right corner, then the red "Log out" in the little menu that opens under it.
3. Open a web browser (Chrome is fine). Click the address bar at the very top of the browser window, type or paste https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login and press Enter. You should see a dark screen split into two halves, with "Every rep gets a rank." on the left and a card titled "Log in to GymRank" on the right.
4. Create the test account. At the bottom of the "Log in to GymRank" card, click the orange words "Create an account" (next to "New to GymRank?"). The card should change to "Create your account" with four boxes. Fill them in like this:
   - Click inside the "Full name" box (the first box) and type: Sam Setup
   - Click inside the "Email" box (the second box) and type: setup-a-1009@example.com
   - Click inside the "Password" box (the third box) and type: AcceptSetup12!
   - Click inside the "Confirm password" box (the fourth box) and type: AcceptSetup12!
   - Click the wide "Create account" button under the boxes.
5. The "Log in to GymRank" card should open again, with a green box that says "Account created. Log in to continue." and the "Email" box already filled in with setup-a-1009@example.com. Click inside the "Password" box, type AcceptSetup12! and click the wide "Log in" button.
6. The page should now say "Choose your training goal" in large white letters at the top-left, with "Log out" in the top-right corner and a bar of four steps ("Training goal", "Experience", "Equipment", "Choose plan") above the heading, "Training goal" lit up. Under "Profile preview" you should see an orange circle with "SS", the name "Sam Setup" and "No goal yet".
7. Click the first box in the row of three boxes, the one called "Strength". It should say "Selected". Then click the orange "Save goal" button in the top-right corner of the page, level with the big title. The page should change to "How experienced are you?".

**Steps:**
1. Look at the "How experienced are you?" page. You should see:
   - at the very top-left, the orange square and the word "GymRank", and at the top-right a "Log out" button
   - the bar of four steps, with "Experience" lit up because it is the current step
   - a "Back to training goal" link above the big white heading "How experienced are you?", and under the heading the grey sentence "We use this to set your starting weights and weekly volume."
   - in the top-right corner, level with the heading, an orange button "Save and continue" that looks faded and can't be clicked, with "Pick your experience level to continue." under it
   - three boxes: "Beginner" ("New to structured training, or under 6 months in."), "Intermediate" ("Consistent training for 6 months to 3 years.") and "Advanced" ("3+ years training, comfortable pushing intensity."). Each one has a small picture of bars, an empty circle and a small grey "Select" button.
2. Click anywhere inside the "Intermediate" box. Its "Select" should change to an orange "Selected", the box should get an orange outline and its circle should fill in orange with a tick. The "Save and continue" button should turn bright orange, and "Pick your experience level to continue." should disappear.
3. Click the bright orange "Save and continue" button. The page should change to "What equipment can you use?", with "Equipment" lit up in the bar of steps. You should see:
   - a "Back to experience" link, the heading "What equipment can you use?" and the grey sentence "Pick everything you can get to. You can change this any time."
   - a wide box "Bodyweight only" with "No equipment. Picking this turns the others off." under it
   - the words "or pick what you have", and under them seven square buttons, each with a small picture and its name: "Dumbbells", "Barbell", "Kettlebells", "Resistance bands", "Cable machine", "Pull-up bar" and "Full gym access". None of them is outlined.
   - a box labelled "Plan impact" that says "Pick your experience and at least one equipment option to see how your plan will be built."
   - the "Save and continue" button, faded again, with "Pick at least one option, or Bodyweight only." under it
4. Click the "Dumbbells" button, then the "Barbell" button. Both should get an orange outline and a filled orange circle with a tick. The "Plan impact" box should now say "Intermediate programming using dumbbells and barbell." and the "Save and continue" button should turn bright orange.
5. Click the bright orange "Save and continue" button. The page should change to "Choose your workout plan", with "Choose plan" lit up in the bar of steps and "Log out" still in the top-right corner: you are still logged in, and the login page does not open.

## Acceptance Test 2: "Bodyweight only" can't be combined with equipment

**Setup for this test:** (this account does not exist yet; you create it here, and it is separate from the account in the other tests)
1. Connect to the UB VPN, or use the campus network.
2. If you're logged in, log out. On an onboarding page, click "Log out" in the top-right corner. On the Dashboard, click the round orange circle with your initials in the top-right corner, then the red "Log out" in the little menu that opens under it.
3. Open a web browser (Chrome is fine). Click the address bar at the very top of the browser window, type or paste https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login and press Enter. You should see a dark screen split into two halves, with "Every rep gets a rank." on the left and a card titled "Log in to GymRank" on the right.
4. Create the test account. At the bottom of the "Log in to GymRank" card, click the orange words "Create an account" (next to "New to GymRank?"). The card should change to "Create your account" with four boxes. Fill them in like this:
   - Click inside the "Full name" box (the first box) and type: Sam Bodyweight
   - Click inside the "Email" box (the second box) and type: setup-b-1009@example.com
   - Click inside the "Password" box (the third box) and type: AcceptSetup12!
   - Click inside the "Confirm password" box (the fourth box) and type: AcceptSetup12!
   - Click the wide "Create account" button under the boxes.
5. The "Log in to GymRank" card should open again, with a green box that says "Account created. Log in to continue." and the "Email" box already filled in with setup-b-1009@example.com. Click inside the "Password" box, type AcceptSetup12! and click the wide "Log in" button.
6. The page should now say "Choose your training goal" in large white letters at the top-left, with "Log out" in the top-right corner and a bar of four steps ("Training goal", "Experience", "Equipment", "Choose plan") above the heading, "Training goal" lit up. Under "Profile preview" you should see an orange circle with "SB", the name "Sam Bodyweight" and "No goal yet".
7. Click the first box in the row of three boxes, the one called "Strength". It should say "Selected". Then click the orange "Save goal" button in the top-right corner of the page, level with the big title. The page should change to "How experienced are you?".
8. Click anywhere inside the "Beginner" box so it says "Selected", then click the orange "Save and continue" button in the top-right corner. The page should change to "What equipment can you use?".

**Steps:**
1. The "What equipment can you use?" page is open and no equipment is chosen yet. No button should have an orange outline, the "Save and continue" button in the top-right corner should look faded, and the "Plan impact" box should say "Pick your experience and at least one equipment option to see how your plan will be built."
2. Click the "Dumbbells" button. It should get an orange outline. Now click the wide "Bodyweight only" box. "Bodyweight only" should get an orange outline and "Dumbbells" should lose its outline. The "Plan impact" box should say "Beginner programming using bodyweight only."
3. Click the "Kettlebells" button. "Kettlebells" should get an orange outline and "Bodyweight only" should lose its outline. The "Plan impact" box should say "Beginner programming using kettlebells."
4. Click the "Kettlebells" button again to turn it off. No button should have an orange outline, and the "Save and continue" button should look faded again.
5. Do not click "Save and continue".

## Acceptance Test 3: Your saved setup is remembered and belongs to your account

**Setup for this test:** (this account does not exist yet; you create it here, and it is separate from the account in the other tests)
1. Connect to the UB VPN, or use the campus network.
2. If you're logged in, log out. On an onboarding page, click "Log out" in the top-right corner. On the Dashboard, click the round orange circle with your initials in the top-right corner, then the red "Log out" in the little menu that opens under it.
3. Open a web browser (Chrome is fine). Click the address bar at the very top of the browser window, type or paste https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login and press Enter. You should see a dark screen split into two halves, with "Every rep gets a rank." on the left and a card titled "Log in to GymRank" on the right.
4. Create the test account. At the bottom of the "Log in to GymRank" card, click the orange words "Create an account" (next to "New to GymRank?"). The card should change to "Create your account" with four boxes. Fill them in like this:
   - Click inside the "Full name" box (the first box) and type: Sam Saved
   - Click inside the "Email" box (the second box) and type: setup-c-1009@example.com
   - Click inside the "Password" box (the third box) and type: AcceptSetup12!
   - Click inside the "Confirm password" box (the fourth box) and type: AcceptSetup12!
   - Click the wide "Create account" button under the boxes.
5. The "Log in to GymRank" card should open again, with a green box that says "Account created. Log in to continue." and the "Email" box already filled in with setup-c-1009@example.com. Click inside the "Password" box, type AcceptSetup12! and click the wide "Log in" button.
6. The page should now say "Choose your training goal" in large white letters at the top-left, with "Log out" in the top-right corner and a bar of four steps ("Training goal", "Experience", "Equipment", "Choose plan") above the heading, "Training goal" lit up. Under "Profile preview" you should see an orange circle with "SS", the name "Sam Saved" and "No goal yet".
7. Click the first box in the row of three boxes, the one called "Strength". It should say "Selected". Then click the orange "Save goal" button in the top-right corner of the page, level with the big title. The page should change to "How experienced are you?".
8. Click anywhere inside the "Advanced" box so it says "Selected", then click the orange "Save and continue" button in the top-right corner. The page should change to "What equipment can you use?".

**Steps:**
1. Click the "Pull-up bar" button and the "Full gym access" button so both are outlined in orange. The "Plan impact" box should say "Advanced programming using pull-up bar and full gym access." Click the bright orange "Save and continue" button. The page should change to "Choose your workout plan".
2. Click the address bar at the very top of the browser window, type or paste https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/experience and press Enter. Wait about a second. "Advanced" should say "Selected". Click "Equipment" in the bar of steps. Only "Pull-up bar" and "Full gym access" should be outlined in orange, and the "Plan impact" box should say "Advanced programming using pull-up bar and full gym access."
3. Click "Log out" in the top-right corner. The login page should open and say "You are logged out."
4. Click inside the "Email" box and type setup-c-1009@example.com. Click inside the "Password" box and type AcceptSetup12!. Click the wide "Log in" button. The Dashboard should open, because the setup is finished. Click the address bar, type or paste https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/equipment and press Enter. Wait about a second. The same choices should still be there: only "Pull-up bar" and "Full gym access" outlined in orange. Click "Back to experience": "Advanced" should still say "Selected".
5. Click "Log out" in the top-right corner. The login page should open.
6. At the bottom of the "Log in to GymRank" card, click the orange "Create an account" link. Fill in the boxes:
   - Click inside "Full name" and type: Sam Second
   - Click inside "Email" and type: setup-d-1009@example.com
   - Click inside "Password" and type: AcceptSetup12!
   - Click inside "Confirm password" and type: AcceptSetup12!
   - Click the wide "Create account" button.
   When the login page opens with "Account created. Log in to continue.", type AcceptSetup12! in the "Password" box and click "Log in". The page should say "Choose your training goal", with "Sam Second" under "Profile preview".
7. Click "Strength", then "Save goal". On "How experienced are you?", this second account should have nothing chosen: none of "Beginner", "Intermediate" or "Advanced" says "Selected" (they all say "Select"), and the "Save and continue" button looks faded. Nothing from Sam Saved's account should show.

## Acceptance Test 4: You must be logged in to enter your setup

**Setup for this test:** (no account is needed for this test)
1. Connect to the UB VPN, or use the campus network.
2. If you're logged in, log out. On an onboarding page, click "Log out" in the top-right corner. On the Dashboard, click the round orange circle with your initials in the top-right corner, then the red "Log out" in the little menu that opens under it. The login page should open. If you were not logged in, open a web browser, click the address bar at the very top of the browser window, type or paste https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login and press Enter; the login page should show.

**Steps:**
1. Click the address bar at the very top of the browser window, type or paste https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/experience and press Enter.
2. Wait about a second. The login page should open instead of the experience page. You should see the card titled "Log in to GymRank" on the right side of the screen, and you should not see "How experienced are you?" anywhere.
3. Do the same with https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/equipment. The login page should open again, and you should not see "What equipment can you use?" anywhere.

## Acceptance Test 5: Changing your experience keeps your equipment, and changing your equipment keeps your experience

**Setup for this test:** (this account does not exist yet; you create it here, and it is separate from the account in the other tests)
1. Connect to the UB VPN, or use the campus network.
2. If you're logged in, log out. On an onboarding page, click "Log out" in the top-right corner. On the Dashboard, click the round orange circle with your initials in the top-right corner, then the red "Log out" in the little menu that opens under it.
3. Open a web browser (Chrome is fine). Click the address bar at the very top of the browser window, type or paste https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login and press Enter. You should see a dark screen split into two halves, with "Every rep gets a rank." on the left and a card titled "Log in to GymRank" on the right.
4. Create the test account. At the bottom of the "Log in to GymRank" card, click the orange words "Create an account" (next to "New to GymRank?"). The card should change to "Create your account" with four boxes. Fill them in like this:
   - Click inside the "Full name" box (the first box) and type: Sam Change
   - Click inside the "Email" box (the second box) and type: setup-e-1009@example.com
   - Click inside the "Password" box (the third box) and type: AcceptSetup12!
   - Click inside the "Confirm password" box (the fourth box) and type: AcceptSetup12!
   - Click the wide "Create account" button under the boxes.
5. The "Log in to GymRank" card should open again, with a green box that says "Account created. Log in to continue." and the "Email" box already filled in with setup-e-1009@example.com. Click inside the "Password" box, type AcceptSetup12! and click the wide "Log in" button.
6. The page should now say "Choose your training goal" in large white letters at the top-left, with "Log out" in the top-right corner and a bar of four steps ("Training goal", "Experience", "Equipment", "Choose plan") above the heading, "Training goal" lit up. Under "Profile preview" you should see an orange circle with "SC", the name "Sam Change" and "No goal yet".
7. Click the first box in the row of three boxes, the one called "Strength". It should say "Selected". Then click the orange "Save goal" button in the top-right corner of the page, level with the big title. The page should change to "How experienced are you?".
8. Click anywhere inside the "Beginner" box so it says "Selected", then click the orange "Save and continue" button in the top-right corner. The page should change to "What equipment can you use?".

**Steps:**
1. Click the "Dumbbells" button and the "Kettlebells" button so both are outlined in orange. The "Plan impact" box should say "Beginner programming using dumbbells and kettlebells." Click the bright orange "Save and continue" button. The page should change to "Choose your workout plan".
2. Click the address bar at the very top of the browser window, type or paste https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/experience and press Enter. Wait about a second. "Beginner" should say "Selected". Click anywhere inside the "Advanced" box so it says "Selected", and click "Save and continue". On "What equipment can you use?", "Dumbbells" and "Kettlebells" should still be the only buttons outlined in orange, and the "Plan impact" box should say "Advanced programming using dumbbells and kettlebells."
3. Click the "Dumbbells" button once to turn its outline off, then click the "Barbell" button once to turn its outline on. The "Plan impact" box should say "Advanced programming using barbell and kettlebells." Click "Save and continue". The page should change to "Choose your workout plan".
4. Click the address bar, type or paste https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/experience and press Enter. Wait about a second. "Advanced" should still say "Selected". Click "Equipment" in the bar of steps. Only "Barbell" and "Kettlebells" should be outlined in orange.
5. Click "Barbell" and "Kettlebells" once each to turn both outlines off. No button should be outlined and the "Save and continue" button should look faded. Do not click "Save and continue". Press the reload button of your browser (the circular arrow at the top-left of the browser window) and wait about a second. The page should show your saved choices from step 3 again: only "Barbell" and "Kettlebells" are outlined in orange, because the changes you made in this step were never saved.

## Notes

Rewritten on 2026-10-09 for card #94, which splits the single "Tell us about your training setup" page into "How experienced are you?" (#/experience) and "What equipment can you use?" (#/equipment). Each page saves only its own choice (card #96), "Save and continue" on the equipment page opens "Choose your workout plan" (Surya's recommended plans, PR #44), and #/setup now opens #/experience. The five tests, their accounts and their step-by-step wording follow Mansur's version from the same day (commit 6458eed), including his Test 5; the emails end in 1009 so the accounts are new on cattle. Since PR #45, "Create account" opens the login page first, so each setup logs in before the goal page.
