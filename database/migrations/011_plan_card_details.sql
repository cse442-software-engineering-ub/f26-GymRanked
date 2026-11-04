-- 011_plan_card_details.sql
-- What the plan library card shows so plans can be compared: a training focus, a one-line summary and an
-- intensity for each plan (Plan List Upgrade, card 112). Session length is not stored here; api/plans.php
-- averages workout_plan_days.duration_minutes.
-- Requires 004_workout_plans.sql and 005_workout_plan_details.sql to have been applied first.
--
-- Apply locally:
--   mysql -u root cse442_2026_fall_team_y_db < database/migrations/011_plan_card_details.sql
-- Apply on aptitude or cattle (after SSH, only when a task card says to):
--   mysql -u UBIT_USERNAME -p cse442_2026_fall_team_y_db < database/migrations/011_plan_card_details.sql
-- Or paste this file into phpMyAdmin's SQL tab with the team database selected.
--
-- Bringing an existing database up to date: run 004, 005 (if they haven't been) and then this file.
-- Nothing is dropped, so existing plan rows and their ids are kept.
--
-- Safe to run more than once: each column is only added if it's missing, and the seed rows key off the
-- plan name so re-running updates them instead of duplicating.

-- MySQL has no ADD COLUMN IF NOT EXISTS, so check information_schema first.
SET @add_focus = IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE() AND table_name = 'workout_plans' AND column_name = 'focus') = 0,
  'ALTER TABLE workout_plans ADD COLUMN focus VARCHAR(60) NULL',
  'DO 0'
);
PREPARE add_focus FROM @add_focus;
EXECUTE add_focus;
DEALLOCATE PREPARE add_focus;

SET @add_summary = IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE() AND table_name = 'workout_plans' AND column_name = 'summary') = 0,
  'ALTER TABLE workout_plans ADD COLUMN summary VARCHAR(160) NULL',
  'DO 0'
);
PREPARE add_summary FROM @add_summary;
EXECUTE add_summary;
DEALLOCATE PREPARE add_summary;

SET @add_intensity = IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE() AND table_name = 'workout_plans' AND column_name = 'intensity') = 0,
  'ALTER TABLE workout_plans ADD COLUMN intensity ENUM(''low'', ''moderate'', ''high'') NULL',
  'DO 0'
);
PREPARE add_intensity FROM @add_intensity;
EXECUTE add_intensity;
DEALLOCATE PREPARE add_intensity;

UPDATE workout_plans p
JOIN (
  SELECT 'Push Pull Legs' AS name, 'Strength split' AS focus, 'Rotates push, pull and leg days for steady progressive overload.' AS summary, 'high' AS intensity
  UNION ALL SELECT 'Full Body Strength', 'Compound strength', 'Squat, bench and deadlift variations to build a strength base.', 'moderate'
  UNION ALL SELECT 'Upper/Lower Hypertrophy', 'Muscle growth', 'Higher-volume upper and lower days to build size across the major lifts.', 'high'
  UNION ALL SELECT '5/3/1 Strength Cycle', 'Maximal strength', 'A percentage-based cycle around the big four lifts for long-term strength.', 'high'
  UNION ALL SELECT 'Beginner Fundamentals', 'Form and basics', 'A simple full-body rotation to learn the core lifts with good form.', 'low'
  UNION ALL SELECT 'Powerlifting Peak', 'Competition peaking', 'Heavy singles and accessory work to peak for a meet.', 'high'
  UNION ALL SELECT 'Bodyweight Basics', 'Bodyweight conditioning', 'Push, pull and leg circuits that need no equipment.', 'low'
  UNION ALL SELECT 'Athletic Performance', 'Power and conditioning', 'Speed, power and conditioning work for all-round athletic ability.', 'high'
  UNION ALL SELECT 'Glute Focus', 'Lower-body growth', 'Targeted lower-body volume to build glute strength and size.', 'moderate'
  UNION ALL SELECT 'Marathon Strength Support', 'Runner support', 'Strength work that complements marathon mileage without hurting recovery.', 'moderate'
) AS d ON d.name = p.name
SET p.focus = d.focus, p.summary = d.summary, p.intensity = d.intensity;
