-- TEMPORARY TEST PLAN for Saturday, November 21, 2026. Apply only to a local or Aptitude test database.
-- Requires migrations 004, 005, 007, 008, and 011. Do not apply to Cattle.
-- This plan trains Monday through Saturday; Saturday is the sixth day and has three exercises.
-- Safe to rerun. Remove it with saturday_active_workout_test_plan_cleanup.sql after testing.

SET @saturday_test_plan_name = 'TEST ONLY - Saturday Workout - Remove Nov 21';

INSERT INTO workout_plans
  (name, level, duration_weeks, days_per_week, description, focus, summary, intensity)
VALUES
  (@saturday_test_plan_name, 'beginner', '1', 6,
   'Temporary plan for testing the active workout on Saturday. Remove after November 21, 2026.',
   'Temporary test plan', 'TEST ONLY: six training days, including a Saturday workout.', 'low')
ON DUPLICATE KEY UPDATE
  level = VALUES(level), duration_weeks = VALUES(duration_weeks), days_per_week = VALUES(days_per_week),
  description = VALUES(description), focus = VALUES(focus), summary = VALUES(summary), intensity = VALUES(intensity);

SET @saturday_test_plan_id = (SELECT id FROM workout_plans WHERE name = @saturday_test_plan_name);

INSERT INTO workout_plan_days (plan_id, position, name, focus, duration_minutes, exercises) VALUES
  (@saturday_test_plan_id, 1, 'Test Monday', 'Temporary workout test', 30, JSON_ARRAY('Bench press', 'Overhead press', 'Triceps pushdown')),
  (@saturday_test_plan_id, 2, 'Test Tuesday', 'Temporary workout test', 30, JSON_ARRAY('Barbell row', 'Lat pulldown', 'Dumbbell curl')),
  (@saturday_test_plan_id, 3, 'Test Wednesday', 'Temporary workout test', 30, JSON_ARRAY('Back squat', 'Romanian deadlift', 'Walking lunge')),
  (@saturday_test_plan_id, 4, 'Test Thursday', 'Temporary workout test', 30, JSON_ARRAY('Bench press', 'Overhead press', 'Triceps pushdown')),
  (@saturday_test_plan_id, 5, 'Test Friday', 'Temporary workout test', 30, JSON_ARRAY('Barbell row', 'Lat pulldown', 'Dumbbell curl')),
  (@saturday_test_plan_id, 6, 'Saturday Test Workout', 'Active workout testing', 45, JSON_ARRAY('Bench press', 'Overhead press', 'Triceps pushdown'))
ON DUPLICATE KEY UPDATE
  name = VALUES(name), focus = VALUES(focus), duration_minutes = VALUES(duration_minutes), exercises = VALUES(exercises);

INSERT IGNORE INTO workout_plan_goals (plan_id, goal) VALUES (@saturday_test_plan_id, 'strength');

SELECT id, name, days_per_week FROM workout_plans WHERE id = @saturday_test_plan_id;
SELECT position, name, exercises FROM workout_plan_days WHERE plan_id = @saturday_test_plan_id ORDER BY position;
