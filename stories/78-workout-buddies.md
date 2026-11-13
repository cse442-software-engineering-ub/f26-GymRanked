# Story 78: As a gym goer, I want to be able to join an invite-only workout buddies group and encourage other members, which is confirmed by being able to accept an invite and send a member an encouragement message.

- **Tasks:** #71 (backend), #79 (page)
- **Automated in:** not automated yet (the story has no Playwright task card)

### What this story is about, in plain words

A "workout buddies group" is a small private group of GymRank users who encourage each other. Nobody can find it or join it without an invite code. The person who creates the group (the owner) can see the code and gives it to friends in person or by text message. A friend types the code on the Workout buddies page to join. Everyone in the group can then see who else is in it and send another member a short encouraging message, for example "Great session today, keep it up!". Only the member it is sent to can read it.

### The rules these tests check

1. Invite code. A group has one invite code, 8 characters long, made of capital letters and numbers, for example 7KQ2MXP9. Only the owner of the group can see it. Anyone who is logged in and is not already in a group can join by typing it. No email is sent.
2. One group per person. Someone who is already in a group cannot join another group or create one.
3. Private. Only the members of a group can see its list of members. Everyone else sees nothing about the group. Names are shown as a first name and the first letter of the last name, for example "Olivia G.". Email addresses are never shown.
4. Encouragement. A member can send a message of 1 to 140 characters to another member of the same group. Only the person it is sent to can read it. Nobody can send a message to themselves.
5. Not part of this story: leaving a group, removing someone, getting a new code, a limit on the number of members, and invites by email.

### What you need

1. A computer with a web browser (Chrome, Safari or Firefox).
2. A connection to the UB VPN, or the campus network. The website for these tests is on a UB computer, so it will not open without this.
3. The test accounts below. They are fake people that are already set up on the website. You do not need to create anything.

### The six test accounts (the password for every account is Buddy-Test-78!)

Olivia Grant, email buddy-olivia@example.com. She owns a group called "Morning Lifters". Its invite code is 7KQ2MXP9.

Ben Cruz, email buddy-ben@example.com. He is a member of "Morning Lifters". One message is already waiting for him from Olivia: "Nice work on leg day!".

Nina Park, email buddy-nina@example.com. She is not in any group. She will join "Morning Lifters".

Cal Moss, email buddy-cal@example.com. He is not in any group. He will create a new group.

Omar Reyes, email buddy-omar@example.com. He is not in any group and never joins one. He is the "outsider".

Pete Lowe, email buddy-pete@example.com. He owns a different group called "Late Starters". Its code (4MXT8H2R) ran out yesterday, so it no longer works.

### Important: run the tests in order, from 1 to 7, in one go

Tests 3 to 7 change the test accounts (messages are sent, a person joins a group, a group is created). They are written so that, run once and in order, each test finds the accounts exactly as it expects. Tests 5 and 6 belong together: Test 6 uses the second browser tab that you open in the Setup of Test 5. If you run the tests a second time, or in a different order, the accounts will already have changed, so ask a team member to reset the test accounts first.

### Words and actions used in these tests

Click: move the mouse pointer onto the thing and press the left mouse button once.

Type in a box: click once inside the box so a blinking line appears, then type on the keyboard.

Web address: the long box at the very top of the browser window that shows the website's address (it starts with https).

Row of links across the top of the page: the bar at the top of every GymRank page after you log in. It contains the links Dashboard, Workouts, Plans, Progress, Leaderboard, Today and Buddies.

Reload the page: click the round arrow button at the top left of the browser, next to the web address. The page loads again from scratch.

Tab: the browsers show each open page as a small tab along the very top. To open a second tab, click the small + button next to the last tab. A new empty page opens. Click a tab's name to switch to it.

Backspace key: the key near the top right of the letter keys, usually with an arrow pointing left. It erases the last character you typed.

Copy and paste: drag the mouse across the text while holding the left button so it turns coloured, then right-click on it and click "Copy". To paste, right-click inside the box and click "Paste".

Log out: look at the top right corner of the page, click the small round button with your initials, then click "Log out" in the small menu that opens. The Login page opens and says "You are logged out."

## Acceptance Test 1: Someone outside a group sees no members, and cannot see another group

### Setup for this test:

1. Connect to the UB VPN or use the campus network. If the next page does not open, you are not connected yet.
2. Open your web browser (Chrome, Safari or Firefox) and click this link: [Login page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login). A page titled "Log in to GymRank" opens.
3. Click once inside the white box **"Email"** so a blinking line appears, then type **buddy-omar@example.com**
4. Click once inside the box **"Password"** and type **Buddy-Test-78!** (a capital B, a dash, a capital T, a dash, the number 78 and an exclamation mark).
5. Click the button **"Log in"** under the two boxes. Check that the Dashboard page opens (the word **"Dashboard"** is highlighted in the row of links across the top of the page).

### Steps:

1. In the row of links across the top of the page, click **"Buddies"**. Check that the large title on the page says "Workout buddies" and that the web address in the long box at the top of the browser ends with /buddies.
2. Read the page. Check that it says "You're not in a group yet." and shows a white box labelled **"Invite code"** and two buttons, **"Join group"** and **"Create a group"**.
3. Check that none of these names appear anywhere on the page: "Olivia G.", "Ben C.", "Nina P.", "Cal M." and "Pete L.". Check that no group name and no invite code is shown.
4. Look at the top right corner of the page. Click the small round button that shows your initials (**"OR"**). A small menu opens. Click **"Log out"** in that menu. Check that the Login page opens and says "You are logged out."
5. On the Login page click the box **"Email"**, type **buddy-pete@example.com**, click the box **"Password"**, type **Buddy-Test-78!** and click **"Log in"**. Check that the Dashboard page opens.
6. In the row of links across the top of the page, click **"Buddies"**. Check that the large title on the page says "Workout buddies" and that the web address in the long box at the top of the browser ends with /buddies.
7. Check that the page shows the group name "Late Starters" as a large title and the line "1 member".
8. Check that the list of members has exactly one row, "Pete L.", with the labels "Owner" and "You".
9. Check that "Olivia G." and "Ben C." do not appear anywhere on the page. Pete can see only his own group.

Expected outcome: Omar sees nothing about any group. Pete sees only his own group, "Late Starters", and nobody from "Morning Lifters".

## Acceptance Test 2: A wrong or expired invite code is refused

### Setup for this test:

1. Connect to the UB VPN or use the campus network. If the next page does not open, you are not connected yet.
2. Open your web browser (Chrome, Safari or Firefox) and click this link: [Login page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login). A page titled "Log in to GymRank" opens.
3. Click once inside the white box **"Email"** so a blinking line appears, then type **buddy-omar@example.com**
4. Click once inside the box **"Password"** and type **Buddy-Test-78!** (a capital B, a dash, a capital T, a dash, the number 78 and an exclamation mark).
5. Click the button **"Log in"** under the two boxes. Check that the Dashboard page opens (the word **"Dashboard"** is highlighted in the row of links across the top of the page).

### Steps:

1. In the row of links across the top of the page, click **"Buddies"**. Check that the large title on the page says "Workout buddies" and that the web address in the long box at the top of the browser ends with /buddies.
2. Click once inside the box **"Invite code"** and type **7KQ2** (only 4 characters). Click the button **"Join group"**. Check that the message "Enter the 8-character invite code." appears next to the box, and that the page still says "You're not in a group yet."
3. Click inside the box, erase what is there (press the Backspace key until the box is empty) and type **ZZZZZZZZ** (the capital letter Z eight times). Click **"Join group"**. Check that the message "That invite code isn't valid or has expired." appears.
4. Erase the box again and type **4MXT8H2R**. This is the code of the group "Late Starters", which ran out yesterday. Click **"Join group"**. Check that exactly the same message appears: "That invite code isn't valid or has expired." The page must not say whether the code was wrong or old.
5. Erase the box again and type **7kq2mxp9** using small letters. Check that the box turns the letters into capital letters by itself, so it shows 7KQ2MXP9. Do not click "Join group" this time. Erase the box so it is empty.
6. Click **"Join group"** with the empty box. Check that the message "Enter the 8-character invite code." appears.
7. Reload the page (click the round arrow button at the top left of the browser, next to the web address). Check that the page still says "You're not in a group yet." and shows no group name and no names of people.

Expected outcome: none of the wrong codes let Omar into a group, the two codes that do not work get exactly the same words, and Omar is still not in a group.

## Acceptance Test 3: Send an encouragement, and only that member receives it

### Setup for this test:

1. Connect to the UB VPN or use the campus network. If the next page does not open, you are not connected yet.
2. Open your web browser (Chrome, Safari or Firefox) and click this link: [Login page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login). A page titled "Log in to GymRank" opens.
3. Click once inside the white box **"Email"** so a blinking line appears, then type **buddy-olivia@example.com**
4. Click once inside the box **"Password"** and type **Buddy-Test-78!** (a capital B, a dash, a capital T, a dash, the number 78 and an exclamation mark).
5. Click the button **"Log in"** under the two boxes. Check that the Dashboard page opens (the word **"Dashboard"** is highlighted in the row of links across the top of the page).
6. In the row of links across the top of the page, click **"Buddies"**. Check that the large title on the page says "Workout buddies" and that the web address in the long box at the top of the browser ends with /buddies.
7. Check that the page shows the group name "Morning Lifters" and the line "2 members", with a row for "Olivia G." (labels "Owner" and "You") and a row for "Ben C.".
8. Because Olivia owns the group, check that the page also shows the label "Invite code" with the code 7KQ2MXP9, and the label "Expires" with a date about one week from today.

### Steps:

1. On the row for "Ben C." click the button **"Encourage"**. Check that a box labelled **"Your message"** and a button **"Send"** appear.
2. Click once inside the box **"Your message"** and type **Great session today, keep it up!** (a capital G at the start and an exclamation mark at the end).
3. Click the button **"Send"**. Check that the page says "Encouragement sent to Ben C." and that the box is empty or has closed.
4. Look at the top right corner of the page. Click the small round button that shows your initials (**"OG"**). A small menu opens. Click **"Log out"** in that menu. Check that the Login page opens and says "You are logged out."
5. On the Login page click the box **"Email"**, type **buddy-ben@example.com**, click the box **"Password"**, type **Buddy-Test-78!** and click **"Log in"**. Check that the Dashboard page opens.
6. In the row of links across the top of the page, click **"Buddies"**. Check that the large title on the page says "Workout buddies" and that the web address in the long box at the top of the browser ends with /buddies.
7. Find the list with the heading "Encouragements for you". Check that it shows two messages, the newest first: first "Great session today, keep it up!" from "Olivia G.", and below it "Nice work on leg day!" from "Olivia G.". Each message shows who sent it and when.
8. Check that on the row for "Ben C." (yourself) there is the label "You" and no **"Encourage"** button, and that the row for "Olivia G." has an **"Encourage"** button.
9. Look at the top right corner of the page. Click the small round button that shows your initials (**"BC"**). A small menu opens. Click **"Log out"** in that menu. Check that the Login page opens and says "You are logged out."
10. On the Login page click the box **"Email"**, type **buddy-pete@example.com**, click the box **"Password"**, type **Buddy-Test-78!** and click **"Log in"**. Check that the Dashboard page opens.
11. In the row of links across the top of the page, click **"Buddies"**. Check that the large title on the page says "Workout buddies" and that the web address in the long box at the top of the browser ends with /buddies.
12. Check that the page shows "Late Starters" only, and that the list "Encouragements for you" shows neither "Great session today, keep it up!" nor "Nice work on leg day!" (it is empty or says there are no messages yet).

Expected outcome: Ben received the new message above his older one, and Pete, who is in a different group, cannot see either message.

## Acceptance Test 4: A message that cannot be sent keeps what you typed

### Setup for this test:

1. Connect to the UB VPN or use the campus network. If the next page does not open, you are not connected yet.
2. Open your web browser (Chrome, Safari or Firefox) and click this link: [Login page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login). A page titled "Log in to GymRank" opens.
3. Click once inside the white box **"Email"** so a blinking line appears, then type **buddy-olivia@example.com**
4. Click once inside the box **"Password"** and type **Buddy-Test-78!** (a capital B, a dash, a capital T, a dash, the number 78 and an exclamation mark).
5. Click the button **"Log in"** under the two boxes. Check that the Dashboard page opens (the word **"Dashboard"** is highlighted in the row of links across the top of the page).
6. In the row of links across the top of the page, click **"Buddies"**. Check that the large title on the page says "Workout buddies" and that the web address in the long box at the top of the browser ends with /buddies.
7. Check that the page shows the group name "Morning Lifters" and a row for "Ben C." with an **"Encourage"** button.

### Steps:

1. On the row for "Ben C." click **"Encourage"**. Leave the box **"Your message"** empty and click **"Send"**. Check that the message "Write a message of 1 to 140 characters." appears next to the box, and that the page does not say "Encouragement sent to Ben C."
2. Click inside the box **"Your message"** and press the space bar (the long key at the bottom of the keyboard) three times, so the box holds only blank spaces. Click **"Send"**. Check that the same message, "Write a message of 1 to 140 characters.", appears.
3. Erase the spaces with the Backspace key. Now copy the long line of numbers below: drag the mouse across the whole line while holding the left button, right-click on it and click "Copy". It is 141 characters long, which is one too many.

12345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890A

4. Click inside the box **"Your message"**, right-click and click "Paste". Check that the line of numbers appears in the box.
5. Click **"Send"**. Check that the message "Write a message of 1 to 140 characters." appears, and that the long line is still in the box (nothing you typed was lost).
6. Click at the very end of the line in the box and press the Backspace key once, so the last character, the letter A, is erased and 140 characters are left. Click **"Send"**. Check that the page says "Encouragement sent to Ben C."
7. Look at the row for "Olivia G." (yourself). Check that it has the label "You" and no **"Encourage"** button, so nobody can send a message to themselves.
8. Look at the top right corner of the page. Click the small round button that shows your initials (**"OG"**). A small menu opens. Click **"Log out"** in that menu. Check that the Login page opens and says "You are logged out."
9. On the Login page click the box **"Email"**, type **buddy-ben@example.com**, click the box **"Password"**, type **Buddy-Test-78!** and click **"Log in"**. Check that the Dashboard page opens.
10. In the row of links across the top of the page, click **"Buddies"**. Check that the large title on the page says "Workout buddies" and that the web address in the long box at the top of the browser ends with /buddies.
11. In the list "Encouragements for you", check that the newest message, at the top, is the long line of numbers that starts with 1234567890 and has no letter A at the end.

Expected outcome: an empty, blank or too long message is refused with the words "Write a message of 1 to 140 characters." and keeps what you typed, a message of exactly 140 characters is sent, and nobody can send a message to themselves.

## Acceptance Test 5: Join a group with a valid invite code

### Setup for this test:

1. Connect to the UB VPN or use the campus network. If the next page does not open, you are not connected yet.
2. Open your web browser (Chrome, Safari or Firefox) and click this link: [Login page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login). A page titled "Log in to GymRank" opens.
3. Click once inside the white box **"Email"** so a blinking line appears, then type **buddy-nina@example.com**
4. Click once inside the box **"Password"** and type **Buddy-Test-78!** (a capital B, a dash, a capital T, a dash, the number 78 and an exclamation mark).
5. Click the button **"Log in"** under the two boxes. Check that the Dashboard page opens (the word **"Dashboard"** is highlighted in the row of links across the top of the page).
6. Open a second tab to use later in Acceptance Test 6: click the small + button next to the last tab along the very top of the browser. In the new empty page, click the web address box at the top, type or paste this address and press the Enter key: https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/buddies
7. Check that this second tab shows "Workout buddies", "You're not in a group yet." and the box **"Invite code"**. Do not reload or use this second tab until Acceptance Test 6. Click the name of the first tab to go back to it.

### Steps:

1. In the row of links across the top of the page, click **"Buddies"**. Check that the large title on the page says "Workout buddies" and that the web address in the long box at the top of the browser ends with /buddies.
2. Check that the page says "You're not in a group yet." and shows a white box labelled **"Invite code"** and two buttons, **"Join group"** and **"Create a group"**. Check that no names of people are shown.
3. Click once inside the box **"Invite code"** and type **7KQ2MXP9** (the number 7, the capital letters K and Q, the number 2, the capital letters M, X and P, and the number 9). Check that the box shows 7KQ2MXP9.
4. Click the button **"Join group"**. Check that the text "You're not in a group yet." and the box "Invite code" disappear.
5. Check that the page now shows the group name "Morning Lifters" as a large title and the line "3 members".
6. Check that the list of members shows three rows in this order: "Olivia G." with the label "Owner", then "Ben C.", then "Nina P." with the label "You".
7. Check that the invite code 7KQ2MXP9 is not shown anywhere on the page (only the owner can see it), and that no email address is shown.
8. Check that the list "Encouragements for you" shows no messages yet (Nina joined after the messages were sent).
9. Reload the page (click the round arrow button at the top left of the browser, next to the web address). Check that "Morning Lifters", the line "3 members" and the same three rows are shown, and that the box "Invite code" does not come back.

Expected outcome: Nina is now a member of "Morning Lifters", which has 3 members, and she is still in it after the page is reloaded.

## Acceptance Test 6: Accepting the same invite twice does not add you again

### Setup for this test:

1. Run this straight after Acceptance Test 5. Nina is still logged in, and the second tab that you opened in the Setup of Acceptance Test 5 is still open. It has not been reloaded, so it still shows the box **"Invite code"** (it does not know that Nina has already joined).

### Steps:

1. Click the name of the second tab along the top of the browser. Check that it shows "You're not in a group yet." and the box **"Invite code"**.
2. In the second tab click the box **"Invite code"**, type **7KQ2MXP9** again and click **"Join group"**. Check that the message "You are already in a workout buddies group." appears.
3. In the second tab reload the page (click the round arrow button at the top left of the browser, next to the web address). Check that it now shows "Morning Lifters" and "3 members" (not 4), and that the box "Invite code" is gone.
4. Check that the list of members has exactly three rows, in this order: "Olivia G." (Owner), "Ben C." and "Nina P." (You), and that "Nina P." appears only once.

Expected outcome: the second attempt is refused with the words "You are already in a workout buddies group." and Nina is in the group only once.

## Acceptance Test 7: Create a group and see your invite code

### Setup for this test:

1. Connect to the UB VPN or use the campus network. If the next page does not open, you are not connected yet.
2. Open your web browser (Chrome, Safari or Firefox) and click this link: [Login page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login). A page titled "Log in to GymRank" opens.
3. Click once inside the white box **"Email"** so a blinking line appears, then type **buddy-cal@example.com**
4. Click once inside the box **"Password"** and type **Buddy-Test-78!** (a capital B, a dash, a capital T, a dash, the number 78 and an exclamation mark).
5. Click the button **"Log in"** under the two boxes. Check that the Dashboard page opens (the word **"Dashboard"** is highlighted in the row of links across the top of the page).

### Steps:

1. In the row of links across the top of the page, click **"Buddies"**. Check that the large title on the page says "Workout buddies" and that the web address in the long box at the top of the browser ends with /buddies.
2. Check that the page says "You're not in a group yet." and shows the button **"Create a group"**.
3. Click the button **"Create a group"**. Check that a box asking for the name of the group appears, with a button **"Create"** next to it.
4. Leave the box empty and click **"Create"**. Check that the message "Name your group in 1 to 40 characters." appears, and that no group is created (the page still says "You're not in a group yet.").
5. Click inside the name box and type **Cal's Crew** (a capital C, the letters a and l, an apostrophe, the letter s, a space, and the word Crew). Click **"Create"**.
6. Check that the page now shows the group name "Cal's Crew" as a large title and the line "1 member".
7. Check that the list of members has exactly one row, "Cal M.", with the labels "Owner" and "You".
8. Because Cal owns the group, check that the page shows the label "Invite code" with a code of exactly 8 characters made of capital letters and numbers (for example 9HX4T2KM), and the label "Expires" with a date about one week from today. This is the code Cal would give to a friend.
9. Reload the page (click the round arrow button at the top left of the browser, next to the web address). Check that "Cal's Crew", the line "1 member" and the same invite code are shown, and that the button "Create a group" is gone (a person can only be in one group).

Expected outcome: Cal has a new private group that he owns, with an invite code that only he can see.
