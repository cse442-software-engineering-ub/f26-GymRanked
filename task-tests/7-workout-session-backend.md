# Task tests: Story #7 backend (workout sessions, sets, completion, history)

Paste these into the backend task card's description before it moves to In Progress. Format and rules:
`TestingAndDebuggingGuide.md` section 5. Run every test in order on aptitude, as written.

The backend (card #105) is built and `node tests/workout-session-api.mjs` runs the same scenarios against a local server and database (see
`TestingAndDebuggingGuide.md` → Checks). Run that script first; these steps are the by-hand version for aptitude.

## Contract these tests assume (agree on it with Nicholas and the other feature owners before coding)

Units: weight is pounds (`weight_lb`, number, 0 to 1500, at most 2 decimal places, 0 = bodyweight). Reps is a whole
number from 1 to 100. Times are set by the server only (any time the client sends is ignored) and are UTC strings like `2026-10-13T19:27:47Z`. All responses are JSON; errors are `{"error": "...", "errors"?: {...}}`.
The frontend already codes against the first three rows (`src/workoutLog/workoutLogApi.js` on branch
`102-Daily-Logging-Frontend`); the other rows are proposed here and need Nicholas's OK.

| Endpoint | Request | Success | Status |
| --- | --- | --- | --- |
| `POST api/workout_sets.php` | `{session_id, exercise, set_number, weight_lb, reps}` | `{"set": {id, exercise, set_number, weight_lb, reps, logged_at, updated_at}}` | 201 |
| `POST api/workout_sets.php` | `{id, weight_lb, reps}` (correction) | `{"set": {...}}` | 200 |
| `POST api/complete_workout.php` | `{session_id}` | `{session_id, completed_at}` | 200 |
| `POST api/workout_session.php` | `{}` or `{"day_position": 1}` | `{"session": {...}}`: creates today's session, or returns the unfinished (or already completed) one | 201 new, 200 existing |
| `GET api/workout_session.php?id=N` | | `{"session": {...}}` | 200 |
| `GET api/workout_history.php` | | `{"sessions": [...]}` completed only, newest first | 200 |

`session` = `{id, plan, name, focus, started_at, completed_at, exercises: [{name, sets: [{id, set_number, weight_lb, reps, logged_at, updated_at}]}], summary}`.
`logged_at` is when the set was first saved and never changes; `updated_at` is the last correction (equal to `logged_at` until corrected).
`summary` is `null` until the workout is completed, then `{exercise_count, set_count, total_reps, total_volume_lb, duration_seconds}`
(`total_volume_lb` = sum of weight × reps; `exercise_count` counts exercises with at least one set; `duration_seconds` = `completed_at` − `started_at`, a whole number).
The user's current session is their most recent session that started within the last 24 hours, finished or not: `POST workout_session.php` returns it (200),
and creates a new one (201) only when there is none, so a user gets one workout per 24 hours and the answer doesn't depend on time zones.
`exercises` come from the user's current plan day, in order. Without `day_position` the day is today's scheduled
training day; on a rest day the server answers 409 `{"error":"Rest day"}`. `day_position` (1, 2, 3...) picks that plan
day instead, so tests don't depend on the weekday.
History item = `{id, name, plan, started_at, completed_at, duration_seconds, exercise_count, set_count, total_volume_lb}`, ordered by `completed_at`, newest first.
Errors: 400 bad input (per-field `errors.weight_lb` / `errors.reps`), 401 not logged in, 404 unknown session or set
(including another user's), 405 wrong method, 409 workout already completed, duplicate set, rest day or no workout plan selected, 415 body isn't JSON, 500 `{"error":"Database error"}`.

## Setup for all tests

1. Connect to the UB VPN or the campus network.
2. Load the seed in `database/seeds/README.md` on aptitude (Marcus Malone and Dana Lee are used below), then apply the
   new migration `database/migrations/009_workout_sessions.sql` (Test 1 does this).
3. In a terminal, set the variables and log both users in. Each user gets their own cookie file:

   ```bash
   API=https://aptitude.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/api
   J='Content-Type: application/json'
   curl -s -c marcus.jar -H "$J" -d '{"email":"marcus.malone@example.com","password":"Marcus-Bench225!"}' $API/login.php
   curl -s -c dana.jar   -H "$J" -d '{"email":"dana.lee@example.com","password":"Dana-Squat315!"}' $API/login.php
   ```

4. Give both users the "Push Pull Legs" plan (its `id` is in `$API/plans.php`; it is `1` after migration 004):

   ```bash
   curl -s -b marcus.jar -H "$J" -d '{"plan_id":1}' $API/current_plan.php
   curl -s -b dana.jar   -H "$J" -d '{"plan_id":1}' $API/current_plan.php
   ```

5. Run `DELETE FROM workout_sessions;` in phpMyAdmin (team database) so every run starts clean. Before Test 1 the
   table doesn't exist yet, so skip this step the first time.

Write `M` for Marcus's commands (`curl -s -b marcus.jar -H "$J"`) and `D` for Dana's (`curl -s -b dana.jar -H "$J"`).

---

Test 1: Migration creates the tables and can be re-run
1. In phpMyAdmin (aptitude, team database) open the SQL tab and paste `database/migrations/009_workout_sessions.sql`. Click Go.
2. Run `SHOW TABLES LIKE 'workout_%';`
3. Run `DESCRIBE workout_sets;` and `DESCRIBE workout_sessions;`
4. Paste and run the migration file a second time.
5. Run `SELECT COUNT(*) FROM workout_sessions;`

Expected outcome: step 1 reports success. Step 2 lists `workout_sessions` and `workout_sets` (plus the existing
`workout_plans`, `workout_plan_days`, `workouts`). Step 3: `workout_sets` has `id`, `session_id`, `exercise`,
`set_number`, `weight_lb` (DECIMAL(6,2)), `reps` (a whole-number type), `logged_at` and `updated_at` (timestamps, set by the database), and a unique key on
(`session_id`, `exercise`, `set_number`); `workout_sessions` has `id`, `user_id`, `plan_id`, `day_name`, `started_at` (set by the server in UTC),
`completed_at` (NULL allowed), with a foreign key from `user_id` to `users` that deletes the sessions when the user
is deleted. Step 4 reports no error and changes nothing. Step 5 returns `0`. The file's top comment says how to apply it
locally, on aptitude and on cattle, as the other migrations do.

Test 2: Every endpoint requires a logged-in user
1. Run each of these with no cookie:
   `curl -s -w ' %{http_code}\n' -H "$J" -d '{}' $API/workout_session.php`
   `curl -s -w ' %{http_code}\n' "$API/workout_session.php?id=1"`
   `curl -s -w ' %{http_code}\n' -H "$J" -d '{"session_id":1,"exercise":"Bench press","set_number":1,"weight_lb":135,"reps":8}' $API/workout_sets.php`
   `curl -s -w ' %{http_code}\n' -H "$J" -d '{"session_id":1}' $API/complete_workout.php`
   `curl -s -w ' %{http_code}\n' $API/workout_history.php`
2. Repeat the first command with a made-up cookie: `curl -s -w ' %{http_code}\n' -b 'gymrank_session=abc' -H "$J" -d '{}' $API/workout_session.php`
3. Log Marcus out (`curl -s -b marcus.jar -c marcus.jar -X POST $API/logout.php`) and run `M -w ' %{http_code}\n' $API/workout_history.php`, then log him back in as in Setup step 3.

Expected outcome: every command in steps 1 to 3 prints `{"error":"Please log in."} 401`, and no row is added to any `workout_*` table.

Test 3: Start today's session with the plan's exercises in order
1. Run `M -w ' %{http_code}\n' -d '{"day_position":1}' $API/workout_session.php`
2. Run `D -w ' %{http_code}\n' -d '{"day_position":2}' $API/workout_session.php`
3. Run `M -w ' %{http_code}\n' -d '{"day_position":9}' $API/workout_session.php`
4. Run `M -w ' %{http_code}\n' -d '{"day_position":"one"}' $API/workout_session.php`
5. Log Priya Shah in (`priya.jar`, password `Priya-Deadlift405!`; she has no plan) and run `curl -s -b priya.jar -H "$J" -w ' %{http_code}\n' -d '{}' $API/workout_session.php`.
6. Log Sean O'Brien in (`sean.jar`, password `Sean-Press135!`), give him plan `1` as in Setup step 4, and run `curl -s -b sean.jar -H "$J" -w ' %{http_code}\n' -d '{}' $API/workout_session.php` (no `day_position`: today's scheduled day, by Eastern time).

Expected outcome: step 1 returns status `201` and a `session` with `"plan":"Push Pull Legs"`, `"name":"Push"`,
`"focus":"Chest, shoulders, triceps"`, `"completed_at":null`, `"summary":null`, a `started_at` in the `...Z` format within a few seconds of now (UTC), and `exercises` exactly
`Bench press`, `Overhead press`, `Triceps pushdown` in that order, each with `"sets":[]`. Note the `id` as `S1`.
Step 2 returns `201` with Dana's own session (`"name":"Pull"`, exercises `Barbell row`, `Lat pulldown`, `Dumbbell curl`) and a different `id`, `D1`.
Step 3 returns `404` with `{"error":"Plan day not found"}`. Step 4 returns `400` with `{"error":"day_position must be a whole number."}`. Neither creates a row.
Step 5 returns `409` with `{"error":"No workout plan selected"}`. Step 6 returns `201` with the day for today's weekday on Push Pull Legs: Monday and Thursday `Push`, Tuesday and Friday `Pull`, Wednesday `Legs`; on Saturday and Sunday it returns `409` with `{"error":"Rest day"}`.
`SELECT user_id, day_name FROM workout_sessions;` shows rows only for Marcus (Push), Dana (Pull) and, on a training day, Sean.

Test 4: Starting again reopens the unfinished session instead of creating a second one
1. Run `M -w ' %{http_code}\n' -d '{"day_position":1}' $API/workout_session.php` again.
2. Log Marcus out and back in (new cookie, as in Setup step 3), then run the same command once more.
3. Run `SELECT COUNT(*) FROM workout_sessions WHERE user_id = (SELECT id FROM users WHERE email='marcus.malone@example.com');`

Expected outcome: steps 1 and 2 return status `200` (not 201) and the same `session.id` as `S1`, with the same exercises.
Step 3 returns `1`.

Test 5: Saving sets stores the right numbers, units and order
1. Run `M -w ' %{http_code}\n' -d "{\"session_id\":$S1,\"exercise\":\"Bench press\",\"set_number\":1,\"weight_lb\":135,\"reps\":8}" $API/workout_sets.php` (replace `$S1` with the id from Test 3).
2. Same with `"set_number":2,"weight_lb":135,"reps":6`.
3. Same with `"exercise":"Overhead press","set_number":1,"weight_lb":65,"reps":10`.
4. Same with `"exercise":"Triceps pushdown","set_number":1,"weight_lb":0,"reps":12`.
5. Run `M $API/workout_session.php?id=$S1` (the `-w` flag isn't needed) and read `exercises`.
6. Run `SELECT exercise, set_number, weight_lb, reps FROM workout_sets ORDER BY id;`

Expected outcome: steps 1 to 4 each return `201` and `{"set":{"id":<number>,"exercise":"...","set_number":<n>,"weight_lb":<number>,"reps":<number>,"logged_at":"<UTC time>","updated_at":"<same as logged_at>"}}`,
where `weight_lb` and `reps` are JSON numbers, not strings (e.g. `"weight_lb":135`, `"reps":8`), and the set ids increase.
Step 5 lists Bench press with sets 1 (135 × 8) and 2 (135 × 6) in that order, Overhead press with set 1 (65 × 10),
and Triceps pushdown with set 1 (0 × 12). Step 6 shows the same four rows, weights as `135.00`, `135.00`, `65.00`, `0.00`.

Test 6: Wrong values are refused, with per-field messages, and nothing is saved
For each row, run the Test 5 step 1 command with the changed values for Bench press set 3. Then run `SELECT COUNT(*) FROM workout_sets;`

| weight_lb | reps | Expected status and body |
| --- | --- | --- |
| (omitted) | 8 | `400`, `errors.weight_lb` = `Enter a weight (0 for bodyweight).` |
| 135 | (omitted) | `400`, `errors.reps` = `Enter your reps.` |
| `"abc"` | 8 | `400`, `errors.weight_lb` = `Enter a weight as a number.` |
| -1 | 8 | `400`, `errors.weight_lb` = `Weight must be between 0 and 1500 lb.` |
| 1501 | 8 | `400`, `errors.weight_lb` = `Weight must be between 0 and 1500 lb.` |
| 135.555 | 8 | `400`, `errors.weight_lb` = `Use at most 2 decimal places, like 137.25.` |
| 135 | 0 | `400`, `errors.reps` = `Reps must be between 1 and 100.` |
| 135 | 101 | `400`, `errors.reps` = `Reps must be between 1 and 100.` |
| 135 | 8.5 | `400`, `errors.reps` = `Reps must be a whole number.` |
| `"1e3"` | 8 | `400`, `errors.weight_lb` = `Enter a weight as a number.` |
| 1500 | 100 | `201` (the limits themselves are allowed; delete this set afterwards with `DELETE FROM workout_sets WHERE reps = 100;`) |
| 135 | `""` | `400`, `errors.reps` = `Enter your reps.` |
| `""` and 135 | `""` | `400` with both `errors.weight_lb` and `errors.reps` in the same response |

These messages are the same strings as `src/workoutLog/setValidation.js` on branch `102-Daily-Logging-Frontend`.
Other bad input, each returning `400` with an `error` and no new row: a `set_number` of `0`, `-1`, `1.5` or `"x"`; an
`exercise` that is not in the session (`"Deadlift"`); a missing or empty `exercise`; an `exercise` longer than 100 characters;
`"exercise":"Bench press'; DROP TABLE workout_sets;--"` (must be refused as not in the session, never a 500); a `set_number` of `51`.
Numbers sent as text (`"weight_lb":"137.25","reps":"5"`) are accepted and saved as numbers.

Expected outcome: every row returns exactly the status and message above, and after all the 400 rows
`SELECT COUNT(*) FROM workout_sets;` still returns `4`.

Test 7: Saving the same set number twice is refused, and a correction changes the existing set
1. Repeat Test 5 step 1 (Bench press set 1 again) with weight 140.
2. Run `M -w ' %{http_code}\n' -d "{\"id\":$SET2,\"weight_lb\":137.25,\"reps\":6}" $API/workout_sets.php`, where `$SET2` is the id of Bench press set 2 from Test 5.
3. Run `M -w ' %{http_code}\n' -d "{\"id\":$SET2,\"weight_lb\":137.25,\"reps\":0}" $API/workout_sets.php`
4. Run `M -w ' %{http_code}\n' -d '{"id":999999,"weight_lb":100,"reps":5}' $API/workout_sets.php`
5. Run `M $API/workout_session.php?id=$S1` and read Bench press.

Expected outcome: step 1 returns `409` with `{"error":"Set already logged"}` and set 1 still says 135 × 8. Step 2 returns `200`
with `{"set":{"id":<SET2>,"exercise":"Bench press","set_number":2,"weight_lb":137.25,"reps":6}}`. Step 3 returns `400` with
`errors.reps` = `Reps must be between 1 and 100.`. Step 4 returns `404` with `{"error":"Set not found"}`. Step 5 shows Bench press as
set 1 (135 × 8) and set 2 (137.25 × 6), and `SELECT COUNT(*) FROM workout_sets;` still returns `4`.

Test 8: Another user can't see or change a session (accounts stay separate)
1. Run `D -w ' %{http_code}\n' $API/workout_session.php?id=$S1` (Dana reads Marcus's session).
2. Run `D -w ' %{http_code}\n' -d "{\"session_id\":$S1,\"exercise\":\"Bench press\",\"set_number\":3,\"weight_lb\":100,\"reps\":5}" $API/workout_sets.php`
3. Run `D -w ' %{http_code}\n' -d "{\"id\":$SET2,\"weight_lb\":1,\"reps\":1}" $API/workout_sets.php` (Dana edits Marcus's set).
4. Run `D -w ' %{http_code}\n' -d "{\"session_id\":$S1}" $API/complete_workout.php`
5. Run `D -w ' %{http_code}\n' -d "{\"session_id\":$D1,\"exercise\":\"Barbell row\",\"set_number\":1,\"weight_lb\":95,\"reps\":10}" $API/workout_sets.php` (Dana's own session works).
6. Run `D $API/workout_session.php?id=$D1` and `M $API/workout_session.php?id=$D1`.

Expected outcome: steps 1 to 4 each return `404` (`Session not found` or `Set not found`), the same status as an id that
doesn't exist, so Dana can't tell Marcus's ids exist. Marcus's rows are unchanged: Bench press set 2 is still 137.25 × 6, and
`completed_at` for `S1` is still NULL. Step 5 returns `201`. Step 6: Dana's read shows her Barbell row set; Marcus's read of
Dana's session returns `404`.

Test 9: Complete Workout needs at least one set
1. Dana's session `D1` has one set (Test 8 step 5). Remove it: run `DELETE FROM workout_sets WHERE session_id = <D1>;` in phpMyAdmin.
2. Run `D -w ' %{http_code}\n' -d "{\"session_id\":$D1}" $API/complete_workout.php`
3. Run `D -w ' %{http_code}\n' -d '{"session_id":999999}' $API/complete_workout.php`
4. Run `D -w ' %{http_code}\n' -d '{"session_id":"abc"}' $API/complete_workout.php`
5. Run `SELECT completed_at FROM workout_sessions WHERE id = <D1>;`
6. Run `D -w ' %{http_code}\n' -d '{"day_position":2}' $API/workout_session.php`
7. Run `D $API/workout_history.php`

Expected outcome: step 2 returns `400` with `{"error":"Log at least one set"}`. Step 3 returns `404`. Step 4 returns `400` with an `error`
saying `session_id` must be a whole number. Step 5 returns NULL (the session stays open). Step 6 returns `200` and the same id `D1`
(Dana's current session is picked up again, not duplicated). Step 7 returns `{"sessions":[]}`: an unfinished workout is not in history.

Test 10: Completing marks the workout done once, with a summary, and locks it
1. Run `M -w ' %{http_code}\n' -d "{\"session_id\":$S1}" $API/complete_workout.php`
2. Note `completed_at`, then run `M -w ' %{http_code}\n' -d "{\"session_id\":$S1}" $API/complete_workout.php` again.
3. Run `SELECT completed_at FROM workout_sessions WHERE id = <S1>;`
4. Run `M -w ' %{http_code}\n' -d "{\"session_id\":$S1,\"exercise\":\"Bench press\",\"set_number\":3,\"weight_lb\":135,\"reps\":5}" $API/workout_sets.php`
5. Run `M -w ' %{http_code}\n' -d "{\"id\":$SET2,\"weight_lb\":100,\"reps\":5}" $API/workout_sets.php`
6. Run `M $API/workout_session.php?id=$S1`
7. Run `M -w ' %{http_code}\n' -d '{"day_position":1}' $API/workout_session.php`

Expected outcome: step 1 returns `200` and `{"session_id":<S1>,"completed_at":"<UTC time within the last minute>"}`. Step 2 returns `409`
with `{"error":"Workout already completed"}`. Step 3 shows the same time as step 1, not a later one. Steps 4 and 5 return `409` with the same
error, and no set changes. Step 6 shows `completed_at` set and `"summary":{"exercise_count":3,"set_count":4,"total_reps":36,"total_volume_lb":2553.5,"duration_seconds":<completed_at minus started_at>}`
(1080 + 823.5 + 650 + 0), with the sets unchanged. Step 7 returns `200` with the same completed session (it does not start a new one).

Test 11: Two Complete requests at once complete the workout exactly once
1. Save one set into Dana's open session `D1`: `D -d "{\"session_id\":$D1,\"exercise\":\"Barbell row\",\"set_number\":1,\"weight_lb\":95,\"reps\":10}" $API/workout_sets.php`
2. Send two Complete requests at the same time:

   ```bash
   for i in 1 2; do
     curl -s -b dana.jar -H "$J" -w ' %{http_code}\n' -d "{\"session_id\":$D1}" $API/complete_workout.php &
   done; wait
   ```

3. Run `SELECT completed_at FROM workout_sessions WHERE id = <D1>;`

Expected outcome: exactly one request prints status `200` and the other `409`. Step 3 returns one time, equal to the `completed_at` in the `200` response.

Test 12: History lists only the user's completed workouts, newest first
1. Run `M $API/workout_history.php`
2. Run `D $API/workout_history.php` (Dana completed her Pull session in Test 11).
3. Run `curl -s -b priya.jar $API/workout_history.php` (Priya has never logged a workout).

Expected outcome: step 1 returns `{"sessions":[{"id":<S1>,"name":"Push","plan":"Push Pull Legs","started_at":"<S1's>","completed_at":"<same as Test 10>","duration_seconds":<same as Test 10>,"exercise_count":3,"set_count":4,"total_volume_lb":2553.5}]}`
and nothing from Dana. Step 2 returns one item, her Pull session, with `set_count` 1 and `total_volume_lb` 950, and nothing from Marcus. Step 3 returns `{"sessions":[]}` with status `200`. Unfinished workouts are never listed (Tests 9 and 16)
and with several completed workouts the one completed last comes first (Test 16).

Test 13: Bad requests get JSON errors, never a PHP error page
1. Run `M -w ' %{http_code}\n' $API/workout_sets.php` (GET).
2. Run `M -w ' %{http_code}\n' -X POST $API/workout_history.php`.
3. Run `M -w ' %{http_code}\n' -d 'not json' $API/workout_sets.php`.
4. Run `curl -s -b marcus.jar -w ' %{http_code}\n' -d 'session_id=1' $API/complete_workout.php` (form data instead of JSON).
5. Run `M -w ' %{http_code}\n' $API/workout_session.php` (GET with no `id`), then with `?id=abc`, then with `?id=999999`.
6. Run `php -l api/workout_session.php`, `php -l api/workout_sets.php`, `php -l api/complete_workout.php`, `php -l api/workout_history.php`.

Expected outcome: steps 1 and 2 return `405` with `{"error":"Method not allowed."}` (same wording as the existing endpoints). Step 3 returns `400` with `{"error":"Send a valid JSON object."}` and step 4 returns `415` with `{"error":"Send application/json."}`. Step 5 returns `400`, `400`, then `404`, all JSON. Step 6 prints `No syntax errors detected` for each file. Every response has `Content-Type: application/json`, and no response body contains `<br />`, `Warning:` or a file path.

Test 14: A database failure returns a JSON 500 and nothing half-saved
1. Locally, start both servers as in `TestingAndDebuggingGuide.md` → Local testing, log in with curl against `http://localhost:8000` (cookie file `local.jar`), start a session and save one set.
2. Stop MySQL, then run `curl -s -b local.jar -H "$J" -w ' %{http_code}\n' -d '{"session_id":1}' http://localhost:8000/complete_workout.php`
3. Start MySQL again and repeat the command from step 2.
4. Run `SELECT id FROM workout_sessions WHERE completed_at IS NOT NULL AND id NOT IN (SELECT session_id FROM workout_sets);`

Expected outcome: step 2 returns `{"error":"Database error"} 500`, with no stack trace and no password or host name in the body.
Step 3 returns a normal answer (`200`) without restarting PHP. Step 4 returns no rows: a completed session never has zero sets.

Test 15: Times are recorded by the server, in UTC, and agree everywhere
1. Log Jordan Kim in (`curl -s -c jordan.jar -H "$J" -d '{"email":"jordan.kim@example.com","password":"Jordan-Row185!"}' $API/login.php`), give him plan `1` as in Setup step 4, and write `JK` for `curl -s -b jordan.jar -H "$J"`. Run `date -u +%Y-%m-%dT%H:%M:%SZ` and note it as `T0`.
2. Run `JK -d '{"day_position":1,"started_at":"2020-01-01T00:00:00Z"}' $API/workout_session.php` and note `started_at` and the session id `J1`.
3. Run `sleep 5`, then save Bench press set 1 (135 × 8) into `J1` with an extra field `"logged_at":"2020-01-01T00:00:00Z"`.
4. Run `sleep 3`, then correct that set to 140 × 8 with `{"id":<set id>,"weight_lb":140,"reps":8}`.
5. Save Bench press set 2 (140 × 6).
6. Run `sleep 5`, then complete `J1`. Note `completed_at`, then run `JK $API/workout_session.php?id=<J1>` and `JK $API/workout_history.php`.
7. Complete `J1` a second time and read the session again.
8. Run `SELECT UTC_TIMESTAMP(), started_at, completed_at, TIMESTAMPDIFF(SECOND, started_at, completed_at) FROM workout_sessions WHERE id = <J1>;` and `SELECT set_number, logged_at, updated_at FROM workout_sets WHERE session_id = <J1> ORDER BY set_number;`

Expected outcome: every time string in every response matches `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$`. Step 2: `started_at` is between `T0` and `T0` + 10 seconds, not 2020 (the client's time is ignored). Step 3: the
set's `logged_at` is at least 5 seconds after the session's `started_at` and still not 2020; `updated_at` equals `logged_at`. Step 4: `logged_at` is unchanged and `updated_at` is at least 3 seconds
later. Step 5: set 2's `logged_at` is later than set 1's `logged_at`. Step 6: `completed_at` is at least 5 seconds after set 2's `logged_at`, is later than `started_at`, and is no later than now;
the session's `summary.duration_seconds` equals `completed_at` minus `started_at` (about 13 to 25 seconds); the history item has the same `started_at`, `completed_at` and `duration_seconds`.
Step 7: returns `409`, and `completed_at` and `duration_seconds` are exactly as in step 6. Step 8: the database times are the same clock readings as the API strings (no hour offset, i.e. stored in UTC),
`UTC_TIMESTAMP()` is within a minute of `T0`, the difference column equals `duration_seconds`, and the two set rows show `logged_at` for set 1 earlier than `updated_at`, and equal for set 2.

Test 16: Only the last 24 hours count as "today", and history is ordered by completion time
1. In phpMyAdmin clear Jordan's sessions from Test 15: `DELETE FROM workout_sessions WHERE user_id = (SELECT id FROM users WHERE email='jordan.kim@example.com');`. Then run `JK -d '{"day_position":2}' $API/workout_session.php`. Note the id as `K1`.
2. In phpMyAdmin run `UPDATE workout_sessions SET started_at = UTC_TIMESTAMP() - INTERVAL 23 HOUR WHERE id = <K1>;` then repeat step 1's start request.
3. Run `UPDATE workout_sessions SET started_at = UTC_TIMESTAMP() - INTERVAL 25 HOUR WHERE id = <K1>;` then repeat the start request. Note the id as `K2`.
4. Save one set into `K2` (Barbell row, set 1, 95 × 10) and complete it. Then run `UPDATE workout_sessions SET started_at = UTC_TIMESTAMP() - INTERVAL 30 HOUR, completed_at = UTC_TIMESTAMP() - INTERVAL 29 HOUR WHERE id = <K2>;` and repeat the start request. Note the id as `K3`.
5. Save one set into `K3` (Barbell row, set 1, 135 × 5) and complete it. Run `JK $API/workout_history.php`.
6. Run `SELECT id, started_at, completed_at FROM workout_sessions WHERE user_id = (SELECT id FROM users WHERE email='jordan.kim@example.com') ORDER BY id;`

Expected outcome: step 1 returns `201`. Step 2 returns `200` and `K1` (23 hours old, still current). Step 3 returns `201` and a new id `K2`; `K1` stays unfinished
(`completed_at` NULL). Step 4: the start request returns `201` and a new id `K3` (a workout completed 29 hours ago does not block today's). Step 5: the history lists `K3` first and `K2` second with
`duration_seconds` `3600` for `K2`, and does not list `K1`. Step 6 shows three rows, where only `K2` and `K3` have a `completed_at`, and `K3`'s `completed_at` is the later one.

Test 17: Existing features still work and the data agrees with the frontend
1. Run `M $API/current_plan.php`, `M $API/session.php` and `curl -s $API/workouts.php`.
2. Deleting a user removes their workout data: in phpMyAdmin run `DELETE FROM users WHERE email='dana.lee@example.com';` then `SELECT COUNT(*) FROM workout_sessions WHERE user_id NOT IN (SELECT id FROM users);` (re-run the seed afterwards to restore Dana).
3. Compare the JSON from Tests 3, 5, 10, 12 and 15 with the contract table above and with the comment block at the top of `src/workoutLog/workoutLogApi.js` (branch `102-Daily-Logging-Frontend`). Check every field name and that weights are in pounds.
4. Add the comment block at the top of each new PHP file in the style of `api/current_plan.php` (request, response, status codes), and confirm that `ARCHITECTURE.md` lists the four new endpoints and the two new tables.

Expected outcome: step 1 returns the same shapes as before this task (`plan` and `week`, `user`, the workouts array). Step 2 returns `0`. Step 3: the field names and types match exactly; any difference is fixed in the backend or agreed with Nicholas in writing on the card. Step 4: the comment blocks exist and match what the endpoints do, and `ARCHITECTURE.md` has the new endpoints and tables.
