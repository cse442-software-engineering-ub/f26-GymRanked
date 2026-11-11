-- 017_workout_buddies.sql
-- Private workout buddies groups (story #78, card #71): the groups, who is in them, and the encouragement messages
-- members send each other. Used by api/buddy_group.php, api/buddy_join.php and api/buddy_encourage.php.
--
-- Requires: 001_auth.sql (users).
--
-- Apply locally:
--   mysql -u root cse442_2026_fall_team_y_db < database/migrations/017_workout_buddies.sql
-- On the dev server, only when a task card says to (see ServerOperationsGuide.md):
--   mysql -u UBIT_USERNAME -p cse442_2026_fall_team_y_db < database/migrations/017_workout_buddies.sql
-- Or paste this file into phpMyAdmin's SQL tab with the team database selected.
--
-- Only adds three tables, so no existing row changes and nobody is in a group until they create or join one. Safe to
-- run more than once: IF NOT EXISTS skips a table that is already there. All times are UTC.
--
-- buddy_groups.invite_code is the one invite method: 8 characters from A-H J-N P-Z 2-9, valid until
-- invite_expires_at (7 days after the group is made), unique across all groups. Only the group's owner is shown it.
-- buddy_members.user_id is UNIQUE: that is what makes it one group per person, even for two joins at the same time.
-- The owner has a member row like everyone else; buddy_members.id is the member_id the API returns (it is not the
-- user id, so no user id leaves the server). Deleting a user deletes their memberships and messages, and deleting an
-- owner deletes their group (nothing in the app deletes accounts yet).
CREATE TABLE IF NOT EXISTS buddy_groups (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(40) NOT NULL,
  owner_id BIGINT UNSIGNED NOT NULL,
  invite_code CHAR(8) NOT NULL,
  invite_expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL,
  UNIQUE KEY invite_code (invite_code),
  FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS buddy_members (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  group_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  joined_at DATETIME NOT NULL,
  UNIQUE KEY user_id (user_id),
  KEY group_id (group_id),
  FOREIGN KEY (group_id) REFERENCES buddy_groups (id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS buddy_encouragements (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  group_id BIGINT UNSIGNED NOT NULL,
  sender_id BIGINT UNSIGNED NOT NULL,
  recipient_id BIGINT UNSIGNED NOT NULL,
  message VARCHAR(140) NOT NULL,
  created_at DATETIME NOT NULL,
  KEY recipient_id (recipient_id, id),
  FOREIGN KEY (group_id) REFERENCES buddy_groups (id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (recipient_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
