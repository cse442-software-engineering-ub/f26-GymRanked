-- 021_buddy_daily_encouragement.sql
-- One encouragement a day from each member to each other member (story #78, card #147). A member can still encourage
-- every other member of their group on the same day, but only once each. api/buddy_encourage.php writes sent_on (the
-- America/New_York calendar day the message was sent, the same day boundary as the weekly goal and progress pages)
-- and answers 409 when the unique key below refuses a second message; api/buddy_common.php reads it for the
-- "encouraged_today" flag on each member.
--
-- Requires: 018_workout_buddies.sql.
--
-- Apply locally:
--   mysql -u root cse442_2026_fall_team_y_db < database/migrations/021_buddy_daily_encouragement.sql
-- On the dev server, only when a task card says to (see ServerOperationsGuide.md):
--   mysql -u UBIT_USERNAME -p cse442_2026_fall_team_y_db < database/migrations/021_buddy_daily_encouragement.sql
-- Or paste this file into phpMyAdmin's SQL tab with the team database selected.
--
-- Run it once: a second run stops with "Duplicate column name 'sent_on'" and changes nothing. Messages already in the
-- table keep sent_on NULL, and MySQL lets any number of NULLs share a unique key, so no existing row is refused and
-- messages sent before this migration don't count toward the daily limit. No seed needs to change.
ALTER TABLE buddy_encouragements
  ADD COLUMN sent_on DATE NULL AFTER created_at,
  ADD UNIQUE KEY one_a_day (sender_id, recipient_id, sent_on);
