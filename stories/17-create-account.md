# Story 17: As a new user, I want to be able to create a new account to save my gym progress, which is confirmed by a create an account button

- **Tasks:** #65 (registration page), #68 (account creation backend), #74 (Playwright checks)
- **Automated in:** `tests/e2e/17-create-account.spec.js`

## Acceptance Test 1: Create an account and start setting up

**Setup for this test:**
1. Connect to the UB VPN, or use the campus network.
2. If you're logged in, log out with "Log out" at the bottom of the menu.

**Steps:**
1. Open https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login. The page should show:
   - a dark screen split into two halves
   - on the left, "Every rep gets a" in large white words with the orange word "rank." under it
   - on the right, the title "Log in to GymRank"
2. Click the orange "Create an account" link under the "Log in" button ("New to GymRank? Create an account"). The log in form should slide away to the left as the new form slides in from the right, and the page should show:
   - the title "Create your account", with "Let's set up your training profile." under it
   - four boxes, in this order: "Full name", "Email", "Password" and "Confirm password"
   - under the Password box, "Password strength: Not entered" with a small bar, and "Use 12+ characters with letters, numbers & symbols."
   - a wide orange "Create account" button
   - under it, "Already have an account? Log in"
3. Type "Jamie Lee" in "Full name" and "jamie-a-1001@example.com" in "Email".
4. Type "Lift!ng2Gether99" in "Password". The line under it should change to "Password strength: Strong".
5. Type "Lift!ng2Gether99" in "Confirm password", then click "Create account". The button should change to "Creating account…", the form should fade, and GymRank should slide in from the right with the first setup step, "Personal details", and a progress bar showing "Personal details" (the current step), "Training goal", "Experience", "Equipment" and "Choose plan". No "Log in to GymRank" screen should appear in between.

## Acceptance Test 2: Your new account is really saved

**Setup for this test:**
1. Complete Acceptance Test 1 first. You should be on "Personal details".

**Steps:**
1. Click "Log out" in the top-right corner. "Log in to GymRank" should show with "You are logged out."
2. Type "jamie-a-1001@example.com" in "Email" and "Lift!ng2Gether99" in "Password", then click "Log in". No "Invalid email or password." message should appear, and "Personal details" should open again, with "Personal details" as the current step.
3. Type "180" in "Body weight (lb)", click "Man", then click "Save and continue". "Choose your training goal" should open, with "Training goal" now the current step.
4. Look at the "Profile preview" on the same page. It should show "JL", "Jamie Lee" and "No goal yet".

## Acceptance Test 3: Empty and incomplete boxes are refused

**Setup for this test:**
1. Connect to the UB VPN, or use the campus network. If you're logged in, log out with "Log out" at the bottom of the menu.

**Steps:**
1. Open https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login and click "Create an account". "Create your account" should show.
2. Leave every box empty and click "Create account". You should stay on "Create your account", with red writing under all four boxes and a red outline around each of them:
   - under "Full name": "Enter your full name."
   - under "Email": "Enter a valid email address."
   - under "Password": "Use 12+ characters with letters, numbers & symbols."
   - under "Confirm password": "Passwords must match."
3. Type "Jamie Lee" in "Full name". The red writing under "Full name" should disappear straight away; the other three messages should stay.
4. Type "jamie.test3" (no @ sign, on purpose) in "Email", "short1" in "Password" and "different1!" in "Confirm password". The line under Password should say "Password strength: Weak" or "Password strength: Moderate", not "Strong".
5. Click "Create account". You should stay on "Create your account", with:
   - "Enter a valid email address." under "Email"
   - "Use 12+ characters with letters, numbers & symbols." under "Password"
   - "Passwords must match." under "Confirm password"
6. "Choose your training goal" should never open, and no account should be created.

## Acceptance Test 4: An email that already has an account is refused

**Setup for this test:**
1. Complete Acceptance Test 1 first, so jamie-a-1001@example.com is already registered. If you're logged in (for example after Acceptance Test 1 or 2), click "Log out" in the top-right corner.

**Steps:**
1. Open https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login and click "Create an account".
2. Type "Jamie Lee" in "Full name", "jamie-a-1001@example.com" in "Email", and "Lift!ng2Gether99" in both "Password" and "Confirm password".
3. Click "Create account". You should stay on "Create your account", with:
   - a red message near the top of the card: "This email is already registered."
   - red writing under "Email": "This email is already registered. Log in instead."
4. Click the orange "Log in" link at the bottom of the card. The "Log in to GymRank" card should show.

## Acceptance Test 5: Leaving the sign-up page without an account

**Setup for this test:**
1. Connect to the UB VPN, or use the campus network. If you're logged in, log out with "Log out" at the bottom of the menu.

**Steps:**
1. Open https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login and click "Create an account". "Create your account" should show.
2. Click the orange "Log in" link under the "Create account" button ("Already have an account? Log in"). "Log in to GymRank" should show again, and no account should have been created.
3. On a phone, or in a browser window 900 pixels wide or narrower: repeat steps 1 and 2. The result should be the same, and the "Log in to GymRank" title should be in the same place as before step 1 (the screen doesn't jump up or down). There is no "×" on the page.

## Notes

Updated on 2026-11-19 (entry screens redesign, upgrade task under story #17): log in and create account now share one split screen, and the form slides between them. A new account is logged in straight away and slides into the first setup step, so Test 1 ends on "Personal details" (it used to end on the login card with "Account created. Log in to continue.") and Test 2 logs out and back in to show the account was saved. The buttons are orange, and the "×" in the phone layout is gone (Test 5 leaves through "Log in" on every screen size).

Updated on 2026-11-18 (card #133): logging in with a new account now opens "Personal details" first (required since 2026-10-27), so Test 2 saves 180 lb and "Man" before "Choose your training goal". Logging out is at the bottom of the menu.

Tests 1, 2 and 4 were changed on 2026-10-12 (Test 1 was "Create an account and start onboarding") to follow the
sign-up flow from PR #45 (card #99): "Create account" now opens the login page with "Account created. Log in to
continue." and the email filled in, and logging in opens "Choose your training goal" (four steps since card #94). Test
2 used to open the Dashboard from the logo; an account without a goal is now sent back to "Choose your training goal",
so it logs out with the onboarding "Log out" instead.

Test 2 step 3 was changed on 2026-10-06: the Dashboard redesign (commit 5718a5e, merged in PR #36) greets a new
account with "Welcome, Jamie" instead of "Let's move weight, Jamie.". Nothing else in the story changed.

Copied from card #17 on 2026-10-01, word for word, after the card was rewritten for the registration-to-goal-setup
flow ("Create account" now opens "Choose your training goal"). Only the headings changed ("Acceptance Test 1: Create
an account and start onboarding" is a `##` heading) so the Playwright runner can find them.

Test 5 was changed on 2026-10-01: the "×" only appears at 850px wide or
narrower, by design, so on a computer the test leaves through the "Log in" link instead. The page itself didn't change.

Test 3 was changed on 2026-10-02 after PR #32 (card #65): an empty "Confirm password" box now also shows
"Passwords must match.", so step 2 lists four messages and step 3 says the other three stay.

The automated version creates a new `e2e-…@example.com` account each run instead of jamie-a-1001@example.com, so it
can be repeated. It runs on a local copy of the site instead of cattle, so the VPN steps don't apply. Test 5 runs
step 2 on Desktop and step 3 on Phone.
