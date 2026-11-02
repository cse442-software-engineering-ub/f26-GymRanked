-- 010_user_theme.sql
-- Each account's colour theme, dark or light (Implement Persistent User Theme Preference).
-- A separate table rather than a column on user_preferences, because user_preferences.training_goal is
-- NOT NULL: a theme has to be saveable for any signed-in account, goal or not.
--
-- Requires: database/migrations/001_auth.sql (the users table).
-- user_id matches users.id exactly (BIGINT UNSIGNED); foreign keys need identical types.
--
-- Apply locally:
--   mysql -u root cse442_2026_fall_team_y_db < database/migrations/010_user_theme.sql
-- Apply on aptitude or cattle (after SSH, only when a task card says to):
--   mysql -u UBIT_USERNAME -p cse442_2026_fall_team_y_db < database/migrations/010_user_theme.sql
-- Or paste this file into phpMyAdmin's SQL tab with the team database selected.
--
-- Only adds a table, so no existing rows change. Safe to run more than once: IF NOT EXISTS skips it.
-- An account with no row uses dark, the default; api/theme.php only writes a row when a theme is saved.

CREATE TABLE IF NOT EXISTS user_theme (
  user_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
  theme ENUM('dark', 'light') NOT NULL DEFAULT 'dark',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_theme_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
