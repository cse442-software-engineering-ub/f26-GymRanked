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

## Check they're there

```bash
mysql -u root cse442_2026_fall_team_y_db -e "SELECT id, full_name, email FROM users WHERE email LIKE '%@example.com';"
```

## If you get "Too many attempts"

Login allows 10 attempts per email every 15 minutes. Clear the counter with:

```bash
mysql -u root cse442_2026_fall_team_y_db -e "DELETE FROM auth_attempts;"
```

## Remove them

Anyone who reads this file can log in as these users, so remove them before a database holds real users:

```bash
mysql -u root cse442_2026_fall_team_y_db -e "DELETE FROM users WHERE email IN ('marcus.malone@example.com', 'dana.lee@example.com', 'priya.shah@example.com', 'sean.obrien@example.com', 'jordan.kim@example.com', 'riley.brooks@example.com');"
```

Their sessions and logged workouts are deleted automatically with the accounts.
