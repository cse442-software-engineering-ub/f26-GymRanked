# Plan details: return to the page that opened it

Use a signed-in account with a selected plan and a local database containing that plan. Start each test independently at `http://localhost:5173/CSE442/2026-Fall/cse-442y/`, with the route specified in step 1. Check the return link at 375 px and 1440 px in both appearances; for Test 1, open the details at desktop width, then resize the details page to phone width before going back.

## Test 1: Return to Workouts

1. Open the app link with `#/weekly-plan` appended and sign in.
2. Select `View plan details` for the current workout. Confirm the plan details page shows `Back to workouts` above the plan title.
3. Select `Back to workouts`. Confirm the Workouts page (`#/weekly-plan`) opens, showing the same selected plan and weekly workouts.

## Test 2: Return to the plan library

1. Open the app link with `#/plans` appended and sign in.
2. Open the current plan's details. Confirm the back link says `Back to plan library`.
3. Select the back link. Confirm the plan library (`#/plans`) opens. Repeat from a different plan card.

## Test 3: Return to Dashboard

1. Open the app link with `#/dashboard` appended and sign in.
2. Select the current plan name or a `View plan` link that opens its details. Confirm the back link says `Back to dashboard`.
3. Select it. Confirm Dashboard (`#/dashboard`) opens. Repeat if the Today's workout card offers a plan-details action.

## Test 4: Direct link fallback

1. Paste a valid plan details URL, `#/plans/<plan id>`, into a new browser tab and sign in if needed.
2. Confirm the back link says `Back to plan library`. Select it and confirm the plan library opens. The link must not send the browser to an unrelated prior website.
