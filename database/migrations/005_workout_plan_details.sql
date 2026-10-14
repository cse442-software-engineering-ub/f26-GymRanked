-- 005_workout_plan_details.sql
-- Description and weekly split for each plan, shown on the plan details screen (story #67).
-- Requires 004_workout_plans.sql to have been applied first.
--
-- Apply locally:
--   mysql -u root cse442_2026_fall_team_y_db < database/migrations/005_workout_plan_details.sql
-- Apply on aptitude or cattle (after SSH, only when a task card says to):
--   mysql -u UBIT_USERNAME -p cse442_2026_fall_team_y_db < database/migrations/005_workout_plan_details.sql
-- Or paste this file into phpMyAdmin's SQL tab with the team database selected.
--
-- Bringing an existing database up to date: run 004 (if it hasn't been) and then this file.
-- Nothing is dropped, so existing plan rows and their ids are kept.
--
-- Safe to run more than once: the description column is only added if it's missing,
-- IF NOT EXISTS skips the days table if it's already there, and the seed rows key off
-- the plan name and (plan_id, position) so re-running updates them instead of duplicating.

-- MySQL has no ADD COLUMN IF NOT EXISTS, so check information_schema first.
SET @add_description = IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE() AND table_name = 'workout_plans' AND column_name = 'description') = 0,
  'ALTER TABLE workout_plans ADD COLUMN description TEXT NULL',
  'DO 0'
);
PREPARE add_description FROM @add_description;
EXECUTE add_description;
DEALLOCATE PREPARE add_description;

-- The training days listed under "Weekly split" on the plan details screen.
CREATE TABLE IF NOT EXISTS workout_plan_days (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plan_id INT NOT NULL,
  position INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  focus VARCHAR(255) NOT NULL,
  duration_minutes INT NOT NULL,
  UNIQUE KEY plan_position (plan_id, position),
  FOREIGN KEY (plan_id) REFERENCES workout_plans (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- Seed data matches the Figma "Plan details" screens.
UPDATE workout_plans p
JOIN (
  SELECT 'Push Pull Legs' AS name, 'A balanced strength split rotating push, pull, and leg days for steady progressive overload. Ideal for lifters who already have the fundamentals down and want a structured, repeatable rotation.' AS description
  UNION ALL SELECT 'Full Body Strength', 'Compound-lift focused full body sessions built around squat, bench, and deadlift variations for a strength base.'
  UNION ALL SELECT 'Upper/Lower Hypertrophy', 'Higher-volume upper and lower splits designed to maximize muscle growth across major lifts.'
  UNION ALL SELECT '5/3/1 Strength Cycle', 'A percentage-based cycle built around the big four lifts, prioritizing long-term strength gains.'
  UNION ALL SELECT 'Beginner Fundamentals', 'Learn proper form on the core lifts with a simple, repeatable full-body rotation.'
  UNION ALL SELECT 'Powerlifting Peak', 'A peaking block for competition prep, built around heavy singles and accessory work.'
  UNION ALL SELECT 'Bodyweight Basics', 'No equipment needed — build strength with push, pull, and leg bodyweight circuits.'
  UNION ALL SELECT 'Athletic Performance', 'A performance-focused program blending speed, power, and conditioning work.'
  UNION ALL SELECT 'Glute Focus', 'Targeted lower-body volume to build glute strength and size.'
  UNION ALL SELECT 'Marathon Strength Support', 'Strength training to complement marathon mileage without compromising recovery.'
) AS d ON d.name = p.name
SET p.description = d.description;

INSERT INTO workout_plan_days (plan_id, position, name, focus, duration_minutes)
SELECT p.id, d.position, d.name, d.focus, d.duration_minutes
FROM (
  SELECT 'Push Pull Legs' AS plan, 1 AS position, 'Push' AS name, 'Chest, shoulders, triceps' AS focus, 45 AS duration_minutes
  UNION ALL SELECT 'Push Pull Legs', 2, 'Pull', 'Back, biceps', 45
  UNION ALL SELECT 'Push Pull Legs', 3, 'Legs', 'Quads, hamstrings, glutes', 50
  UNION ALL SELECT 'Full Body Strength', 1, 'Full body A', 'Squat focus', 40
  UNION ALL SELECT 'Full Body Strength', 2, 'Full body B', 'Bench focus', 40
  UNION ALL SELECT 'Full Body Strength', 3, 'Full body C', 'Deadlift focus', 40
  UNION ALL SELECT 'Upper/Lower Hypertrophy', 1, 'Upper', 'Chest, back, shoulders, arms', 50
  UNION ALL SELECT 'Upper/Lower Hypertrophy', 2, 'Lower', 'Quads, hamstrings, glutes', 50
  UNION ALL SELECT 'Upper/Lower Hypertrophy', 3, 'Rest & mobility', 'Recovery work', 20
  UNION ALL SELECT '5/3/1 Strength Cycle', 1, 'Squat day', 'Squat + accessories', 55
  UNION ALL SELECT '5/3/1 Strength Cycle', 2, 'Bench day', 'Bench + accessories', 50
  UNION ALL SELECT '5/3/1 Strength Cycle', 3, 'Deadlift day', 'Deadlift + accessories', 55
  UNION ALL SELECT 'Beginner Fundamentals', 1, 'Full body A', 'Form and technique', 35
  UNION ALL SELECT 'Beginner Fundamentals', 2, 'Full body B', 'Form and technique', 35
  UNION ALL SELECT 'Beginner Fundamentals', 3, 'Full body C', 'Form and technique', 35
  UNION ALL SELECT 'Powerlifting Peak', 1, 'Squat', 'Heavy singles', 60
  UNION ALL SELECT 'Powerlifting Peak', 2, 'Bench', 'Heavy singles', 55
  UNION ALL SELECT 'Powerlifting Peak', 3, 'Deadlift', 'Heavy singles', 60
  UNION ALL SELECT 'Bodyweight Basics', 1, 'Push', 'Push-ups, dips', 30
  UNION ALL SELECT 'Bodyweight Basics', 2, 'Pull', 'Rows, pull-ups', 30
  UNION ALL SELECT 'Bodyweight Basics', 3, 'Legs', 'Squats, lunges', 30
  UNION ALL SELECT 'Athletic Performance', 1, 'Speed', 'Sprint mechanics', 40
  UNION ALL SELECT 'Athletic Performance', 2, 'Strength', 'Full body', 50
  UNION ALL SELECT 'Athletic Performance', 3, 'Power', 'Plyometrics', 40
  UNION ALL SELECT 'Glute Focus', 1, 'Glute A', 'Hip thrusts, squats', 45
  UNION ALL SELECT 'Glute Focus', 2, 'Glute B', 'Deadlifts, lunges', 45
  UNION ALL SELECT 'Glute Focus', 3, 'Full body', 'Upper + core', 40
  UNION ALL SELECT 'Marathon Strength Support', 1, 'Lower strength', 'Single-leg focus', 35
  UNION ALL SELECT 'Marathon Strength Support', 2, 'Upper strength', 'Full body push/pull', 35
  UNION ALL SELECT 'Marathon Strength Support', 3, 'Core & mobility', 'Stability work', 30
) AS d
JOIN workout_plans p ON p.name = d.plan
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  focus = VALUES(focus),
  duration_minutes = VALUES(duration_minutes);
