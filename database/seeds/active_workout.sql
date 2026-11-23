-- Active workout test accounts for story #4 (Acceptance Tests 1 to 7): active4-start, -phone, -resume, -validation,
-- -unfinished, -complete and -summary, one per test. Each has finished onboarding (Strength, Intermediate, Full gym
-- access), has the Push Pull Legs plan selected, and has no workout or saved sets today, so its first workout is
-- clean. All use the password Active-Test-4!; only its salted hash is stored here.
-- (Acceptance Test 8 uses returnto-15@example.com from set_entry.sql.)
--
-- active4-summary also has two completed Push workouts, each with only Bench press: 100 lb x 5 ten days ago, then
-- 90 lb x 8 five days ago. Neither contains Overhead press, so today's Overhead press is a first result and today's
-- Bench press (95 lb x 6) is not a weight record against the 100 lb best.
--
-- Push is today's workout only on the weekdays the plan schedules it (Monday and Thursday for the 5-day Push Pull
-- Legs plan). Reload this seed on the test day: it resets these accounts to the state above.
-- Requires database/migrations/001_auth.sql to 019_workout_set_request_ids.sql. Safe to rerun: these accounts are
-- reset (their workouts, with their sets, are deleted and the summary history is recreated) and every other account
-- is left alone. The accounts are marked users.is_test = 1, so they never appear on a leaderboard.
--
-- Load it from the repo root:
--   mysql --default-character-set=utf8mb4 -u root cse442_2026_fall_team_y_db < database/seeds/active_workout.sql

INSERT INTO users (full_name, email, password_hash) VALUES
    ('Active 4 Start', 'active4-start@example.com', '$2y$12$2VMRXrvAlZC1EwWQNw/pTObBQ5R6kK7q7C5Il5jt.p04wfGWE6mdC'),
    ('Active 4 Phone', 'active4-phone@example.com', '$2y$12$2VMRXrvAlZC1EwWQNw/pTObBQ5R6kK7q7C5Il5jt.p04wfGWE6mdC'),
    ('Active 4 Resume', 'active4-resume@example.com', '$2y$12$2VMRXrvAlZC1EwWQNw/pTObBQ5R6kK7q7C5Il5jt.p04wfGWE6mdC'),
    ('Active 4 Validation', 'active4-validation@example.com', '$2y$12$2VMRXrvAlZC1EwWQNw/pTObBQ5R6kK7q7C5Il5jt.p04wfGWE6mdC'),
    ('Active 4 Unfinished', 'active4-unfinished@example.com', '$2y$12$2VMRXrvAlZC1EwWQNw/pTObBQ5R6kK7q7C5Il5jt.p04wfGWE6mdC'),
    ('Active 4 Complete', 'active4-complete@example.com', '$2y$12$2VMRXrvAlZC1EwWQNw/pTObBQ5R6kK7q7C5Il5jt.p04wfGWE6mdC'),
    ('Active 4 Summary', 'active4-summary@example.com', '$2y$12$2VMRXrvAlZC1EwWQNw/pTObBQ5R6kK7q7C5Il5jt.p04wfGWE6mdC')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), password_hash = VALUES(password_hash);

UPDATE users SET is_test = 1 WHERE email LIKE 'active4-%@example.com';

INSERT INTO user_preferences (user_id, training_goal)
    SELECT id, 'strength' FROM users WHERE email LIKE 'active4-%@example.com'
ON DUPLICATE KEY UPDATE training_goal = VALUES(training_goal);

INSERT INTO user_setup (user_id, experience)
    SELECT id, 'intermediate' FROM users WHERE email LIKE 'active4-%@example.com'
ON DUPLICATE KEY UPDATE experience = VALUES(experience);

DELETE FROM user_equipment WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'active4-%@example.com');
INSERT INTO user_equipment (user_id, equipment)
    SELECT id, 'full_gym' FROM users WHERE email LIKE 'active4-%@example.com';

DELETE FROM user_plans WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'active4-%@example.com');
INSERT INTO user_plans (user_id, plan_id)
    SELECT id, (SELECT id FROM workout_plans WHERE name = 'Push Pull Legs')
    FROM users WHERE email LIKE 'active4-%@example.com';

-- No workout started: deleting the sessions also deletes their sets.
DELETE FROM workout_sessions WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'active4-%@example.com');

-- active4-summary's two earlier completed workouts (times are UTC, like the ones the API saves).
INSERT INTO workout_sessions (user_id, plan_id, plan_name, day_name, focus, exercises, started_at, completed_at)
SELECT u.id, (SELECT id FROM workout_plans WHERE name = 'Push Pull Legs'), 'Push Pull Legs', 'Push',
       'Chest, shoulders, triceps', JSON_ARRAY('Bench press'),
       UTC_TIMESTAMP() - INTERVAL w.days_ago DAY - INTERVAL 40 MINUTE, UTC_TIMESTAMP() - INTERVAL w.days_ago DAY
FROM users u
JOIN (SELECT 10 AS days_ago UNION ALL SELECT 5) w
WHERE u.email = 'active4-summary@example.com';

INSERT INTO workout_sets (session_id, exercise, set_number, weight_lb, reps, logged_at, updated_at)
SELECT s.id, 'Bench press', 1, IF(s.completed_at < UTC_TIMESTAMP() - INTERVAL 7 DAY, 100, 90),
       IF(s.completed_at < UTC_TIMESTAMP() - INTERVAL 7 DAY, 5, 8),
       s.started_at + INTERVAL 10 MINUTE, s.started_at + INTERVAL 10 MINUTE
FROM workout_sessions s JOIN users u ON u.id = s.user_id
WHERE u.email = 'active4-summary@example.com';
