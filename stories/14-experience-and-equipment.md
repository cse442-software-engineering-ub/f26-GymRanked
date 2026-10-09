# Story 14: As a gym goer I want to be able to log my experience and available equipment, which is confirmed by a prompt allowing selection of different experience and equipment.

- **Tasks:** #64 (experience and equipment), #77 (Playwright checks), #96 (save experience and equipment separately)
- **Automated in:** `tests/e2e/14-experience-and-equipment.spec.js`

## Acceptance Test 1: Choose your experience and equipment and save them

**Setup for this test:** (this account does not exist yet; you create it here)
1. Connect to the UB VPN, or use the campus network.
2. If you're logged in, log out. Click the round orange circle with your initials in the top-right corner of the page, then click the red "Log out" in the little menu that opens under it.
3. Open a web browser (Chrome is fine). Click the address bar at the very top of the browser window, type or paste https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login and press Enter. You should see a dark screen split into two halves, with "Every rep gets a rank." on the left and a card titled "Log in to GymRank" on the right.
4. Create the test account. At the bottom of the "Log in to GymRank" card, click the orange words "Create an account" (next to "New to GymRank?"). The card should change to "Create your account" with four boxes. Fill them in like this:
   - Click inside the "Full name" box (the first box) and type: Sam Setup
   - Click inside the "Email" box (the second box) and type: setup-a-0930@example.com
   - Click inside the "Password" box (the third box) and type: AcceptSetup12!
   - Click inside the "Confirm password" box (the fourth box) and type: AcceptSetup12!
   - Click the wide "Create account" button under the boxes.
5. The page should now say "Choose your training goal" in large white letters at the top-left, and a bar of three steps ("Training goal", "Experience", "Choose plan") should sit above it, with "Training goal" lit up in orange. Under "Profile preview" you should see an orange circle with "SS", the name "Sam Setup" and "No goal yet".
6. Click the first box in the row of three boxes, the one called "Strength". It should say "Selected". Then click the orange "Save goal" button in the top-right corner of the page, level with the big title. The page should change to "Tell us about your training setup".

**Steps:**
1. Look at the "Tell us about your training setup" page. You should see:
   - at the very top-left, the orange square and the word "GymRank"
   - under that, a bar with three steps: "Training goal", "Experience" and "Choose plan". "Experience" is lit up in orange, because it is the current step.
   - the big white heading "Tell us about your training setup", and under it the grey sentence "This helps tailor your workout plan to your experience and available equipment."
   - in the top-right corner, level with the heading, an orange button "Save setup" that looks faded and can't be clicked
   - the small grey label "Training experience", and under it three boxes side by side: "Beginner", "Intermediate" and "Advanced". Each one has a short sentence of description and a small grey "Select" button at the bottom.
   - the small grey label "Available equipment", and under it a row of eight buttons: "Bodyweight only", "Dumbbells", "Barbell", "Kettlebells", "Resistance bands", "Cable machine", "Pull-up bar" and "Full gym access". None of them is lit up.
   - a box at the bottom labelled "Plan impact" that says "Pick your experience and at least one equipment option to see how your plan will be built."
2. Click anywhere inside the "Intermediate" box. The small grey "Select" at the bottom of that box should change to an orange "Selected", and the box should get an orange outline. The "Save setup" button should still look faded, because no equipment is chosen yet. The "Plan impact" sentence should not change.
3. Click the "Dumbbells" button in the row of equipment buttons. It should get an orange outline. Then click the "Barbell" button. It should get an orange outline too. Both "Dumbbells" and "Barbell" should now be outlined in orange. The "Plan impact" box should now say "Intermediate programming using dumbbells and barbell." and the "Save setup" button in the top-right corner should turn bright orange.
4. Click the bright orange "Save setup" button in the top-right corner. You should be taken to the login page ("Log in to GymRank"). A green box under the title should say "Account setup saved. Log in to continue." The "Email" box should already be filled in with setup-a-0930@example.com and the "Password" box should be empty.
5. Click inside the "Password" box and type: AcceptSetup12!. Then click the wide dark-grey "Log in" button. The Dashboard should open, with "Welcome, Sam" in large white letters near the top-left, and a round orange circle with "SS" in the top-right corner.

## Acceptance Test 2: "Bodyweight only" can't be combined with equipment

**Setup for this test:** (this account does not exist yet; you create it here, and it is separate from the account in the other tests)
1. Connect to the UB VPN, or use the campus network.
2. If you're logged in, log out. Click the round orange circle with your initials in the top-right corner of the page, then click the red "Log out" in the little menu that opens under it.
3. Open a web browser (Chrome is fine). Click the address bar at the very top of the browser window, type or paste https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login and press Enter. You should see a dark screen split into two halves, with "Every rep gets a rank." on the left and a card titled "Log in to GymRank" on the right.
4. Create the test account. At the bottom of the "Log in to GymRank" card, click the orange words "Create an account" (next to "New to GymRank?"). The card should change to "Create your account" with four boxes. Fill them in like this:
   - Click inside the "Full name" box (the first box) and type: Sam Bodyweight
   - Click inside the "Email" box (the second box) and type: setup-b-0930@example.com
   - Click inside the "Password" box (the third box) and type: AcceptSetup12!
   - Click inside the "Confirm password" box (the fourth box) and type: AcceptSetup12!
   - Click the wide "Create account" button under the boxes.
5. The page should now say "Choose your training goal" in large white letters at the top-left, and a bar of three steps ("Training goal", "Experience", "Choose plan") should sit above it, with "Training goal" lit up in orange. Under "Profile preview" you should see an orange circle with "SB", the name "Sam Bodyweight" and "No goal yet".
6. Click the first box in the row of three boxes, the one called "Strength". It should say "Selected". Then click the orange "Save goal" button in the top-right corner of the page, level with the big title. The page should change to "Tell us about your training setup".

**Steps:**
1. The "Tell us about your training setup" page is open and nothing is chosen yet. Click anywhere inside the "Beginner" box. It should change to "Selected". No equipment button should have an orange outline, the "Save setup" button in the top-right corner should look faded, and the "Plan impact" box should say "Pick your experience and at least one equipment option to see how your plan will be built."
2. Click the "Dumbbells" button. It should get an orange outline. Now click the "Bodyweight only" button (the first one in the row). "Bodyweight only" should get an orange outline and "Dumbbells" should lose its outline. The "Plan impact" box should say "Beginner programming using bodyweight only."
3. Click the "Kettlebells" button. "Kettlebells" should get an orange outline and "Bodyweight only" should lose its outline. The "Plan impact" box should say "Beginner programming using kettlebells."
4. Click the "Kettlebells" button again to turn it off. No equipment button should have an orange outline, and the "Save setup" button in the top-right corner should look faded again.
5. Do not click "Save setup".

## Acceptance Test 3: Your saved setup is remembered and belongs to your account

**Setup for this test:** (this account does not exist yet; you create it here, and it is separate from the account in the other tests)
1. Connect to the UB VPN, or use the campus network.
2. If you're logged in, log out. Click the round orange circle with your initials in the top-right corner of the page, then click the red "Log out" in the little menu that opens under it.
3. Open a web browser (Chrome is fine). Click the address bar at the very top of the browser window, type or paste https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login and press Enter. You should see a dark screen split into two halves, with "Every rep gets a rank." on the left and a card titled "Log in to GymRank" on the right.
4. Create the test account. At the bottom of the "Log in to GymRank" card, click the orange words "Create an account" (next to "New to GymRank?"). The card should change to "Create your account" with four boxes. Fill them in like this:
   - Click inside the "Full name" box (the first box) and type: Sam Saved
   - Click inside the "Email" box (the second box) and type: setup-c-0930@example.com
   - Click inside the "Password" box (the third box) and type: AcceptSetup12!
   - Click inside the "Confirm password" box (the fourth box) and type: AcceptSetup12!
   - Click the wide "Create account" button under the boxes.
5. The page should now say "Choose your training goal" in large white letters at the top-left, and a bar of three steps ("Training goal", "Experience", "Choose plan") should sit above it, with "Training goal" lit up in orange. Under "Profile preview" you should see an orange circle with "SS", the name "Sam Saved" and "No goal yet".
6. Click the first box in the row of three boxes, the one called "Strength". It should say "Selected". Then click the orange "Save goal" button in the top-right corner of the page, level with the big title. The page should change to "Tell us about your training setup".

**Steps:**
1. The "Tell us about your training setup" page is open and nothing is chosen yet. Click anywhere inside the "Advanced" box so it says "Selected". Click the "Pull-up bar" button and the "Full gym access" button so both are outlined in orange. The "Plan impact" box should say "Advanced programming using pull-up bar and full gym access." Click the bright orange "Save setup" button in the top-right corner. The login page should open with a green box that says "Account setup saved. Log in to continue."
2. Click inside the "Password" box (the "Email" box should already say setup-c-0930@example.com) and type: AcceptSetup12!. Click the wide dark-grey "Log in" button. The Dashboard should open. Click the address bar at the very top of the browser window, type or paste https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/setup and press Enter. Wait about a second. "Advanced" should say "Selected", only "Pull-up bar" and "Full gym access" should be outlined in orange, and the "Plan impact" box should say "Advanced programming using pull-up bar and full gym access."
3. Click the "GymRank" logo in the top-left corner to go back to the Dashboard. Click the round orange circle with "SS" in the top-right corner. A small menu opens under it with "Profile", "Account Settings" and a red "Log out". Click "Log out". The login page should open and say "You are logged out."
4. Click inside the "Email" box and type setup-c-0930@example.com. Click inside the "Password" box and type AcceptSetup12!. Click the wide dark-grey "Log in" button. The Dashboard should open. Click the address bar at the very top of the browser window, type or paste https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/setup and press Enter. Wait about a second. The same choices should still be there: "Advanced" selected, with "Pull-up bar" and "Full gym access" outlined in orange.
5. Click "GymRank" in the top-left corner, click the orange circle with "SS" in the top-right corner, and click the red "Log out". The login page should open.
6. At the bottom of the "Log in to GymRank" card, click the orange "Create an account" link. Fill in the boxes:
   - Click inside "Full name" and type: Sam Second
   - Click inside "Email" and type: setup-d-0930@example.com
   - Click inside "Password" and type: AcceptSetup12!
   - Click inside "Confirm password" and type: AcceptSetup12!
   - Click the wide "Create account" button.
   The page should say "Choose your training goal", with "Sam Second" under "Profile preview".
7. Click the address bar at the very top of the browser window, type or paste https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/setup and press Enter. Wait about a second. This second account should have nothing chosen: none of "Beginner", "Intermediate" or "Advanced" says "Selected" (they all say "Select"), no equipment button has an orange outline, the "Plan impact" box says "Pick your experience and at least one equipment option to see how your plan will be built." and the "Save setup" button in the top-right corner looks faded. Nothing from Sam Saved's account should show.

## Acceptance Test 4: You must be logged in to enter your setup

**Setup for this test:** (no account is needed for this test)
1. Connect to the UB VPN, or use the campus network.
2. If you're logged in, log out. Click the round orange circle with your initials in the top-right corner of the page, then click the red "Log out" in the little menu that opens under it. The login page should open. If you were not logged in, open a web browser, click the address bar at the very top of the browser window, type or paste https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login and press Enter; the login page should show.

**Steps:**
1. Click the address bar at the very top of the browser window, type or paste https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/setup and press Enter.
2. Wait about a second. The login page should open instead of the setup page. You should see the card titled "Log in to GymRank" on the right side of the screen, and you should not see "Tell us about your training setup" anywhere.

## Acceptance Test 5: Changing your experience keeps your equipment, and changing your equipment keeps your experience

**Setup for this test:** (this account does not exist yet; you create it here, and it is separate from the account in the other tests)
1. Connect to the UB VPN, or use the campus network.
2. If you're logged in, log out. Click the round orange circle with your initials in the top-right corner of the page, then click the red "Log out" in the little menu that opens under it.
3. Open a web browser (Chrome is fine). Click the address bar at the very top of the browser window, type or paste https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login and press Enter. You should see a dark screen split into two halves, with "Every rep gets a rank." on the left and a card titled "Log in to GymRank" on the right.
4. Create the test account. At the bottom of the "Log in to GymRank" card, click the orange words "Create an account" (next to "New to GymRank?"). The card should change to "Create your account" with four boxes. Fill them in like this:
   - Click inside the "Full name" box (the first box) and type: Sam Change
   - Click inside the "Email" box (the second box) and type: setup-e-0930@example.com
   - Click inside the "Password" box (the third box) and type: AcceptSetup12!
   - Click inside the "Confirm password" box (the fourth box) and type: AcceptSetup12!
   - Click the wide "Create account" button under the boxes.
5. The page should now say "Choose your training goal" in large white letters at the top-left, and a bar of three steps ("Training goal", "Experience", "Choose plan") should sit above it, with "Training goal" lit up in orange. Under "Profile preview" you should see an orange circle with "SC", the name "Sam Change" and "No goal yet".
6. Click the first box in the row of three boxes, the one called "Strength". It should say "Selected". Then click the orange "Save goal" button in the top-right corner of the page, level with the big title. The page should change to "Tell us about your training setup".

**Steps:**
1. The "Tell us about your training setup" page is open and nothing is chosen yet. Click anywhere inside the "Beginner" box so it says "Selected". Click the "Dumbbells" button and the "Kettlebells" button so both are outlined in orange. The "Plan impact" box should say "Beginner programming using dumbbells and kettlebells." Click the bright orange "Save setup" button in the top-right corner. The login page should open with a green box that says "Account setup saved. Log in to continue."
2. Click inside the "Password" box (the "Email" box should already say setup-e-0930@example.com) and type AcceptSetup12!. Click the wide dark-grey "Log in" button. When the Dashboard opens, click the address bar at the very top of the browser window, type or paste https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/setup and press Enter. Wait about a second. "Beginner" should say "Selected", only "Dumbbells" and "Kettlebells" should be outlined in orange, and the "Plan impact" box should say "Beginner programming using dumbbells and kettlebells."
3. Click anywhere inside the "Advanced" box, and do not click any equipment button. "Advanced" should say "Selected", "Dumbbells" and "Kettlebells" should still be outlined, and the "Plan impact" box should say "Advanced programming using dumbbells and kettlebells." Click the bright orange "Save setup" button. When the login page opens, click inside the "Password" box, type AcceptSetup12! and click "Log in". When the Dashboard opens, click the address bar at the very top of the browser window, type or paste https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/setup and press Enter. Wait about a second. "Advanced" should say "Selected", and "Dumbbells" and "Kettlebells" should still be the only equipment buttons outlined in orange.
4. Click the "Dumbbells" button once to turn its outline off, then click the "Barbell" button once to turn its outline on. Do not click any of the three experience boxes. The "Plan impact" box should say "Advanced programming using barbell and kettlebells." Click the bright orange "Save setup" button. When the login page opens, click inside the "Password" box, type AcceptSetup12! and click "Log in". When the Dashboard opens, click the address bar at the very top of the browser window, type or paste https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/setup and press Enter. Wait about a second. "Advanced" should still say "Selected", and only "Barbell" and "Kettlebells" should be outlined in orange.
5. Click anywhere inside the "Beginner" box. Then click "Barbell" and "Kettlebells" once each to turn both outlines off. No equipment button should be outlined and the "Save setup" button should look faded. Do not click "Save setup". Press the reload button of your browser (the circular arrow at the top-left of the browser window) and wait about a second. The page should show your saved choices from step 4 again: "Advanced" says "Selected" and only "Barbell" and "Kettlebells" are outlined in orange, because the changes you made in this step were never saved.
