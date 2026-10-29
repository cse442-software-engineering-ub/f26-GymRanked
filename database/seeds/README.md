# Test users

Fake accounts for testing login on a local or dev database. Each account has its own password.

| Full name | Email | Password | Useful for |
| --- | --- | --- | --- |
| Marcus Malone | marcus.malone@example.com | `Marcus-Bench225!` | General login testing |
| Dana Lee | dana.lee@example.com | `Dana-Squat315!` | A second account (two windows, one per user) |
| Priya Shah | priya.shah@example.com | `Priya-Deadlift405!` | Spare account, e.g. for rate-limit tests |
| Sean O'Brien | sean.obrien@example.com | `Sean-Press135!` | A name with an apostrophe |
| Jordan Kim | jordan.kim@example.com | `Jordan-Row185!` | Spare account |
| Riley Brooks | riley.brooks@example.com | `Riley-Curl95!` | Workout history (story #9): six finished workouts. Loaded by `workout_history.sql`, not `test_users.sql` |
| Taylor Reed | taylor.reed@example.com | `Taylor-Lift265!` | Progress ranges (story #8): three Deadlift workouts 150, 50 and 1 days back. Loaded by `exercise_progress_ranges.sql`, not `test_users.sql` |

These are `example.com` addresses, which can never belong to a real person. Only a bcrypt hash of each password is stored.

## Add them to the database

Apply the migrations first if you haven't (all of `database/migrations/`, in order), then load the seed from the repo root:

```bash
mysql -u root cse442_2026_fall_team_y_db < database/migrations/001_auth.sql
mysql -u root cse442_2026_fall_team_y_db < database/seeds/test_users.sql
```

On the dev server, use your own MySQL user instead of `root` (see `ServerOperationsGuide.md`), e.g. `mysql -u <ubit> -p cse442_2026_fall_team_y_db < database/seeds/test_users.sql`.

Each account has also finished onboarding (goal Strength, experience Beginner, equipment Full gym access) and has no workout plan, so logging in opens the Dashboard with "Welcome, <first name>". The seed needs migrations 001 to 006 applied first.

Rerunning the seed is safe: it resets these five accounts' names, passwords, setup and plan to the ones above and doesn't touch any other account.

## Riley's workout history

`workout_history.sql` adds Riley Brooks with a finished setup, the Beginner Fundamentals plan and six finished workouts (September 28 to October 9, 2026), which story #9's acceptance tests check. It needs every migration up to `009_workout_sessions.sql`. Load it after `test_users.sql`:

```bash
mysql --default-character-set=utf8mb4 -u root cse442_2026_fall_team_y_db < database/seeds/workout_history.sql
```

Rerunning it is safe: it resets Riley's account and replaces Riley's workouts with the same six, and doesn't touch any other account.

## Exercise progress data

`exercise_progress.sql` gives four of the test accounts known workouts for story #8 (`api/exercise_progress.php`), whose task tests are in `task-tests/8-exercise-progress-backend.html`. It needs every migration up to `009_workout_sessions.sql`. Load it after `test_users.sql`:

```bash
mysql --default-character-set=utf8mb4 -u root cse442_2026_fall_team_y_db < database/seeds/exercise_progress.sql
```

| Account | Workouts it gets |
| --- | --- |
| Marcus Malone | 7 finished workouts (August 31 to October 14, 2026) and 1 unfinished one on October 5, with Bench press, Back squat and Pull-up |
| Dana Lee | 2 finished workouts |
| Sean O'Brien | 120 finished workouts (one a day, June 1 to September 28), more than the 100 the history list returns |
| Priya Shah | none (empty history) |

Rerunning it is safe, but it replaces **all** workouts of these four accounts (Marcus's setup and login are untouched). Any other account, including Riley and Jordan, keeps its workouts. The story #7 backend checks (`node tests/workout-session-api.mjs`) delete every `@example.com` account's workouts, so load this seed again after running them.

## Check they're there

```bash
mysql -u root cse442_2026_fall_team_y_db -e "SELECT id, full_name, email FROM users WHERE email LIKE '%@example.com';"
```

## Taylor's progress ranges

`exercise_progress_ranges.sql` adds Taylor Reed with a finished setup, no plan, and three finished Deadlift workouts (225, 245 and 265 lb × 5) placed 150, 50 and 1 days before the seed is loaded. On the Progress page (story #8), 30 days then shows 1 of them, 90 days 2 and All time 3, which story #8's acceptance test 3 checks. That holds for 4 weeks after each load, so load it again before testing after that. It needs every migration up to `009_workout_sessions.sql`. Load it after `test_users.sql`:

```bash
mysql --default-character-set=utf8mb4 -u root cse442_2026_fall_team_y_db < database/seeds/exercise_progress_ranges.sql
```

Rerunning it is safe: it resets Taylor's account and replaces Taylor's workouts with the same three, dated from the day you load it, and doesn't touch any other account.

## Accounts from before body weight and gender

`personal_details.sql` adds four accounts that look like they were created before the Personal details step existed (story #116, card #117): `personal-details1@test.com` to `personal-details4@test.com`, full names Personal Details1 to Personal Details4, all with the password `ABC12345678@`. Each has finished onboarding (Strength, Beginner, Full gym access) and the Beginner Fundamentals plan, and has no saved body weight or gender. It needs every migration up to `012_user_profile.sql`. Load it after `test_users.sql`:

```bash
mysql --default-character-set=utf8mb4 -u root cse442_2026_fall_team_y_db < database/seeds/personal_details.sql
```

Rerunning it is safe: it resets these four accounts, including deleting any body weight and gender they saved, and doesn't touch any other account.

## Leaderboard data

`leaderboard.sql` adds 62 accounts for story #10 (the leaderboard backend, `api/leaderboard.php`), whose checks are in `task-tests/10-leaderboard-backend.html`: the 13 test-cast people (Ana Cole, Ben Ortiz, Cy Park, Dee Sharma, Eli Ford, Gus Hart, Hana Reyes, Ivy Chen, Zed Quinn, Nova Lane, Sky Moreno, Pia Lund and Rex Tully, all with the password `Rank-Test-2026!`), the people story #10's acceptance tests log in as, and 44 demo members (password `Demo-Member-2026!`) who fill out the boards. All are `first.last@example.com`.

| Full name | Email | Password | Useful for |
| --- | --- | --- | --- |
| Casey Morgan | casey.morgan@example.com | `Casey-Deadlift330!` | Ranked #15 on Overall, outside the top 10 (pinned row) |
| Luis Ortega | luis.ortega@example.com | `Luis-Squat285!` | Ranked #14 on Overall, a second viewer |
| Robin Hale | robin.hale@example.com | `Robin-Bench135!` | Unranked: 2 finished workouts |
| Noor Haddad | noor.haddad@example.com | `Noor-Bench150!` | Ranked on Bench press only |
| Max Tester | max.tester@example.com | `Max-Tester600!` | The one `users.is_test = 1` account: never on a board |

The number in a password is only a label, not the person's lift. It needs every migration up to `013_leaderboard.sql`. Load it any time after the migrations (it does not need `test_users.sql`):

```bash
mysql --default-character-set=utf8mb4 -u root cse442_2026_fall_team_y_db < database/seeds/leaderboard.sql
```

Rerunning it is safe: it resets these 62 accounts (names, passwords, personal details, joined state and all their workouts) and doesn't touch any other account, so stories 7, 8, 9 and 18 keep their numbers. To empty a board in SQL, `UPDATE user_profile SET leaderboard_joined_at = NULL WHERE user_id IN (...)`; to put people back, set it to `UTC_TIMESTAMP()`, or load the seed again.

## Weekly competition data

`weekly_competition.sql` adds twelve accounts (`week-casey@example.com`, `week-maya@example.com`, `week-pat@example.com`, `week-jordan@example.com`, `week-alex@example.com`, `week-riley@example.com`, `week-sam@example.com`, `week-nia@example.com`, `week-dana@example.com`, `week-ivy@example.com`, `week-lee@example.com` and the test account `week-tess@example.com`), all with the password `Weekly-Test-Compete!`. They are in the weekly consistency competition for story #124 (card #126); the starting standings are in `task-tests/124-weekly-standings-backend.html`. It needs every migration up to `015_weekly_competition.sql`.

Its workouts are dated in the current Monday-Sunday week, so load it on a Thursday, Friday or Saturday (not between 12:00 AM and 1:00 AM New York time) and test within 24 hours:

```bash
mysql --default-character-set=utf8mb4 -u root cse442_2026_fall_team_y_db < database/seeds/weekly_competition.sql
```

Rerunning it is safe: it resets these twelve accounts and their workouts, goals and joined state, and doesn't touch any other account. Reload it before running a test that finishes a workout again.

## If you get "Too many attempts"

Login allows 10 attempts per email every 15 minutes. Clear the counter with:

```bash
mysql -u root cse442_2026_fall_team_y_db -e "DELETE FROM auth_attempts;"
```

## Remove them

Anyone who reads this file can log in as these users, so remove them before a database holds real users:

```bash
mysql -u root cse442_2026_fall_team_y_db -e "DELETE FROM users WHERE email IN ('marcus.malone@example.com', 'dana.lee@example.com', 'priya.shah@example.com', 'sean.obrien@example.com', 'jordan.kim@example.com', 'riley.brooks@example.com', 'taylor.reed@example.com', 'personal-details1@test.com', 'personal-details2@test.com', 'personal-details3@test.com', 'personal-details4@test.com');"
```

Their sessions and logged workouts are deleted automatically with the accounts.

The leaderboard accounts are all `@example.com`, so this removes them too (and the seven accounts above):

```bash
mysql -u root cse442_2026_fall_team_y_db -e "DELETE FROM users WHERE email LIKE '%@example.com';"
```
