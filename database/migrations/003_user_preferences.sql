-- 003_user_preferences.sql
-- Stores each account's training goal (story #13).
--
-- Requires: database/migrations/001_auth.sql (the users table).
-- user_id matches users.id exactly (BIGINT UNSIGNED); foreign keys need identical types.
--
-- Apply locally:
--   mysql -u root cse442_2026_fall_team_y_db < database/migrations/003_user_preferences.sql
-- Apply on aptitude or cattle (after SSH, only when a task card says to):
--   mysql -u UBIT_USERNAME -p cse442_2026_fall_team_y_db < database/migrations/003_user_preferences.sql
-- Or paste this file into phpMyAdmin's SQL tab with the team database selected.
--
-- Safe to run more than once: IF NOT EXISTS skips it if the table is already there.

-- One row per user: changing the goal replaces the old one.
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
  training_goal ENUM('strength', 'fat_loss', 'aerobic') NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_preferences_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
