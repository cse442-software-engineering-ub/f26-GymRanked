-- 014_weekly_goals.sql
-- A user's weekly training-day target (card #89): one row per user per week, so the target for the current week and
-- the one chosen for next week are both saved. Used by api/weekly_goal.php.
-- Requires 001_auth.sql (users). The goal doesn't depend on a workout plan, so no plan table is referenced and
-- switching plans never changes it.
--
-- Apply locally:
--   mysql -u root cse442_2026_fall_team_y_db < database/migrations/014_weekly_goals.sql
-- Apply on aptitude or cattle (after SSH, only when a task card says to):
--   mysql -u UBIT_USERNAME -p cse442_2026_fall_team_y_db < database/migrations/014_weekly_goals.sql
-- Or paste this file into phpMyAdmin's SQL tab with the team database selected.
--
-- Only adds a table, so existing rows are untouched, and nobody has a saved target until they pick one (the API
-- shows 3 days a week until then). Safe to run more than once: IF NOT EXISTS skips a table that is already there.
-- Deleting a user deletes their goals.
--
-- week_start is the Monday of the week in America/New_York time (UB's time zone), as a DATE. The days a user has
-- earned in a week are not stored: they are read from finished workouts on every request, so they always match
-- the workout history.
CREATE TABLE IF NOT EXISTS user_weekly_goals (
  user_id BIGINT UNSIGNED NOT NULL,
  week_start DATE NOT NULL,
  target_days TINYINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (user_id, week_start),
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT chk_user_weekly_goals_days CHECK (target_days BETWEEN 1 AND 7)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
