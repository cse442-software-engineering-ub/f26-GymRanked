-- 003_user_setup.sql
-- Stores each account's training experience and available equipment (story #14).
--
-- Requires: the users table from the login task (users.id INT primary key).
--
-- Apply locally:
--   mysql -u root cse442_2026_fall_team_y_db < database/003_user_setup.sql
-- Apply on aptitude or cattle (after SSH, only when a task card says to):
--   mysql -u UBIT_USERNAME -p cse442_2026_fall_team_y_db < database/003_user_setup.sql
-- Or paste this file into phpMyAdmin's SQL tab with the team database selected.
--
-- Safe to run more than once: IF NOT EXISTS skips tables that are already there.

-- One row per user: their experience level.
CREATE TABLE IF NOT EXISTS user_setup (
  user_id INT NOT NULL PRIMARY KEY,
  experience ENUM('beginner', 'intermediate', 'advanced') NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_setup_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- One row per piece of equipment a user has (equipment is multi-select).
-- The ENUM order matches the Figma chip order, so ORDER BY equipment returns them in that order.
CREATE TABLE IF NOT EXISTS user_equipment (
  user_id INT NOT NULL,
  equipment ENUM(
    'bodyweight', 'dumbbells', 'barbell', 'kettlebells',
    'resistance_bands', 'cable_machine', 'pullup_bar', 'full_gym'
  ) NOT NULL,
  PRIMARY KEY (user_id, equipment),
  CONSTRAINT fk_user_equipment_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
