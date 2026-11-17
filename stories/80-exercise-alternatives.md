# Story 80: As a lifter whose equipment or experience doesn't fit an exercise in my workout, I want to see other exercises for the same movement that I can do, so that I know what I could do instead, which is confirmed by an "Alternatives to …" list showing each option's difficulty, equipment, muscles and why it fits, or a clear explanation when nothing fits.

- **Tasks:** #82 (exercise alternatives screen, frontend), #81 (exercise alternatives API, Surya), and the Playwright task card
- **Automated in:** none yet (no Playwright spec exists for this story)

(Note: the first version only shows suggestions. It never replaces an exercise in your plan, changes saved sets, or changes workout history. These tests use an unfinished workout that the test data starts for today, so they work on any day of the week, including rest days. Weights are in pounds.)

Test accounts (fake accounts loaded by `database/seeds/exercise_alternatives.sql`; load it again on the day you test, before each full run):

- `Alex Alternatives`, email `alt.alex@example.com`, password `Alt-Alex-82!`: experience **Intermediate**, equipment **Dumbbells** only. Today's unfinished workout has Bench press, Pull-up and Romanian deadlift, with no sets yet. One finished workout two days ago with one Bench press set of 135 lb × 5.
- `Gio Gym`, email `alt.gio@example.com`, password `Alt-Gio-82!`: experience **Advanced**, equipment **Full gym access**. Same unfinished workout as Alex.

"Open the workout" below means: open the [Active workout page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/workout/active). You should see the three exercises Bench press, Pull-up and Romanian deadlift, each with a "Begin exercise" button.

## Acceptance Test 1: See alternatives that fit your equipment and experience

### Setup for this test:

1. Connect to the UB VPN, or use the campus network. On a computer, open the [Login page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login). If you are logged in, log out first.
2. Type `alt.alex@example.com` and `Alt-Alex-82!` and press **Log in**. Confirm that the Dashboard opens.
3. Open the workout and press **Begin exercise** on **Bench press**. Confirm that the page is headed `Bench press` with `EXERCISE 1 OF 3` above it, and that a **See alternatives** button is under the heading.

### Steps:

1. Press **Start set**, wait 3 seconds, press **Finish set**, then type `135` in **Weight (lb)** and `5` in **Reps**. Do NOT press **Log set**.
2. Press **See alternatives**. Confirm that a box opens titled `Alternatives to Bench press`.
3. At the top of the box, confirm the "You're doing" section shows `Bench press`, `Intermediate · Barbell` and `Chest · Shoulders · Triceps`, and the line `Your setup: Intermediate · Dumbbells`.
4. Confirm the line `These work the same pressing movement with equipment you have, at your level or easier. Closest in difficulty first.` and the count `4 alternatives`.
5. Confirm these four options appear in this order, each with the details shown:
   1. `Incline dumbbell press`: `Intermediate`, `Dumbbells`, `Chest · Shoulders · Triceps`, `Same difficulty as Bench press. Uses dumbbells, which you have.`
   2. `Dumbbell press`: `Beginner`, `Dumbbells`, `Chest · Shoulders · Triceps`, `One level easier than Bench press. Uses dumbbells, which you have.`
   3. `Incline push-up`: `Beginner`, `No equipment`, `Chest · Shoulders · Triceps`, `One level easier than Bench press. Needs no equipment.`
   4. `Push-up`: `Beginner`, `No equipment`, `Chest · Shoulders · Triceps`, `One level easier than Bench press. Needs no equipment.`
6. Confirm that no option is `Close-grip bench press` (it needs a barbell) and that the box says `Suggestions only. Your plan, saved sets and workout history stay the same.`
7. Press **Close**. Confirm the box closes, the page still says `Set 1`, the clock still says `Set finished`, and the boxes still hold `135` and `5`.
8. Press **Log set**. Confirm that `Saved sets` shows `Set 1` with `135 lb × 5`.

### Expected outcome:

Test passes if the four alternatives above appear in that order with exactly those details, Close-grip bench press is not offered, and closing the box leaves the unlogged set (135 and 5) in place so it can still be logged.
Test fails if any alternative is missing, extra, in a different order or shows different details, if an exercise needing a barbell is offered, or if the typed weight, reps or set timer change after opening and closing the box.

## Acceptance Test 2: Someone with more equipment and experience sees more options, capped at five

### Setup for this test:

1. Log out if you are logged in. Log in with `alt.gio@example.com` and `Alt-Gio-82!`. Confirm that the Dashboard opens.
2. Open the workout and press **Begin exercise** on **Bench press**.

### Steps:

1. Press **See alternatives**. Confirm `Your setup: Advanced · Full gym access` and `5 alternatives`.
2. Confirm these five options appear in this order:
   1. `Close-grip bench press`: `Intermediate`, `Barbell`, `Triceps · Chest`, `Same difficulty as Bench press. Uses a barbell, which your full gym access covers.`
   2. `Incline dumbbell press`: `Intermediate`, `Dumbbells`, `Same difficulty as Bench press. Uses dumbbells, which your full gym access covers.`
   3. `Dumbbell press`: `Beginner`, `Dumbbells`, `One level easier than Bench press. Uses dumbbells, which your full gym access covers.`
   4. `Incline push-up`: `Beginner`, `No equipment`, `One level easier than Bench press. Needs no equipment.`
   5. `Push-up`: `Beginner`, `No equipment`, `One level easier than Bench press. Needs no equipment.`
3. Press **Close**. Press **‹ Return to workout**, then press **Begin exercise** on **Pull-up**, then **See alternatives**.
4. Confirm `Pull-up`, `Intermediate · Pull-up bar`, `Back · Biceps` at the top, `1 alternative`, and one option: `Lat pulldown`: `Beginner`, `Cable machine`, `Back · Biceps`, `One level easier than Pull-up. Uses a cable machine, which your full gym access covers.`

### Expected outcome:

Test passes if Gio sees the five Bench press options above in that order (the same-difficulty ones first) and Lat pulldown for Pull-up.
Test fails if more than five options appear, the order differs, or the explanations do not mention full gym access.

## Acceptance Test 3: When nothing fits, the page explains why

### Setup for this test:

1. Log out, then log in as Alex (`alt.alex@example.com`, `Alt-Alex-82!`). Open the workout and press **Begin exercise** on **Pull-up**.

### Steps:

1. Press **See alternatives**. Confirm the top shows `Pull-up`, `Intermediate · Pull-up bar` and `Back · Biceps`.
2. Confirm the box says `No alternative fits your setup` and `None of the other pulling-down exercises we list fit your equipment (Dumbbells) and experience (Intermediate). Keep doing Pull-up, or add equipment you have in your training preferences.`
3. Confirm there is an **Update training preferences ›** link, that no exercise is listed, and that the box does not say `Couldn't load alternatives`.
4. Press **Update training preferences ›**. Confirm the page titled `Edit Training Preferences` opens. Do not change anything. Open the workout again and press **Begin exercise** on **Pull-up**. Confirm the page still shows the Pull-up exercise with no sets saved.

### Expected outcome:

Test passes if the box names the reason (Alex's equipment and experience) and offers a way to change equipment, without showing an empty list or an error.
Test fails if the box is blank, shows an empty list with no explanation, shows an error message, or lists Lat pulldown (it needs a cable machine Alex doesn't have).

## Acceptance Test 4: An exercise that isn't covered yet says so

### Setup for this test:

1. Log in as Alex. Open the workout and press **Begin exercise** on **Romanian deadlift**.

### Steps:

1. Press **See alternatives**. Confirm the box is titled `Alternatives to Romanian deadlift` and shows `Romanian deadlift` with `Hamstrings · Glutes · Lower back`.
2. Confirm it says `No alternatives listed for Romanian deadlift yet` and `Alternatives cover pressing, squatting, rowing and pulling-down exercises so far. Keep doing Romanian deadlift as planned.`
3. Confirm no exercise is listed and the box does not say `No alternative fits your setup` or `Couldn't load alternatives`.

### Expected outcome:

Test passes if the box explains that this exercise isn't covered yet, which is different from the "nothing fits your setup" message in Acceptance Test 3.
Test fails if the box is blank, shows an error, or uses the "nothing fits your setup" wording.

## Acceptance Test 5: A failed request can be tried again without losing your set

### Setup for this test:

1. On a computer, load the test data again, then log in as Alex. Open the workout and press **Begin exercise** on **Bench press**.
2. Press **Start set**, wait 3 seconds, press **Finish set**, and type `140` in **Weight (lb)** and `4` in **Reps**. Do NOT press **Log set**.

### Steps:

1. Turn off the computer's internet connection (switch off Wi-Fi or unplug the network cable) and keep this page open.
2. Press **See alternatives**. Confirm the box says `Couldn't load alternatives. Check your connection and try again.` with a **Try again** button, and lists no exercises.
3. Press **Close**. Confirm the boxes still hold `140` and `4`, and the clock still says `Set finished`.
4. Turn the internet connection back on, and reconnect to the UB VPN if you use it.
5. Press **See alternatives** again. If the error appears, press **Try again**. Confirm the four alternatives from Acceptance Test 1, step 5 appear.
6. Press **Close**, then **Log set**. Confirm `Saved sets` shows `Set 1` with `140 lb × 4`.

### Expected outcome:

Test passes if the failure shows a clear message and a way to try again, the typed set survives the failure, and trying again after reconnecting shows the alternatives.
Test fails if the page goes blank, reloads, shows "No alternative fits your setup" for a connection problem, or loses the typed 140 and 4.

## Acceptance Test 6: Looking at alternatives never changes the plan, saved sets or history

### Setup for this test:

1. Load the test data again. Log in as Alex. Open the workout and press **Begin exercise** on **Bench press**. Log one set: **Start set**, **Finish set**, `100` and `8`, **Log set**, then **Skip rest**.

### Steps:

1. Press **See alternatives**, wait for the four options, then press **Close**.
2. Confirm the page is still headed `Bench press` and `Saved sets` still shows only `Set 1` with `100 lb × 8`.
3. Press **‹ Return to workout**. Confirm the exercises are still Bench press, Pull-up and Romanian deadlift, in that order.
4. Click **Progress**, then **Workout history**. Open the workout from two days ago. Confirm it still lists `Bench press` with `135 lb × 5`, and no alternative exercise name appears.
5. Reload the browser page and open the workout again. Confirm the exercises and the saved Bench press set are the same as in steps 2 and 3.

### Expected outcome:

Test passes if after viewing alternatives the workout, its saved set and the earlier workout in history are exactly as before.
Test fails if any exercise name changes, a set is added, removed or moved, or the history shows a different exercise.

## Acceptance Test 7: Everything works with the keyboard only

### Setup for this test:

1. On a computer, log in as Alex. Open the workout and press **Begin exercise** on **Bench press**. From here on, don't use the mouse.

### Steps:

1. Press Tab until **See alternatives** has a visible outline, then press Enter. Confirm the box opens and the title `Alternatives to Bench press` is outlined or read out first.
2. Press Tab repeatedly. Confirm the outline moves only between **Close** and the list inside the box, going round and round, and never reaches the page behind it.
3. Press Escape. Confirm the box closes and the outline is back on **See alternatives**.
4. Press Enter to open it again, Tab to **Close** and press Enter. Confirm the box closes and the outline is on **See alternatives**.
5. Press **‹ Return to workout** with the keyboard (Tab to it, Enter), open **Pull-up** the same way, open **See alternatives**, and Tab to **Update training preferences ›**. Confirm it has a visible outline.

### Expected outcome:

Test passes if the box can be opened, read, moved through and closed with Tab, Enter and Escape alone, and the outline never disappears or goes behind the box.
Test fails if any control can't be reached by keyboard, the outline goes to the page behind the box while it is open, Escape doesn't close it, or the outline is lost after closing.

## Acceptance Test 8: Alternatives work on a phone

### Setup for this test:

1. On a phone held upright (or a browser window 390 pixels wide), log in as Gio on the [Login page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login). Open the workout and press **Begin exercise** on **Bench press**.

### Steps:

1. Tap **See alternatives**. Confirm the box fits the screen width with space on both sides and the page does not need to be scrolled sideways.
2. Confirm `Close-grip bench press` is shown in full (it may wrap to a second line, but no letters are cut off) and its `Intermediate` and `Barbell` labels are readable.
3. Scroll down inside the box. Confirm you can reach the fifth option, `Push-up`, and the line `Suggestions only. Your plan, saved sets and workout history stay the same.`
4. Tap **Close**. Confirm the box closes and the exercise page is where you left it.

### Expected outcome:

Test passes if all five options can be read and reached on the phone without sideways scrolling or cut-off text, and Close works.
Test fails if the box is wider than the screen, any text is cut off, the fifth option can't be reached, or Close can't be tapped.
