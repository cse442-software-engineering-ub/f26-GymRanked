# Story #78 / Task #79: workout buddies page, package for review

Sprint 4. Prepared 2026-11-11 for the November 11 review.

Story #78: *As a gym goer, I want to be able to join an invite-only workout buddies group and encourage other members, which is confirmed by being able to accept an invite and send a member an encouragement message.*

Task #79, *Build workout buddies group page frontend*, stays under story #78. It builds the page on Mansur's #71 backend, using the contract, accounts and examples in [`71-workout-buddies-package.md`](https://github.com/cse442-software-engineering-ub/f26-GymRanked/blob/71-Build-workout-buddies-group-and-invite-backend/task-tests/71-workout-buddies-package.md) (on branch `71-Build-workout-buddies-group-and-invite-backend`; it sits next to this file once both branches are merged).

## 1. Where things stand

| Question from the brief | Answer |
| --- | --- |
| What did the last card review find? | No written instructions and no tests. #79 was a title only. |
| What does the card hold now? | The screen flow (every screen, message, button and loading state), the phone and keyboard rules, the values agreed with #71, the open points, and **12 task tests** on aptitude. |
| Is there an example of the screens? | Yes. Screenshots of all 19 screens at desktop and phone width are in section 3. The clickable version is [`79-workout-buddies-prototype.html`](79-workout-buddies-prototype.html), next to this file: open it in a browser. It shows all 19 screens and can be clicked through as any of the six test accounts, with switches for a slow or failed request, phone width and light mode. It uses a fake copy of #71's responses in the page, so it needs no server. |
| Is the page built? | No. Programming starts after the review. |
| What is verified? | The example: clicked through as the six accounts (join, wrong and expired codes, the 140-character limit, Escape and focus, sending, a failed send and retry, creating a group), no console errors, no sideways scrolling at 390 and 320 px, every phone button at least 44 px. The nav: a seventh link was added to the running app on dev and measured (section 6). |
| What is **not** verified yet? | The card's task tests, which need the page and #71's backend on aptitude. On 2026-11-11 the pushed #71 branch holds only Mansur's package file, so the endpoints, migration and seed are not on GitHub yet (section 9). |
| November 13 target | The real invite and membership journey on aptitude: open the page, join with a code, see the members, create a group (task tests 1 to 5, 8 and 9). See section 11. |

## 2. Where the page lives

- A **Buddies** link at the end of the top navigation and in the phone menu opens `#/buddies`. It is highlighted like the other links (`aria-current="page"`).
- Behind login like every signed-in page: a logged-out visitor, or any request that returns 401, goes to the login page.
- Page heading **"Workout buddies"**, then "A private group for encouraging each other. Only members can see it."
- Not in this task: leaving a group, removing a member, a new invite code, a member limit, email or push invites, notifications, a badge on other pages, an open feed or general chat.

## 3. The screens

The numbers match the screen list in the example.

| # | Screen | Who (seed) | What the page shows |
| --- | --- | --- | --- |
| 01 | Loading | anyone | "Loading your workout buddies…" until the server answers. It never shows "You're not in a group yet." before then. |
| 02 | Load failed | anyone | "Couldn't load your workout buddies. Check your connection and try again." with **Try again**. No join form and no group. |
| 03 | Not in a group | Omar, Nina, Cal | "You're not in a group yet." / "Join a friend's group with their invite code, or start your own." / **Invite code \*** with the hint "8 letters and numbers, for example 7KQ2MXP9. Ask the group's owner for it." / **Join group** / "or" / **Create a group** |
| 04 | Code too short | Omar | "Enter the 8-character invite code." under the box. No request is sent. |
| 05 | Wrong or expired code | Omar | "That invite code isn't valid or has expired." under the box, the code still in it. |
| 06 | Joining… | Nina | The button says "Joining…" and is disabled; a second click sends nothing. |
| 07 | Join failed | Omar | "Couldn't join the group. Check your connection and try again." The code stays and **Join group** tries again. |
| 08 | Already in a group | Nina's second tab | "You are already in a workout buddies group." with **Show my group**. |
| 09 | Create a group | Cal | **Group name \*** with "Up to 40 characters. Members see this name.", **Create** and **Cancel**. Empty or blank: "Name your group in 1 to 40 characters." |
| 10 | Group created | Cal | "You created Cal's Crew. Share the invite code below so friends can join." and the owner view with 1 member. |
| 11 | Joined | Nina | "You joined Morning Lifters.", then "Your group", **Morning Lifters**, "3 members", rows Olivia G. (Owner), Ben C., Nina P. (You). No invite code. |
| 12 | Owner view | Olivia | Also an **Invite code** panel: `7KQ2MXP9`, "Expires Nov 18, 2026, 10:00 AM" (New York time) and "Share it in person or by text. Anyone with the code can join until it expires." |
| 13 | Owner, code expired | Pete | "Expired …" and "This code no longer works, so nobody new can join. Getting a new code isn't part of this version." |
| 14 | Writing a message | Olivia | Under Ben's row: "To Ben C.", **Your message \***, "Only Ben C. will see this. Up to 140 characters.", a counter "32/140", **Send** and **Cancel**. |
| 15 | Empty message | Olivia | "Write a message of 1 to 140 characters." under the box. No request is sent. |
| 16 | Send failed | Olivia | "Couldn't send your encouragement. Check your connection and try again." The message stays and **Send** tries again. |
| 17 | Sent | Olivia | "Encouragement sent to Ben C." The form closes; Olivia's own list stays empty. |
| 18 | Ben receives it | Ben | "Encouragements for you": "Olivia G." · time · "Great session today, keep it up!", above "Nice work on leg day!". |
| 19 | Other members see nothing | Nina | "No encouragements yet. When someone in your group encourages you, it appears here." |

### Screenshots: every screen at desktop and phone width

Taken from the example file in dark mode (the app's default) at desktop width and at 375 px, the phone width the Playwright tests use. The files are in [`79-screens/`](79-screens/). Dates and times are from when the screenshots were taken.

| # | Screen | Desktop | Phone (375 px) |
| --- | --- | --- | --- |
| 01 | Loading | <img src="79-screens/01-loading-desktop.jpg" alt="Loading, desktop" width="420"> | <img src="79-screens/01-loading-phone.jpg" alt="Loading, phone" width="170"> |
| 02 | Load failed | <img src="79-screens/02-load-failed-desktop.jpg" alt="Load failed, desktop" width="420"> | <img src="79-screens/02-load-failed-phone.jpg" alt="Load failed, phone" width="170"> |
| 03 | Not in a group | <img src="79-screens/03-no-group-desktop.jpg" alt="Not in a group, desktop" width="420"> | <img src="79-screens/03-no-group-phone.jpg" alt="Not in a group, phone" width="170"> |
| 04 | Code too short | <img src="79-screens/04-code-short-desktop.jpg" alt="Code too short, desktop" width="420"> | <img src="79-screens/04-code-short-phone.jpg" alt="Code too short, phone" width="170"> |
| 05 | Wrong or expired code | <img src="79-screens/05-code-wrong-desktop.jpg" alt="Wrong or expired code, desktop" width="420"> | <img src="79-screens/05-code-wrong-phone.jpg" alt="Wrong or expired code, phone" width="170"> |
| 06 | Joining… | <img src="79-screens/06-joining-desktop.jpg" alt="Joining…, desktop" width="420"> | <img src="79-screens/06-joining-phone.jpg" alt="Joining…, phone" width="170"> |
| 07 | Join failed | <img src="79-screens/07-join-failed-desktop.jpg" alt="Join failed, desktop" width="420"> | <img src="79-screens/07-join-failed-phone.jpg" alt="Join failed, phone" width="170"> |
| 08 | Already in a group | <img src="79-screens/08-already-desktop.jpg" alt="Already in a group, desktop" width="420"> | <img src="79-screens/08-already-phone.jpg" alt="Already in a group, phone" width="170"> |
| 09 | Create a group, empty name | <img src="79-screens/09-create-form-desktop.jpg" alt="Create a group, empty name, desktop" width="420"> | <img src="79-screens/09-create-form-phone.jpg" alt="Create a group, empty name, phone" width="170"> |
| 10 | Group created | <img src="79-screens/10-created-desktop.jpg" alt="Group created, desktop" width="420"> | <img src="79-screens/10-created-phone.jpg" alt="Group created, phone" width="170"> |
| 11 | Joined (member view) | <img src="79-screens/11-joined-desktop.jpg" alt="Joined (member view), desktop" width="420"> | <img src="79-screens/11-joined-phone.jpg" alt="Joined (member view), phone" width="170"> |
| 12 | Owner view | <img src="79-screens/12-owner-desktop.jpg" alt="Owner view, desktop" width="420"> | <img src="79-screens/12-owner-phone.jpg" alt="Owner view, phone" width="170"> |
| 13 | Owner, code expired | <img src="79-screens/13-expired-desktop.jpg" alt="Owner, code expired, desktop" width="420"> | <img src="79-screens/13-expired-phone.jpg" alt="Owner, code expired, phone" width="170"> |
| 14 | Writing a message | <img src="79-screens/14-compose-desktop.jpg" alt="Writing a message, desktop" width="420"> | <img src="79-screens/14-compose-phone.jpg" alt="Writing a message, phone" width="170"> |
| 15 | Empty message | <img src="79-screens/15-compose-error-desktop.jpg" alt="Empty message, desktop" width="420"> | <img src="79-screens/15-compose-error-phone.jpg" alt="Empty message, phone" width="170"> |
| 16 | Send failed | <img src="79-screens/16-send-failed-desktop.jpg" alt="Send failed, desktop" width="420"> | <img src="79-screens/16-send-failed-phone.jpg" alt="Send failed, phone" width="170"> |
| 17 | Sent | <img src="79-screens/17-sent-desktop.jpg" alt="Sent, desktop" width="420"> | <img src="79-screens/17-sent-phone.jpg" alt="Sent, phone" width="170"> |
| 18 | Ben receives it | <img src="79-screens/18-recipient-desktop.jpg" alt="Ben receives it, desktop" width="420"> | <img src="79-screens/18-recipient-phone.jpg" alt="Ben receives it, phone" width="170"> |
| 19 | Other members see nothing | <img src="79-screens/19-others-desktop.jpg" alt="Other members see nothing, desktop" width="420"> | <img src="79-screens/19-others-phone.jpg" alt="Other members see nothing, phone" width="170"> |

Light mode and the phone menu:

| Screen | Desktop | Phone (375 px) |
| --- | --- | --- |
| 14 Writing a message, light | <img src="79-screens/light-compose-desktop.jpg" alt="Writing a message, light mode, desktop" width="420"> | <img src="79-screens/light-compose-phone.jpg" alt="Writing a message, light mode, phone" width="170"> |
| 05 Wrong or expired code, light | <img src="79-screens/light-code-wrong-desktop.jpg" alt="Wrong or expired code, light mode, desktop" width="420"> | <img src="79-screens/light-code-wrong-phone.jpg" alt="Wrong or expired code, light mode, phone" width="170"> |
| Phone menu with Buddies | (desktop shows the links in the top bar, above) | <img src="79-screens/20-phone-menu-phone.jpg" alt="Phone menu with Buddies marked as the current page" width="170"> |

## 4. Messages and buttons, by response

Every wording in section 9 of Mansur's package is used exactly. The page shows the server's own words for 400, 404 and 409, and its own words for anything else.

| Request and result | What the page shows |
| --- | --- |
| GET `buddy_group.php` 200, `"group": null` | Screen 03 |
| GET 200 with a group | Screens 11 to 13: name, "3 members" / "1 member", owner first then by join time, "Owner" and "You" labels, **Encourage** on every other member |
| GET fails (network, 500, anything but 200 or 401) | Screen 02 |
| Join, invite code fails the page's own check | "Enter the 8-character invite code." (same rule as #71: `^[A-HJ-NP-Z2-9]{8}$`) |
| Join 400 / 404 / 409 | "Enter the 8-character invite code." / "That invite code isn't valid or has expired." / "You are already in a workout buddies group." with **Show my group** |
| Join 200 | "You joined Morning Lifters." and the group; focus moves to the group's name |
| Join fails | "Couldn't join the group. Check your connection and try again." |
| Create 400 / 409 | "Name your group in 1 to 40 characters." / the same 409 box as join |
| Create 201 | "You created Cal's Crew. Share the invite code below so friends can join." |
| Create fails | "Couldn't create the group. Check your connection and try again." |
| Encourage, empty or blank (page's own check) | "Write a message of 1 to 140 characters." |
| Encourage 400 | the server's `errors.message` or `errors.member_id` under the box |
| Encourage 201 | "Encouragement sent to Ben C."; focus goes back to Ben's **Encourage** |
| Encourage 404 Member not found | "Ben C. isn't in your group any more." and the list loads again |
| Encourage fails | "Couldn't send your encouragement. Check your connection and try again." |

Success messages use `role="status"` and errors `role="alert"`. Errors about one box go under that box with a red outline, `aria-invalid` and `aria-describedby`.

## 5. Loading behaviour

- First load: screen 01 in place of the content (`aria-busy="true"`).
- Join, Create and Send: the button changes to "Joining…", "Creating…" or "Sending…" and is disabled, the box can't be changed, and a second click sends nothing, so one click makes one request.
- After a successful action the page shows the server's reply at once (the same group view), with no second loading screen.
- When the tab comes back into view the page loads the group again quietly, keeping what is on screen, so a new member or a new message shows without a manual reload. A failed quiet reload changes nothing.

## 6. Who receives an encouragement, and how they see it

- Only the member it was sent to. The form says so before sending ("Only Ben C. will see this.").
- They see it the next time they open Workout buddies, or come back to the tab, at the top of **Encouragements for you**: the sender ("Olivia G."), the time in New York time ("Nov 13, 10:04 AM") and the text. Newest first, the 20 newest that #71 returns.
- The text is shown as plain text, never as HTML, and long words wrap inside the card.
- There is no notification, email or badge. The sender sees only "Encouragement sent to Ben C.", and other members see nothing.

## 7. Phone and keyboard checks

**Phone (640 px or less):** Buddies is in the phone menu; 16 px side margins; the invite code box and **Join group** stack at full width; member rows keep the name and labels on the left and **Encourage** on the right; the message form uses the full width. Every button and box is at least 44 px tall and wide. No sideways scrolling at 375 or 320 px. Tablet (768 px): the desktop layout in one column.

**Navigation width (measured):** with a seventh link the desktop links fit on one row at 1440, 1280, 1024, 900, 768 and 700 px, and the phone menu takes over at 640 px. Between 641 and about 700 px they wrap to a second row (today's six links don't). The course allows one row only, so #79 narrows the gap between links from 641 to 900 px. Task test 1 checks one row at 641, 700 and 768 px.

**Keyboard:** every control is a real button, link, input or textarea, reached with Tab in screen order, with the app's focus ring. Enter in **Invite code** joins and Enter in **Group name** creates. Space or Enter presses **Encourage**, **Send** and **Cancel**. Escape closes the open form and puts focus back on the button that opened it. Opening the message form puts focus in the box.

**Input limits (course UI rules):** the invite code box turns letters into capitals, drops spaces and stops at 8 characters; the group name stops at 40; the message stops at 140 characters, counted as characters (an emoji is one), the same count #71 uses. Required boxes are marked with \* and every format is shown before typing.

## 8. Same accounts and values as #71

Taken from Mansur's package, sections 5 to 7, with no changes:

| Account (password `Buddy-Test-78!`) | Role | Used in task tests |
| --- | --- | --- |
| `buddy-olivia@example.com` | Owner of Morning Lifters, code `7KQ2MXP9` | 6, 7, 10, 11 |
| `buddy-ben@example.com` | Member of Morning Lifters, one message waiting | 6, 7, 10 |
| `buddy-nina@example.com` | No group, joins | 4, 5, 6 |
| `buddy-cal@example.com` | No group, creates a group | 8 |
| `buddy-omar@example.com` | No group, the outside account | 1, 2, 3, 10 |
| `buddy-pete@example.com` | Owner of Late Starters, code `4MXT8H2R` expired yesterday | 5, 6, 9 |

Mansur's five examples map to the page like this: **valid invite** = screen 11 (task test 4); **invalid invite** = screens 04 and 05 (task test 3); **accepting twice** = screen 08 (task test 5); **outside account** = screen 03 for Omar (task test 2); **failed request** = screens 02, 07 and 16 (task test 10).

## 9. Open points for Mansur and the review

1. **Message length.** Mansur's section 9 says a 400 on encourage keeps the typed text, and story #78's Acceptance Test 4 (steps 3 to 6) pastes 141 characters and expects "Write a message of 1 to 140 characters.". The course UI rules say a box must not accept more than its limit, so this page's box stops at 140: the paste keeps the first 140 characters (counter "140/140", no letter A) and **Send** sends it. Proposed new steps 3 to 6: paste the line, check 140/140 and no A, click Send, check "Encouragement sent to Ben C.". Step 11 stays, and #71's API check for 141 characters stays.
2. **The backend code.** Mansur's package says the backend is built (9 commits, `tests/buddies-api.mjs` passing locally). On 2026-11-11 the pushed branch `71-Build-workout-buddies-group-and-invite-backend` holds only the package file: no `api/buddy_*.php`, no `017_workout_buddies.sql`, no seed. #79's tests need them pushed and on aptitude.
3. **Expired code for its owner.** Section 5 of Mansur's package returns the code to the owner whether or not it has expired, which screen 13 relies on. To check against the code once it is pushed.
4. **Story file and story checks.** The repository needs `stories/78-workout-buddies.md` (AGENTS.md: added by the task that starts work on the story); #79 adds it, copied from card #78. Story #78 has no Playwright task card, so its automated checks are not part of #79.
5. **Story #78 on a phone.** Story #78 has no phone or failed-request test, and its "row of links across the top of the page" is a menu on a phone. #79's task tests 10 and 11 cover both.

## 10. Tests

**Card #79, 12 task tests on aptitude** (all on the card, with exact steps, inputs and results):

1. Buddies opens the page, needs a login, and the navigation stays on one row
2. Someone outside a group sees the join screen and nothing about any group (outside account)
3. A wrong, short or expired invite code is refused (invalid invite)
4. A valid invite joins the group, and the group stays after a reload (valid invite)
5. Accepting the invite twice does not add you again (already joined)
6. An encouragement reaches only the member it was sent to, and they see who sent it and when
7. The message box checks its length, keeps your text, and shows messages as plain text
8. Create a group and see your own invite code
9. An expired invite code is labelled for its owner
10. Loading, failed requests and retry keep what you typed (failed request)
11. Phone and tablet widths, both themes, and theme colours only
12. Build, unit tests (`tests/buddiesFormat.test.js`) and the other stories still pass

Three Console lines on the card (PAGE MATCHES API, NAV ROWS, PHONE CHECK) compare the page with `buddy_group.php`, count navigation rows, and check sideways scrolling and 44 px targets, so each check has one exact expected line.

## 11. What was asked for by November 11

| Asked for | Where it is |
| --- | --- |
| A clickable or screen-by-screen example of the normal journey | Section 3 (screenshots at desktop and phone width), screens 03, 06, 11, 12, 14, 17, 18; the clickable example file |
| Invalid-invite, already-joined and failed-request states | Screens 04, 05, 08, 02, 07, 16 |
| Who receives the encouragement and how that person sees it | Section 6; screens 17 to 19 |
| The screen's messages, buttons and loading behaviour | Sections 4 and 5 |
| Phone and keyboard checks | Section 7; task tests 1, 6, 8 and 11 |
| The same prepared accounts and returned values as #71 | Section 8 |
| Feeds, general chat and notification delivery left out | Section 2 |

## 12. Proposed November 13 target (if the review selects it)

**The real invite and membership journey on aptitude**, with #71's backend deployed:

1. Omar opens Buddies and sees the join screen; a wrong or expired code is refused (task tests 1 to 3).
2. Nina joins Morning Lifters with `7KQ2MXP9` and sees the three members; a second try is refused (task tests 4 and 5).
3. Cal creates a group and sees his invite code; Pete sees his expired code labelled (task tests 8 and 9).

Sending and receiving an encouragement (task tests 6 and 7) follows.
