# Story 155: As a workout buddy, I want to see the encouragements I have sent, which is confirmed by seeing each message I sent with the person it went to and the date it was sent, and no messages sent by anyone else.

- **Tasks:** #156 (backend and Buddies page)
- **Automated in:** not automated yet (the story has no Playwright task card)

Test accounts (already on the cattle server; the password for every account is Buddy-Test-78!): buddy-olivia@example.com (Olivia Grant) owns the group "Morning Lifters" and has already sent Ben one message, "Nice work on leg day!". buddy-ben@example.com (Ben Cruz) is a member of "Morning Lifters" and has sent nothing. buddy-omar@example.com (Omar Reyes) is in no group and has sent nothing. Each test starts from these accounts as described: if an earlier test or someone else changed them, ask a team member to reset the test accounts first (they load database/seeds/workout_buddies.sql). Use the same day for the whole test.

## Acceptance Test 1: A message I send appears in my sent list with who it went to and the date, also after reloading

**Setup for this test:**
1. Connect to the UB VPN, or use the campus network.
2. Open https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login in a private window and log in as buddy-olivia@example.com with the password Buddy-Test-78!. The Dashboard opens.

**Steps:**
1. Choose "Buddies" in the menu. Scroll down to the section "Sent by you". Confirm it says "Only you can see this list." and shows one message: "To Ben C.", today's date with a time (for example "Nov 23, 12:39 PM"), and "Nice work on leg day!".
2. Scroll up. On the row "Ben C." under "Members", click "Encourage". In the window that opens, type Great squat form today! and click "Send". Confirm the page says "Encouragement sent to Ben C.".
3. Without reloading, scroll down to "Sent by you". Confirm the first message is now "To Ben C.", today's date with the current time, and "Great squat form today!", and "Nice work on leg day!" is second.
4. Reload the page (the round arrow next to the address). Confirm "Sent by you" still shows the same two messages in the same order.

**Result:** record Pass only if every Confirm line above was true exactly as written. Otherwise record Fail with the first step that did not match and what the page showed instead.

## Acceptance Test 2: I only see my own sent messages, not the ones other people sent

**Setup for this test:**
1. Connect to the UB VPN, or use the campus network.
2. Open https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login in a private window and log in as buddy-ben@example.com with the password Buddy-Test-78!.

**Steps:**
1. Choose "Buddies" in the menu. Confirm "Encouragements for you" shows "Nice work on leg day!" from Olivia G., and "Sent by you" says "You haven't sent any encouragements yet. When you send one, it appears here." (Olivia's message is not in Ben's sent list.)
2. On the row "Olivia G.", click "Encourage", type Thanks for the push, Olivia! and click "Send". Confirm "Sent by you" now shows exactly one message: "To Olivia G.", today's date, "Thanks for the push, Olivia!".
3. Log out (profile button, then "Log out") and log in as buddy-olivia@example.com in the same window. Choose "Buddies".
4. Confirm "Sent by you" shows only messages to Ben C. ("Nice work on leg day!", and any Olivia sent herself), and that "Thanks for the push, Olivia!" appears under "Encouragements for you" from Ben C., not under "Sent by you".

**Result:** record Pass only if every Confirm line above was true exactly as written. Otherwise record Fail with the first step that did not match and what the page showed instead.

## Acceptance Test 3: Someone who has sent nothing and is in no group sees no sent list

**Setup for this test:**
1. Connect to the UB VPN, or use the campus network.
2. Open https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login in a private window and log in as buddy-omar@example.com with the password Buddy-Test-78!.

**Steps:**
1. Choose "Buddies" in the menu. Confirm the page says "You're not in a group yet." with the "Invite code" box, "Join group" and "Create a group".
2. Scroll to the bottom. Confirm there is no "Sent by you" section and no message from Olivia G. or Ben C. anywhere on the page.

**Result:** record Pass only if every Confirm line above was true exactly as written. Otherwise record Fail with the first step that did not match and what the page showed instead.
