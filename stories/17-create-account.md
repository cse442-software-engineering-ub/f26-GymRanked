# Story 17: As a new user, I want to be able to create a new account to save my gym progress, which is confirmed by a create an account button

- **Tasks:** #65 (registration page), #68 (account creation backend), #74 (Playwright checks)
- **Automated in:** `tests/e2e/17-create-account.spec.js`

## Acceptance Test 1: Create an account and start onboarding

**Setup for this test:**
1. Connect to the UB VPN, or use the campus network.
2. If you're logged in, log out from the account menu.

**Steps:**
1. Open https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login. The page should show:
   - a dark screen split into two halves
   - on the left, "Every rep gets a" in large white words with the orange word "rank." under it
   - on the right, a card titled "Log in to GymRank"
2. Click the orange "Create an account" link at the bottom of the card ("New to GymRank? Create an account"). The page should show:
   - the title "Create your account", with "Let's set up your training profile." under it
   - four boxes, in this order: "Full name", "Email", "Password" and "Confirm password"
   - under the Password box, "Password strength: Not entered" with a small bar, and "Use 12+ characters with letters, numbers & symbols."
   - a wide "Create account" button
   - under it, "Already have an account? Log in"
3. Type "Jamie Lee" in "Full name" and "jamie-a-1001@example.com" in "Email".
4. Type "Lift!ng2Gether99" in "Password". The line under it should change to "Password strength: Strong".
5. Type "Lift!ng2Gether99" in "Confirm password", then click "Create account". The first onboarding step should open: "Choose your training goal", with "Training goal" as the current step in the progress bar, followed by "Experience" and "Choose plan". The "Profile preview" should show "JL", "Jamie Lee" and "No goal yet".

## Acceptance Test 2: Your new account is really saved

**Setup for this test:**
1. Complete Acceptance Test 1 first. You should be on "Choose your training goal" as Jamie Lee.

**Steps:**
1. Click the "GymRank" logo in the top-left corner. The Dashboard should open.
2. Open the account menu and click "Log out". The "Log in to GymRank" card should show.
3. Type "jamie-a-1001@example.com" in "Email" and "Lift!ng2Gether99" in "Password", then click "Log in". The Dashboard should open with "Let's move weight, Jamie." near the top-left, and no "Invalid email or password." message should appear.

## Acceptance Test 3: Empty and incomplete boxes are refused

**Setup for this test:**
1. Connect to the UB VPN, or use the campus network. If you're logged in, log out from the account menu.

**Steps:**
1. Open https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login and click "Create an account". "Create your account" should show.
2. Leave every box empty and click "Create account". You should stay on "Create your account", with red writing under three boxes and a red outline around each of them:
   - under "Full name": "Enter your full name."
   - under "Email": "Enter a valid email address."
   - under "Password": "Use 12+ characters with letters, numbers & symbols."
3. Type "Jamie Lee" in "Full name". The red writing under "Full name" should disappear straight away; the other two messages should stay.
4. Type "jamie.test3" (no @ sign, on purpose) in "Email", "short1" in "Password" and "different1!" in "Confirm password". The line under Password should say "Password strength: Weak" or "Password strength: Moderate", not "Strong".
5. Click "Create account". You should stay on "Create your account", with:
   - "Enter a valid email address." under "Email"
   - "Use 12+ characters with letters, numbers & symbols." under "Password"
   - "Passwords must match." under "Confirm password"
6. "Choose your training goal" should never open, and no account should be created.

## Acceptance Test 4: An email that already has an account is refused

**Setup for this test:**
1. Complete Acceptance Test 1 first, so jamie-a-1001@example.com is already registered. Log out from the account menu on the Dashboard.

**Steps:**
1. Open https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login and click "Create an account".
2. Type "Jamie Lee" in "Full name", "jamie-a-1001@example.com" in "Email", and "Lift!ng2Gether99" in both "Password" and "Confirm password".
3. Click "Create account". You should stay on "Create your account", with:
   - a red message near the top of the card: "This email is already registered."
   - red writing under "Email": "This email is already registered. Log in instead."
4. Click the orange "Log in" link at the bottom of the card. The "Log in to GymRank" card should show.

## Acceptance Test 5: Leaving the sign-up page without an account

**Setup for this test:**
1. Connect to the UB VPN, or use the campus network. If you're logged in, log out from the account menu.

**Steps:**
1. Open https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login and click "Create an account". "Create your account" should show.
2. On a computer: click the orange "Log in" link at the bottom of the card ("Already have an account? Log in"). The "Log in to GymRank" card should show again, and no account should have been created. (There is no "×" on this page on a computer screen.)
3. On a phone, or in a browser window 850 pixels wide or narrower: repeat step 1, then tap the small "×" in the top-right corner instead. The "Log in to GymRank" card should show again, and no account should have been created.

## Notes

Copied from card #17 on 2026-10-01, word for word, after the card was rewritten for the registration-to-goal-setup
flow ("Create account" now opens "Choose your training goal"). Only the headings changed ("Acceptance Test 1: Create
an account and start onboarding" is a `##` heading) so the Playwright runner can find them.

Test 5 was changed on 2026-10-01: the "×" only appears at 850px wide or
narrower, by design, so on a computer the test leaves through the "Log in" link instead. The page itself didn't change.

The automated version creates a new `e2e-…@example.com` account each run instead of jamie-a-1001@example.com, so it
can be repeated. It runs on a local copy of the site instead of cattle, so the VPN steps don't apply. Test 5 runs
step 2 on Desktop and step 3 on Phone.
