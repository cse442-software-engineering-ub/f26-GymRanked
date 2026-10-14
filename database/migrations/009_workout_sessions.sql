-- 009_workout_sessions.sql
-- A user's logged workouts (story #7): one session per workout, with the sets, reps and weights logged in it.
-- Used by api/workout_session.php, api/workout_sets.php, api/complete_workout.php and api/workout_history.php.
-- Requires 001_auth.sql (users) and 004_workout_plans.sql (workout_plans); 007_plan_day_exercises.sql
-- supplies the exercise names a session is started from.
--
-- Apply locally:
--   mysql -u root cse442_2026_fall_team_y_db < database/migrations/009_workout_sessions.sql
-- Apply on aptitude or cattle (after SSH, only when a task card says to):
--   mysql -u UBIT_USERNAME -p cse442_2026_fall_team_y_db < database/migrations/009_workout_sessions.sql
-- Or paste this file into phpMyAdmin's SQL tab with the team database selected.
--
-- Only adds tables, so existing rows are untouched. Safe to run more than once: IF NOT EXISTS skips
-- tables that are already there. Deleting a user deletes their sessions and sets.
--
-- Times are UTC, written by the server (UTC_TIMESTAMP()) and never taken from the client, so they are DATETIME
-- columns, not TIMESTAMP (which would shift with the connection's time zone). Weight is in pounds.

-- One row per workout. plan_name, day_name, focus and exercises are copied from the plan when the session starts,
-- so a finished workout still reads the same after the user switches plans. completed_at stays NULL until the
-- workout is completed; once set it is never changed.
CREATE TABLE IF NOT EXISTS workout_sessions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  plan_id INT NULL,
  plan_name VARCHAR(100) NOT NULL,
  day_name VARCHAR(100) NOT NULL,
  focus VARCHAR(255) NOT NULL DEFAULT '',
  exercises JSON NOT NULL,
  started_at DATETIME NOT NULL,
  completed_at DATETIME NULL,
  INDEX idx_workout_sessions_user_started (user_id, started_at),
  INDEX idx_workout_sessions_user_completed (user_id, completed_at),
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES workout_plans (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- One row per logged set. The unique key stops the same set number being saved twice for an exercise.
-- logged_at is when the set was first saved; updated_at moves each time it is corrected.
CREATE TABLE IF NOT EXISTS workout_sets (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  session_id BIGINT UNSIGNED NOT NULL,
  exercise VARCHAR(100) NOT NULL,
  set_number SMALLINT UNSIGNED NOT NULL,
  weight_lb DECIMAL(6, 2) NOT NULL,
  reps SMALLINT UNSIGNED NOT NULL,
  logged_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uq_workout_sets_set (session_id, exercise, set_number),
  FOREIGN KEY (session_id) REFERENCES workout_sessions (id) ON DELETE CASCADE,
  CONSTRAINT chk_workout_sets_weight CHECK (weight_lb BETWEEN 0 AND 1500),
  CONSTRAINT chk_workout_sets_reps CHECK (reps BETWEEN 1 AND 100)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
