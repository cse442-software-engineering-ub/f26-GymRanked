-- Immutable weekly-goal feedback for each newly completed workout (task #123, story #87).
-- Requires migrations 001, 009 and 014. Apply before deploying the matching PHP endpoints.
-- Existing completed workouts are intentionally not backfilled: their historical target and
-- progress at completion cannot always be established from current data.
-- Safe to rerun. Deleting a workout session cascades to its snapshot.
CREATE TABLE IF NOT EXISTS workout_weekly_goal_snapshots (
  session_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
  week_start DATE NOT NULL,
  target_days TINYINT UNSIGNED NOT NULL,
  completed_dates JSON NOT NULL,
  credited_day TINYINT(1) NOT NULL,
  FOREIGN KEY (session_id) REFERENCES workout_sessions (id) ON DELETE CASCADE,
  CONSTRAINT chk_snapshot_target CHECK (target_days BETWEEN 1 AND 7),
  CONSTRAINT chk_snapshot_credit CHECK (credited_day IN (0, 1))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
