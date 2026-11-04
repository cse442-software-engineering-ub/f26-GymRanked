-- 012_user_profile.sql
-- Each account's body weight and gender, entered on the Personal details onboarding page (story #116) and
-- used for the leaderboard score (story #10).
-- A new table rather than columns on user_setup, because user_setup.experience is NOT NULL and Personal
-- details comes before the experience step, so a new account has no user_setup row yet.
--
-- Requires: database/migrations/001_auth.sql (the users table).
-- user_id matches users.id exactly (BIGINT UNSIGNED); foreign keys need identical types.
--
-- Apply locally:
--   mysql -u root cse442_2026_fall_team_y_db < database/migrations/012_user_profile.sql
-- Apply on aptitude or cattle (after SSH, only when a task card says to):
--   mysql -u UBIT_USERNAME -p cse442_2026_fall_team_y_db < database/migrations/012_user_profile.sql
-- Or paste this file into phpMyAdmin's SQL tab with the team database selected.
--
-- Only adds a table, so no existing rows change. Existing accounts simply have no row until they save their
-- details; api/personal_details.php reads that as "nothing saved yet". Safe to run more than once: IF NOT
-- EXISTS skips it. Deleting a user deletes their row.

-- One row per user. bodyweight_lb is pounds with one decimal (180.5), 50 to 700. gender is one of the four
-- onboarding choices; prefer_not_to_say counts as an answer. Both are NULL until saved.
CREATE TABLE IF NOT EXISTS user_profile (
  user_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
  bodyweight_lb DECIMAL(4, 1) NULL,
  gender ENUM('woman', 'man', 'nonbinary', 'prefer_not_to_say') NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_profile_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT chk_user_profile_bodyweight CHECK (bodyweight_lb BETWEEN 50 AND 700)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
