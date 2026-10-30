-- 015_weekly_competition.sql
-- Who has joined the weekly consistency competition (story #124, card #126): one row per user, used by
-- api/weekly_standings.php. A row means "joined"; leaving deletes it. Requires 001_auth.sql (users).
--
-- Apply locally:
--   mysql -u root cse442_2026_fall_team_y_db < database/migrations/015_weekly_competition.sql
-- Apply on aptitude or cattle (after SSH, only when a task card says to):
--   mysql -u UBIT_USERNAME -p cse442_2026_fall_team_y_db < database/migrations/015_weekly_competition.sql
-- Or paste this file into phpMyAdmin's SQL tab with the team database selected.
--
-- Only adds a table, so existing rows are untouched and nobody has joined until they press Join. Safe to run more
-- than once: IF NOT EXISTS skips a table that is already there. Deleting a user deletes their row.
--
-- joined_at is UTC. ranked_from is the Monday (America/New_York) after the user joined: someone who joins mid-week
-- is in a practice week and is first ranked from that Monday. Days and progress are not stored: they are read from
-- finished workouts and user_weekly_goals (014) on every request, so they always match Home and the goal page.
CREATE TABLE IF NOT EXISTS user_weekly_competition (
  user_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
  joined_at DATETIME NOT NULL,
  ranked_from DATE NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
