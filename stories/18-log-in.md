# Story 18: As an existing user, I want to be able to log into my account using my email and password, which is confirmed by the user login button

- **Tasks:** #66 (login page), #69 (login backend), #75 (Playwright checks)
- **Automated in:** `tests/e2e/18-log-in.spec.js`

Test account used below (from the seeded test users): name "Marcus Malone", email marcus.malone@example.com, password Marcus-Bench225!. Before you start, the seed in database/seeds/README.md must be loaded into the database you are testing.

## Acceptance Test 1: Logging in with the right email and password

Before you start: If you are logged in, log out. Open the GymRank login screen by clicking this link: http://localhost:5173/CSE442/2026-Fall/cse-442y/#/login. The first thing you should see is the dark login screen with "Every rep gets a rank." on the left.

1. Look at the screen. You should see, on the right, a card with:
   - the title "Log in to GymRank", with "Welcome back. Your division is waiting." under it;
   - a box labelled "Email" and a box labelled "Password";
   - a tick box "Keep me logged in" and the words "Forgot password?" on the same line;
   - a wide dark-grey button that says "Log in";
   - under it, "OR", then two buttons "Google" and "Apple";
   - at the bottom, "New to GymRank? Create an account".
2. Click inside the "Email" box and type marcus.malone@example.com.
3. Click inside the "Password" box and type Marcus-Bench225!. The letters should show as dots.
4. Press the wide dark-grey Log in button.
5. Look at the screen. You should see the Dashboard, with "Let's move weight, Marcus." near the top-left, and across the very top the words "Dashboard", "Workouts", "Plans", "Progress", "Leaderboard" and "Today".

Test passes if: Every box and button above appears as written, and Log in takes you to the Dashboard greeting you by your first name.

Test fails if: Any of these happen:
- the login screen is missing its boxes or the Log in button;
- the password shows as plain letters;
- Log in with correct details shows an error or does nothing;
- the Dashboard shows someone else's name.

## Acceptance Test 2: Empty boxes are refused

Before you start: Open the GymRank login screen and click the link: http://localhost:5173/CSE442/2026-Fall/cse-442y/#/login. Leave both boxes empty.

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

Before you start: Open the GymRank login screen and click the link: http://localhost:5173/CSE442/2026-Fall/cse-442y/#/login.

1. Type marcus.malone@example.com in the "Email" box and wrongpassword123 in the "Password" box.
2. Press the wide dark-grey Log in button once.
3. Watch whether the whole screen flashes white and reloads like a new website. It should not.
4. Look at the screen. You should still be on the login screen, with red writing above the "Email" box that says exactly "Invalid email or password."
5. Check that the Dashboard did not appear.

Test passes if: The red message appears and you stay on the login screen.

Test fails if: You reach the Dashboard, or no message appears.

## Acceptance Test 4: An email with no account is rejected

Before you start: Open the GymRank login screen and click the link: http://localhost:5173/CSE442/2026-Fall/cse-442y/#/login.

1. Type nobody.here@example.com in the "Email" box and Marcus-Bench225! in the "Password" box.
2. Press the wide dark-grey Log in button once.
3. Look at the screen. You should see the same red writing above the "Email" box: "Invalid email or password." (the app does not reveal whether the email exists), and you should still be on the login screen.

Test passes if: The exact red message appears and you stay on the login screen.

Test fails if: You reach the Dashboard, or the message says something different that tells you the email does not exist.

## Acceptance Test 5: Staying logged in and logging out

Before you start: Open the GymRank login screen and click the link: http://localhost:5173/CSE442/2026-Fall/cse-442y/#/login and log in as in Test 6, so you are on the Dashboard.

1. Press the Log out button (or open the profile menu in the top-right corner and press "Log out").
2. Look at the screen. You should see the "Log in to GymRank" card again.
3. Click your browser's Back button once.
4. Look at the screen. You should not be able to see the Dashboard; you should be taken back to the login screen.
5. Type marcus.malone@example.com in the "Email" box and Marcus-Bench225! in the "Password" box, then tick the box "Keep me logged in".
6. Press the wide dark-grey Log in button.
7. Look at the screen. You should see the Dashboard.
8. Close the browser tab, then open the GymRank website again.
9. Look at the screen. You should see the Dashboard, not the login screen, because you asked to stay logged in.

Test passes if: Log out returns you to the login screen and blocks the Dashboard, and "Keep me logged in" keeps you signed in after reopening the site.

Test fails if: Any of these happen:
- Log out does nothing;
- the Back button shows the Dashboard after logging out;
- you are asked to log in again after reopening the site with "Keep me logged in" ticked.

## Acceptance Test 6: The "not available yet" buttons

Before you start: Open the GymRank login screen click the link: http://localhost:5173/CSE442/2026-Fall/cse-442y/#/login.

1. Press the words Forgot password?
2. Look at the screen. You should see a message near the top of the card saying "Password recovery is not available yet. Please contact the GymRank team."
3. Press the Google button.
4. Look at the screen. You should see "Google sign-in is not available yet. Please use your email and password."
5. Press the Apple button.
6. Look at the screen. You should see "Apple sign-in is not available yet. Please use your email and password."
7. Check that you are still on the login screen each time.

Test passes if: Each button shows its message and none of them logs you in or leaves the page.

Test fails if: A button logs you in, shows a blank page, or shows no message.

## Notes

From the card: Login allows 10 attempts per email every 15 minutes. If you re-run Story #18 several times in a row on marcus.malone@example.com, you may see "Too many attempts". The seeds README shows how to clear it.

Copied from card #18 on 2026-09-29, word for word. Only the headings changed ("Test 1 — Logging in with the right
email and password" became "Acceptance Test 1: Logging in with the right email and password") so the Playwright
runner can find them, and the steps are numbered 1, 2, 3 instead of repeating "1.".

The automated version creates a new "Marcus Malone" account with its own `e2e-…@example.com` address and the
card's password each run, instead of the seeded marcus.malone@example.com, so it works on any database and can be
repeated without hitting the 10-attempt limit. Test 5's "as in Test 6" is read as Test 1.
