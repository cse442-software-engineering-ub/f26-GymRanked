# Story 18: As an existing user, I want to be able to log into my account using my email and password, which is confirmed by the user login button

- **Tasks:** #66 (login page), #69 (login backend), #75 (Playwright checks)
- **Automated in:** `tests/e2e/18-log-in.spec.js`

Test account used below (from the seeded test users): name "Marcus Malone", email marcus.malone@example.com, password Marcus-Bench225!. Before you start, the seed in database/seeds/README.md must be loaded into the database you are testing. It also gives Marcus a finished account setup (Strength, Beginner, Full gym access) and no workout plan, so logging in opens the Dashboard rather than "Choose your training goal".

## Acceptance Test 1: Logging in with the right email and password

Before you start: Connect to the UB VPN, or use the campus network. If you are logged in, log out. Open the GymRank login screen by clicking this link: https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login. The first thing you should see is the dark login screen with "Every rep gets a rank." on the left.

1. Look at the screen. You should see, on the right, a card with:
   - the title "Log in to GymRank", with "Welcome back. Your division is waiting." under it;
   - a box labelled "Email" and a box labelled "Password";
   - a tick box "Keep me logged in" and the words "Forgot password?" on the same line;
   - a wide dark-grey button that says "Log in";
   - under it, "OR", then two buttons "Continue with Google" and "Continue with Apple";
   - at the bottom, "New to GymRank? Create an account".
2. Click inside the "Email" box and type marcus.malone@example.com.
3. Click inside the "Password" box and type Marcus-Bench225!. The letters should show as dots.
4. Press the wide dark-grey Log in button.
5. Look at the screen. You should see the Dashboard, with "Welcome, Marcus" near the top-left, and across the very top the words "Dashboard", "Workouts", "Plans", "Progress", "Leaderboard" and "Today". On a phone, tap the menu button (three lines) in the top-left corner to see these words.

Test passes if: Every box and button above appears as written, and Log in takes you to the Dashboard greeting you by your first name.

Test fails if: Any of these happen:
- the login screen is missing its boxes or the Log in button;
- the password shows as plain letters;
- Log in with correct details shows an error or does nothing;
- "Choose your training goal" opens instead of the Dashboard;
- the Dashboard shows someone else's name.

## Acceptance Test 2: Empty boxes are refused

Before you start: Open the GymRank login screen and click the link: https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login. Leave both boxes empty.

1. Press the wide dark-grey Log in button.
2. Look at the screen. You should still be on the login screen. You should see:
   - "Enter a valid email address." in red under the Email box;
   - "Enter your password." in red under the Password box;
   - both boxes outlined in red.
3. Click inside the "Email" box and type marcus.malone@example.com.
4. Look at the screen. The red writing under "Email" should disappear straight away.

Test passes if: You stay on the login screen and both exact red messages appear.

Test fails if: You reach the Dashboard, or a message is missing or worded differently.

## Acceptance Test 3: A wrong password is rejected

Before you start: Open the GymRank login screen and click the link: https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login.

1. Type marcus.malone@example.com in the "Email" box and wrongpassword123 in the "Password" box.
2. Press the wide dark-grey Log in button once.
3. Watch whether the whole screen flashes white and reloads like a new website. It should not.
4. Look at the screen. You should still be on the login screen, with red writing above the "Email" box that says exactly "Invalid email or password."
5. Check that the Dashboard did not appear.

Test passes if: The red message appears and you stay on the login screen.

Test fails if: You reach the Dashboard, or no message appears.

## Acceptance Test 4: An email with no account is rejected

Before you start: Open the GymRank login screen and click the link: https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login.

1. Type nobody.here@example.com in the "Email" box and Marcus-Bench225! in the "Password" box.
2. Press the wide dark-grey Log in button once.
3. Look at the screen. You should see the same red writing above the "Email" box: "Invalid email or password." (the app does not reveal whether the email exists), and you should still be on the login screen.

Test passes if: The exact red message appears and you stay on the login screen.

Test fails if: You reach the Dashboard, or the message says something different that tells you the email does not exist.

## Acceptance Test 5: Staying logged in and logging out

Before you start: Use a computer for this test. Open the GymRank login screen by clicking the link: https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login and log in as in Test 1, so you are on the Dashboard.

1. Open the profile menu in the top-right corner (the orange circle showing "MM") and press "Log out" in the drop-down menu.
2. Look at the screen. You should see the "Log in to GymRank" card again, with a red box above the "Email" box that says "You are logged out."
3. Click your browser's Back button once.
4. Look at the screen. You should not see the Dashboard: the browser goes back to the page you were on before you opened the login link (for example the scrum board).
5. Click your browser's Forward button once. You should see the "Log in to GymRank" card again, not the Dashboard.
6. Type marcus.malone@example.com in the "Email" box and Marcus-Bench225! in the "Password" box, then tick the box "Keep me logged in".
7. Press the wide dark-grey Log in button.
8. Look at the screen. You should see the Dashboard.
9. Close the browser tab, then open https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login again in a new tab.
10. Look at the screen. You should see the Dashboard, not the login screen, because you asked to stay logged in.

Test passes if: Log out returns you to the login screen and blocks the Dashboard, and "Keep me logged in" keeps you signed in after reopening the site.

Test fails if: Any of these happen:
- Log out does nothing;
- the Back or Forward button shows the Dashboard after logging out;
- you are asked to log in again after reopening the site with "Keep me logged in" ticked.

## Acceptance Test 6: The "not available yet" buttons

Before you start: Open the GymRank login screen by clicking the link: https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login.

1. Press the words "Forgot password?".
2. Look at the screen. You should see a message near the top of the card saying "Password recovery is not available yet. Please contact the GymRank team."
3. Press the "Continue with Google" button.
4. Look at the screen. You should see "Google sign-in is not available yet. Please use your email and password."
5. Press the "Continue with Apple" button.
6. Look at the screen. You should see "Apple sign-in is not available yet. Please use your email and password."
7. Check that you are still on the login screen each time.

Test passes if: Each button shows its message and none of them logs you in or leaves the page.

Test fails if: A button logs you in, shows a blank page, or shows no message.

Login allows 10 attempts per email every 15 minutes. If you re-run Story #18 several times in a row on marcus.malone@example.com, you may see "Too many attempts". The seeds README shows how to clear it.

## Notes

Updated on 2026-10-12 from card #18 as Eric edited it on 2026-10-09 (cattle links, "Continue with Google" and
"Continue with Apple", the profile menu's "MM" circle), plus these fixes:
- Since PR #45 (card #99), an account without a training goal and setup is sent to "Choose your training goal"
  instead of the Dashboard. The seed in `database/seeds/test_users.sql` now gives the test accounts a finished setup
  and no plan, so Marcus reaches the Dashboard. Reload the seed on any database used for these tests.
- Test 1 step 5: the Dashboard greets "Welcome, Marcus" (no full stop) since the Dashboard redesign (PR #36); on a
  phone the top words are in the menu.
- Test 5: "log in as in Test 6" now says Test 1, it is for a computer (the profile menu is in the top-right corner
  there), and step 2 gives the exact message "You are logged out.". Logging in and out replace the page in the
  browser's history, so Back after logging out leaves GymRank (to the page before the login link) instead of
  showing the login screen; new step 5 presses Forward and checks the login screen, not the Dashboard, comes back.

Copied from card #18 on 2026-09-29, word for word. Only the headings changed ("Test 1 — Logging in with the right
email and password" became "Acceptance Test 1: Logging in with the right email and password") so the Playwright
runner can find them, and the steps are numbered 1, 2, 3 instead of repeating "1.".

The automated version creates a new "Marcus Malone" account with its own `e2e-…@example.com` address and the
card's password each run, and gives it the same setup as the seed (Strength, Beginner, Full gym access, no plan),
instead of using the seeded marcus.malone@example.com, so it works on any database and can be repeated without
hitting the 10-attempt limit. It runs on a local copy of the site instead of cattle, so the VPN step doesn't apply.
