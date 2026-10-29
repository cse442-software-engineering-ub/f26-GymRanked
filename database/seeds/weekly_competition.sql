-- Weekly consistency competition test accounts for story #124 (card #126): twelve accounts, week-<name>@example.com.
-- The password is Weekly-Test-Compete! for all of them; only its salted hash is stored here.
-- Requires database/migrations/001_auth.sql to 015_weekly_competition.sql. Adds new accounts only. Safe to rerun: these twelve accounts' names, password, setup, plan, goals, joined
-- state and workouts are reset to the ones below, and no other account is touched.
--
-- The workouts are dated in the current Monday-Sunday week (New York time), so LOAD IT ON A THURSDAY, FRIDAY OR
-- SATURDAY, not between 12:00 AM and 1:00 AM New York time, and run the tests within 24 hours (an unfinished workout
-- is "current" for 24 hours). Reload it before running a test that finishes a workout again. It needs no MySQL time
-- zone tables: finished workouts are stamped 16:00 UTC (noon in summer time, 11:00 AM in winter time in New York), so
-- their New York date equals their UTC date, and this week's Monday is worked out from the UTC time minus 5 hours.
--
-- Load it from the repo root:
--   mysql --default-character-set=utf8mb4 -u root cse442_2026_fall_team_y_db < database/seeds/weekly_competition.sql

INSERT INTO users (full_name, email, password_hash) VALUES
    ('Casey Lin',    'week-casey@example.com',  '$2y$12$BQyrBRH7MWNLMWqjS2y5PeEj52Z4O0YMVNXzQ89Lb90AHmOdNE9KG'),
    ('Maya Rios',    'week-maya@example.com',   '$2y$12$BQyrBRH7MWNLMWqjS2y5PeEj52Z4O0YMVNXzQ89Lb90AHmOdNE9KG'),
    ('Pat Moss',     'week-pat@example.com',    '$2y$12$BQyrBRH7MWNLMWqjS2y5PeEj52Z4O0YMVNXzQ89Lb90AHmOdNE9KG'),
    ('Jordan Kemp',  'week-jordan@example.com', '$2y$12$BQyrBRH7MWNLMWqjS2y5PeEj52Z4O0YMVNXzQ89Lb90AHmOdNE9KG'),
    ('Alex Tran',    'week-alex@example.com',   '$2y$12$BQyrBRH7MWNLMWqjS2y5PeEj52Z4O0YMVNXzQ89Lb90AHmOdNE9KG'),
    ('Riley Shaw',   'week-riley@example.com',  '$2y$12$BQyrBRH7MWNLMWqjS2y5PeEj52Z4O0YMVNXzQ89Lb90AHmOdNE9KG'),
    ('Sam Lowe',     'week-sam@example.com',    '$2y$12$BQyrBRH7MWNLMWqjS2y5PeEj52Z4O0YMVNXzQ89Lb90AHmOdNE9KG'),
    ('Nia Cole',     'week-nia@example.com',    '$2y$12$BQyrBRH7MWNLMWqjS2y5PeEj52Z4O0YMVNXzQ89Lb90AHmOdNE9KG'),
    ('Dana Fox',     'week-dana@example.com',   '$2y$12$BQyrBRH7MWNLMWqjS2y5PeEj52Z4O0YMVNXzQ89Lb90AHmOdNE9KG'),
    ('Ivy Park',     'week-ivy@example.com',    '$2y$12$BQyrBRH7MWNLMWqjS2y5PeEj52Z4O0YMVNXzQ89Lb90AHmOdNE9KG'),
    ('Lee Ford',     'week-lee@example.com',    '$2y$12$BQyrBRH7MWNLMWqjS2y5PeEj52Z4O0YMVNXzQ89Lb90AHmOdNE9KG'),
    ('Tess Tester',  'week-tess@example.com',   '$2y$12$BQyrBRH7MWNLMWqjS2y5PeEj52Z4O0YMVNXzQ89Lb90AHmOdNE9KG')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), password_hash = VALUES(password_hash);

-- Only Tess is a test account (never listed). Set here and never by the app.
UPDATE users SET is_test = 0 WHERE email LIKE 'week-%@example.com';
UPDATE users SET is_test = 1 WHERE email = 'week-tess@example.com';

SET @casey  = (SELECT id FROM users WHERE email = 'week-casey@example.com');
SET @maya   = (SELECT id FROM users WHERE email = 'week-maya@example.com');
SET @pat    = (SELECT id FROM users WHERE email = 'week-pat@example.com');
SET @jordan = (SELECT id FROM users WHERE email = 'week-jordan@example.com');
SET @alex   = (SELECT id FROM users WHERE email = 'week-alex@example.com');
SET @riley  = (SELECT id FROM users WHERE email = 'week-riley@example.com');
SET @sam    = (SELECT id FROM users WHERE email = 'week-sam@example.com');
SET @nia    = (SELECT id FROM users WHERE email = 'week-nia@example.com');
SET @dana   = (SELECT id FROM users WHERE email = 'week-dana@example.com');
SET @ivy    = (SELECT id FROM users WHERE email = 'week-ivy@example.com');
SET @lee    = (SELECT id FROM users WHERE email = 'week-lee@example.com');
SET @tess   = (SELECT id FROM users WHERE email = 'week-tess@example.com');
SET @plan   = (SELECT id FROM workout_plans WHERE name = 'Beginner Fundamentals');

-- This week's Monday in New York (UTC minus 5 hours; see the top). WEEKDAY() is 0 on a Monday.
SET @today  = DATE(UTC_TIMESTAMP() - INTERVAL 5 HOUR);
SET @monday = @today - INTERVAL WEEKDAY(@today) DAY;

-- A finished setup (Strength, Beginner, Full gym access) and the Beginner Fundamentals plan, so logging in opens the
-- Dashboard instead of an onboarding step.
INSERT INTO user_preferences (user_id, training_goal)
    SELECT id, 'strength' FROM users WHERE email LIKE 'week-%@example.com'
ON DUPLICATE KEY UPDATE training_goal = VALUES(training_goal);

INSERT INTO user_setup (user_id, experience)
    SELECT id, 'beginner' FROM users WHERE email LIKE 'week-%@example.com'
ON DUPLICATE KEY UPDATE experience = VALUES(experience);

DELETE FROM user_equipment WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'week-%@example.com');
INSERT INTO user_equipment (user_id, equipment)
    SELECT id, 'full_gym' FROM users WHERE email LIKE 'week-%@example.com';

INSERT INTO user_plans (user_id, plan_id, started_at)
    SELECT id, @plan, TIMESTAMP(@monday - INTERVAL 14 DAY, '16:00:00') FROM users WHERE email LIKE 'week-%@example.com'
ON DUPLICATE KEY UPDATE plan_id = VALUES(plan_id), started_at = VALUES(started_at);

-- Weekly targets (api/weekly_goal.php): everyone has one saved for this week, 3 days except Dana (5). Nia's earlier
-- week is saved too. Deleting first resets them.
DELETE FROM user_weekly_goals WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'week-%@example.com');
INSERT INTO user_weekly_goals (user_id, week_start, target_days, created_at, updated_at)
    SELECT id, @monday, IF(email = 'week-dana@example.com', 5, 3), UTC_TIMESTAMP(), UTC_TIMESTAMP()
    FROM users WHERE email LIKE 'week-%@example.com';
INSERT INTO user_weekly_goals (user_id, week_start, target_days, created_at, updated_at)
VALUES (@nia, @monday - INTERVAL 7 DAY, 3, UTC_TIMESTAMP(), UTC_TIMESTAMP());

-- Who joined, and from which Monday they are ranked (the Monday after they joined). Casey to Sam, Dana and Tess joined
-- last Tuesday, so they are ranked this week; Nia joined two weeks ago; Lee joined just now, so this is a practice
-- week and Lee is ranked from next Monday; Ivy has not joined.
DELETE FROM user_weekly_competition WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'week-%@example.com');
INSERT INTO user_weekly_competition (user_id, joined_at, ranked_from)
    SELECT id, TIMESTAMP(@monday - INTERVAL 6 DAY, '16:00:00'), @monday FROM users
    WHERE email IN ('week-casey@example.com', 'week-maya@example.com', 'week-pat@example.com',
                    'week-jordan@example.com', 'week-alex@example.com', 'week-riley@example.com',
                    'week-sam@example.com', 'week-dana@example.com', 'week-tess@example.com');
INSERT INTO user_weekly_competition (user_id, joined_at, ranked_from)
VALUES (@nia, TIMESTAMP(@monday - INTERVAL 13 DAY, '16:00:00'), @monday - INTERVAL 7 DAY),
       (@lee, UTC_TIMESTAMP(), @monday + INTERVAL 7 DAY);

-- Finished workouts. d is the number of days after this week's Monday (negative = last week), at 16:00 UTC; each
-- finished workout gets two sets below. Deleting the sessions also deletes their sets.
DELETE FROM workout_sessions WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'week-%@example.com');
INSERT INTO workout_sessions (user_id, plan_id, plan_name, day_name, focus, exercises, started_at, completed_at)
SELECT v.user_id, @plan, 'Beginner Fundamentals', 'Full body A', 'Form and technique',
       JSON_ARRAY('Goblet squat', 'Push-up', 'Dumbbell row'),
       TIMESTAMP(@monday + INTERVAL v.d DAY, v.t) - INTERVAL 40 MINUTE,
       TIMESTAMP(@monday + INTERVAL v.d DAY, v.t)
FROM (
    SELECT @casey AS user_id, 0 AS d, '16:00:00' AS t
    UNION ALL SELECT @casey, 1, '16:00:00'
    UNION ALL SELECT @maya, 0, '16:00:00'
    UNION ALL SELECT @maya, 1, '16:00:00'
    UNION ALL SELECT @maya, 2, '16:00:00'
    UNION ALL SELECT @pat, 0, '14:00:00'
    UNION ALL SELECT @pat, 0, '18:00:00'
    UNION ALL SELECT @pat, 1, '16:00:00'
    UNION ALL SELECT @jordan, 0, '16:00:00'
    UNION ALL SELECT @jordan, 1, '16:00:00'
    UNION ALL SELECT @alex, 0, '16:00:00'
    UNION ALL SELECT @riley, 1, '16:00:00'
    UNION ALL SELECT @dana, 0, '16:00:00'
    UNION ALL SELECT @ivy, 0, '16:00:00'
    UNION ALL SELECT @ivy, 1, '16:00:00'
    UNION ALL SELECT @lee, 0, '16:00:00'
    UNION ALL SELECT @tess, 0, '16:00:00'
    UNION ALL SELECT @tess, 1, '16:00:00'
    UNION ALL SELECT @tess, 2, '16:00:00'
    UNION ALL SELECT @nia, -7, '16:00:00'
    UNION ALL SELECT @nia, -5, '16:00:00'
    UNION ALL SELECT @nia, -3, '16:00:00'
) v;

-- Maya's fourth day, finished a minute before the load, so it is today's date: 4 days on a 3-day target.
INSERT INTO workout_sessions (user_id, plan_id, plan_name, day_name, focus, exercises, started_at, completed_at)
VALUES (@maya, @plan, 'Beginner Fundamentals', 'Full body A', 'Form and technique',
        JSON_ARRAY('Goblet squat', 'Push-up', 'Dumbbell row'),
        UTC_TIMESTAMP() - INTERVAL 41 MINUTE, UTC_TIMESTAMP() - INTERVAL 1 MINUTE);

-- Casey's and Lee's unfinished workout, started now with one saved set, so "Resume workout" works on any day and
-- Complete workout adds today.
INSERT INTO workout_sessions (user_id, plan_id, plan_name, day_name, focus, exercises, started_at, completed_at)
VALUES (@casey, @plan, 'Beginner Fundamentals', 'Full body B', 'Form and technique',
        JSON_ARRAY('Hip hinge', 'Dumbbell press', 'Lat pulldown'), UTC_TIMESTAMP(), NULL),
       (@lee, @plan, 'Beginner Fundamentals', 'Full body B', 'Form and technique',
        JSON_ARRAY('Hip hinge', 'Dumbbell press', 'Lat pulldown'), UTC_TIMESTAMP(), NULL);

-- Two Goblet squat sets in every finished workout (Pat's sessions need at least two), one Hip hinge set of 135 lb
-- x 8 in each unfinished one.
INSERT INTO workout_sets (session_id, exercise, set_number, weight_lb, reps, logged_at, updated_at)
SELECT s.id, 'Goblet squat', n.set_number, 25, 10, s.started_at + INTERVAL 5 MINUTE, s.started_at + INTERVAL 5 MINUTE
FROM workout_sessions s
JOIN (SELECT 1 AS set_number UNION ALL SELECT 2) n
WHERE s.completed_at IS NOT NULL AND s.user_id IN (SELECT id FROM users WHERE email LIKE 'week-%@example.com');

INSERT INTO workout_sets (session_id, exercise, set_number, weight_lb, reps, logged_at, updated_at)
SELECT s.id, 'Hip hinge', 1, 135, 8, s.started_at, s.started_at
FROM workout_sessions s
WHERE s.completed_at IS NULL AND s.user_id IN (SELECT id FROM users WHERE email LIKE 'week-%@example.com');

-- Check: the Monday this seed used, and today's weekday there (it should be Thursday, Friday or Saturday).
SELECT @monday AS week_start, DAYNAME(@today) AS weekday;
