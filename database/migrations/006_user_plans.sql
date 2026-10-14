-- 006_user_plans.sql
-- Each user's current workout plan, set by the Select button in the workout plan library (story #67).
-- Requires 001_auth.sql (users) and 004_workout_plans.sql (workout_plans) to have been applied first.
--
-- Apply locally:
--   mysql -u root cse442_2026_fall_team_y_db < database/migrations/006_user_plans.sql
-- Apply on aptitude or cattle (after SSH, only when a task card says to):
--   mysql -u UBIT_USERNAME -p cse442_2026_fall_team_y_db < database/migrations/006_user_plans.sql
-- Or paste this file into phpMyAdmin's SQL tab with the team database selected.
--
-- Bringing an existing database up to date: apply 001, 004, and 005 if they haven't been, then this file.
-- It only adds a new table, so no existing rows change.
--
-- Safe to run more than once: IF NOT EXISTS skips the table if it's already there.

-- One row per user: switching plans replaces the row. started_at drives the "Week N" shown
-- in the switch plan warning, so switching restarts the week count.
CREATE TABLE IF NOT EXISTS user_plans (
  user_id BIGINT UNSIGNED PRIMARY KEY,
  plan_id INT NOT NULL,
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES workout_plans (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
