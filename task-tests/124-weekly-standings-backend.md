# DRAFT: Calculate weekly consistency standings (backend)

Task, Sprint 3 | @mansurna. Backend for story #124 "Weekly consistency competition". Card number: TBD (created under #124). Sam's screen task is #125 and reads this card's response, so nothing here is final until Sam has seen the contract. The accepted strength leaderboard (story #10, #121, api/leaderboard.php) is not changed.

Ready to paste into the card's description. Run the tests in order on aptitude, except Test 12 (local). Needs Surya's weekly goals (#89: migration 014 and api/weekly_goal.php) and the leaderboard migration 013 (users.is_test) on the database first.

Decisions made (no open questions):
1. Surya's rule: api/weekly_goal.php answers one user per call and stays unchanged (it is accepted work). The standings need everyone's target and days at once, so this task copies her rule exactly in one query. Test 10 checks that both endpoints give the same numbers for all 12 people; a difference means this task is wrong.
2. Names: the last names in the Test data (Kemp, Tran, Shaw, Lowe) are seed data only. The page shows first name and last initial, which match the story.
3. Changing target: circles use the target api/weekly_goal.php reports at the moment of the request. A target can only still change while the week has no saved target and no earned day, so anyone who moves circles then has 0 days and gains nothing; once a day is earned the target is locked.
4. Time zones: PHP works out the week and the reset with the America/New_York zone, and the seed stamps workouts at 16:00 UTC. MySQL needs no time zone tables on aptitude, cattle or locally.

## Contract these tests assume

One new endpoint, api/weekly_standings.php, for the logged-in user. The user always comes from the gymrank_session cookie. There is no way to ask for another user's data, and any user_id, email or other parameter sent is ignored.

Methods. GET returns the standings. POST {"join": true} joins the weekly competition. DELETE leaves it and keeps workouts, goals and everything else. POST and DELETE return the same body as GET (status 200), so the page updates without a second request. Joining when already joined and leaving when not joined are not errors: they change nothing and return 200.

Week. Monday 00:00 to Sunday in America/New_York time, the same week as api/weekly_goal.php (week_start and week_end are those dates). The week resets at the next Monday 00:00 New York time; resets_at is that moment as an ISO UTC time ending in Z, worked out in PHP with the America/New_York time zone (MySQL time zone tables are not needed) and not by adding 7 days (the week the clocks go back is 169 hours long: on Friday 2026-10-30 resets_at is 2026-11-02T05:00:00Z, not 04:00Z). now is the server's current time, ISO UTC with seconds, so the page's countdown does not depend on the phone's clock.

Training days. Taken from Surya's rule in api/weekly_goal.php, not recounted differently: a day counts when the user finished a workout (completed_at set) with at least one saved set, dates in New York time, one date counts once however many sessions or sets it has. completed_count is the number of those days. The target is the one weekly_goal.php reports: the target saved for this week, else the most recent earlier saved week, else 3. progress_days is completed_count capped at the target, progress_percent is progress_days / target_days rounded to a whole percent, goal_reached is completed_count >= target_days. Nothing about workout plans is used.

The circle. People are compared only with others who have the same target_days this week. The circle of a request is the people with the viewer's target_days who are ranked this week.

Who is ranked this week. All of these are true: the user joined (has a participation row), users.is_test is 0, and ranked_from is on or before this week's Monday. ranked_from is the Monday after the user joined (the Monday of the week they joined, plus 7 days; a join on a Monday morning is still the next Monday). Someone who joins mid-week is in a practice week: they see their own progress, are not ranked and are not listed. Leaving deletes the participation row, so joining again starts a new practice week.

Order and ranks. Most progress_days first. People with the same progress_days share a rank and the next rank is skipped (1, 1, 3). Tied people are listed by full name A to Z, then by user id. name is first name and last initial ("Maya R.", the same shortening as api/leaderboard.php).

GET returns 200:

```json
{
  "time_zone": "America/New_York", "week_start": "2026-10-26", "week_end": "2026-11-01",
  "resets_at": "2026-11-02T05:00:00Z", "now": "2026-10-30T18:48:00Z",
  "target_days": 3, "member_count": 8,
  "rows": [
    {"rank": 1, "name": "Maya R.", "progress_days": 3, "progress_percent": 100, "is_me": false, "gap_before": false},
    {"rank": 2, "name": "Casey L.", "progress_days": 2, "progress_percent": 67, "is_me": true, "gap_before": false}
  ],
  "me": {"joined": true, "ranked": true, "reason": null, "ranked_from": null, "rank": 2,
         "completed_count": 2, "progress_days": 2, "progress_percent": 67, "goal_reached": false}
}
```

- target_days is the viewer's own target and names the circle. rows is everyone in that circle, with no cut-off (the groups are small), so gap_before is always false. It is kept so the page can reuse the strength board's row shape. member_count is the number of rows. is_me is true on the viewer's own row and false on every other row. A row has no email, user id or target.
- me.progress_days, progress_percent, completed_count and goal_reached are filled in for everyone, ranked or not.
- me.reason is null when ranked, otherwise one value, the first of: test_account (users.is_test is 1), not_joined, practice_week. me.ranked_from is the Monday date (YYYY-MM-DD) when the reason is practice_week, otherwise null. me.rank is null unless ranked. me.joined is true when the user has a participation row.
- A test account (is_test = 1) is never listed in any circle and gets reason test_account. They still see the circle that matches their target.
- An empty circle returns rows [] and member_count 0 with status 200.

Errors, all JSON: 401 {"error":"Please log in."}; 405 {"error":"Method not allowed."} with an Allow: GET, POST, DELETE header; 400 {"error":"Invalid request.","errors":{"join":"Use true."}} for a POST body that is not exactly {"join": true}; 415, 413 and 403 as the other POST endpoints; 500 {"error":"Database error"}.

Data. New migration database/migrations/015_weekly_competition.sql (014 is Surya's weekly goals) adds one table, user_weekly_competition: user_id (primary key, foreign key to users, deleted with the user), joined_at DATETIME (UTC), ranked_from DATE (a Monday, New York time). A row means joined. Safe to run more than once, says in its top comment how to apply it locally, on aptitude and on cattle, and changes no existing row. Nobody has joined until they press Join. Standings are read from workout_sessions and user_weekly_goals on every request, so no day or progress is stored and Home, the weekly goal page and the standings can't disagree. Two joins at the same time give one row.

Code. api/weekly_standings.php; the week and reset calculation in a function that takes the current time, so it can be checked for fixed instants (tests/weekly_standings_time.php, run with php); database/seeds/weekly_competition.sql; and an entry for the endpoint in ARCHITECTURE.md. No change to api/weekly_goal.php or api/leaderboard.php.

## Test data (database/seeds/weekly_competition.sql)

The seed picks its dates from the day it is loaded, so the workouts fall in the current Monday to Sunday week in New York time. Load it on a Thursday, Friday or Saturday: Casey, Pat and the others have days "before today", and Maya needs four distinct days, the fourth being a workout finished at load time. Run the tests within 24 hours of loading: an unfinished workout older than that is not "current" and "Resume workout" would start a new one (api/workout_session.php). The seed ends with a SELECT that prints the week_start it used and today's weekday. The seed needs no MySQL time zone tables: the finished workouts it adds are stamped 16:00 UTC (noon in summer time and 11:00 AM in winter time in New York), so their New York date equals their UTC date, and this week's Monday is worked out from the UTC time minus 5 hours. For that reason don't load it between 12:00 AM and 1:00 AM New York time.

It adds new accounts only, changes none of the existing test accounts, and can be loaded again: it resets these accounts' goals, participation and workouts to the ones below. Reload it before running Test 2 or Test 7 again, because each one finishes a workout. Every account has an @example.com email, has finished onboarding with Beginner Fundamentals, and the password is Weekly-Test-Compete!. Every account has a saved target for this week, so every target is locked.

The circle of 3 days, in the order the standings return it before Test 2 runs (this is the same starting circle as the story's Test accounts list):

Casey Lin, week-casey@example.com: joined last week, target 3, finished workouts on Monday and Tuesday, and an unfinished workout started now with one saved set (135 lb x 8). Finishing it makes 3 of 3.

Maya Rios, week-maya@example.com: joined last week, target 3, finished workouts on 4 different dates (Monday, Tuesday, Wednesday and the load time). 4 days on a 3-day target.

Pat Moss, week-pat@example.com: joined last week, target 3, three finished sessions on two dates (two on Monday, one on Tuesday), each with at least two sets.

Jordan Kemp, week-jordan@example.com: joined last week, target 3, 2 days (Monday, Tuesday).

Alex Tran, week-alex@example.com: joined last week, target 3, 1 day (Monday).

Riley Shaw, week-riley@example.com: joined last week, target 3, 1 day (Tuesday).

Sam Lowe, week-sam@example.com: joined last week, target 3, no workout this week.

Nia Cole, week-nia@example.com: joined two weeks ago, target 3, finished workouts on 3 different days last week (Monday, Wednesday, Friday) and none this week.

Not in the 3-day circle's rows:

Dana Fox, week-dana@example.com: joined last week, target 5, 1 day. The only person in the 5-day circle.

Ivy Park, week-ivy@example.com: has not joined, target 3, 2 days (Monday, Tuesday).

Lee Ford, week-lee@example.com: joined now (this week), target 3, 1 day (Monday) and an unfinished workout started now with one saved set (135 lb x 8). Practice week.

Tess Tester, week-tess@example.com: users.is_test = 1, joined last week, target 3, 3 days (Monday, Tuesday, Wednesday). Would tie with Maya at 3 of 3 if she were listed.

Expected circle of 3 days before any test changes it (member_count 8):

```text
#1 Maya R.   3 of 3  100
#2 Casey L.  2 of 3   67
#2 Jordan K. 2 of 3   67
#2 Pat M.    2 of 3   67
#5 Alex T.   1 of 3   33
#5 Riley S.  1 of 3   33
#7 Nia C.    0 of 3    0
#7 Sam L.    0 of 3    0
```

Ranked this week means ranked_from on or before this Monday. Last week's joiners (Casey to Sam, Dana, Tess) have ranked_from = this Monday. Nia's is last Monday. Lee's is next Monday. Ivy has no row.

## Setup for all tests

Step 1: Connect to the UB VPN or the campus network.

Step 2: On aptitude apply database/migrations/013_leaderboard.sql, 014_weekly_goals.sql and 015_weekly_competition.sql, then load database/seeds/test_users.sql and database/seeds/weekly_competition.sql, following ServerOperationsGuide.md and database/seeds/README.md. Do this on a Thursday, Friday or Saturday. Test 1 does the seed load.

Step 3: In a terminal, set the variables and log the people in. Each person gets their own cookie file. Run each line:

```bash
API=https://aptitude.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/api
J='Content-Type: application/json'
for p in casey maya pat jordan alex riley sam nia dana ivy lee tess; do curl -s -c $p.jar -H "$J" -d '{"email":"week-'$p'@example.com","password":"Weekly-Test-Compete!"}' $API/login.php; done
```

Write CASEY for curl -s -b casey.jar, and so on for each person. Add -w ' %{http_code}\n' to print the status code and pipe to python3 -m json.tool to read the output.

Step 4: Keep a mysql session open on aptitude (mysql -u UBIT_USERNAME -p cse442_2026_fall_team_y_db) for the tests that read or change a row.

### Test 1: The migration and seed load, can be re-run, and match the test data

1. Check the day: run TZ=America/New_York date +'%A %Y-%m-%d %H:%M' and confirm it is a Thursday, Friday or Saturday and not between 12:00 AM and 1:00 AM.
2. Apply migration 015 twice. Run DESCRIBE user_weekly_competition; and SELECT COUNT(*) FROM user_weekly_competition;
3. Load database/seeds/weekly_competition.sql, then load it a second time. Read the SELECT at the end of the seed.
4. Run SELECT email, is_test FROM users WHERE email LIKE 'week-%@example.com' ORDER BY email; and SELECT u.email, w.week_start, w.target_days FROM user_weekly_goals w JOIN users u ON u.id = w.user_id WHERE u.email LIKE 'week-%@example.com' ORDER BY u.email, w.week_start;
5. Before step 3, and again after it, run SELECT u.email, COUNT(s.id) FROM users u LEFT JOIN workout_sessions s ON s.user_id = u.id WHERE u.email NOT LIKE 'week-%' GROUP BY u.email ORDER BY u.email; and compare the two outputs.

Expected outcome: step 1 prints Thursday, Friday or Saturday and a time after 1:00 AM. Step 2 prints the table with columns user_id, joined_at and ranked_from, and the second run says nothing and changes no row. Step 3 loads twice without an error and the SELECT shows this Monday as week_start and today as Thursday, Friday or Saturday. Step 4 lists 12 accounts (week-alex, week-casey, week-dana, week-ivy, week-jordan, week-lee, week-maya, week-nia, week-pat, week-riley, week-sam, week-tess) and only week-tess has is_test 1; every account has a goal row for this Monday (target 5 for Dana, 3 for the others), and Nia also has one for last Monday. Step 5 gives identical output before and after the seed: no other account's workouts changed.

### Test 2: The standings show the circle, ranks, ties and the deadline

1. Run: CASEY $API/weekly_standings.php | python3 -m json.tool
2. Run the same call as maya, pat and jordan.

Expected outcome: status 200. time_zone is America/New_York, week_start is this week's Monday and week_end the Sunday. resets_at is the next Monday 00:00 New York time as a UTC time ending in Z (2026-11-02T05:00:00Z this week) and now is within a minute of the real time. target_days is 3 and member_count is 8. rows are exactly the list in Test data, in that order: #1 Maya R. 3 and 100, then #2 Casey L., #2 Jordan K., #2 Pat M. with 2 and 67, #5 Alex T. and #5 Riley S. with 1 and 33, #7 Nia C. and #7 Sam L. with 0 and 0, and gap_before false on every row. Dana F., Ivy P., Lee F. and Tess T. are not in rows. is_me is true only on Casey L.'s row. me is {"joined":true,"ranked":true,"reason":null,"ranked_from":null,"rank":2,"completed_count":2,"progress_days":2,"progress_percent":67,"goal_reached":false}. Step 2 returns the same rows with is_me moved to the caller's own row and a me of rank 1 for Maya (completed_count 4, progress_days 3, progress_percent 100, goal_reached true), rank 2 for Pat and rank 2 for Jordan.

### Test 3: Finishing a workout changes the standings and shared ranks appear

1. Run: CASEY -X POST -H "$J" -d '{}' $API/workout_session.php . Note session.id (the unfinished workout with one set).
2. Run: CASEY -X POST -H "$J" -d '{"session_id":ID}' $API/complete_workout.php , with ID the id from step 1.
3. Run: CASEY $API/weekly_standings.php | python3 -m json.tool
4. Run: MAYA $API/weekly_standings.php | python3 -m json.tool
5. Repeat step 3 and run: CASEY $API/weekly_goal.php

Expected outcome: step 1 returns status 200 and the existing session (not a new one). Step 2 returns 200 with a completed_at. Step 3: me is rank 1, completed_count 3, progress_days 3, progress_percent 100, goal_reached true. rows are #1 Casey L. (is_me true) and #1 Maya R., both 3 of 3 and 100 (Casey before Maya, because ties are listed by full name), then #3 Jordan K. and #3 Pat M. with 2 and 67, #5 Alex T. and #5 Riley S., then #7 Nia C. and #7 Sam L. Tess T. is still not listed, so she does not push anyone down. Step 4 shows Maya at rank 1 as well. Step 5 shows the same standings and weekly_goal.php says completed_count 3 and progress_days 3. After reloading the seed, Casey is back at #2.

### Test 4: One date counts once and progress stops at 100%

1. Run: PAT $API/weekly_standings.php | python3 -m json.tool
2. Run: PAT $API/weekly_goal.php | python3 -m json.tool
3. Run: MAYA $API/weekly_goal.php | python3 -m json.tool
4. In mysql run: SELECT DATE(s.completed_at) AS day, COUNT(*) FROM workout_sessions s JOIN users u ON u.id = s.user_id WHERE u.email = 'week-pat@example.com' AND s.completed_at IS NOT NULL GROUP BY day;

Expected outcome: step 4 shows Pat has three finished sessions on two dates. Steps 1 and 2 both give Pat completed_count 2, progress_days 2 and progress_percent 67 (extra sessions and sets earn nothing). Step 3 gives Maya completed_count 4, progress_days 3, progress_percent 100 and goal_reached true; step 1's rows show Maya at 3 of 3 and 100, never 4 of 3 or 133.

### Test 5: Only people with the same target are compared

1. Run: DANA $API/weekly_standings.php | python3 -m json.tool
2. Run: MAYA $API/weekly_standings.php | python3 -m json.tool

Expected outcome: step 1 returns target_days 5, member_count 1 and one row, #1 Dana F. with progress_days 1 and progress_percent 20, is_me true; me is {"joined":true,"ranked":true,"reason":null,"ranked_from":null,"rank":1,"completed_count":1,"progress_days":1,"progress_percent":20,"goal_reached":false}. Maya's call has no Dana and the same 8 rows as Test 2.

### Test 6: Join and leave are saved, joining mid-week is a practice week

1. Run: IVY $API/weekly_standings.php | python3 -m json.tool
2. Run: IVY -X POST -H "$J" -d '{"join":true}' $API/weekly_standings.php | python3 -m json.tool
3. Run step 2 again.
4. In mysql run: SELECT user_id, joined_at, ranked_from FROM user_weekly_competition WHERE user_id = (SELECT id FROM users WHERE email = 'week-ivy@example.com');
5. Run: IVY $API/weekly_standings.php | python3 -m json.tool
6. Run: IVY -X DELETE $API/weekly_standings.php | python3 -m json.tool
7. Run: IVY -X DELETE $API/weekly_standings.php -w ' %{http_code}\n' and IVY $API/weekly_goal.php

Expected outcome: step 1: status 200, me {"joined":false,"ranked":false,"reason":"not_joined","ranked_from":null,"rank":null,"completed_count":2,"progress_days":2,"progress_percent":67,"goal_reached":false} and the same 8 rows as Test 2 with no row for Ivy and is_me false everywhere. Step 2: 200 and me {"joined":true,"ranked":false,"reason":"practice_week","ranked_from":<next Monday as YYYY-MM-DD>,"rank":null,...} with the same progress and the same 8 rows (Ivy still not listed). Step 3: 200 and nothing changes. Step 4 shows one row whose ranked_from is next Monday (2026-11-02 this week). Step 5 matches step 2. Step 6: 200 and me is back to joined false, reason not_joined. Step 7: the second DELETE returns 200 and the same body, and weekly_goal.php still says completed_count 2: leaving kept her workouts and goal.

### Test 7: A practice week shows your progress without a rank

1. Run: LEE $API/weekly_standings.php | python3 -m json.tool
2. Run: LEE -X POST -H "$J" -d '{}' $API/workout_session.php and note session.id.
3. Run: LEE -X POST -H "$J" -d '{"session_id":ID}' $API/complete_workout.php
4. Run step 1 again.

Expected outcome: step 1: me {"joined":true,"ranked":false,"reason":"practice_week","ranked_from":<next Monday>,"rank":null,"completed_count":1,"progress_days":1,"progress_percent":33,"goal_reached":false}, member_count 8, no row with is_me true and no row for Lee F. Step 2 returns the existing unfinished session with its one set. After step 3, step 4 shows completed_count 2, progress_days 2, progress_percent 67, still practice_week and rank null, and the 8 rows are unchanged (Lee is not added and nobody's rank moves). Reload the seed before running this test again.

### Test 8: A new week starts from zero and keeps the history

1. Run: NIA $API/weekly_standings.php | python3 -m json.tool
2. Run: NIA $API/workout_history.php | python3 -m json.tool
3. Run: NIA $API/weekly_goal.php | python3 -m json.tool

Expected outcome: step 1: me rank 7, completed_count 0, progress_days 0, progress_percent 0, goal_reached false, ranked true. Nia's row says 0 of 3 and #7 with Sam L. Last week's three days are not counted. Step 2 still lists Nia's three finished workouts from last week. Step 3 shows completed_dates [] this week and the same target 3.

### Test 9: Test accounts and other circles never leak

1. Run: TESS $API/weekly_standings.php | python3 -m json.tool
2. Run: CASEY $API/weekly_standings.php and search the whole output for each of: week-, @example.com, "user_id", "email", "target".

Expected outcome: step 1: status 200, me {"joined":true,"ranked":false,"reason":"test_account","ranked_from":null,"rank":null,"completed_count":3,"progress_days":3,"progress_percent":100,"goal_reached":true}, the same 8 rows as Test 2 and no Tess T. in them. Step 2 finds none of those words: a row has only rank, name, progress_days, progress_percent, is_me and gap_before.

### Test 10: The standings agree with the weekly goal endpoint for every person

1. For each of casey, maya, pat, jordan, alex, riley, sam, nia, dana, ivy, lee and tess, run the person's own call to weekly_goal.php and to weekly_standings.php and compare the target_days, completed_count, progress_days, progress_percent and goal_reached of weekly_goal.php with those of weekly_standings.php (target_days at the top, the rest in me).

Expected outcome: for all 12 people the five values are identical, and week_start and week_end are identical. If a number differs, this task is wrong, not the goal endpoint.

### Test 11: Bad requests get JSON errors, and another user's data can't be asked for

1. Run with no cookie: curl -s -w ' %{http_code}\n' $API/weekly_standings.php
2. Run: CASEY -X PUT -D - $API/weekly_standings.php -o /dev/null
3. Run: CASEY -X POST -H "$J" -d '{}' $API/weekly_standings.php -w ' %{http_code}\n'
4. Run: CASEY -X POST -H "$J" -d '{"join":"yes"}' $API/weekly_standings.php -w ' %{http_code}\n'
5. Run: CASEY -X POST -H "$J" -d '{"join":true' $API/weekly_standings.php -w ' %{http_code}\n'
6. Run: CASEY "$API/weekly_standings.php?user_id=1&email=week-maya@example.com" | python3 -m json.tool
7. Run: CASEY -X POST -H "$J" -d '{"join":true,"user_id":1}' $API/weekly_standings.php | python3 -m json.tool

Expected outcome: step 1: {"error":"Please log in."} 401. Step 2: 405 with a header Allow: GET, POST, DELETE and body {"error":"Method not allowed."}. Steps 3 and 4: 400 {"error":"Invalid request.","errors":{"join":"Use true."}}. Step 5: 400 with a JSON error (not a PHP warning or HTML). Step 6: Casey's own standings, is_me on Casey L., not Maya's. Step 7: Casey's own standings and no participation row is created for user 1 (SELECT * FROM user_weekly_competition WHERE user_id = 1; returns none).

### Test 12: The reset time follows daylight saving, and a database error is JSON (run locally)

1. Start both servers as in TestingAndDebuggingGuide.md, Local testing, and apply the migrations and seed locally.
2. Run: php tests/weekly_standings_time.php
3. In api/config.php change the database password to a wrong one, run: curl -s -w ' %{http_code}\n' -b casey.jar http://localhost:8000/weekly_standings.php (log in as casey on the local API first), then change the password back.

Expected outcome: step 2 prints PASS for each fixed instant and exits with 0: Friday 2026-10-30 18:48:00Z gives week_start 2026-10-26 and resets_at 2026-11-02T05:00:00Z; Sunday 2026-11-01 03:30:00Z (before the clocks go back) gives resets_at 2026-11-02T05:00:00Z; Monday 2026-11-02 05:00:00Z gives week_start 2026-11-02 and resets_at 2026-11-09T05:00:00Z; Friday 2027-03-12 18:00:00Z gives resets_at 2027-03-15T04:00:00Z (the week the clocks go forward); Monday 2026-10-26 04:00:00Z (12:00 AM New York) gives week_start 2026-10-26, and one second earlier, 03:59:59Z, is still in the week of 2026-10-19. Step 3: {"error":"Database error"} 500 as JSON. After restoring the password, the same call returns 200.

### Test 13: Two joins at the same time give one row

1. Reload the seed and log ivy in again. Run: for i in 1 2 3 4 5 6; do (IVY -X POST -H "$J" -d '{"join":true}' $API/weekly_standings.php -o /dev/null -w '%{http_code} ' &); done; wait
2. In mysql run: SELECT COUNT(*) FROM user_weekly_competition WHERE user_id = (SELECT id FROM users WHERE email = 'week-ivy@example.com');

Expected outcome: all 6 calls print 200 and the count is 1.
