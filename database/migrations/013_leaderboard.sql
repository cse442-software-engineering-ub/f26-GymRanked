-- 013_leaderboard.sql
-- What the leaderboard (story #10) needs on top of the personal details table:
--   users.is_test                   hides test accounts. Set only by seed files or SQL, never by the app.
--   user_profile.leaderboard_joined_at  when the user pressed Join (UTC). NULL means not on the leaderboard.
--   user_profile.scoring_table      'men' or 'women': the DOTS table a nonbinary or prefer-not-to-say member chose.
--                                   NULL for everyone else, because the table follows a man's or woman's gender.
--
-- Requires: 001_auth.sql (users) and 012_user_profile.sql (user_profile). The workout tables do not change.
--
-- Apply locally:
--   mysql -u root cse442_2026_fall_team_y_db < database/migrations/013_leaderboard.sql
-- Apply on aptitude or cattle (after SSH, only when a task card says to):
--   mysql -u UBIT_USERNAME -p cse442_2026_fall_team_y_db < database/migrations/013_leaderboard.sql
-- Or paste this file into phpMyAdmin's SQL tab with the team database selected.
--
-- Existing rows are not changed: every account starts with is_test = 0, not joined and no scoring table, so nobody
-- is on the leaderboard until they join. Safe to run more than once: each column is only added if it is missing
-- (MySQL has no ADD COLUMN IF NOT EXISTS, so information_schema is checked first, as 005 and 007 do).

SET @add_is_test = IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'is_test') = 0,
  'ALTER TABLE users ADD COLUMN is_test TINYINT(1) NOT NULL DEFAULT 0',
  'DO 0'
);
PREPARE add_is_test FROM @add_is_test;
EXECUTE add_is_test;
DEALLOCATE PREPARE add_is_test;

SET @add_joined = IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE() AND table_name = 'user_profile' AND column_name = 'leaderboard_joined_at') = 0,
  'ALTER TABLE user_profile ADD COLUMN leaderboard_joined_at DATETIME NULL',
  'DO 0'
);
PREPARE add_joined FROM @add_joined;
EXECUTE add_joined;
DEALLOCATE PREPARE add_joined;

SET @add_table = IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE() AND table_name = 'user_profile' AND column_name = 'scoring_table') = 0,
  "ALTER TABLE user_profile ADD COLUMN scoring_table ENUM('men', 'women') NULL",
  'DO 0'
);
PREPARE add_table FROM @add_table;
EXECUTE add_table;
DEALLOCATE PREPARE add_table;
