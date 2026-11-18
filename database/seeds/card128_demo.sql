-- Card #128: two saved Bench press examples for the PM review.
-- Test server only. Requires migrations 001-009 and 013, plus the plan catalog.
-- Rerunning replaces workouts only for the two exact accounts below.
-- This prepares saved data; the cardPR Start Test flow and PR labels require #128 code.
-- MySQL dates are UTC, as in workout_sessions. The older workout precedes the example.

START TRANSACTION;

INSERT INTO users (full_name, email, password_hash, is_test) VALUES
  ('Summary PR One', 'summary-pr-1@example.com', '$2y$12$hO7iFrc7awqrajrI3KvC8e1UZC7IhW3SHMZisI2DLSv7Vdl2.6oDS', 1),
  ('Summary PR Two', 'summary-pr-2@example.com', '$2y$12$hO7iFrc7awqrajrI3KvC8e1UZC7IhW3SHMZisI2DLSv7Vdl2.6oDS', 1)
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), password_hash = VALUES(password_hash), is_test = 1;

SET @pr1 = (SELECT id FROM users WHERE email = 'summary-pr-1@example.com');
SET @pr2 = (SELECT id FROM users WHERE email = 'summary-pr-2@example.com');
SET @plan = (SELECT id FROM workout_plans WHERE name = 'Beginner Fundamentals');

INSERT INTO user_preferences (user_id, training_goal) VALUES (@pr1, 'strength'), (@pr2, 'strength')
ON DUPLICATE KEY UPDATE training_goal = VALUES(training_goal);
INSERT INTO user_setup (user_id, experience) VALUES (@pr1, 'beginner'), (@pr2, 'beginner')
ON DUPLICATE KEY UPDATE experience = VALUES(experience);
DELETE FROM user_equipment WHERE user_id IN (@pr1, @pr2);
INSERT INTO user_equipment (user_id, equipment) VALUES (@pr1, 'full_gym'), (@pr2, 'full_gym');
INSERT INTO user_plans (user_id, plan_id, started_at) VALUES
  (@pr1, @plan, UTC_TIMESTAMP() - INTERVAL 21 DAY),
  (@pr2, @plan, UTC_TIMESTAMP() - INTERVAL 21 DAY)
ON DUPLICATE KEY UPDATE plan_id = VALUES(plan_id), started_at = VALUES(started_at);

-- The FK cascade also removes these accounts' old sets and weekly snapshots.
DELETE FROM workout_sessions WHERE user_id IN (@pr1, @pr2);

INSERT INTO workout_sessions
  (user_id, plan_id, plan_name, day_name, focus, exercises, started_at, completed_at)
VALUES
  (@pr1, @plan, 'Beginner Fundamentals', 'Bench press baseline', 'Strength', JSON_ARRAY('Bench press'),
   UTC_TIMESTAMP() - INTERVAL 14 DAY - INTERVAL 40 MINUTE, UTC_TIMESTAMP() - INTERVAL 14 DAY),
  (@pr1, @plan, 'Beginner Fundamentals', 'Bench press PR example', 'Strength', JSON_ARRAY('Bench press'),
   UTC_TIMESTAMP() - INTERVAL 1 DAY - INTERVAL 40 MINUTE, UTC_TIMESTAMP() - INTERVAL 1 DAY),
  (@pr2, @plan, 'Beginner Fundamentals', 'Bench press baseline', 'Strength', JSON_ARRAY('Bench press'),
   UTC_TIMESTAMP() - INTERVAL 14 DAY - INTERVAL 40 MINUTE, UTC_TIMESTAMP() - INTERVAL 14 DAY),
  (@pr2, @plan, 'Beginner Fundamentals', 'Bench press below best', 'Strength', JSON_ARRAY('Bench press'),
   UTC_TIMESTAMP() - INTERVAL 1 DAY - INTERVAL 40 MINUTE, UTC_TIMESTAMP() - INTERVAL 1 DAY);

INSERT INTO workout_sets (session_id, exercise, set_number, weight_lb, reps, logged_at, updated_at)
SELECT id, 'Bench press', 1,
  CASE WHEN day_name = 'Bench press PR example' THEN 105
       WHEN day_name = 'Bench press below best' THEN 95
       ELSE 100 END,
  5, started_at + INTERVAL 10 MINUTE, started_at + INTERVAL 10 MINUTE
FROM workout_sessions
WHERE user_id IN (@pr1, @pr2);

COMMIT;

SELECT u.email, s.day_name, ws.weight_lb, ws.reps, s.completed_at
FROM users u
JOIN workout_sessions s ON s.user_id = u.id
JOIN workout_sets ws ON ws.session_id = s.id
WHERE u.email IN ('summary-pr-1@example.com', 'summary-pr-2@example.com')
ORDER BY u.email, s.completed_at;
