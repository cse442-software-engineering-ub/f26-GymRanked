# Task tests: Plan library redesign, current plan first and More plans toggle (upgrade task under story #72)

Upgrade task #129 under story #72 (*select a workout plan and change my current workout plan*). Sprint 4, owner Mansur. Frontend only: no API, database or seed change. Second round of the card: the first release (current plan first and a closed "More plans" row) is merged; this round gives the page the look of the design preview (`GymRanked-redesign.html`, the Plans screen). Only the Plans page (`#/plans`) changes: the navigation bar and every other page are untouched.

## What changed

The Plans page is now titled **Plan library** and has, from top to bottom:

1. **Current plan:** one wide card with the orange label "CURRENT PLAN", the plan's name in large type, its one-line description, a line of facts ("Beginner · 3 days/week · 6 weeks") and a **View plan →** button on the right (under the text on a phone).
2. **Recommended for you:** the plans that match the saved setup (without the current plan), as cards in two columns (one on a phone). Each card is a link to the plan's details: name, an orange ↗ arrow, one line of description and the facts line.
3. **More plans, N programs:** one row with a chevron that starts closed. It opens when chosen and closes when chosen again (click, Enter or Space), and is closed again after a refresh or after leaving and coming back. Inside it the remaining plans are cards like the ones above.
4. If there were no current plan and no recommended plan, the remaining plans would show open under "All plans". (A signed-in user with no plan is sent to "Choose your workout plan", so in the app this is only a safety net.)

A plan appears once: the current plan is not repeated in Recommended or More plans.

**What the page no longer shows (as in the design preview):** the "Choose plan" button on each card, the equipment icons and "Equipment ready" line, the Schedule/Session/Intensity row, the swipe dots and the setup box ("Goal, Experience, Schedule, Equipment" with "Edit preferences"). A plan is chosen or switched on its details page ("Start this plan", which asks before switching); the setup is edited from Profile > Edit Training Preferences.

Files: `src/WorkoutPlanLibrary.jsx` (rewritten), `src/index.css` (new `.plan-lib*` rules, using only `--gr-` colour variables, so light mode works; the old "More plans" rules removed), `DESIGN.md`. `PlanCard`, `PlanCarousel` and `PlanPreferences` are no longer used by any page and were left in place.

## Setup (do this once before the Task Tests)

1. Connect to the UB VPN or campus network.
2. The plan data (migrations 004-008) must be on aptitude: the library lists 10 plans.
3. Create `plan-lib@test.com` with the password `ABC12345678@` (Full name: Plan Library) on the login page ("Create an account"), log in, enter body weight 180 and Man, then choose "Strength", "Intermediate" and "Full gym access". On "Choose your workout plan" click "Choose plan" on **Push Pull Legs**.
4. Plans page: https://aptitude.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/plans
5. With this setup the recommended plans are, in order, Push Pull Legs, Upper/Lower Hypertrophy, Athletic Performance, Full Body Strength, Beginner Fundamentals. The others are 5/3/1 Strength Cycle, Powerlifting Peak, Bodyweight Basics, Glute Focus and Marathon Strength Support.
6. Use a desktop-width browser (1440 x 900) unless a test says phone (375 x 812).

## Task Test 1: Plan library shows the current plan first, then recommendations, then a closed More plans row

Steps:
1. Signed in as plan-lib@test.com, click "Plans" on the navigation bar. The heading should say "Plan library" and nothing else should sit above the first card.
2. The first card should have the orange label "CURRENT PLAN", the name "Push Pull Legs" in large type, a one-line description, the line "Intermediate · 5 days/week · 6-8 weeks", and a "View plan →" button on its right.
3. Under the heading "Recommended for you" there should be 4 cards, in this order: Upper/Lower Hypertrophy, Athletic Performance, Full Body Strength, Beginner Fundamentals, two per row. Each shows the name with an orange ↗ arrow, one line of description and the facts line. Push Pull Legs should not be among them.
4. Under them there should be one row reading "More plans" and "5 programs" with a chevron pointing down. None of 5/3/1 Strength Cycle, Powerlifting Peak, Bodyweight Basics, Glute Focus or Marathon Strength Support should be visible.
5. The page should have no "Choose plan" buttons, no equipment icons, and no "Goal / Experience / Schedule / Equipment" box. The navigation bar should be the same as on the other pages, with "Plans" highlighted.

## Task Test 2: More plans opens when chosen, closes when chosen again, and is closed after a refresh

Steps:
1. Click the "More plans" row. The 5 remaining plans should appear as cards in two columns, in this order: 5/3/1 Strength Cycle, Powerlifting Peak, Bodyweight Basics, Glute Focus, Marathon Strength Support. The chevron should point up. The page should show 10 plans in total (1 current, 4 recommended, 5 more) and none twice.
2. Click the row again. The 5 plans should disappear and the chevron should point down.
3. Press Tab until the row has a visible orange focus ring. Press Enter: it should open. Press Space: it should close.
4. Open it again and refresh the page. It should be closed.
5. Open it, click "Dashboard" on the navigation bar, then "Plans". It should be closed.

## Task Test 3: Cards and "View plan" open the plan's details

Steps:
1. Click "View plan →" on the current plan. The details of Push Pull Legs should open, with "Back to plan library" above its name. Click "Back to plan library": the Plan library should open.
2. Click anywhere on the "Beginner Fundamentals" card. Its details page should open. Click "Back to plan library".
3. Open "More plans" and click the "Glute Focus" card. Its details page should open. Click "Back to plan library". More plans should be closed.
4. Hover over a card: its border should get slightly lighter and the text should not become underlined.

## Task Test 4: Switching plans moves the cards

Steps:
1. Open the "Full Body Strength" card, then click "Start this plan". A dialog should open with "Switch to Full Body Strength?". Click "Cancel". Open the Plan library: "Push Pull Legs" should still be the current plan.
2. Open "Full Body Strength" again, click "Start this plan", then "Switch plan". The Dashboard should open. Click "Plans". The current plan card should say "Full Body Strength". "Recommended for you" should list Push Pull Legs, Upper/Lower Hypertrophy, Athletic Performance, Beginner Fundamentals in that order. The row should read "More plans" and "5 programs" and be closed.
3. Open "More plans", click the "Powerlifting Peak" card, click "Start this plan", then "Switch plan". Click "Plans". The current plan should be "Powerlifting Peak". "Recommended for you" should list Push Pull Legs, Upper/Lower Hypertrophy, Athletic Performance, Full Body Strength, Beginner Fundamentals (5 cards). The row should read "4 programs" and be closed.

## Task Test 5: The page works on a phone and in light mode

Steps:
1. In Chrome DevTools device mode set 375 x 812 and open "Plans". Nothing should need sideways scrolling. The cards should be one per row, and "View plan →" should sit under the current plan's text and be at least 44 px tall.
2. The "More plans" row should be at least 44 px tall. Tap it: the plans should appear one per row. Tap again: they should disappear.
3. Open Profile, go to Appearance and choose "Light". Open "Plans" on a computer and on a phone: the heading, plan names, descriptions, the orange label and arrows, and the row should all be readable, with no white-on-white or dark-on-dark text. Choose "Dark" again afterwards.

## Task Test 6: Loading and failure states keep working

Steps:
1. In Chrome DevTools > Network > Request blocking, block `*plans.php*` and reload "Plans". The heading "Plan library" should show "Error loading plans" and no cards.
2. Remove the block and reload: the page should return to the order in Task Test 1.
3. Throttle the network to "Slow 4G" and reload: it should say "Loading plans..." and show no "More plans" row until the plans have loaded.

## Task Test 7: Nothing else changed

Steps:
1. Click through the navigation bar: Dashboard, Workouts, Plans, Progress, Leaderboard, Today, Buddies. The navigation bar should look the same on each page, and each page should look as it did before.
2. Open a plan's details page: it should look as before, with "Back to plan library" and a "Start this plan" button (or "This is your current plan").
3. Log in as a new account with no plan: it should be sent to "Choose your workout plan", which should look as before, with a "Choose plan" button on each card.

## Points for review

1. The "Choose plan" button, equipment icons and the setup box are gone from the library because the design preview does not have them. Choosing a plan now takes one more click (open the card, then "Start this plan"). Say if you want the equipment fit line or a quick "Choose plan" button back.
2. The preview uses a different heading font; the page keeps the app's font.
3. Story and Playwright text for story #72 that clicks a "Choose plan" button on the library needs the new steps (open the card, then "Start this plan"). The story owner updates the story and the Playwright owner the code; they were not edited here.
