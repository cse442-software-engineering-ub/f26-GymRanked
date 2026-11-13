# Story #78 / Task #71: workout buddies backend, package for review

Sprint 4. Prepared 2026-11-11 for the November 11 review.

Story #78: *As a gym goer, I want to be able to join an invite-only workout buddies group and encourage other members, which is confirmed by being able to accept an invite and send a member an encouragement message.*

Task #71, *Build workout buddies group and invite backend*, stays under story #78. Samuel's #79, *Build workout buddies group page frontend*, builds on the same contract.

## 1. Where things stand

| Question from the brief | Answer |
| --- | --- |
| What did the last card review find? | #71 was a title only: no description and no tests. |
| What does the card hold now? | A full description: what it adds, the rules, who can do what, the contract, the storage changes, the seed accounts, five exact examples, setup and **10 task tests**. Story #78 holds **7 plain-language acceptance tests** for cattle testers. |
| Is the backend built? | Yes, on branch `71-Build-workout-buddies-group-and-invite-backend` (9 commits, titles 38 characters or fewer). It was built after the contract was written, so the review can compare the two. |
| What is verified? | On a local server and database: `tests/buddies-api.mjs` (9 groups of checks, run 4 times in a row, all passing), a wrong database password returns JSON 500 on all three endpoints, `php -l` on every new file, `npm run build`, and `npm test` (84 passed). |
| What is **not** verified yet? | The task tests have **not** been run on aptitude, and Samuel has not yet confirmed the contract for #79. Both come after this review. |
| November 13 target | One working invite and membership journey: a group is created, a second account joins with its code, and both see the members. The code for it already exists on the branch. See section 8. |

## 2. The invite method (one, in-app, no email)

An **invite code**. When someone creates a group, the server makes a code like `7KQ2MXP9` and shows it to the owner. The owner passes it to friends in person or by text message. A friend types it on the Workout buddies page. No email is sent, stored or required anywhere in this feature.

- 8 characters, capital letters A to Z (without I and O) and digits 2 to 9, so it is easy to read aloud.
- Valid for **7 days** from when the group is made.
- Unique across all groups.
- The server accepts capital letters only. The page turns what is typed into capitals before sending.

## 3. Who can do what

| Action | Who can do it |
| --- | --- |
| Create a group | Any logged-in user who is not in a group. They become the owner. |
| Accept an invite (join) | Any logged-in user who is not in a group and sends the code of a group whose code exists and has not expired. The owner does not have to approve. |
| See the invite code | Only the owner of the group. Every other member sees `null`. |
| See the group members | Only members of that group. Everyone else gets "no group" and learns nothing about any group. |
| Send an encouragement | A member of a group, to a **different** member of the **same** group. |
| Receive an encouragement | Only the person it was sent to sees it. The sender gets a confirmation only, and other members see nothing. |

Other rules:

- **One group per person.** The database enforces it, so two requests at the same moment still make one membership.
- **Names are shown as first name plus last initial** (for example "Olivia G."). No email address and no user id is ever returned. `member_id` is the id of the membership.
- **An encouragement is plain text,** 1 to 140 characters, trimmed. The page must show it as text, never as HTML.
- **Not in this task:** leaving or deleting a group, removing a member, a new invite code, a member limit, a limit on messages, email or push invites, and any frontend.

## 4. How it is stored

Migration `database/migrations/018_workout_buddies.sql` (016 is already used twice on dev, and 017 is taken by weekly123_test_runs). It only adds three tables, changes no existing row, and is safe to run twice. Times are UTC.

| Table | Holds | Key points |
| --- | --- | --- |
| `buddy_groups` | `name` (up to 40), `owner_id`, `invite_code`, `invite_expires_at`, `created_at` | `invite_code` is unique. Deleting the owner deletes the group. |
| `buddy_members` | `group_id`, `user_id`, `joined_at` (the owner has a row too) | `user_id` is unique: this is what makes it one group per person. Its `id` is the `member_id` the API returns. |
| `buddy_encouragements` | `group_id`, `sender_id`, `recipient_id`, `message` (up to 140), `created_at` | An index on the recipient makes the inbox query fast. Deleting a user deletes their messages. |

Existing local and shared databases are brought up to date by running the migration file (the apply commands are in its top comment).

## 5. How it is returned

Three endpoints. The user always comes from the session cookie, so nothing in a request can name another user.

| Request | Success |
| --- | --- |
| `GET api/buddy_group.php` | `200` the group view |
| `POST api/buddy_group.php {"create":true,"name":"Morning Lifters"}` | `201` the group view, caller is the owner |
| `POST api/buddy_join.php {"code":"7KQ2MXP9"}` | `200` the group view, after joining |
| `POST api/buddy_encourage.php {"member_id":12,"message":"Great session today, keep it up!"}` | `201` `{"encouragement":{"id":5,"to":"Ben C.","message":"Great session today, keep it up!","sent_at":"2026-11-13T15:04:05Z"}}` |

**The group view** is returned the same way every time:

```json
{
  "group": {
    "name": "Morning Lifters",
    "member_count": 3,
    "invite_code": null,
    "invite_expires_at": null,
    "members": [
      { "member_id": 11, "name": "Olivia G.", "is_me": false, "is_owner": true },
      { "member_id": 12, "name": "Ben C.",    "is_me": false, "is_owner": false },
      { "member_id": 15, "name": "Nina P.",   "is_me": true,  "is_owner": false }
    ]
  },
  "me": { "member_id": 15, "is_owner": false },
  "encouragements": [
    { "id": 4, "from": "Olivia G.", "message": "Nice work on leg day!", "sent_at": "2026-11-13T15:00:00Z" }
  ]
}
```

Members are listed owner first, then by when they joined. `encouragements` are the last 20 sent to the caller, newest first. For the owner, `invite_code` is the code and `invite_expires_at` is an ISO UTC time ending in `Z`. A caller in no group gets `{"group":null,"me":null,"encouragements":[]}` with status 200, which is not an error.

**Errors** are always JSON:

| Status | Body | When |
| --- | --- | --- |
| 401 | `{"error":"Please log in."}` | no valid session |
| 405 | `{"error":"Method not allowed."}` plus an `Allow` header | wrong method |
| 400 | `{"error":"Send a valid JSON object."}` | the body is not JSON |
| 400 | `{"error":"Invalid request.","errors":{"code":"Enter the 8-character invite code."}}` | join: code missing or not 8 allowed characters |
| 409 | `{"error":"You are already in a workout buddies group."}` | join or create when already in a group (checked before the code is looked up) |
| 404 | `{"error":"That invite code isn't valid or has expired."}` | join: no such code, or its 7 days are over (same words for both) |
| 400 | `errors.name` "Name your group in 1 to 40 characters." | create |
| 400 | `errors.member_id` "Choose a member of your group." or "You can't encourage yourself." | encourage |
| 400 | `errors.message` "Write a message of 1 to 140 characters." | encourage |
| 404 | `{"error":"Group not found."}` | encourage by someone with no group |
| 404 | `{"error":"Member not found."}` | encourage someone who is not in your group |
| 500 | `{"error":"Database error"}` | a query failed; nothing is half-saved |

## 6. The five exact examples

`API` is the site's `/api` address. `NIN`, `OMA`, `PET`, `OLI` and `BEN` mean a request made while logged in as Nina, Omar, Pete, Olivia or Ben. The member ids shown are examples: the seed prints the real ones.

**1. Valid invite.** Nina is in no group and posts Olivia's code.

```
NIN POST $API/buddy_join.php   {"code":"7KQ2MXP9"}
→ 200  the group view above: Morning Lifters, member_count 3, invite_code null,
       members Olivia G. (owner), Ben C., Nina P. (is_me true)
```

**2. Invalid invite.** Omar tries codes that do not work. Nothing is created.

```
OMA POST $API/buddy_join.php   {"code":"ZZZZZZZZ"}
→ 404  {"error":"That invite code isn't valid or has expired."}

OMA POST $API/buddy_join.php   {"code":"4MXT8H2R"}        (expired yesterday)
→ 404  the same message

OMA POST $API/buddy_join.php   {"code":"7KQ2"}            (also "7kq2mxp9")
→ 400  {"error":"Invalid request.","errors":{"code":"Enter the 8-character invite code."}}
```

**3. Accepting twice.** The same request again, and a person who is in another group.

```
NIN POST $API/buddy_join.php   {"code":"7KQ2MXP9"}        (Nina is already in)
→ 409  {"error":"You are already in a workout buddies group."}

PET POST $API/buddy_join.php   {"code":"7KQ2MXP9"}        (Pete owns Late Starters)
→ 409  the same message        member_count stays 3
```

**4. Outside account.** Omar is in no group.

```
OMA GET  $API/buddy_group.php
→ 200  {"group":null,"me":null,"encouragements":[]}

OMA POST $API/buddy_encourage.php   {"member_id":12,"message":"Hi"}
→ 404  {"error":"Group not found."}

BEN POST $API/buddy_encourage.php   {"member_id":<Pete's member id>,"message":"Hi"}
→ 404  {"error":"Member not found."}
```

**5. Failed request.**

```
OLI POST $API/buddy_encourage.php   {"member_id":12,"message":"<141 characters>"}
→ 400  {"error":"Invalid request.","errors":{"message":"Write a message of 1 to 140 characters."}}
       and nothing is saved

any endpoint, database unavailable
→ 500  {"error":"Database error"}                          (plain JSON, never a PHP error page)
```

## 7. Safe prepared accounts

Six fake accounts, all `@example.com` addresses that can never belong to a real person, all with the password `Buddy-Test-78!` (only a salted hash is stored), all with first-time setup finished and marked as test accounts so they never appear on a leaderboard.

| Account | Email | Role |
| --- | --- | --- |
| Olivia Grant | `buddy-olivia@example.com` | Owner of "Morning Lifters", code `7KQ2MXP9` |
| Ben Cruz | `buddy-ben@example.com` | Member of "Morning Lifters", one message waiting |
| Nina Park | `buddy-nina@example.com` | No group, joins with the code |
| Cal Moss | `buddy-cal@example.com` | No group, creates a group |
| Omar Reyes | `buddy-omar@example.com` | No group, never joins (the outside account) |
| Pete Lowe | `buddy-pete@example.com` | Owner of "Late Starters", whose code `4MXT8H2R` expired yesterday |

The seed (`database/seeds/workout_buddies.sql`) **adds only these accounts and touches no other account or group.** Loading it again resets just these six, their groups and their messages, so a test run can always be started over. It can be loaded on any day.

## 8. Tests and evidence

- **Card #71, 10 task tests.** Migration and seed (twice), login and methods, valid invite, invalid invite, accepting twice, outside account, encouragement, create group, database error (local), nothing else broke. Each has exact inputs and exact expected results.
- **Story #78, 7 acceptance tests** written for someone with no technical knowledge, run on the cattle site with click-by-click steps. They use the same five examples and the same six accounts.
- **`tests/buddies-api.mjs`** runs the same checks against a local server, including six simultaneous joins and six simultaneous creates (exactly one succeeds each time).
- **Local run:** all passing; `npm run build` and `npm test` (84 tests) pass.
- **Still to run:** the card's tests on aptitude, and the story's tests on cattle.

## 9. Agreement with Samuel (#79)

Samuel builds the page from the same material, so the page and the API cannot disagree:

| What the API returns | What the page shows |
| --- | --- |
| `"group": null` | "You're not in a group yet." with an "Invite code" box and the buttons "Join group" and "Create a group" |
| 404 on join | "That invite code isn't valid or has expired." |
| 400 on join | "Enter the 8-character invite code." |
| 409 on join or create | "You are already in a workout buddies group." |
| 400 on create | "Name your group in 1 to 40 characters." |
| a group view | the group name, "3 members" (or "1 member"), one row per member with "Owner" and "You" labels, an "Encourage" button on every other member |
| owner's group view | also "Invite code" and "Expires" |
| 201 on encourage | "Encouragement sent to Ben C." |
| 400 on encourage | "Write a message of 1 to 140 characters." and the typed text is kept |
| `encouragements` | a list headed "Encouragements for you", newest first, shown as plain text |

The page is reached from a new **Buddies** link in the top navigation (`#/buddies`). Samuel confirms the wording when he writes #79's tests.

## 10. What was asked for by November 11

| Asked for | Where it is |
| --- | --- |
| Exact inputs and results | Section 6, and the full tests on card #71 |
| Proposed storage changes | Section 4, `database/migrations/018_workout_buddies.sql` |
| Tests | Section 8: 10 task tests on #71, 7 acceptance tests on #78, `tests/buddies-api.mjs` |
| A safe set of prepared accounts | Section 7, `database/seeds/workout_buddies.sql` |
| Who can accept, see members, send and receive | Section 3 |
| One simple in-app invite method, no email | Section 2 |
| The same examples and response details as #79 | Sections 6 and 9 |

## 11. Proposed November 13 target (if the review selects it)

**One working invite and membership journey:**

1. Cal creates a group and sees its invite code (task test 8).
2. A second account types the code and joins (task test 3).
3. Both accounts see the members, and only the owner sees the code (task tests 3 and 6).

Sending an encouragement (task test 7) follows. The backend for all of it is already on the branch, so the remaining work is running the tests on aptitude, Samuel's page, and the review itself.
