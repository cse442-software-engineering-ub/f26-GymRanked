# Task tests: Exercise guide video controls and picture fallback (#91, story #90)

Task #91, Sprint 4. Frontend task for story #90. Depends on Surya's #92 (backup pictures and instructions for the guide). Branch: `91-guide-video-controls`. The guide is `src/ExerciseGuide.jsx`, opened from the exercise page of the active workout (`#/workout/active/:exerciseIndex`, `src/ExerciseSession.jsx`).

## Card checks before review

- **Blocking:** on PMTool, card #91 must show that it **blocks story #90** and depends on **#92**.
- **Tags:** "Frontend task" and the Sprint 4 tag.
- **Branch:** `91-guide-video-controls`, made from `dev`, attached to #91 when it moves to In Progress.

## Links used in these tests

- Login page: https://aptitude.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login
- Active workout page: https://aptitude.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/workout/active
- First exercise of today's workout: https://aptitude.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/workout/active/0

## Setup for all tests

Step 1: Connect to the UB VPN or the campus network.

Step 2: Open the Login page and log in with any account that has a workout plan selected and a workout scheduled for today. Confirm the Dashboard opens.

Step 3: Open the Active workout page. Confirm today's exercises are listed, each with a **Begin exercise** button. If there's no workout today, start one from the Dashboard first.

## Test 1: Pause and resume a working video

Step 1: Press **Begin exercise** on the first exercise. Confirm the page is headed with the exercise's name and `EXERCISE 1 OF [total]` above it.

Step 2: Press **How to perform it**. Confirm a pop-up opens titled `How to perform [exercise name]`, and the demo video starts playing within 5 seconds.

Step 3: Confirm a **Pause** button is visible on or directly under the video.

Step 4: Press **Pause**. Confirm the video stops on the current frame and the button now says **Play**.

Step 5: Wait 5 seconds. Confirm the video hasn't moved.

Step 6: Press **Play**. Confirm the video continues from the frame where it stopped, not from the beginning, and the button says **Pause** again.

Step 7: Press **Pause**, then press **Close**. Press **How to perform it** again. Confirm the pop-up opens with the video playing and the button saying **Pause**.

Expected outcome: the video stops and continues from the same frame, and the button label always matches what the video is doing.

Fails if there's no Pause button, Pause doesn't stop the video, Play restarts it from the beginning, or the label shows the wrong word.

## Test 2: Use the controls with the keyboard

Step 1: Open the first exercise of today's workout.

Step 2: Press **How to perform it** and confirm the video is playing.

Step 3: Press Tab until the **Pause** button has a visible focus outline.

Step 4: Press Space. Confirm the video stops and the button says **Play**, with the focus outline still on it.

Step 5: Press Enter. Confirm the video continues and the button says **Pause**.

Step 6: Press Escape. Confirm the pop-up closes and focus returns to the **How to perform it** button.

Expected outcome: Space and Enter toggle the video exactly like clicking does, and focus is always visible.

Fails if the button can't be reached with Tab, the keys do nothing, or focus disappears.

## Test 3: Show pictures and instructions when the video can't load

Step 1: On the Active workout page, press **Begin exercise** on an exercise whose demo video isn't available.

Step 2: Press **How to perform it**. Confirm the pop-up opens titled `How to perform [exercise name]`.

Step 3: Confirm no video player, black box or Play/Pause button appears.

Step 4: Confirm a message says the video isn't available: `Video unavailable. Follow the pictures and steps below.`

Step 5: Confirm the first picture shows, with step 1's instruction under it and a position counter such as `1 of [total]`.

Step 6: Confirm a credit line appears under the picture naming where it came from.

Step 7: Press **Next**. Confirm picture 2 and step 2 appear, the counter goes up by one, and the credit line updates if the source is different.

Step 8: Keep pressing **Next** until you reach the last picture. Confirm **Next** is disabled there.

Step 9: Press **Back** until you reach the first picture. Confirm **Back** is disabled there.

Expected outcome: every picture and step can be reached in order, each picture has a credit, and no broken video shows.

Fails if a broken player or blank space appears, a picture has no credit, a step is skipped, or Next/Back go past the first or last picture.

## Test 4: Switch to the fallback when the connection drops

Step 1: Open the first exercise of today's workout. Don't open the guide yet.

Step 2: Turn off your computer's Wi-Fi (or unplug the network cable).

Step 3: Press **How to perform it**. Confirm that within 10 seconds the pop-up shows the video-unavailable message and the written steps instead of a spinning or frozen player.

Step 4: Close the pop-up, press **Start set**, and confirm the set timer counts up.

Step 5: Turn Wi-Fi back on. Reopen **How to perform it**. Confirm the video plays with the **Pause** button visible.

Expected outcome: losing the connection shows the fallback message and steps, set logging keeps working, and the video returns once you're back online.

Fails if the player freezes or spins forever, the page shows an error with no steps, or the set timer stops working.

## Test 5: Show difficulty and equipment in the guide and alternatives

Step 1: Open the first exercise of today's workout.

Step 2: Press **How to perform it**. Confirm the top of the pop-up shows the exercise's difficulty and required equipment, written as `[Difficulty] · [Equipment]` (for example `Intermediate · Barbell`). Note what it says, then press **Close**.

Step 3: Press **See alternatives**. Confirm the box is titled `Alternatives to [exercise name]` and the "You're doing" section shows the same difficulty and equipment as step 2.

Step 4: Confirm every suggested alternative shows its own difficulty (`Beginner`, `Intermediate` or `Advanced`) and equipment (such as `Dumbbells` or `No equipment`).

Step 5: Press **Close**, press **‹ Return to workout**, open a different exercise and repeat steps 2–4.

Expected outcome: each exercise's difficulty and equipment match in the guide and the alternatives box, and every alternative lists both.

Fails if either detail is missing, the two places disagree, or an alternative is missing its difficulty or equipment.

## Test 6: Dark theme and phone width

Step 1: Switch the app to dark theme with the appearance toggle.

Step 2: Repeat Test 1, steps 1–6. Confirm the Pause/Play button and its label are clearly readable against the video and pop-up background.

Step 3: Repeat Test 3, steps 1–7. Confirm the message, instructions, counter and credit line are readable, and the pictures aren't cut off.

Step 4: Switch back to light theme. Open the first exercise on a phone, or narrow the browser window to about 375 px wide.

Step 5: Repeat Test 1, steps 2–6, and Test 3, steps 2–9.

Step 6: Confirm the pop-up fits the screen with no sideways scrolling. Confirm the **Play/Pause**, **Next** and **Back** buttons are large enough to tap easily (about a fingertip wide) and don't overlap the picture or text.

Expected outcome: everything is readable and usable in both themes and at phone width.

Fails if any text or button is hard to read, content spills out of the pop-up, the page scrolls sideways, or buttons overlap.
