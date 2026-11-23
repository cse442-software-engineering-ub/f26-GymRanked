# Story 157: As a workout buddy, I want to leave my workout buddies group, which is confirmed by confirming "Leave group" and then seeing the options to join or create a group again, while the members who stay keep a working group.

- **Tasks:** #158 (backend), #159 (Buddies page)
- **Automated in:** not automated yet (the story has no Playwright task card)

Test accounts (already on the cattle server; the password for every account is Buddy-Test-78!): buddy-olivia@example.com (Olivia Grant) owns the group "Morning Lifters", whose invite code is 7KQ2MXP9. buddy-ben@example.com (Ben Cruz) is a member of "Morning Lifters". buddy-nina@example.com (Nina Park) is in no group. buddy-pete@example.com (Pete Lowe) is the only member of his group "Late Starters". Each test starts from these accounts as described: if an earlier test or someone else changed them, ask a team member to reset the test accounts first (they load database/seeds/workout_buddies.sql).

## Acceptance Test 1: A member leaves after confirming, and the owner's group updates

**Setup for this test:**
1. Connect to the UB VPN, or use the campus network.
2. Window A (a normal window): open https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login and log in as buddy-nina@example.com with the password Buddy-Test-78!. Choose "Buddies", type 7KQ2MXP9 in "Invite code" and click "Join group". The page shows "Morning Lifters".
3. Window B (a private window): open the same link, log in as buddy-olivia@example.com and choose "Buddies". The member list shows Olivia G., Ben C. and Nina P.

**Steps:**
1. In window A, click "Leave group" in the "Morning Lifters" card. Confirm a window opens titled "Leave Morning Lifters?" that says "You'll stop seeing its members and the encouragements sent to you in it. To come back, you will need an invite code again." with the buttons "Leave group" and "Stay in group".
2. Click "Stay in group". Confirm the window closes and Nina is still in "Morning Lifters" with 3 members.
3. Click "Leave group" again, then the red "Leave group" button in the window. Confirm the page says "You left Morning Lifters." and shows "You're not in a group yet." with "Join group" and "Create a group".
4. Reload window A. Confirm it still shows "You're not in a group yet.".
5. In window B, don't click anything for 15 seconds. Confirm the member list now shows only Olivia G. and Ben C., and the card says "2 members".

**Result:** record Pass only if every Confirm line above was true exactly as written. Otherwise record Fail with the first step that did not match and what the page showed instead.

## Acceptance Test 2: The owner leaves and the member who joined first becomes the owner

**Setup for this test:**
1. Connect to the UB VPN, or use the campus network.
2. Window A (a normal window): open https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login, log in as buddy-olivia@example.com with the password Buddy-Test-78! and choose "Buddies". The card says "Owner", and "Invite friends" shows 7KQ2MXP9.
3. Window B (a private window): open the same link, log in as buddy-ben@example.com and choose "Buddies". There is no "Invite friends" box.

**Steps:**
1. In window A, click "Leave group". Confirm the window says "Ben C. will become the owner and see the invite code." before the rest of the text.
2. Click the red "Leave group" button. Confirm the page says "You left Morning Lifters. Ben C. is the owner now." and shows "You're not in a group yet.".
3. In window B, don't click anything for 15 seconds. Confirm the card now shows "Owner", Ben C. has the "Owner" label, "Invite friends" shows 7KQ2MXP9, and the member list has only Ben C.
4. In window A, type 7KQ2MXP9 in "Invite code" and click "Join group". Confirm Olivia is back in "Morning Lifters", Ben C. has the "Owner" label, and Olivia has no "Invite friends" box.

**Result:** record Pass only if every Confirm line above was true exactly as written. Otherwise record Fail with the first step that did not match and what the page showed instead.

## Acceptance Test 3: The only member leaves and the group is gone

**Setup for this test:**
1. Connect to the UB VPN, or use the campus network.
2. Open https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login in a private window and log in as buddy-pete@example.com with the password Buddy-Test-78!. Choose "Buddies". The page shows "Late Starters" with "1 member".

**Steps:**
1. Click "Leave group". Confirm the window says "You're the only member, so the group and its invite code will be deleted."
2. Click the red "Leave group" button. Confirm the page says "You left Late Starters. You were its only member, so the group was deleted." and shows "You're not in a group yet.".
3. Reload the page. Confirm it still shows "You're not in a group yet." and "Late Starters" does not appear anywhere.

**Result:** record Pass only if every Confirm line above was true exactly as written. Otherwise record Fail with the first step that did not match and what the page showed instead.
