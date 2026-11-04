-- Exercise progress test data for story #8 (the exercise progress backend task): known workouts for four test accounts.
-- Requires database/migrations/001_auth.sql to 009_workout_sessions.sql and database/seeds/test_users.sql.
-- Safe to rerun: it replaces ALL workouts of Marcus Malone, Dana Lee, Sean O'Brien and Priya Shah with the ones below and
-- touches no other account. Times are UTC, like the ones the API saves. A weight of 0 is a bodyweight set.
-- The expected results for these workouts are in task-tests/8-exercise-progress-backend.html.
--
-- Load it from the repo root after test_users.sql:
--   mysql --default-character-set=utf8mb4 -u root cse442_2026_fall_team_y_db < database/seeds/exercise_progress.sql
--
-- Marcus:  seven finished workouts (August 31 to October 14, 2026) plus one UNFINISHED workout on October 5 that
--          must never be counted. The October 10 workout finished at 01:30 UTC, which is still October 9 in New York.
-- Dana:    two finished workouts, to prove one account's numbers never leak into another's.
-- Sean:   120 finished workouts (one per day, June 1 to September 28), more than the 100 the history list returns.
-- Priya:   no workouts at all (empty history).

-- Marcus: eight workouts, the one on October 5 is unfinished.
SET @marcus = (SELECT id FROM users WHERE email = 'marcus.malone@example.com');
DELETE FROM workout_sessions WHERE user_id = @marcus;
INSERT INTO workout_sessions (user_id, plan_id, plan_name, day_name, focus, exercises, started_at, completed_at) VALUES
    (@marcus, NULL, 'Progress seed', 'Workout 1', '', JSON_ARRAY('Bench press', 'Back squat'), '2026-08-31 17:20:00', '2026-08-31 18:00:00'),
    (@marcus, NULL, 'Progress seed', 'Workout 2', '', JSON_ARRAY('Bench press', 'Back squat', 'Pull-up'), '2026-09-02 17:20:00', '2026-09-02 18:00:00'),
    (@marcus, NULL, 'Progress seed', 'Workout 3', '', JSON_ARRAY('Bench press', 'Back squat'), '2026-09-09 17:20:00', '2026-09-09 18:00:00'),
    (@marcus, NULL, 'Progress seed', 'Workout 4', '', JSON_ARRAY('Bench press', 'Back squat', 'Pull-up'), '2026-09-21 17:20:00', '2026-09-21 18:00:00'),
    (@marcus, NULL, 'Progress seed', 'Workout 5', '', JSON_ARRAY('Bench press', 'Back squat', 'Pull-up'), '2026-09-30 17:20:00', '2026-09-30 18:00:00'),
    (@marcus, NULL, 'Progress seed', 'Workout 6', '', JSON_ARRAY('Bench press', 'Back squat'), '2026-10-05 18:00:00', NULL),
    (@marcus, NULL, 'Progress seed', 'Workout 7', '', JSON_ARRAY('Bench press', 'Back squat'), '2026-10-10 00:50:00', '2026-10-10 01:30:00'),
    (@marcus, NULL, 'Progress seed', 'Workout 8', '', JSON_ARRAY('Bench press', 'Back squat'), '2026-10-14 17:20:00', '2026-10-14 18:00:00');
INSERT INTO workout_sets (session_id, exercise, set_number, weight_lb, reps, logged_at, updated_at)
SELECT s.id, v.exercise, v.set_number, v.weight_lb, v.reps, s.started_at + INTERVAL 5 MINUTE, s.started_at + INTERVAL 5 MINUTE
FROM workout_sessions s
JOIN (
    SELECT '2026-08-31 17:20:00' AS started_at, 'Bench press' AS exercise, 1 AS set_number, 180 AS weight_lb, 6 AS reps
    UNION ALL SELECT '2026-08-31 17:20:00', 'Back squat', 1, 220, 6
    UNION ALL SELECT '2026-09-02 17:20:00', 'Bench press', 1, 180, 9
    UNION ALL SELECT '2026-09-02 17:20:00', 'Bench press', 2, 190, 6
    UNION ALL SELECT '2026-09-02 17:20:00', 'Back squat', 1, 220, 6
    UNION ALL SELECT '2026-09-02 17:20:00', 'Back squat', 2, 230, 3
    UNION ALL SELECT '2026-09-02 17:20:00', 'Pull-up', 1, 0, 8
    UNION ALL SELECT '2026-09-02 17:20:00', 'Pull-up', 2, 0, 6
    UNION ALL SELECT '2026-09-09 17:20:00', 'Bench press', 1, 190, 6
    UNION ALL SELECT '2026-09-09 17:20:00', 'Bench press', 2, 185, 6
    UNION ALL SELECT '2026-09-09 17:20:00', 'Back squat', 1, 240, 6
    UNION ALL SELECT '2026-09-21 17:20:00', 'Bench press', 1, 200, 6
    UNION ALL SELECT '2026-09-21 17:20:00', 'Bench press', 2, 200, 3
    UNION ALL SELECT '2026-09-21 17:20:00', 'Back squat', 1, 250, 3
    UNION ALL SELECT '2026-09-21 17:20:00', 'Pull-up', 1, 0, 10
    UNION ALL SELECT '2026-09-30 17:20:00', 'Bench press', 1, 210, 3
    UNION ALL SELECT '2026-09-30 17:20:00', 'Bench press', 2, 200, 6
    UNION ALL SELECT '2026-09-30 17:20:00', 'Back squat', 1, 240, 6
    UNION ALL SELECT '2026-09-30 17:20:00', 'Pull-up', 1, 0, 9
    UNION ALL SELECT '2026-10-05 18:00:00', 'Bench press', 1, 300, 3
    UNION ALL SELECT '2026-10-05 18:00:00', 'Back squat', 1, 400, 3
    UNION ALL SELECT '2026-10-10 00:50:00', 'Bench press', 1, 220, 3
    UNION ALL SELECT '2026-10-10 00:50:00', 'Back squat', 1, 260, 3
    UNION ALL SELECT '2026-10-14 17:20:00', 'Bench press', 1, 200, 9
    UNION ALL SELECT '2026-10-14 17:20:00', 'Back squat', 1, 250, 6
) v ON v.started_at = s.started_at
WHERE s.user_id = @marcus;

-- Dana: two finished workouts.
SET @dana = (SELECT id FROM users WHERE email = 'dana.lee@example.com');
DELETE FROM workout_sessions WHERE user_id = @dana;
INSERT INTO workout_sessions (user_id, plan_id, plan_name, day_name, focus, exercises, started_at, completed_at) VALUES
    (@dana, NULL, 'Progress seed', 'Workout 1', '', JSON_ARRAY('Back squat'), '2026-09-03 17:20:00', '2026-09-03 18:00:00'),
    (@dana, NULL, 'Progress seed', 'Workout 2', '', JSON_ARRAY('Back squat', 'Bench press'), '2026-09-24 17:20:00', '2026-09-24 18:00:00');
INSERT INTO workout_sets (session_id, exercise, set_number, weight_lb, reps, logged_at, updated_at)
SELECT s.id, v.exercise, v.set_number, v.weight_lb, v.reps, s.started_at + INTERVAL 5 MINUTE, s.started_at + INTERVAL 5 MINUTE
FROM workout_sessions s
JOIN (
    SELECT '2026-09-03 17:20:00' AS started_at, 'Back squat' AS exercise, 1 AS set_number, 300 AS weight_lb, 6 AS reps
    UNION ALL SELECT '2026-09-24 17:20:00', 'Back squat', 1, 320, 3
    UNION ALL SELECT '2026-09-24 17:20:00', 'Bench press', 1, 130, 9
) v ON v.started_at = s.started_at
WHERE s.user_id = @dana;

-- Sean: 120 finished workouts, one Barbell row set of 9 reps each. The weight is 95 lb for the first 30 days,
-- then 100, 105 and 110 lb for each following block of 30 days.
SET @sean = (SELECT id FROM users WHERE email = 'sean.obrien@example.com');
DELETE FROM workout_sessions WHERE user_id = @sean;
INSERT INTO workout_sessions (user_id, plan_id, plan_name, day_name, focus, exercises, started_at, completed_at)
SELECT @sean, NULL, 'Progress seed', 'Pull', '', JSON_ARRAY('Barbell row'),
       TIMESTAMP('2026-06-01 17:20:00') + INTERVAL d.n DAY, TIMESTAMP('2026-06-01 18:00:00') + INTERVAL d.n DAY
FROM (
    SELECT ones.n + 10 * tens.n AS n
    FROM (SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
          UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) ones
    CROSS JOIN (SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
          UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11) tens
) d;
INSERT INTO workout_sets (session_id, exercise, set_number, weight_lb, reps, logged_at, updated_at)
SELECT s.id, 'Barbell row', 1, 95 + 5 * FLOOR(DATEDIFF(s.completed_at, '2026-06-01') / 30), 9,
       s.started_at + INTERVAL 5 MINUTE, s.started_at + INTERVAL 5 MINUTE
FROM workout_sessions s
WHERE s.user_id = @sean;

-- Priya: no workouts, so every progress request for her is an empty history.
DELETE FROM workout_sessions WHERE user_id = (SELECT id FROM users WHERE email = 'priya.shah@example.com');
