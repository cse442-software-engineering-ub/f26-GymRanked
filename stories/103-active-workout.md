# Story 103: As a user at the gym, I want to start my workout from my selected plan and work through it one exercise and set at a time, which is confirmed by a set timer, weight and reps boxes, a rest timer, and a tick on each finished exercise.

- **Tasks:** #103 (active workout page)
- **Automated in:** none yet (no Playwright spec exists for this story)

(Note: these tests use today's workout from the plan you select, so the exercise names depend on the day of the week. Push Pull Legs has a rest day on some days, and the start button is hidden on a rest day, so run these on a training day. Wherever a step says "the first exercise", use whatever exercise is listed first on your page. Weights are in pounds. The test saves sets to the database you are testing.)

Test account used below (from the seeded test users): name "Marcus Malone", email marcus.malone@example.com, password Marcus-Bench225!. Before you start, the seed in database/seeds/README.md must be loaded into the database you are testing, and the migration database/migrations/009_workout_sessions.sql must have been applied to it.

## Acceptance Test 1: Start a workout, then start, finish and log a set, then rest

Before you start: Connect to the UB VPN, or use the campus network. If you are logged in, log out. Open https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login, type marcus.malone@example.com and Marcus-Bench225!, and press "Log in". The Dashboard should open. Click "Plans", press "Select" on the "Push Pull Legs" card, then click "Workouts" in the top bar. You should see this week's plan with a "Today's workout" card.

1. In the "Today's workout" card, press "Start today's workout". You should land on a page with "ACTIVE WORKOUT" above today's workout name, a photo band at the top, and three cards at the bottom of that band reading "Sets logged" (0), "Volume" (0 lb) and "Exercises" (0 of 3).
2. Look at the exercise cards. You should see one card for each exercise, each with its muscles written out, a body figure, "Not started", and a "Begin exercise" button.
3. Press "Begin exercise" on the first exercise. You should open a page headed with that exercise's name, with "EXERCISE 1 OF 3" above it and "Set 1" in a card. The card shows a clock reading "00:00", the word "Ready" and a "Start set" button. You should NOT see "Weight (lb)", "Reps" or "Log set" yet.
4. Press "Start set". Wait about 3 seconds. The clock should count up (00:01, 00:02, 00:03) and say "Set in progress", and "Pause" and "Finish set" buttons should appear. You should still not see "Log set".
5. Press "Pause". Wait 3 seconds. The clock should stop and say "Paused", with "Resume" and "Finish set" buttons. Press "Resume" and check that the clock counts again.
6. Press "Finish set". The clock should stop and say "Set finished". A "Weight (lb)" box, a "Reps" box and a "Log set" button should appear.
7. Without typing anything, press "Log set". You should see "Enter a weight (0 for bodyweight)." under the weight box and "Enter your reps." under the reps box, and the set should not be saved.
8. Type 100 in "Weight (lb)" and 8 in "Reps", then press "Log set". You should see a "Rest" card with a countdown starting near 01:30, a progress bar, and "−15s", "+15s" and "Skip rest" buttons. Under it, a "Saved sets" list should show "Set 1" with "100 lb × 8", and the top of the card should say "1 set saved".
9. Press "+15s". The countdown should jump up by about 15 seconds. Press "Skip rest". The rest card should disappear and the page should show "Set 2" with the clock back at "00:00" and "Start set".

Test passes if: The set could not be finished into a log without starting it first, the timer counted, paused and resumed, an empty weight and reps were refused with the messages above, the set saved as "100 lb × 8", the rest timer appeared and could be adjusted and skipped, and the next set started fresh as "Set 2".
Test fails if: Any of these happen:

* "Weight (lb)", "Reps" or "Log set" are visible before "Finish set" is pressed;
* the clock does not count, does not stop on "Pause", or does not restart on "Resume";
* an empty set is saved, or the saved set shows numbers different from the ones typed;
* no rest timer appears after "Log set", or "+15s" and "Skip rest" do nothing;
* the page reloads or loses the saved set.

## Acceptance Test 2: Finish an exercise, and come back to an unfinished workout

Before you start: Log in and select the "Push Pull Legs" plan as in Test 1. Open the "Workouts" page, press "Start today's workout", press "Begin exercise" on the first exercise, and log one set of 100 lb × 8 by following Test 1 steps 3 to 8. When the rest timer appears, press "Skip rest". You should be on "Set 2" of the first exercise.

1. Look at the bottom of the page. You should see a "‹ Return to workout" button and a "Finish exercise" button, and you should NOT see a "Next exercise" button.
2. Press "Start set", wait 3 seconds, then press "Finish set". Type 105 in "Weight (lb)" and 6 in "Reps", but do NOT press "Log set".
3. Press "‹ Return to workout". You should land on the active workout page. The first exercise's card should show "1 set" and "Set 1 100 lb × 8" and a "Continue exercise" button, and it should NOT show a tick or the word "Finished".
4. Click "Workouts" in the top bar. The button in the "Today's workout" card should now read "Resume workout" and a line under it should read "1 set logged · 1 of 3 exercises started".
5. Press "Resume workout". You should be back on the active workout page with the same card. Press "Continue exercise" on the first exercise. The page should show "Set 2" with the clock reading "Set finished" at about 3 seconds, and the boxes should still hold 105 and 6.
6. Press "Log set". You should see the rest timer, and "2 sets saved" at the top of the card. Press "Skip rest".
7. Press "Finish exercise". You should land on the active workout page again. The first exercise should now show a green "✓ Finished" badge, its name in the row of buttons at the top should start with a "✓", and the "Exercises" card should read "1 of 3". The "Sets logged" card should read 2 and "Volume" should read 1,430 lb.
8. Reload the browser page. The "✓ Finished" badge, the tick and "1 of 3" should still be there.

Test passes if: Leaving in the middle of a set kept the finished timer and the typed 105 and 6, the exercise only got its tick after "Finish exercise", the weekly plan offered "Resume workout" with the right set count, and the tick and totals were still there after a reload.
Test fails if: Any of these happen:

* the typed weight and reps or the finished timer are gone when you come back to the set;
* the exercise shows a tick before "Finish exercise" is pressed, or loses it after a reload;
* a "Next exercise" button appears on the exercise page;
* the weekly plan still says "Start today's workout" with an unfinished workout open in the same browser;
* the totals do not match the saved sets (2 sets, 1,430 lb).
