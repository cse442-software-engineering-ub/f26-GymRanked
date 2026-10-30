-- Weekly goal test accounts for task #88 (story #87, frontend of Surya's api/weekly_goal.php, #89).
-- Passwords are listed in database/seeds/README.md; only their salted hashes are stored here.
-- Requires database/migrations/001_auth.sql to 014_weekly_goals.sql. Safe to rerun: these three accounts are reset
-- (setup, plan, personal details, weekly goals and workouts) and no other account is touched. Rerun it before each
-- test run, because the workouts are placed in the week the seed is loaded (see "Dates" below).
--
-- Load it from the repo root:
--   mysql --default-character-set=utf8mb4 -u root cse442_2026_fall_team_y_db < database/seeds/weekly_goals.sql
-- On aptitude: mysql --default-character-set=utf8mb4 -u UBIT_USERNAME -p cse442_2026_fall_team_y_db < database/seeds/weekly_goals.sql
--
-- Accounts (all have finished onboarding, the Beginner Fundamentals plan and saved personal details):
--   Wes Fresh   weekly.fresh@example.com   no goal saved ever, no workout this week (one last Sunday, which must not
--                                          count), so this week's goal is the default 3 and can still be changed.
--   Lena Locked weekly.locked@example.com  a goal of 4 saved LAST week (so this week starts at 4, not saved), workouts
--                                          finished Monday and today, so this week is locked. The day before today has
--                                          an unfinished workout and a finished one with no sets: neither counts.
--   Nia Next    weekly.next@example.com    this week's goal 2 and next week's goal 5 both saved, workouts finished
--                                          Monday, the day before today and today: 3 days on a goal of 2.
--
-- Dates. A week runs Monday to Sunday in New York time, like the API. "Today" is the New York date when the seed
-- runs. CONVERT_TZ needs MySQL's time zone tables; when they are missing it returns NULL and the seed uses UTC-5
-- (Eastern Standard Time, from November 1, 2026), which is only wrong between 11 PM and midnight New York time
-- during daylight saving time. Load the seed and run the tests on a Wednesday to Sunday so Monday, the day before
-- today and today are three different days of the same week.

SET @now_ny = COALESCE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', 'America/New_York'), UTC_TIMESTAMP() - INTERVAL 5 HOUR);
SET @today = DATE(@now_ny);
SET @monday = @today - INTERVAL WEEKDAY(@today) DAY;
SET @yesterday = @today - INTERVAL 1 DAY;
-- 17:00 UTC is noon or 1 PM in New York, so the date is the same in both time zones.
SET @monday_noon = TIMESTAMP(@monday, '17:00:00');
SET @yesterday_noon = TIMESTAMP(@yesterday, '17:00:00');
SET @last_sunday_noon = TIMESTAMP(@monday - INTERVAL 1 DAY, '17:00:00');
-- Today's workouts finished 10 minutes ago, so they are today in New York and never in the future.
SET @today_done = UTC_TIMESTAMP() - INTERVAL 10 MINUTE;

INSERT INTO users (full_name, email, password_hash) VALUES
    ('Wes Fresh', 'weekly.fresh@example.com', '$2y$12$aUZoxSKz5ZTEGFCwCnbYTeiWSPLVje.lt4J9rKW/4a6.ifKWh0Jce'),
    ('Lena Locked', 'weekly.locked@example.com', '$2y$12$AxAdMR2snihv0mO9T.qtH.y43cy33pzCv6YWiKoypIme8R70r.oEG'),
    ('Nia Next', 'weekly.next@example.com', '$2y$12$ZpDvAj/qYktW4jmIOEditeYTyNu5K71e54ZxL0dyKrkQmqi7mGKsm')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), password_hash = VALUES(password_hash);

SET @wes = (SELECT id FROM users WHERE email = 'weekly.fresh@example.com');
SET @lena = (SELECT id FROM users WHERE email = 'weekly.locked@example.com');
SET @nia = (SELECT id FROM users WHERE email = 'weekly.next@example.com');
SET @plan = (SELECT id FROM workout_plans WHERE name = 'Beginner Fundamentals');

-- Finished onboarding (Strength, Beginner, Full gym access), the Beginner Fundamentals plan and personal details,
-- so logging in opens the Dashboard.
INSERT INTO user_preferences (user_id, training_goal) VALUES (@wes, 'strength'), (@lena, 'strength'), (@nia, 'strength')
ON DUPLICATE KEY UPDATE training_goal = VALUES(training_goal);
INSERT INTO user_setup (user_id, experience) VALUES (@wes, 'beginner'), (@lena, 'beginner'), (@nia, 'beginner')
ON DUPLICATE KEY UPDATE experience = VALUES(experience);
DELETE FROM user_equipment WHERE user_id IN (@wes, @lena, @nia);
INSERT INTO user_equipment (user_id, equipment) VALUES (@wes, 'full_gym'), (@lena, 'full_gym'), (@nia, 'full_gym');
DELETE FROM user_plans WHERE user_id IN (@wes, @lena, @nia);
INSERT INTO user_plans (user_id, plan_id, started_at) VALUES
    (@wes, @plan, @last_sunday_noon), (@lena, @plan, @last_sunday_noon), (@nia, @plan, @last_sunday_noon);
DELETE FROM user_profile WHERE user_id IN (@wes, @lena, @nia);
INSERT INTO user_profile (user_id, bodyweight_lb, gender) VALUES (@wes, 180, 'man'), (@lena, 150, 'woman'), (@nia, 140, 'woman');

-- Weekly goals
DELETE FROM user_weekly_goals WHERE user_id IN (@wes, @lena, @nia);
INSERT INTO user_weekly_goals (user_id, week_start, target_days, created_at, updated_at) VALUES
    (@lena, @monday - INTERVAL 7 DAY, 4, UTC_TIMESTAMP(), UTC_TIMESTAMP()),
    (@nia, @monday, 2, UTC_TIMESTAMP(), UTC_TIMESTAMP()),
    (@nia, @monday + INTERVAL 7 DAY, 5, UTC_TIMESTAMP(), UTC_TIMESTAMP());

-- Workouts. Deleting the sessions also deletes their sets. A session with sets is added and then given one set, so
-- it counts as a training day; the others are left without sets on purpose.
DELETE FROM workout_sessions WHERE user_id IN (@wes, @lena, @nia);

-- Wes: last Sunday only (the previous week).
INSERT INTO workout_sessions (user_id, plan_id, plan_name, day_name, focus, exercises, started_at, completed_at) VALUES
    (@wes, @plan, 'Beginner Fundamentals', 'Full body A', 'Form and technique', JSON_ARRAY('Goblet squat'), @last_sunday_noon - INTERVAL 40 MINUTE, @last_sunday_noon);
INSERT INTO workout_sets (session_id, exercise, set_number, weight_lb, reps, logged_at, updated_at)
    VALUES (LAST_INSERT_ID(), 'Goblet squat', 1, 25, 10, @last_sunday_noon, @last_sunday_noon);

-- Lena: Monday and today count.
INSERT INTO workout_sessions (user_id, plan_id, plan_name, day_name, focus, exercises, started_at, completed_at) VALUES
    (@lena, @plan, 'Beginner Fundamentals', 'Full body A', 'Form and technique', JSON_ARRAY('Goblet squat'), @monday_noon - INTERVAL 40 MINUTE, @monday_noon);
INSERT INTO workout_sets (session_id, exercise, set_number, weight_lb, reps, logged_at, updated_at)
    VALUES (LAST_INSERT_ID(), 'Goblet squat', 1, 25, 10, @monday_noon, @monday_noon);
INSERT INTO workout_sessions (user_id, plan_id, plan_name, day_name, focus, exercises, started_at, completed_at) VALUES
    (@lena, @plan, 'Beginner Fundamentals', 'Full body B', 'Form and technique', JSON_ARRAY('Hip hinge'), @today_done - INTERVAL 40 MINUTE, @today_done);
INSERT INTO workout_sets (session_id, exercise, set_number, weight_lb, reps, logged_at, updated_at)
    VALUES (LAST_INSERT_ID(), 'Hip hinge', 1, 40, 10, @today_done, @today_done);
-- Lena, the day before today: one unfinished workout with a set and one finished workout with no sets. Neither counts.
INSERT INTO workout_sessions (user_id, plan_id, plan_name, day_name, focus, exercises, started_at, completed_at) VALUES
    (@lena, @plan, 'Beginner Fundamentals', 'Full body C', 'Form and technique', JSON_ARRAY('Split squat'), @yesterday_noon - INTERVAL 40 MINUTE, NULL);
INSERT INTO workout_sets (session_id, exercise, set_number, weight_lb, reps, logged_at, updated_at)
    VALUES (LAST_INSERT_ID(), 'Split squat', 1, 20, 10, @yesterday_noon, @yesterday_noon);
INSERT INTO workout_sessions (user_id, plan_id, plan_name, day_name, focus, exercises, started_at, completed_at) VALUES
    (@lena, @plan, 'Beginner Fundamentals', 'Full body C', 'Form and technique', JSON_ARRAY('Split squat'), @yesterday_noon - INTERVAL 20 MINUTE, @yesterday_noon);

-- Nia: Monday, the day before today and today.
INSERT INTO workout_sessions (user_id, plan_id, plan_name, day_name, focus, exercises, started_at, completed_at) VALUES
    (@nia, @plan, 'Beginner Fundamentals', 'Full body A', 'Form and technique', JSON_ARRAY('Goblet squat'), @monday_noon - INTERVAL 40 MINUTE, @monday_noon);
INSERT INTO workout_sets (session_id, exercise, set_number, weight_lb, reps, logged_at, updated_at)
    VALUES (LAST_INSERT_ID(), 'Goblet squat', 1, 25, 10, @monday_noon, @monday_noon);
INSERT INTO workout_sessions (user_id, plan_id, plan_name, day_name, focus, exercises, started_at, completed_at) VALUES
    (@nia, @plan, 'Beginner Fundamentals', 'Full body B', 'Form and technique', JSON_ARRAY('Hip hinge'), @yesterday_noon - INTERVAL 40 MINUTE, @yesterday_noon);
INSERT INTO workout_sets (session_id, exercise, set_number, weight_lb, reps, logged_at, updated_at)
    VALUES (LAST_INSERT_ID(), 'Hip hinge', 1, 40, 10, @yesterday_noon, @yesterday_noon);
INSERT INTO workout_sessions (user_id, plan_id, plan_name, day_name, focus, exercises, started_at, completed_at) VALUES
    (@nia, @plan, 'Beginner Fundamentals', 'Full body C', 'Form and technique', JSON_ARRAY('Split squat'), @today_done - INTERVAL 40 MINUTE, @today_done);
INSERT INTO workout_sets (session_id, exercise, set_number, weight_lb, reps, logged_at, updated_at)
    VALUES (LAST_INSERT_ID(), 'Split squat', 1, 20, 10, @today_done, @today_done);

-- Check: one row per account with its goals and counted days this week.
SELECT u.full_name, u.email,
       (SELECT target_days FROM user_weekly_goals g WHERE g.user_id = u.id AND g.week_start = @monday) AS this_week_saved,
       (SELECT target_days FROM user_weekly_goals g WHERE g.user_id = u.id AND g.week_start = @monday + INTERVAL 7 DAY) AS next_week_saved,
       (SELECT COUNT(*) FROM workout_sessions s WHERE s.user_id = u.id AND s.completed_at >= TIMESTAMP(@monday, '05:00:00')
           AND EXISTS (SELECT 1 FROM workout_sets st WHERE st.session_id = s.id)) AS counted_workouts_this_week
FROM users u WHERE u.id IN (@wes, @lena, @nia) ORDER BY u.id;
