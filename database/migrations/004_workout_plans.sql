-- 004_workout_plans.sql
-- Catalog of workout plans shown in the workout plan library (story #67).
-- The plan details screen's description and weekly split are added by 005_workout_plan_details.sql.
--
-- Apply locally:
--   mysql -u root cse442_2026_fall_team_y_db < database/migrations/004_workout_plans.sql
-- Apply on aptitude or cattle (after SSH, only when a task card says to):
--   mysql -u UBIT_USERNAME -p cse442_2026_fall_team_y_db < database/migrations/004_workout_plans.sql
-- Or paste this file into phpMyAdmin's SQL tab with the team database selected.
--
-- Safe to run more than once: IF NOT EXISTS skips the table if it's already there,
-- and the seed rows key off `name` so re-running updates them instead of duplicating.

-- Catalog table, not user-specific: anyone can browse the library.
-- duration_weeks is a string (e.g. "8" or "6-8") because the Figma copy includes a range.
CREATE TABLE IF NOT EXISTS workout_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  level ENUM('beginner', 'intermediate', 'advanced') NOT NULL,
  duration_weeks VARCHAR(20) NOT NULL,
  days_per_week INT NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- Seed data matches the Figma "Workout plan library" screen.
INSERT INTO workout_plans (name, level, duration_weeks, days_per_week) VALUES
  ('Push Pull Legs', 'intermediate', '6-8', 5),
  ('Full Body Strength', 'beginner', '8', 3),
  ('Upper/Lower Hypertrophy', 'intermediate', '10', 4),
  ('5/3/1 Strength Cycle', 'advanced', '12', 4),
  ('Beginner Fundamentals', 'beginner', '6', 3),
  ('Powerlifting Peak', 'advanced', '8', 4),
  ('Bodyweight Basics', 'beginner', '4', 3),
  ('Athletic Performance', 'intermediate', '10', 5),
  ('Glute Focus', 'intermediate', '8', 4),
  ('Marathon Strength Support', 'intermediate', '12', 3)
ON DUPLICATE KEY UPDATE
  level = VALUES(level),
  duration_weeks = VALUES(duration_weeks),
  days_per_week = VALUES(days_per_week);
