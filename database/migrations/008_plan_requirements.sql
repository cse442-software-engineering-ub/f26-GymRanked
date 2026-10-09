-- 008_plan_requirements.sql
-- Which training goals each plan suits and which equipment it needs, so onboarding can recommend
-- plans and the plan library can flag plans that need equipment the user doesn't have.
-- Requires 004_workout_plans.sql. The equipment values match user_equipment in 002_user_setup.sql
-- and the goal values match user_preferences in 003_user_preferences.sql.
--
-- Apply locally:
--   mysql -u root cse442_2026_fall_team_y_db < database/migrations/008_plan_requirements.sql
-- Apply on aptitude or cattle (after SSH, only when a task card says to):
--   mysql -u UBIT_USERNAME -p cse442_2026_fall_team_y_db < database/migrations/008_plan_requirements.sql
-- Or paste this file into phpMyAdmin's SQL tab with the team database selected.
--
-- Only adds tables, so existing rows are untouched. Safe to run more than once: IF NOT EXISTS skips
-- the tables and the seed rows are INSERT IGNORE. Bodyweight plans simply have no equipment rows.
-- 'full_gym' is never listed here: the app treats full gym access as covering every item.

CREATE TABLE IF NOT EXISTS workout_plan_goals (
  plan_id INT NOT NULL,
  goal ENUM('strength', 'fat_loss', 'aerobic') NOT NULL,
  PRIMARY KEY (plan_id, goal),
  FOREIGN KEY (plan_id) REFERENCES workout_plans (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS workout_plan_equipment (
  plan_id INT NOT NULL,
  equipment ENUM(
    'dumbbells', 'barbell', 'kettlebells',
    'resistance_bands', 'cable_machine', 'pullup_bar'
  ) NOT NULL,
  PRIMARY KEY (plan_id, equipment),
  FOREIGN KEY (plan_id) REFERENCES workout_plans (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

INSERT IGNORE INTO workout_plan_goals (plan_id, goal)
SELECT p.id, g.goal
FROM (
  SELECT 'Push Pull Legs' AS plan, 'strength' AS goal
  UNION ALL SELECT 'Push Pull Legs', 'fat_loss'
  UNION ALL SELECT 'Full Body Strength', 'strength'
  UNION ALL SELECT 'Upper/Lower Hypertrophy', 'strength'
  UNION ALL SELECT 'Upper/Lower Hypertrophy', 'fat_loss'
  UNION ALL SELECT '5/3/1 Strength Cycle', 'strength'
  UNION ALL SELECT 'Beginner Fundamentals', 'strength'
  UNION ALL SELECT 'Beginner Fundamentals', 'aerobic'
  UNION ALL SELECT 'Powerlifting Peak', 'strength'
  UNION ALL SELECT 'Bodyweight Basics', 'fat_loss'
  UNION ALL SELECT 'Bodyweight Basics', 'aerobic'
  UNION ALL SELECT 'Athletic Performance', 'strength'
  UNION ALL SELECT 'Athletic Performance', 'fat_loss'
  UNION ALL SELECT 'Athletic Performance', 'aerobic'
  UNION ALL SELECT 'Glute Focus', 'fat_loss'
  UNION ALL SELECT 'Marathon Strength Support', 'aerobic'
) AS g
JOIN workout_plans p ON p.name = g.plan;

INSERT IGNORE INTO workout_plan_equipment (plan_id, equipment)
SELECT p.id, e.equipment
FROM (
  SELECT 'Push Pull Legs' AS plan, 'barbell' AS equipment
  UNION ALL SELECT 'Push Pull Legs', 'dumbbells'
  UNION ALL SELECT 'Push Pull Legs', 'cable_machine'
  UNION ALL SELECT 'Full Body Strength', 'barbell'
  UNION ALL SELECT 'Full Body Strength', 'cable_machine'
  UNION ALL SELECT 'Upper/Lower Hypertrophy', 'dumbbells'
  UNION ALL SELECT 'Upper/Lower Hypertrophy', 'cable_machine'
  UNION ALL SELECT '5/3/1 Strength Cycle', 'barbell'
  UNION ALL SELECT '5/3/1 Strength Cycle', 'dumbbells'
  UNION ALL SELECT '5/3/1 Strength Cycle', 'pullup_bar'
  UNION ALL SELECT 'Beginner Fundamentals', 'dumbbells'
  UNION ALL SELECT 'Beginner Fundamentals', 'cable_machine'
  UNION ALL SELECT 'Powerlifting Peak', 'barbell'
  UNION ALL SELECT 'Powerlifting Peak', 'cable_machine'
  UNION ALL SELECT 'Athletic Performance', 'barbell'
  UNION ALL SELECT 'Glute Focus', 'barbell'
  UNION ALL SELECT 'Glute Focus', 'dumbbells'
  UNION ALL SELECT 'Glute Focus', 'cable_machine'
  UNION ALL SELECT 'Marathon Strength Support', 'dumbbells'
) AS e
JOIN workout_plans p ON p.name = e.plan;
