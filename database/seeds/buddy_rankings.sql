-- Buddies rankings test accounts for story #78 (card #138): eighteen crew-<name>@example.com accounts in two groups plus
-- one account in no group. The password is Crew-Test-78! for all of them; only its salted hash is stored here.
-- Requires database/migrations/001_auth.sql to 022_buddy_invite_no_expiry.sql. Safe to rerun: these accounts' names, password,
-- setup, profile, goals, groups, memberships and workouts are reset to the ones below, and no other account is touched.
-- The accounts are marked users.is_test = 1, so they never appear on the Everyone boards; the Buddies scope ignores that flag.
--
-- Strength workouts are dated in October 2026. The weekly workouts are dated in the CURRENT Monday-Sunday week (New York
-- time) at 16:00 UTC, on this week's Monday and the days after it, so the weekly tables are the same on any day it is
-- loaded (a workout dated later this week counts too). Reload it after a Sunday-to-Monday change.
--
-- Load it from the repo root:
--   mysql --default-character-set=utf8mb4 -u root cse442_2026_fall_team_y_db < database/seeds/buddy_rankings.sql
--
-- Northside Crew (owner Nora, invite code NRTH5CRW): 13 members. Everyone is a man at 180 lb, so the order follows the
-- lift total. Bench / Back squat / Deadlift (lb, three finished workouts of 1 set x 5 each):
--   Nora 225/315/405, Eli 215/300/390, Ana and Ben 205/285/365 (tied), Fay 185/265/335, Gus 175/255/325, Hal 165/245/315,
--   Ira 155/235/305, Jon 145/225/295, Kai 135/215/285, Lea 125/205/275       -> 11 ranked, so no top-10 cut shows
--   Cal: has not joined the leaderboard (not_joined). Dev: only 2 finished workouts (too_few_workouts).
--   Weekly (target days, days trained this week): goal 3: Nora 3, Eli 3, Lea 3, Ana 2, Ben 2, Fay 1, Kai 0;
--   goal 4: Gus 4, Hal 2, Ira 2; goal 5: Jon 1. Cal has not joined; Dev joined this week (practice week).
-- Eastside Lifters (owner Ola, invite code ESTL4FTR): Ola (woman, 140 lb) 135/185/225, Pia (woman, 140 lb) 115/155/195,
--   Raf (man, 200 lb) 275/365/455 -> ranked; Tim has no deadlift (missing_lifts) and has not joined the weekly competition.
--   Weekly, goal 3: Ola 3, Pia 3, Raf 1.
-- Zed Nolan: in no group (ranked on the Everyone-style rules, weekly goal 3 with 2 days).

INSERT INTO users (full_name, email, password_hash) VALUES
    ('Nora Vale', 'crew-nora@example.com', '$2y$12$z/bazfmG43yBYXFWoctpluP/MAz7twYrOtxQtO5yQmztei1PMUXY.'),
    ('Eli Marsh', 'crew-eli@example.com', '$2y$12$z/bazfmG43yBYXFWoctpluP/MAz7twYrOtxQtO5yQmztei1PMUXY.'),
    ('Ana Reed', 'crew-ana@example.com', '$2y$12$z/bazfmG43yBYXFWoctpluP/MAz7twYrOtxQtO5yQmztei1PMUXY.'),
    ('Ben Reed', 'crew-ben@example.com', '$2y$12$z/bazfmG43yBYXFWoctpluP/MAz7twYrOtxQtO5yQmztei1PMUXY.'),
    ('Fay Stone', 'crew-fay@example.com', '$2y$12$z/bazfmG43yBYXFWoctpluP/MAz7twYrOtxQtO5yQmztei1PMUXY.'),
    ('Gus Hart', 'crew-gus@example.com', '$2y$12$z/bazfmG43yBYXFWoctpluP/MAz7twYrOtxQtO5yQmztei1PMUXY.'),
    ('Hal Dunn', 'crew-hal@example.com', '$2y$12$z/bazfmG43yBYXFWoctpluP/MAz7twYrOtxQtO5yQmztei1PMUXY.'),
    ('Ira Cole', 'crew-ira@example.com', '$2y$12$z/bazfmG43yBYXFWoctpluP/MAz7twYrOtxQtO5yQmztei1PMUXY.'),
    ('Jon Pike', 'crew-jon@example.com', '$2y$12$z/bazfmG43yBYXFWoctpluP/MAz7twYrOtxQtO5yQmztei1PMUXY.'),
    ('Kai Lund', 'crew-kai@example.com', '$2y$12$z/bazfmG43yBYXFWoctpluP/MAz7twYrOtxQtO5yQmztei1PMUXY.'),
    ('Lea Moss', 'crew-lea@example.com', '$2y$12$z/bazfmG43yBYXFWoctpluP/MAz7twYrOtxQtO5yQmztei1PMUXY.'),
    ('Cal Dixon', 'crew-cal@example.com', '$2y$12$z/bazfmG43yBYXFWoctpluP/MAz7twYrOtxQtO5yQmztei1PMUXY.'),
    ('Dev Shaw', 'crew-dev@example.com', '$2y$12$z/bazfmG43yBYXFWoctpluP/MAz7twYrOtxQtO5yQmztei1PMUXY.'),
    ('Ola Finch', 'crew-ola@example.com', '$2y$12$z/bazfmG43yBYXFWoctpluP/MAz7twYrOtxQtO5yQmztei1PMUXY.'),
    ('Pia Quinn', 'crew-pia@example.com', '$2y$12$z/bazfmG43yBYXFWoctpluP/MAz7twYrOtxQtO5yQmztei1PMUXY.'),
    ('Raf Soto', 'crew-raf@example.com', '$2y$12$z/bazfmG43yBYXFWoctpluP/MAz7twYrOtxQtO5yQmztei1PMUXY.'),
    ('Tim Webb', 'crew-tim@example.com', '$2y$12$z/bazfmG43yBYXFWoctpluP/MAz7twYrOtxQtO5yQmztei1PMUXY.'),
    ('Zed Nolan', 'crew-zed@example.com', '$2y$12$z/bazfmG43yBYXFWoctpluP/MAz7twYrOtxQtO5yQmztei1PMUXY.')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), password_hash = VALUES(password_hash);

UPDATE users SET is_test = 1 WHERE email LIKE 'crew-%@example.com';

SET @today  = DATE(UTC_TIMESTAMP() - INTERVAL 5 HOUR);
SET @monday = @today - INTERVAL WEEKDAY(@today) DAY;

-- A finished setup (Strength, Beginner, Full gym access), so logging in opens the Dashboard instead of an onboarding step.
INSERT INTO user_preferences (user_id, training_goal)
    SELECT id, 'strength' FROM users WHERE email LIKE 'crew-%@example.com'
ON DUPLICATE KEY UPDATE training_goal = VALUES(training_goal);

INSERT INTO user_setup (user_id, experience)
    SELECT id, 'beginner' FROM users WHERE email LIKE 'crew-%@example.com'
ON DUPLICATE KEY UPDATE experience = VALUES(experience);

DELETE FROM user_equipment WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'crew-%@example.com');
INSERT INTO user_equipment (user_id, equipment)
    SELECT id, 'full_gym' FROM users WHERE email LIKE 'crew-%@example.com';

-- Reset everything these accounts own. Deleting a group deletes its members and messages.
DELETE FROM buddy_groups WHERE owner_id IN (SELECT id FROM users WHERE email LIKE 'crew-%@example.com');
DELETE FROM buddy_members WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'crew-%@example.com');
DELETE FROM workout_sessions WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'crew-%@example.com');
DELETE FROM user_weekly_goals WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'crew-%@example.com');
DELETE FROM user_weekly_competition WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'crew-%@example.com');
DELETE FROM user_profile WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'crew-%@example.com');

-- Body weight, gender and the leaderboard join (joined = 0: Cal has details but has not joined).
INSERT INTO user_profile (user_id, bodyweight_lb, gender, leaderboard_joined_at)
    SELECT u.id, p.bodyweight_lb, p.gender, IF(p.joined = 1, UTC_TIMESTAMP(), NULL)
    FROM (
        SELECT 'x' AS email, 0 AS bodyweight_lb, 'man' AS gender, 0 AS joined
                UNION ALL SELECT 'crew-nora@example.com', 180, 'man', 1
        UNION ALL SELECT 'crew-eli@example.com', 180, 'man', 1
        UNION ALL SELECT 'crew-ana@example.com', 180, 'man', 1
        UNION ALL SELECT 'crew-ben@example.com', 180, 'man', 1
        UNION ALL SELECT 'crew-fay@example.com', 180, 'man', 1
        UNION ALL SELECT 'crew-gus@example.com', 180, 'man', 1
        UNION ALL SELECT 'crew-hal@example.com', 180, 'man', 1
        UNION ALL SELECT 'crew-ira@example.com', 180, 'man', 1
        UNION ALL SELECT 'crew-jon@example.com', 180, 'man', 1
        UNION ALL SELECT 'crew-kai@example.com', 180, 'man', 1
        UNION ALL SELECT 'crew-lea@example.com', 180, 'man', 1
        UNION ALL SELECT 'crew-cal@example.com', 180, 'man', 0
        UNION ALL SELECT 'crew-dev@example.com', 180, 'man', 1
        UNION ALL SELECT 'crew-ola@example.com', 140, 'woman', 1
        UNION ALL SELECT 'crew-pia@example.com', 140, 'woman', 1
        UNION ALL SELECT 'crew-raf@example.com', 200, 'man', 1
        UNION ALL SELECT 'crew-tim@example.com', 190, 'man', 1
        UNION ALL SELECT 'crew-zed@example.com', 180, 'man', 1
    ) p JOIN users u ON u.email = p.email;


INSERT INTO buddy_groups (name, owner_id, invite_code, created_at) VALUES
    ('Northside Crew',  (SELECT id FROM users WHERE email = 'crew-nora@example.com'), 'NRTH5CRW', UTC_TIMESTAMP() - INTERVAL 5 DAY),
    ('Eastside Lifters', (SELECT id FROM users WHERE email = 'crew-ola@example.com'),  'ESTL4FTR', UTC_TIMESTAMP() - INTERVAL 5 DAY);

INSERT INTO buddy_members (group_id, user_id, joined_at)
    SELECT IF(u.email IN ('crew-nora@example.com', 'crew-eli@example.com', 'crew-ana@example.com', 'crew-ben@example.com', 'crew-fay@example.com', 'crew-gus@example.com', 'crew-hal@example.com', 'crew-ira@example.com', 'crew-jon@example.com', 'crew-kai@example.com', 'crew-lea@example.com', 'crew-cal@example.com', 'crew-dev@example.com'), (SELECT id FROM buddy_groups WHERE invite_code = 'NRTH5CRW'), (SELECT id FROM buddy_groups WHERE invite_code = 'ESTL4FTR')),
           u.id, UTC_TIMESTAMP() - INTERVAL 4 DAY
    FROM users u WHERE u.email IN ('crew-nora@example.com', 'crew-eli@example.com', 'crew-ana@example.com', 'crew-ben@example.com', 'crew-fay@example.com', 'crew-gus@example.com', 'crew-hal@example.com', 'crew-ira@example.com', 'crew-jon@example.com', 'crew-kai@example.com', 'crew-lea@example.com', 'crew-cal@example.com', 'crew-dev@example.com', 'crew-ola@example.com', 'crew-pia@example.com', 'crew-raf@example.com', 'crew-tim@example.com');

-- Weekly goals for this week (api/weekly_goal.php).
INSERT INTO user_weekly_goals (user_id, week_start, target_days, created_at, updated_at)
    SELECT u.id, @monday, g.target, UTC_TIMESTAMP(), UTC_TIMESTAMP() FROM (
        SELECT 'x' AS email, 0 AS target
        UNION ALL SELECT 'crew-nora@example.com', 3
        UNION ALL SELECT 'crew-eli@example.com', 3
        UNION ALL SELECT 'crew-ana@example.com', 3
        UNION ALL SELECT 'crew-ben@example.com', 3
        UNION ALL SELECT 'crew-fay@example.com', 3
        UNION ALL SELECT 'crew-gus@example.com', 4
        UNION ALL SELECT 'crew-hal@example.com', 4
        UNION ALL SELECT 'crew-ira@example.com', 4
        UNION ALL SELECT 'crew-jon@example.com', 5
        UNION ALL SELECT 'crew-kai@example.com', 3
        UNION ALL SELECT 'crew-lea@example.com', 3
        UNION ALL SELECT 'crew-dev@example.com', 3
        UNION ALL SELECT 'crew-ola@example.com', 3
        UNION ALL SELECT 'crew-pia@example.com', 3
        UNION ALL SELECT 'crew-raf@example.com', 3
        UNION ALL SELECT 'crew-zed@example.com', 3
    ) g JOIN users u ON u.email = g.email;

-- Weekly competition: joined last Tuesday, ranked from this Monday. Dev joined just now (a practice week). Cal and Tim have not joined.
INSERT INTO user_weekly_competition (user_id, joined_at, ranked_from)
    SELECT id, TIMESTAMP(@monday - INTERVAL 6 DAY, '16:00:00'), @monday FROM users WHERE email IN ('crew-nora@example.com', 'crew-eli@example.com', 'crew-ana@example.com', 'crew-ben@example.com', 'crew-fay@example.com', 'crew-gus@example.com', 'crew-hal@example.com', 'crew-ira@example.com', 'crew-jon@example.com', 'crew-kai@example.com', 'crew-lea@example.com', 'crew-ola@example.com', 'crew-pia@example.com', 'crew-raf@example.com', 'crew-zed@example.com');
INSERT INTO user_weekly_competition (user_id, joined_at, ranked_from)
    SELECT id, UTC_TIMESTAMP(), @monday + INTERVAL 7 DAY FROM users WHERE email = 'crew-dev@example.com';

-- Finished workouts: the three strength workouts (October 5, 12 and 19, 22:00 UTC) and this week's training days.
INSERT INTO workout_sessions (user_id, plan_id, plan_name, day_name, focus, exercises, started_at, completed_at)
    SELECT u.id, NULL, 'Buddies rankings seed', 'Seed day', '', w.exercises, w.completed_at - INTERVAL 40 MINUTE, w.completed_at FROM (
        SELECT 'x' AS email, NOW() AS completed_at, JSON_ARRAY('x') AS exercises
        UNION ALL SELECT 'crew-nora@example.com', '2026-10-05 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-nora@example.com', '2026-10-12 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-nora@example.com', '2026-10-19 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-nora@example.com', TIMESTAMP(@monday + INTERVAL 0 DAY, '16:00:00'), JSON_ARRAY('Push-up')
        UNION ALL SELECT 'crew-nora@example.com', TIMESTAMP(@monday + INTERVAL 1 DAY, '16:00:00'), JSON_ARRAY('Push-up')
        UNION ALL SELECT 'crew-nora@example.com', TIMESTAMP(@monday + INTERVAL 2 DAY, '16:00:00'), JSON_ARRAY('Push-up')
        UNION ALL SELECT 'crew-eli@example.com', '2026-10-05 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-eli@example.com', '2026-10-12 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-eli@example.com', '2026-10-19 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-eli@example.com', TIMESTAMP(@monday + INTERVAL 0 DAY, '16:00:00'), JSON_ARRAY('Push-up')
        UNION ALL SELECT 'crew-eli@example.com', TIMESTAMP(@monday + INTERVAL 1 DAY, '16:00:00'), JSON_ARRAY('Push-up')
        UNION ALL SELECT 'crew-eli@example.com', TIMESTAMP(@monday + INTERVAL 2 DAY, '16:00:00'), JSON_ARRAY('Push-up')
        UNION ALL SELECT 'crew-ana@example.com', '2026-10-05 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-ana@example.com', '2026-10-12 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-ana@example.com', '2026-10-19 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-ana@example.com', TIMESTAMP(@monday + INTERVAL 0 DAY, '16:00:00'), JSON_ARRAY('Push-up')
        UNION ALL SELECT 'crew-ana@example.com', TIMESTAMP(@monday + INTERVAL 1 DAY, '16:00:00'), JSON_ARRAY('Push-up')
        UNION ALL SELECT 'crew-ben@example.com', '2026-10-05 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-ben@example.com', '2026-10-12 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-ben@example.com', '2026-10-19 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-ben@example.com', TIMESTAMP(@monday + INTERVAL 0 DAY, '16:00:00'), JSON_ARRAY('Push-up')
        UNION ALL SELECT 'crew-ben@example.com', TIMESTAMP(@monday + INTERVAL 1 DAY, '16:00:00'), JSON_ARRAY('Push-up')
        UNION ALL SELECT 'crew-fay@example.com', '2026-10-05 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-fay@example.com', '2026-10-12 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-fay@example.com', '2026-10-19 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-fay@example.com', TIMESTAMP(@monday + INTERVAL 0 DAY, '16:00:00'), JSON_ARRAY('Push-up')
        UNION ALL SELECT 'crew-gus@example.com', '2026-10-05 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-gus@example.com', '2026-10-12 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-gus@example.com', '2026-10-19 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-gus@example.com', TIMESTAMP(@monday + INTERVAL 0 DAY, '16:00:00'), JSON_ARRAY('Push-up')
        UNION ALL SELECT 'crew-gus@example.com', TIMESTAMP(@monday + INTERVAL 1 DAY, '16:00:00'), JSON_ARRAY('Push-up')
        UNION ALL SELECT 'crew-gus@example.com', TIMESTAMP(@monday + INTERVAL 2 DAY, '16:00:00'), JSON_ARRAY('Push-up')
        UNION ALL SELECT 'crew-gus@example.com', TIMESTAMP(@monday + INTERVAL 3 DAY, '16:00:00'), JSON_ARRAY('Push-up')
        UNION ALL SELECT 'crew-hal@example.com', '2026-10-05 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-hal@example.com', '2026-10-12 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-hal@example.com', '2026-10-19 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-hal@example.com', TIMESTAMP(@monday + INTERVAL 0 DAY, '16:00:00'), JSON_ARRAY('Push-up')
        UNION ALL SELECT 'crew-hal@example.com', TIMESTAMP(@monday + INTERVAL 1 DAY, '16:00:00'), JSON_ARRAY('Push-up')
        UNION ALL SELECT 'crew-ira@example.com', '2026-10-05 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-ira@example.com', '2026-10-12 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-ira@example.com', '2026-10-19 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-ira@example.com', TIMESTAMP(@monday + INTERVAL 0 DAY, '16:00:00'), JSON_ARRAY('Push-up')
        UNION ALL SELECT 'crew-ira@example.com', TIMESTAMP(@monday + INTERVAL 1 DAY, '16:00:00'), JSON_ARRAY('Push-up')
        UNION ALL SELECT 'crew-jon@example.com', '2026-10-05 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-jon@example.com', '2026-10-12 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-jon@example.com', '2026-10-19 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-jon@example.com', TIMESTAMP(@monday + INTERVAL 0 DAY, '16:00:00'), JSON_ARRAY('Push-up')
        UNION ALL SELECT 'crew-kai@example.com', '2026-10-05 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-kai@example.com', '2026-10-12 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-kai@example.com', '2026-10-19 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-lea@example.com', '2026-10-05 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-lea@example.com', '2026-10-12 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-lea@example.com', '2026-10-19 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-lea@example.com', TIMESTAMP(@monday + INTERVAL 0 DAY, '16:00:00'), JSON_ARRAY('Push-up')
        UNION ALL SELECT 'crew-lea@example.com', TIMESTAMP(@monday + INTERVAL 1 DAY, '16:00:00'), JSON_ARRAY('Push-up')
        UNION ALL SELECT 'crew-lea@example.com', TIMESTAMP(@monday + INTERVAL 2 DAY, '16:00:00'), JSON_ARRAY('Push-up')
        UNION ALL SELECT 'crew-cal@example.com', '2026-10-05 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-cal@example.com', '2026-10-12 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-cal@example.com', '2026-10-19 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-dev@example.com', '2026-10-05 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-dev@example.com', '2026-10-12 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-ola@example.com', '2026-10-05 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-ola@example.com', '2026-10-12 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-ola@example.com', '2026-10-19 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-ola@example.com', TIMESTAMP(@monday + INTERVAL 0 DAY, '16:00:00'), JSON_ARRAY('Push-up')
        UNION ALL SELECT 'crew-ola@example.com', TIMESTAMP(@monday + INTERVAL 1 DAY, '16:00:00'), JSON_ARRAY('Push-up')
        UNION ALL SELECT 'crew-ola@example.com', TIMESTAMP(@monday + INTERVAL 2 DAY, '16:00:00'), JSON_ARRAY('Push-up')
        UNION ALL SELECT 'crew-pia@example.com', '2026-10-05 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-pia@example.com', '2026-10-12 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-pia@example.com', '2026-10-19 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-pia@example.com', TIMESTAMP(@monday + INTERVAL 0 DAY, '16:00:00'), JSON_ARRAY('Push-up')
        UNION ALL SELECT 'crew-pia@example.com', TIMESTAMP(@monday + INTERVAL 1 DAY, '16:00:00'), JSON_ARRAY('Push-up')
        UNION ALL SELECT 'crew-pia@example.com', TIMESTAMP(@monday + INTERVAL 2 DAY, '16:00:00'), JSON_ARRAY('Push-up')
        UNION ALL SELECT 'crew-raf@example.com', '2026-10-05 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-raf@example.com', '2026-10-12 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-raf@example.com', '2026-10-19 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-raf@example.com', TIMESTAMP(@monday + INTERVAL 0 DAY, '16:00:00'), JSON_ARRAY('Push-up')
        UNION ALL SELECT 'crew-tim@example.com', '2026-10-05 22:00:00', JSON_ARRAY('Bench press','Back squat')
        UNION ALL SELECT 'crew-tim@example.com', '2026-10-12 22:00:00', JSON_ARRAY('Bench press','Back squat')
        UNION ALL SELECT 'crew-tim@example.com', '2026-10-19 22:00:00', JSON_ARRAY('Bench press','Back squat')
        UNION ALL SELECT 'crew-zed@example.com', '2026-10-05 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-zed@example.com', '2026-10-12 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-zed@example.com', '2026-10-19 22:00:00', JSON_ARRAY('Bench press','Back squat','Deadlift')
        UNION ALL SELECT 'crew-zed@example.com', TIMESTAMP(@monday + INTERVAL 0 DAY, '16:00:00'), JSON_ARRAY('Push-up')
        UNION ALL SELECT 'crew-zed@example.com', TIMESTAMP(@monday + INTERVAL 1 DAY, '16:00:00'), JSON_ARRAY('Push-up')
    ) w JOIN users u ON u.email = w.email;

-- One set of 5 per lift in each strength workout (every strength workout of a person is the same), and one 0 lb push-up set per training day.
INSERT INTO workout_sets (session_id, exercise, set_number, weight_lb, reps, logged_at, updated_at)
    SELECT s.id, l.exercise, 1, l.weight_lb, 5, s.started_at + INTERVAL 10 MINUTE, s.started_at + INTERVAL 10 MINUTE FROM (
        SELECT 'x' AS email, 'x' AS exercise, 0 AS weight_lb
        UNION ALL SELECT 'crew-nora@example.com', 'Bench press', 225
        UNION ALL SELECT 'crew-nora@example.com', 'Back squat', 315
        UNION ALL SELECT 'crew-nora@example.com', 'Deadlift', 405
        UNION ALL SELECT 'crew-eli@example.com', 'Bench press', 215
        UNION ALL SELECT 'crew-eli@example.com', 'Back squat', 300
        UNION ALL SELECT 'crew-eli@example.com', 'Deadlift', 390
        UNION ALL SELECT 'crew-ana@example.com', 'Bench press', 205
        UNION ALL SELECT 'crew-ana@example.com', 'Back squat', 285
        UNION ALL SELECT 'crew-ana@example.com', 'Deadlift', 365
        UNION ALL SELECT 'crew-ben@example.com', 'Bench press', 205
        UNION ALL SELECT 'crew-ben@example.com', 'Back squat', 285
        UNION ALL SELECT 'crew-ben@example.com', 'Deadlift', 365
        UNION ALL SELECT 'crew-fay@example.com', 'Bench press', 185
        UNION ALL SELECT 'crew-fay@example.com', 'Back squat', 265
        UNION ALL SELECT 'crew-fay@example.com', 'Deadlift', 335
        UNION ALL SELECT 'crew-gus@example.com', 'Bench press', 175
        UNION ALL SELECT 'crew-gus@example.com', 'Back squat', 255
        UNION ALL SELECT 'crew-gus@example.com', 'Deadlift', 325
        UNION ALL SELECT 'crew-hal@example.com', 'Bench press', 165
        UNION ALL SELECT 'crew-hal@example.com', 'Back squat', 245
        UNION ALL SELECT 'crew-hal@example.com', 'Deadlift', 315
        UNION ALL SELECT 'crew-ira@example.com', 'Bench press', 155
        UNION ALL SELECT 'crew-ira@example.com', 'Back squat', 235
        UNION ALL SELECT 'crew-ira@example.com', 'Deadlift', 305
        UNION ALL SELECT 'crew-jon@example.com', 'Bench press', 145
        UNION ALL SELECT 'crew-jon@example.com', 'Back squat', 225
        UNION ALL SELECT 'crew-jon@example.com', 'Deadlift', 295
        UNION ALL SELECT 'crew-kai@example.com', 'Bench press', 135
        UNION ALL SELECT 'crew-kai@example.com', 'Back squat', 215
        UNION ALL SELECT 'crew-kai@example.com', 'Deadlift', 285
        UNION ALL SELECT 'crew-lea@example.com', 'Bench press', 125
        UNION ALL SELECT 'crew-lea@example.com', 'Back squat', 205
        UNION ALL SELECT 'crew-lea@example.com', 'Deadlift', 275
        UNION ALL SELECT 'crew-cal@example.com', 'Bench press', 115
        UNION ALL SELECT 'crew-cal@example.com', 'Back squat', 195
        UNION ALL SELECT 'crew-cal@example.com', 'Deadlift', 265
        UNION ALL SELECT 'crew-dev@example.com', 'Bench press', 105
        UNION ALL SELECT 'crew-dev@example.com', 'Back squat', 185
        UNION ALL SELECT 'crew-dev@example.com', 'Deadlift', 255
        UNION ALL SELECT 'crew-ola@example.com', 'Bench press', 135
        UNION ALL SELECT 'crew-ola@example.com', 'Back squat', 185
        UNION ALL SELECT 'crew-ola@example.com', 'Deadlift', 225
        UNION ALL SELECT 'crew-pia@example.com', 'Bench press', 115
        UNION ALL SELECT 'crew-pia@example.com', 'Back squat', 155
        UNION ALL SELECT 'crew-pia@example.com', 'Deadlift', 195
        UNION ALL SELECT 'crew-raf@example.com', 'Bench press', 275
        UNION ALL SELECT 'crew-raf@example.com', 'Back squat', 365
        UNION ALL SELECT 'crew-raf@example.com', 'Deadlift', 455
        UNION ALL SELECT 'crew-tim@example.com', 'Bench press', 185
        UNION ALL SELECT 'crew-tim@example.com', 'Back squat', 245
        UNION ALL SELECT 'crew-zed@example.com', 'Bench press', 185
        UNION ALL SELECT 'crew-zed@example.com', 'Back squat', 245
        UNION ALL SELECT 'crew-zed@example.com', 'Deadlift', 305
    ) l JOIN users u ON u.email = l.email JOIN workout_sessions s ON s.user_id = u.id AND s.plan_name = 'Buddies rankings seed' AND s.completed_at < @monday
    WHERE l.exercise <> 'x';

INSERT INTO workout_sets (session_id, exercise, set_number, weight_lb, reps, logged_at, updated_at)
    SELECT s.id, 'Push-up', 1, 0, 10, s.started_at + INTERVAL 10 MINUTE, s.started_at + INTERVAL 10 MINUTE
    FROM workout_sessions s JOIN users u ON u.id = s.user_id
    WHERE u.email LIKE 'crew-%@example.com' AND s.plan_name = 'Buddies rankings seed' AND s.completed_at >= @monday;

-- The groups, for the task tests.
SELECT g.name, COUNT(*) AS members, g.invite_code FROM buddy_groups g JOIN buddy_members m ON m.group_id = g.id WHERE g.invite_code IN ('NRTH5CRW', 'ESTL4FTR') GROUP BY g.id;
