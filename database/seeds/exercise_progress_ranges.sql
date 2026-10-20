-- Progress ranges test account for story #8 (card #110): Taylor Reed with three finished Deadlift workouts placed
-- 150, 50 and 1 days before the seed is loaded, so the Progress page's 30 days / 90 days / All time buttons always
-- show 1, 2 and 3 of them. That holds for 4 weeks after each load: reload this seed before testing after that.
-- The password is listed in database/seeds/README.md; only its salted hash is stored here.
-- Requires database/migrations/001_auth.sql to 009_workout_sessions.sql. Safe to rerun: Taylor's name, password and
-- setup are reset and Taylor's workouts are replaced by these three. No other account is touched.
--
-- Load it from the repo root after test_users.sql:
--   mysql --default-character-set=utf8mb4 -u root cse442_2026_fall_team_y_db < database/seeds/exercise_progress_ranges.sql

INSERT INTO users (full_name, email, password_hash) VALUES
    ('Taylor Reed', 'taylor.reed@example.com', '$2y$12$YvIJKTHmf9ZSv3Ag8jlxU.G7ULKHMATjtIn75b7MMF/ESjJyUIgSy')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), password_hash = VALUES(password_hash);

SET @taylor = (SELECT id FROM users WHERE email = 'taylor.reed@example.com');

-- A finished setup (Strength, Intermediate, Full gym access) and no plan, so logging in opens the Dashboard.
INSERT INTO user_preferences (user_id, training_goal) VALUES (@taylor, 'strength')
ON DUPLICATE KEY UPDATE training_goal = VALUES(training_goal);

INSERT INTO user_setup (user_id, experience) VALUES (@taylor, 'intermediate')
ON DUPLICATE KEY UPDATE experience = VALUES(experience);

DELETE FROM user_equipment WHERE user_id = @taylor;
INSERT INTO user_equipment (user_id, equipment) VALUES (@taylor, 'full_gym');

DELETE FROM user_plans WHERE user_id = @taylor;

-- Times are UTC, like the ones the API saves: 17:00 UTC is noon or 1 PM in New York, so each workout's New York
-- day is the same as its UTC day. Deleting the sessions also deletes their sets.
DELETE FROM workout_sessions WHERE user_id = @taylor;
INSERT INTO workout_sessions (user_id, plan_id, plan_name, day_name, focus, exercises, started_at, completed_at)
SELECT @taylor, NULL, 'Progress ranges seed', 'Deadlift day', '', JSON_ARRAY('Deadlift'),
       TIMESTAMP(UTC_DATE() - INTERVAL d.days_ago DAY, '16:20:00'), TIMESTAMP(UTC_DATE() - INTERVAL d.days_ago DAY, '17:00:00')
FROM (SELECT 150 AS days_ago UNION ALL SELECT 50 UNION ALL SELECT 1) d;

-- One set of 5 per workout, heavier each time: 225, 245 and 265 lb. Matched to its session by the finish day.
INSERT INTO workout_sets (session_id, exercise, set_number, weight_lb, reps, logged_at, updated_at)
SELECT s.id, 'Deadlift', 1, v.weight_lb, 5, s.started_at + INTERVAL 20 MINUTE, s.started_at + INTERVAL 20 MINUTE
FROM workout_sessions s
JOIN (SELECT 150 AS days_ago, 225 AS weight_lb UNION ALL SELECT 50, 245 UNION ALL SELECT 1, 265) v
  ON DATE(s.completed_at) = UTC_DATE() - INTERVAL v.days_ago DAY
WHERE s.user_id = @taylor;
