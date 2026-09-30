# Story 17: As a new user, I want to be able to create a new account to save my gym progress, which is confirmed by a create an account button

- **Tasks:** #65 (registration page), #68 (account creation backend), #74 (Playwright checks)
- **Automated in:** `tests/e2e/17-create-account.spec.js`

## Acceptance Test 1: Creating a new account

Before you start: Open the GymRank website in a web browser by clicking this link: https://aptitude.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login. The first thing you should see is the dark login screen with "Every rep gets a rank." on the left. If you see a different page, add #/login to the end of the address and press Enter.

1. Look at the screen. You should see:
   - a dark screen split into two halves;
   - on the left, large white words "Every rep gets a" with the orange word "rank." underneath;
   - on the right, a card titled "Log in to GymRank".
2. At the very bottom of that card is the line "New to GymRank? Create an account". Press the orange words Create an account.
3. Look at the screen. You should see:
   - the title "Create your account", with "Let's set up your training profile." under it;
   - four boxes, in this order: "Full name", "Email", "Password" and "Confirm password";
   - under the Password box, the words "Password strength: Not entered" with a small bar, and "Use 12+ characters with letters, numbers & symbols.";
   - a wide button that says "Create account";
   - under it, "Already have an account? Log in".
4. Click inside the "Full name" box and type Jamie Lee.
5. Click inside the "Email" box and type jamie.test1@example.com.
6. Click inside the "Password" box and type Lift!ng2Gether99.
7. Look at the screen. You should see the words under the Password box change to "Password strength: Strong".
8. Click inside the "Confirm password" box and type Lift!ng2Gether99 again.
9. Press the wide Create account button.
10. Look at the screen. You should see the Dashboard, with "Let's move weight, Jamie." near the top-left.

Test passes if: Every screen, box, button and word above appears as written, and pressing "Create account" with the details above takes you to the Dashboard greeting you by your first name.

Test fails if: Any of these happen:
- the "Create an account" link does nothing;
- any of the four boxes is missing;
- "Password strength" does not change as you type;
- pressing "Create account" shows an error or stays on the same page;
- the Dashboard does not show your first name.

## Acceptance Test 2: Your new account is really saved

Before you start: Do Test 1 first, so Jamie's account exists. Open the GymRank login screen in a browser.

1. On the Dashboard, press the Log out button (or the "Log out" choice in the profile menu).
2. Look at the screen. You should see the "Log in to GymRank" card again.
3. Click inside the "Email" box and type jamie.test1@example.com.
4. Click inside the "Password" box and type Lift!ng2Gether99.
5. Press the wide dark-grey Log in button.
6. Look at the screen. You should see the Dashboard, with "Let's move weight, Jamie."

Test passes if: The account you created can be used to log in again after logging out.

Test fails if: Any error message such as "Invalid email or password." appears for the details you just registered.

## Acceptance Test 3: Empty and incomplete boxes are refused

Before you start: Open the GymRank login screen by clicking this link: https://aptitude.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login.

1. Press the orange words Create an account. You should see "Create your account".
2. Leave every box empty. Press the wide Create account button.
3. Look at the screen. You should still be on "Create your account". You should see red writing under the boxes:
   - under "Full name": "Enter your full name.";
   - under "Email": "Enter a valid email address.";
   - under "Password": "Use 12+ characters with letters, numbers & symbols.";
   - the boxes with a problem have a red outline.
4. Click inside "Full name" and type Jamie Lee.
5. Look at the screen. The red writing under "Full name" should disappear straight away; the others stay.
6. Click inside "Email" and type jamie.test3 (with no @ sign, on purpose).
7. Click inside "Password" and type short1.
8. Click inside "Confirm password" and type different1!.
9. Press Create account.
10. Look at the screen. You should still be on "Create your account", with:
    - "Enter a valid email address." under "Email";
    - "Use 12+ characters with letters, numbers & symbols." under "Password";
    - "Passwords must match." under "Confirm password".
11. Look at the words under the Password box. They should say "Password strength: Weak" or "Password strength: Moderate", not "Strong".

Test passes if: Nothing is saved, you never reach the Dashboard, and each problem box shows the exact red message above.

Test fails if: Any of these happen:
- the app accepts empty or incomplete boxes and moves to the Dashboard;
- a message is missing or worded differently;
- a red message stays after you fix that box.

## Acceptance Test 4: An email that already has an account is refused

Before you start: Do Test 1 first, so jamie.test1@example.com is already registered. Open the GymRank login screen by clicking this link: https://aptitude.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login.

1. Press Create an account.
2. Type Jamie Lee in "Full name", jamie.test1@example.com in "Email", and Lift!ng2Gether99 in both "Password" and "Confirm password".
3. Press the wide Create account button.
4. Look at the screen. You should still be on "Create your account". You should see:
   - a red message near the top of the card saying "This email is already registered.";
   - red writing under the Email box saying "This email is already registered. Log in instead.".
5. At the bottom of the card, press the orange word Log in.
6. Look at the screen. You should see the "Log in to GymRank" card.

Test passes if: No second account is created, both red messages appear, and the "Log in" link returns you to the login screen.

Test fails if: The app lets you register the same email a second time, or shows no message.

## Acceptance Test 5: Leaving the sign-up page without an account

Before you start: Open the GymRank login screen by clicking this link: https://aptitude.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login.

1. Press Create an account.
2. In the top-right corner is a small "×". Press it.
3. Look at the screen. You should see the "Log in to GymRank" card again, and no account has been created.

Test passes if: The "×" returns you to the login screen.

Test fails if: The "×" does nothing or shows a blank page.

## Notes

Copied from card #17 on 2026-09-29, word for word. Only the headings changed ("Test 1 — Creating a new account"
became "Acceptance Test 1: Creating a new account") so the Playwright runner can find them, and the steps are
numbered 1, 2, 3 instead of repeating "1.".

The automated version creates a new `e2e-…@example.com` account each run instead of jamie.test1@example.com, so
it can be repeated. As of dev at 719d940 (PR #22), Tests 1 and 2 fail: "Create account" now logs you in and opens
the training goal page ("Choose your training goal") instead of the Dashboard.
