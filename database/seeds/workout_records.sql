-- Workout records test accounts for story #12: eleven summary-pr-<n>@example.com accounts, each with the completed Bench press
-- (account 9: Push-up) history that one comparison case needs. The password is Summary-PR-Test-12! for all of them; only its
-- salted hash is stored here. Requires database/migrations/001_auth.sql to 018_workout_buddies.sql. Safe to rerun: these
-- accounts' names, password, setup, plan and workouts are reset to the ones below, and no other account is touched.
-- The accounts are marked users.is_test = 1, so they never appear on a leaderboard.
--
-- Load it from the repo root:
--   mysql --default-character-set=utf8mb4 -u root cse442_2026_fall_team_y_db < database/seeds/workout_records.sql
--
--   n   completed workouts (top set)                     unfinished workout           case
--   1   100x5                                            Bench press, no sets         heavier set is a record (105x5)
--   2   100x5                                            Bench press, no sets         lower result is not a record (95x5)
--   3   none                                             Bench press, no sets         first result is a baseline (100x5)
--   4   110x5, then 100x5                                Bench press, no sets         105x5 beats the previous, not the best
--   5   100x5                                            Bench press, no sets         100x5 ties the best, not a record
--   6   100x8                                            Bench press, no sets         105x5 is a record, reps differ
--   7   100x5, then 105x5                                 Bench press, no sets         a later workout must not change the 105x5 one
--   8   100x5, then 105x5                                 none                         saved record, for the failure test
--   9   Push-up 0x10, then 0x8                            Push-up, no sets             bodyweight: 0x12 is a record by reps
--   10  100x5 and 105x5 on the same day                   none                         two workouts, one day, separate results
--   11  100x5, then 105x5                                 Bench press, 300x5 saved     unfinished sets are never used
--
-- Times are UTC, like the ones the API saves. The unfinished workouts start a minute ago, so Resume workout finds them.
-- The last query prints every workout id for the task tests (<U1>, <C7A>, ...): "unfinished" is U<n>, and completed
-- workouts of an account are C<n>A, C<n>B in the order listed in the table above.

INSERT INTO users (full_name, email, password_hash) VALUES
    ('Pat Record One',    'summary-pr-1@example.com',  '$2y$12$xRVRYOAQK1I1IPLCKR6zsu5q6ki.D2z5c4visRHCj3ohq0lYzuWFq'),
    ('Pat Record Two',    'summary-pr-2@example.com',  '$2y$12$xRVRYOAQK1I1IPLCKR6zsu5q6ki.D2z5c4visRHCj3ohq0lYzuWFq'),
    ('Pat Record Three',  'summary-pr-3@example.com',  '$2y$12$xRVRYOAQK1I1IPLCKR6zsu5q6ki.D2z5c4visRHCj3ohq0lYzuWFq'),
    ('Pat Record Four',   'summary-pr-4@example.com',  '$2y$12$xRVRYOAQK1I1IPLCKR6zsu5q6ki.D2z5c4visRHCj3ohq0lYzuWFq'),
    ('Pat Record Five',   'summary-pr-5@example.com',  '$2y$12$xRVRYOAQK1I1IPLCKR6zsu5q6ki.D2z5c4visRHCj3ohq0lYzuWFq'),
    ('Pat Record Six',    'summary-pr-6@example.com',  '$2y$12$xRVRYOAQK1I1IPLCKR6zsu5q6ki.D2z5c4visRHCj3ohq0lYzuWFq'),
    ('Pat Record Seven',  'summary-pr-7@example.com',  '$2y$12$xRVRYOAQK1I1IPLCKR6zsu5q6ki.D2z5c4visRHCj3ohq0lYzuWFq'),
    ('Pat Record Eight',  'summary-pr-8@example.com',  '$2y$12$xRVRYOAQK1I1IPLCKR6zsu5q6ki.D2z5c4visRHCj3ohq0lYzuWFq'),
    ('Pat Record Nine',   'summary-pr-9@example.com',  '$2y$12$xRVRYOAQK1I1IPLCKR6zsu5q6ki.D2z5c4visRHCj3ohq0lYzuWFq'),
    ('Pat Record Ten',    'summary-pr-10@example.com', '$2y$12$xRVRYOAQK1I1IPLCKR6zsu5q6ki.D2z5c4visRHCj3ohq0lYzuWFq'),
    ('Pat Record Eleven', 'summary-pr-11@example.com', '$2y$12$xRVRYOAQK1I1IPLCKR6zsu5q6ki.D2z5c4visRHCj3ohq0lYzuWFq')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), password_hash = VALUES(password_hash);

UPDATE users SET is_test = 1 WHERE email LIKE 'summary-pr-%@example.com';

SET @plan = (SELECT id FROM workout_plans WHERE name = 'Beginner Fundamentals');

-- A finished setup (Strength, Beginner, Full gym access) and the Beginner Fundamentals plan, so logging in opens the
-- Dashboard instead of an onboarding step.
INSERT INTO user_preferences (user_id, training_goal)
    SELECT id, 'strength' FROM users WHERE email LIKE 'summary-pr-%@example.com'
ON DUPLICATE KEY UPDATE training_goal = VALUES(training_goal);

INSERT INTO user_setup (user_id, experience)
    SELECT id, 'beginner' FROM users WHERE email LIKE 'summary-pr-%@example.com'
ON DUPLICATE KEY UPDATE experience = VALUES(experience);

DELETE FROM user_equipment WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'summary-pr-%@example.com');
INSERT INTO user_equipment (user_id, equipment)
    SELECT id, 'full_gym' FROM users WHERE email LIKE 'summary-pr-%@example.com';

INSERT INTO user_plans (user_id, plan_id, started_at)
    SELECT id, @plan, '2026-10-26 12:00:00' FROM users WHERE email LIKE 'summary-pr-%@example.com'
ON DUPLICATE KEY UPDATE plan_id = VALUES(plan_id), started_at = VALUES(started_at);

-- Reset: deleting the sessions also deletes their sets.
DELETE FROM workout_sessions WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'summary-pr-%@example.com');

-- One row per workout. completed_at NULL = unfinished (started a minute ago).
INSERT INTO workout_sessions (user_id, plan_id, plan_name, day_name, focus, exercises, started_at, completed_at)
SELECT u.id, @plan, 'Beginner Fundamentals', 'Full body A', 'Form and technique', JSON_ARRAY(w.exercise),
       IF(w.completed_at IS NULL, UTC_TIMESTAMP() - INTERVAL 1 MINUTE, w.completed_at - INTERVAL 40 MINUTE), w.completed_at
FROM (
    SELECT 1 AS n, 'Bench press' AS exercise, '2026-11-02 15:00:00' AS completed_at
    UNION ALL SELECT 1, 'Bench press', NULL
    UNION ALL SELECT 2, 'Bench press', '2026-11-02 15:00:00'
    UNION ALL SELECT 2, 'Bench press', NULL
    UNION ALL SELECT 3, 'Bench press', NULL
    UNION ALL SELECT 4, 'Bench press', '2026-10-20 15:00:00'
    UNION ALL SELECT 4, 'Bench press', '2026-11-02 15:00:00'
    UNION ALL SELECT 4, 'Bench press', NULL
    UNION ALL SELECT 5, 'Bench press', '2026-11-02 15:00:00'
    UNION ALL SELECT 5, 'Bench press', NULL
    UNION ALL SELECT 6, 'Bench press', '2026-11-02 15:00:00'
    UNION ALL SELECT 6, 'Bench press', NULL
    UNION ALL SELECT 7, 'Bench press', '2026-10-28 15:00:00'
    UNION ALL SELECT 7, 'Bench press', '2026-11-02 15:00:00'
    UNION ALL SELECT 7, 'Bench press', NULL
    UNION ALL SELECT 8, 'Bench press', '2026-10-28 15:00:00'
    UNION ALL SELECT 8, 'Bench press', '2026-11-02 15:00:00'
    UNION ALL SELECT 9, 'Push-up', '2026-10-28 15:00:00'
    UNION ALL SELECT 9, 'Push-up', '2026-11-02 15:00:00'
    UNION ALL SELECT 9, 'Push-up', NULL
    UNION ALL SELECT 10, 'Bench press', '2026-11-02 14:00:00'
    UNION ALL SELECT 10, 'Bench press', '2026-11-02 22:00:00'
    UNION ALL SELECT 11, 'Bench press', '2026-10-28 15:00:00'
    UNION ALL SELECT 11, 'Bench press', '2026-11-02 15:00:00'
    UNION ALL SELECT 11, 'Bench press', NULL
) w
JOIN users u ON u.email = CONCAT('summary-pr-', w.n, '@example.com');

-- The saved sets of the completed workouts (and account 11's unfinished one, matched with NULL below).
-- A weight of 0 is a bodyweight set. Each workout has a single set.
INSERT INTO workout_sets (session_id, exercise, set_number, weight_lb, reps, logged_at, updated_at)
SELECT s.id, v.exercise, 1, v.weight_lb, v.reps, s.started_at + INTERVAL 10 MINUTE, s.started_at + INTERVAL 10 MINUTE
FROM (
    SELECT 1 AS n, '2026-11-02 15:00:00' AS completed_at, 'Bench press' AS exercise, 100 AS weight_lb, 5 AS reps
    UNION ALL SELECT 2, '2026-11-02 15:00:00', 'Bench press', 100, 5
    UNION ALL SELECT 4, '2026-10-20 15:00:00', 'Bench press', 110, 5
    UNION ALL SELECT 4, '2026-11-02 15:00:00', 'Bench press', 100, 5
    UNION ALL SELECT 5, '2026-11-02 15:00:00', 'Bench press', 100, 5
    UNION ALL SELECT 6, '2026-11-02 15:00:00', 'Bench press', 100, 8
    UNION ALL SELECT 7, '2026-10-28 15:00:00', 'Bench press', 100, 5
    UNION ALL SELECT 7, '2026-11-02 15:00:00', 'Bench press', 105, 5
    UNION ALL SELECT 8, '2026-10-28 15:00:00', 'Bench press', 100, 5
    UNION ALL SELECT 8, '2026-11-02 15:00:00', 'Bench press', 105, 5
    UNION ALL SELECT 9, '2026-10-28 15:00:00', 'Push-up', 0, 10
    UNION ALL SELECT 9, '2026-11-02 15:00:00', 'Push-up', 0, 8
    UNION ALL SELECT 10, '2026-11-02 14:00:00', 'Bench press', 100, 5
    UNION ALL SELECT 10, '2026-11-02 22:00:00', 'Bench press', 105, 5
    UNION ALL SELECT 11, '2026-10-28 15:00:00', 'Bench press', 100, 5
    UNION ALL SELECT 11, '2026-11-02 15:00:00', 'Bench press', 105, 5
) v
JOIN users u ON u.email = CONCAT('summary-pr-', v.n, '@example.com')
JOIN workout_sessions s ON s.user_id = u.id AND s.completed_at = v.completed_at;

-- Account 11's unfinished workout already holds a heavy set that must never count.
INSERT INTO workout_sets (session_id, exercise, set_number, weight_lb, reps, logged_at, updated_at)
SELECT s.id, 'Bench press', 1, 300, 5, s.started_at, s.started_at
FROM workout_sessions s JOIN users u ON u.id = s.user_id
WHERE u.email = 'summary-pr-11@example.com' AND s.completed_at IS NULL;

-- The workout ids the task tests use: U<n> is account n's unfinished workout, C<n>A and C<n>B its completed ones in
-- the order of the table at the top.
SELECT CONCAT(IF(s.completed_at IS NULL, 'U', 'C'), SUBSTRING_INDEX(SUBSTRING_INDEX(u.email, '-', -1), '@', 1),
              IF(s.completed_at IS NULL, '', CHAR(64 + (SELECT COUNT(*) FROM workout_sessions x
                                                      WHERE x.user_id = s.user_id AND x.completed_at IS NOT NULL
                                                        AND x.completed_at <= s.completed_at)))) AS label,
       s.id AS session_id, s.completed_at
FROM workout_sessions s JOIN users u ON u.id = s.user_id
WHERE u.email LIKE 'summary-pr-%@example.com'
ORDER BY CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(u.email, '-', -1), '@', 1) AS UNSIGNED), s.completed_at IS NULL, s.completed_at;
