# Task tests: Plans page layout and More plans toggle (upgrade task under story #72)

Upgrade task under story #72 (*select a workout plan and change my current workout plan*). Card #129, Sprint 4, owner Mansur. Frontend only: no API, database or seed change.

**Status: draft for review. Nothing is implemented.** After review the card gets its own branch from `dev` (`129-Plans-layout-and-more-plans-toggle`), separate from #71 (Buddies backend) and from the page-widths card (#130, `130-page-widths-no-breadcrumbs.md`).

## What this card adds

Today the Plans page (`#/plans`, `src/WorkoutPlanLibrary.jsx`) shows two always-open card rows: "Recommended plans", then "More plans". The current plan is not set apart: it is one card inside whichever row holds it, and with all ten plans on screen the page is long. This card changes the order and lets the user hide the long part.

1. **Your current plan first.** When the user follows a plan, a section headed "Your current plan" comes first, holding that plan's card once (orange border, greyed "Current plan" button, as today). With no current plan the section is not shown.
2. **Recommendations second.** "Recommended plans" lists the plans that match the saved setup, in the same order as today, without the current plan (a plan never appears twice).
3. **Everything else under "More plans", closed to start with.** The remaining plans sit behind one button, "More plans (N)", where N is how many plans it holds. The page opens with it closed. Choosing it opens the list, and choosing it again closes it. It is not remembered: a refresh or coming back to the page shows it closed again.
4. **When nothing sits above it**, that is, no current plan and no recommended plan, the remaining plans are the whole page, so the section reads "All plans" and is open, with no toggle. (Open question 1 below.)

Implementation notes for the reviewer (not tested): the toggle can be a native `<details>`/`<summary>`, which gives keyboard use, `aria-expanded` and open/close with no new state. It reuses `PlanCard`, `PlanCarousel`, `orderByRecommendation` and `usePlanSelection`; the only new pieces are the current-plan section and the toggle, plus their CSS using `--gr-` variables (no new colours). Files expected to change: `src/WorkoutPlanLibrary.jsx`, `src/index.css`, `DESIGN.md` (Plan card / plan library paragraph).

## What this card does not change

- Plan cards, the "Choose plan" and "Switch plan" flow, plan details, "Your setup" and the equipment dots.
- Which plans are recommended, and their order (`recommendPlans`).
- Breadcrumbs and page width: those belong to the page-widths card. Both cards edit `src/WorkoutPlanLibrary.jsx` (this one the body, that one the breadcrumb line and the width class), so whichever merges second merges `dev` first.

## Open questions for review

1. With no current plan and no recommended plan, should "All plans" show open (proposed, so the page isn't empty) or closed like everywhere else?
2. The headings in the code say "Recommended plans"; the older task and story text (`111-recommended-plans.md`, `stories/TBD-recommended-plans.md`) says "Recommended for you". This card keeps the code's wording. The story owner may want to update the story text.
3. Should "More plans (N)" show the count? Proposed yes, because a closed list otherwise hides how much is inside.

## Setup (do this once before the Task Tests)

1. Connect to the UB VPN or campus network.
2. The plan data (migrations 004-008) must be on aptitude: the library lists 10 plans.
3. Test account: on the Aptitude login page (https://aptitude.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login) click "Create an account" and create `plans-layout@test.com` with the password `ABC12345678@` (Full name: Plans Layout). Log in. Choose "Strength" and "Save goal", then "Intermediate" and "Save and continue", then "Full gym access" and "Save and continue". Do not select a plan yet.
4. Plans page: https://aptitude.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/plans
5. With this setup the recommended plans are, in order: Push Pull Legs, Upper/Lower Hypertrophy, Athletic Performance, Full Body Strength, Beginner Fundamentals. The other five are, in order: 5/3/1 Strength Cycle, Powerlifting Peak, Bodyweight Basics, Glute Focus, Marathon Strength Support.
6. Use a desktop-width browser (1440 x 900) unless a test says phone (375 x 812).

## Task Test 1: With no current plan, recommendations come first and More plans starts closed

Steps:
1. Signed in as plans-layout@test.com with no plan selected, click "Plans" on the navigation bar. The page should open with "Find your next workout plan" and "Your setup" reading Strength, Intermediate and Full gym access.
2. There should be no "Your current plan" heading.
3. The first group should be "Recommended plans", with these 5 cards in order: Push Pull Legs, Upper/Lower Hypertrophy, Athletic Performance, Full Body Strength, Beginner Fundamentals.
4. Under it there should be one button reading "More plans (5)", with a chevron pointing down.
5. None of 5/3/1 Strength Cycle, Powerlifting Peak, Bodyweight Basics, Glute Focus or Marathon Strength Support should be visible anywhere on the page, and none should be reachable with the Tab key while the button is closed.

## Task Test 2: More plans opens when chosen, closes when chosen again, and is closed again after a refresh

Setup for this test: Task Test 1 steps, with the page on "Plans" and More plans closed.

Steps:
1. Click "More plans (5)". The 5 remaining plans should appear under it in this order: 5/3/1 Strength Cycle, Powerlifting Peak, Bodyweight Basics, Glute Focus, Marathon Strength Support. The chevron should point up. "Recommended plans" should still show its 5 cards.
2. Count the cards on the page. There should be 10, and no plan should appear twice.
3. Click "More plans (5)" again. The 5 plans should disappear and the chevron should point down again.
4. Press Tab until "More plans (5)" has a visible focus ring. Press Enter: it should open. Press Space: it should close.
5. Open it again, then refresh the page. It should be closed.
6. Open it, click "Dashboard" on the navigation bar, then "Plans". It should be closed.

## Task Test 3: A current plan is shown first, once

Setup for this test: signed in as plans-layout@test.com, no plan selected, on "Plans".

Steps:
1. Click "Choose plan" on "Push Pull Legs" (no warning should appear). The Dashboard should open.
2. Click "Plans". From top to bottom the page should show: "Your setup", then "Your current plan" with one card, Push Pull Legs, then "Recommended plans", then "More plans (5)" closed.
3. The Push Pull Legs card should have an orange border and a greyed-out "Current plan" button with a tick. Its card should appear only once on the page.
4. "Recommended plans" should list 4 cards in this order: Upper/Lower Hypertrophy, Athletic Performance, Full Body Strength, Beginner Fundamentals. Each should have a "Choose plan" button.
5. Click "More plans (5)". It should still hold the same 5 plans as in Task Test 2. The page should now have 10 cards, with no plan twice.

## Task Test 4: Switching plans moves the current-plan card and More plans stays as the user left it

Setup for this test: Task Test 3 done, so Push Pull Legs is the current plan.

Steps:
1. On "Plans" click "Choose plan" on "Full Body Strength" (in Recommended plans). A dialog should open with "Switch to Full Body Strength?". Click "Switch plan". The Dashboard should say "You're following Full Body Strength".
2. Click "Plans". "Your current plan" should now hold Full Body Strength. "Recommended plans" should list Push Pull Legs, Upper/Lower Hypertrophy, Athletic Performance, Beginner Fundamentals in that order, and Push Pull Legs should have a clickable "Choose plan" button. More plans should be closed and read "More plans (5)".
3. Open "More plans (5)" and click "Choose plan" on "Powerlifting Peak". The switch dialog should open. Click "Cancel". The dialog should close, Full Body Strength should still be the current plan, and More plans should still be open.
4. Click "Choose plan" on "Powerlifting Peak" again, then "Switch plan". The Dashboard should say "You're following Powerlifting Peak". Click "Plans". "Your current plan" should hold Powerlifting Peak. "Recommended plans" should list Push Pull Legs, Upper/Lower Hypertrophy, Athletic Performance, Full Body Strength, Beginner Fundamentals (5 cards, Full Body Strength is back). "More plans" should read "More plans (4)" and be closed, because Powerlifting Peak left that group.

## Task Test 5: Plan details still open from every group

Setup for this test: signed in as plans-layout@test.com with any plan selected, on "Plans".

Steps:
1. Click the "Your current plan" card anywhere except its button. Its details page should open. Click "Plans" on the navigation bar.
2. Click a card in "Recommended plans" anywhere except its button. Its details page should open. Click "Plans" on the navigation bar.
3. Open "More plans" and click a card in it anywhere except its button. Its details page should open. Click "Plans" on the navigation bar. More plans should be closed.

## Task Test 6: With no current plan and no recommended plan the page is not empty

Setup for this test: log out, then create `plans-layout-2@test.com` with the password `ABC12345678@` (Full name: Plans Layout Two) and log in. Choose "Strength" and "Save goal", then "Beginner" and "Save and continue", then "Bodyweight only" and "Save and continue". Do not select a plan, so the account has no current plan.

Steps:
1. Click "Plans". "Your setup" should read Strength, Beginner and Bodyweight only.
2. There should be no "Your current plan" and no "Recommended plans" heading.
3. A group headed "All plans" should be open with all 10 plans in this order: Push Pull Legs, Full Body Strength, Upper/Lower Hypertrophy, 5/3/1 Strength Cycle, Beginner Fundamentals, Powerlifting Peak, Bodyweight Basics, Athletic Performance, Glute Focus, Marathon Strength Support. There should be no "More plans" button.

## Task Test 7: The page works on a phone and in light mode

Setup for this test: signed in as plans-layout@test.com with Push Pull Legs as the current plan (the Strength, Intermediate, Full gym access setup).

Steps:
1. In Chrome DevTools device mode set 375 x 812 and open "Plans". "Your current plan" should show its card, then "Recommended plans" a swipeable row with dots, then "More plans (5)" closed. Nothing should need sideways scrolling.
2. The "More plans (5)" button should be at least 44 px tall. Tap it: the five plans should appear as a swipeable row with 5 dots. Tap it again: they should disappear.
3. Open Profile, go to Appearance and choose "Light". Open "Plans" and repeat steps 1 and 2 on a computer and a phone: the button text, chevron and focus ring should be readable, and every colour should come from the theme (nothing white-on-white or dark-on-dark). Choose "Dark" again afterwards.

## Task Test 8: Loading and failure states keep working

Steps:
1. In Chrome DevTools > Network > Request blocking, block `*plans.php*` and reload "Plans". The page should say "Error loading plans" with the heading still visible, and there should be no "More plans" button and no "Your current plan" section.
2. Remove the block and reload. The page should return to the order in Task Test 3 (or Task Test 1 if there is no current plan).
3. While the page is loading (throttle the network to "Slow 4G" and reload), it should say "Loading plans..." and show no "More plans" button until the plans have loaded.

## Existing tests and documents this changes

- `tests/e2e/72-select-workout-plan.spec.js` and `stories/72-select-workout-plan.md` check the plan library; whichever steps look for a plan card in the second row must open "More plans" first. The story owner updates the story text; the Playwright task owner updates the code (per AGENTS.md).
- `task-tests/111-recommended-plans.md`, Task Tests 2 and 3, count "More plans" cards without opening it. They are history for a closed card and are not edited.
- `DESIGN.md`, "Plan card" section: add the current-plan section and the toggle (done in this card).
