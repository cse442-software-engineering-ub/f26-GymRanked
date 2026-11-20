-- Dashboard redesign demo accounts (card #136): six dash-<name>@example.com accounts that fill every part of the Dashboard,
-- for showing it off. The password is Dash-Demo-136! for all of them; only its salted hash is stored here.
-- Requires database/migrations/001_auth.sql to 018_workout_buddies.sql and the plan catalog (Push Pull Legs). Safe to rerun:
-- these accounts' names, password, setup, plan, profile, goals, group, messages and workouts are reset to the ones below,
-- and no other account is touched.
--
-- Unlike the other ranking seeds these accounts are NOT test accounts (users.is_test = 0), so they also rank on the
-- Everyone boards next to whoever else has joined. Load it on a local or dev database only, never on cattle.
--
-- Load it from the repo root:
--   mysql --default-character-set=utf8mb4 -u root cse442_2026_fall_team_y_db < database/seeds/dashboard_demo.sql
--
-- Dates are relative to the day it is loaded (New York time): everyone follows Push Pull Legs (Mon Push, Tue Pull,
-- Wed Legs, Thu Push, Fri Pull, weekends off) and trained on it for the three weeks before this one. Reload it each day
-- you demo, since "today" is fixed when it is loaded.
--
--   Avery Stone   the main demo account. Weekly goal 3, trained every scheduled day this week before today, and has not
--                 trained today: Today's workout offers Start workout (on a weekday). Two messages from buddies.
--   Blake Rivera  already finished today's workout: Today's workout shows Done and View workout summary. Strongest lifter.
--   Cam Ellis, Drew Patel, Emery Walsh: the rest of the group, with fewer days this week.
--   Finn Hayes    trains the same plan but is in no group: Buddies rankings say "Join a buddies group".
-- Group "Iron Circle" (owner Avery, invite code DASH136G): Avery, Blake, Cam, Drew, Emery.
-- Bench / Back squat / Deadlift this week (lb, 3 x 5; 5 lb less for each week before):
--   Blake 225/315/405, Avery 205/275/355, Cam 185/255/335, Drew 155/215/275, Emery (woman, 135 lb) 115/165/215,
--   Finn 175/245/315. Everyone else is a man at 185 lb.

CREATE TEMPORARY TABLE dash_people (
    email VARCHAR(255) PRIMARY KEY, full_name VARCHAR(100), bodyweight DECIMAL(4,1), gender VARCHAR(20),
    bench INT, squat INT, deadlift INT,
    past_days INT,      -- scheduled days trained in each earlier week (of 5)
    week_days INT,      -- scheduled days trained this week, before today (of the ones that have passed)
    done_today TINYINT, -- today's scheduled workout is finished
    in_group TINYINT
);
INSERT INTO dash_people VALUES
    ('dash-avery@example.com', 'Avery Stone',  185, 'man',   205, 275, 355, 4, 5, 0, 1),
    ('dash-blake@example.com', 'Blake Rivera', 185, 'man',   225, 315, 405, 5, 5, 1, 1),
    ('dash-cam@example.com',   'Cam Ellis',    185, 'man',   185, 255, 335, 4, 1, 0, 1),
    ('dash-drew@example.com',  'Drew Patel',   185, 'man',   155, 215, 275, 3, 0, 0, 1),
    ('dash-emery@example.com', 'Emery Walsh',  135, 'woman', 115, 165, 215, 3, 2, 0, 1),
    ('dash-finn@example.com',  'Finn Hayes',   185, 'man',   175, 245, 315, 3, 1, 0, 0);

INSERT INTO users (full_name, email, password_hash, is_test)
    SELECT full_name, email, '$2y$12$HpBFUAIB8HDrzf79xxiCTeKAjyxgpBZO/JKfkkWvWX6/AkJI0aVEq', 0 FROM dash_people
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), password_hash = VALUES(password_hash), is_test = 0;

SET @today  = DATE(UTC_TIMESTAMP() - INTERVAL 5 HOUR);
SET @monday = @today - INTERVAL WEEKDAY(@today) DAY;
SET @plan   = (SELECT id FROM workout_plans WHERE name = 'Push Pull Legs');

-- Reset everything these accounts own. Deleting a group deletes its members and messages; deleting a workout its sets.
DELETE FROM buddy_groups WHERE owner_id IN (SELECT u.id FROM users u JOIN dash_people p ON p.email = u.email);
DELETE FROM buddy_members WHERE user_id IN (SELECT u.id FROM users u JOIN dash_people p ON p.email = u.email);
DELETE FROM workout_sessions WHERE user_id IN (SELECT u.id FROM users u JOIN dash_people p ON p.email = u.email);
DELETE FROM user_weekly_goals WHERE user_id IN (SELECT u.id FROM users u JOIN dash_people p ON p.email = u.email);
DELETE FROM user_weekly_competition WHERE user_id IN (SELECT u.id FROM users u JOIN dash_people p ON p.email = u.email);
DELETE FROM user_profile WHERE user_id IN (SELECT u.id FROM users u JOIN dash_people p ON p.email = u.email);
DELETE FROM user_equipment WHERE user_id IN (SELECT u.id FROM users u JOIN dash_people p ON p.email = u.email);

-- A finished setup (Strength, Intermediate, Full gym access) and the Push Pull Legs plan, started four weeks ago.
INSERT INTO user_preferences (user_id, training_goal)
    SELECT u.id, 'strength' FROM users u JOIN dash_people p ON p.email = u.email
ON DUPLICATE KEY UPDATE training_goal = VALUES(training_goal);
INSERT INTO user_setup (user_id, experience)
    SELECT u.id, 'intermediate' FROM users u JOIN dash_people p ON p.email = u.email
ON DUPLICATE KEY UPDATE experience = VALUES(experience);
INSERT INTO user_equipment (user_id, equipment)
    SELECT u.id, 'full_gym' FROM users u JOIN dash_people p ON p.email = u.email;
INSERT INTO user_plans (user_id, plan_id, started_at)
    SELECT u.id, @plan, TIMESTAMP(@monday - INTERVAL 21 DAY, '12:00:00') FROM users u JOIN dash_people p ON p.email = u.email
ON DUPLICATE KEY UPDATE plan_id = VALUES(plan_id), started_at = VALUES(started_at);

-- Body weight and gender (so no "Add personal details" banner) and the strength leaderboard join.
INSERT INTO user_profile (user_id, bodyweight_lb, gender, leaderboard_joined_at)
    SELECT u.id, p.bodyweight, p.gender, TIMESTAMP(@monday - INTERVAL 21 DAY, '12:00:00') FROM users u JOIN dash_people p ON p.email = u.email;

-- Weekly goal 3 this week (the same circle as weekly_competition.sql), and the weekly competition: joined three weeks
-- ago, so ranked this week.
INSERT INTO user_weekly_goals (user_id, week_start, target_days, created_at, updated_at)
    SELECT u.id, @monday, 3, UTC_TIMESTAMP(), UTC_TIMESTAMP() FROM users u JOIN dash_people p ON p.email = u.email;
INSERT INTO user_weekly_competition (user_id, joined_at, ranked_from)
    SELECT u.id, TIMESTAMP(@monday - INTERVAL 20 DAY, '12:00:00'), @monday - INTERVAL 14 DAY FROM users u JOIN dash_people p ON p.email = u.email;

-- The group and its messages (newest first on the Dashboard: Avery sees Cam's).
INSERT INTO buddy_groups (name, owner_id, invite_code, invite_expires_at, created_at)
    SELECT 'Iron Circle', u.id, 'DASH136G', UTC_TIMESTAMP() + INTERVAL 7 DAY, TIMESTAMP(@monday - INTERVAL 20 DAY, '12:00:00')
    FROM users u WHERE u.email = 'dash-avery@example.com';
SET @group = (SELECT id FROM buddy_groups WHERE invite_code = 'DASH136G');
INSERT INTO buddy_members (group_id, user_id, joined_at)
    SELECT @group, u.id, TIMESTAMP(@monday - INTERVAL 20 DAY, '13:00:00') FROM users u JOIN dash_people p ON p.email = u.email WHERE p.in_group = 1;

SET @avery = (SELECT id FROM users WHERE email = 'dash-avery@example.com');
SET @blake = (SELECT id FROM users WHERE email = 'dash-blake@example.com');
SET @cam   = (SELECT id FROM users WHERE email = 'dash-cam@example.com');
SET @drew  = (SELECT id FROM users WHERE email = 'dash-drew@example.com');
INSERT INTO buddy_encouragements (group_id, sender_id, recipient_id, message, created_at) VALUES
    (@group, @blake, @avery, 'Huge week so far. Keep the streak going!', UTC_TIMESTAMP() - INTERVAL 1 DAY),
    (@group, @cam,   @avery, 'That deadlift is climbing fast. See you at the gym tonight?', UTC_TIMESTAMP() - INTERVAL 2 HOUR),
    (@group, @avery, @drew,  'Nice work getting back in this week!', UTC_TIMESTAMP() - INTERVAL 3 HOUR);

-- Finished workouts. Scheduled weekday w (0 = Monday .. 4 = Friday) is Push, Pull, Legs, Push, Pull. Earlier weeks: the first
-- past_days of them. This week: the first week_days of the days before today, plus today for done_today (on a weekday).
CREATE TEMPORARY TABLE dash_days (w INT PRIMARY KEY);
INSERT INTO dash_days VALUES (0), (1), (2), (3), (4);
CREATE TEMPORARY TABLE dash_weeks (weeks_ago INT PRIMARY KEY);
INSERT INTO dash_weeks VALUES (0), (1), (2), (3);

-- Each day of the four weeks with its date and completion time (22:00 UTC is 5 pm in New York). Today's finished workout is
-- 45 minutes before loading, but never before 12:01 am New York time.
CREATE TEMPORARY TABLE dash_slots AS
    SELECT k.weeks_ago, d.w, @monday - INTERVAL k.weeks_ago * 7 DAY + INTERVAL d.w DAY AS day
    FROM dash_weeks k CROSS JOIN dash_days d;

INSERT INTO workout_sessions (user_id, plan_id, plan_name, day_name, focus, exercises, started_at, completed_at)
    SELECT u.id, @plan, 'Push Pull Legs', ELT(s.w MOD 3 + 1, 'Push', 'Pull', 'Legs'),
           ELT(s.w MOD 3 + 1, 'Chest, shoulders, triceps', 'Back, biceps', 'Quads, hamstrings, glutes'),
           ELT(s.w MOD 3 + 1, '["Bench press", "Overhead press", "Triceps pushdown"]',
                              '["Barbell row", "Deadlift", "Lat pulldown"]',
                              '["Back squat", "Romanian deadlift", "Walking lunge"]'),
           IF(s.day = @today, GREATEST(UTC_TIMESTAMP() - INTERVAL 45 MINUTE, TIMESTAMP(@today, '05:01:00')), TIMESTAMP(s.day, '22:00:00')) - INTERVAL 45 MINUTE,
           IF(s.day = @today, GREATEST(UTC_TIMESTAMP() - INTERVAL 45 MINUTE, TIMESTAMP(@today, '05:01:00')), TIMESTAMP(s.day, '22:00:00'))
    FROM dash_people p
    JOIN users u ON u.email = p.email
    JOIN dash_slots s
    WHERE (s.weeks_ago > 0 AND s.w < p.past_days)
       OR (s.weeks_ago = 0 AND s.day < @today AND s.w < p.week_days)
       OR (s.weeks_ago = 0 AND s.day = @today AND p.done_today = 1);

-- Three sets of each exercise. The big lifts follow each person's numbers above (5 lb less per earlier week), the rest are a
-- share of them or a fixed weight.
CREATE TEMPORARY TABLE dash_exercises (day_name VARCHAR(10), exercise VARCHAR(100), lift VARCHAR(10), share DECIMAL(3,2), fixed_lb INT, reps INT);
INSERT INTO dash_exercises VALUES
    ('Push', 'Bench press',       'bench',    1.00, NULL, 5),
    ('Push', 'Overhead press',    'bench',    0.60, NULL, 8),
    ('Push', 'Triceps pushdown',  NULL,       NULL, 50,  12),
    ('Pull', 'Barbell row',       'bench',    0.80, NULL, 8),
    ('Pull', 'Deadlift',          'deadlift', 1.00, NULL, 5),
    ('Pull', 'Lat pulldown',      'bench',    0.65, NULL, 10),
    ('Legs', 'Back squat',        'squat',    1.00, NULL, 5),
    ('Legs', 'Romanian deadlift', 'deadlift', 0.60, NULL, 8),
    ('Legs', 'Walking lunge',     NULL,       NULL, 40,  12);
CREATE TEMPORARY TABLE dash_set_numbers (n INT PRIMARY KEY);
INSERT INTO dash_set_numbers VALUES (1), (2), (3);

INSERT INTO workout_sets (session_id, exercise, set_number, weight_lb, reps, logged_at, updated_at)
    SELECT ws.id, e.exercise, n.n,
           IF(e.lift IS NULL, e.fixed_lb,
              ROUND(ELT(FIELD(e.lift, 'bench', 'squat', 'deadlift'), p.bench, p.squat, p.deadlift) * e.share / 5) * 5
              - 5 * GREATEST(0, CEIL(DATEDIFF(@monday, DATE(ws.completed_at - INTERVAL 5 HOUR)) / 7))),
           e.reps,
           ws.started_at + INTERVAL (n.n + 3 * (FIELD(e.exercise, 'Bench press', 'Barbell row', 'Back squat', 'Overhead press', 'Deadlift', 'Romanian deadlift', 'Triceps pushdown', 'Lat pulldown', 'Walking lunge') - 1)) MINUTE,
           ws.started_at + INTERVAL (n.n + 3 * (FIELD(e.exercise, 'Bench press', 'Barbell row', 'Back squat', 'Overhead press', 'Deadlift', 'Romanian deadlift', 'Triceps pushdown', 'Lat pulldown', 'Walking lunge') - 1)) MINUTE
    FROM workout_sessions ws
    JOIN users u ON u.id = ws.user_id
    JOIN dash_people p ON p.email = u.email
    JOIN dash_exercises e ON e.day_name = ws.day_name
    CROSS JOIN dash_set_numbers n;

DROP TEMPORARY TABLE dash_people, dash_days, dash_weeks, dash_slots, dash_exercises, dash_set_numbers;
