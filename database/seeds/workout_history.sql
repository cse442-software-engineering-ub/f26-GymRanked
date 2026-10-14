-- Workout history test account for story #9 (card #106): Riley Brooks with six finished workouts.
-- The password is listed in database/seeds/README.md; only its salted hash is stored here.
-- Requires database/migrations/001_auth.sql to 009_workout_sessions.sql. Safe to rerun: Riley's name, password,
-- setup and plan are reset and Riley's workouts are replaced by these six. No other account is touched.
--
-- Load it from the repo root after test_users.sql:
--   mysql --default-character-set=utf8mb4 -u root cse442_2026_fall_team_y_db < database/seeds/workout_history.sql

INSERT INTO users (full_name, email, password_hash) VALUES
    ('Riley Brooks', 'riley.brooks@example.com', '$2y$12$rPSyMh9C.Wte2vjMdCGgBe6SFKUTeTb/9IbEPZzG94itLO6epAd7G')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), password_hash = VALUES(password_hash);

SET @riley = (SELECT id FROM users WHERE email = 'riley.brooks@example.com');
SET @plan = (SELECT id FROM workout_plans WHERE name = 'Beginner Fundamentals');

-- A finished setup (Strength, Beginner, Full gym access) and the Beginner Fundamentals plan, so logging in opens
-- the Dashboard instead of an onboarding step.
INSERT INTO user_preferences (user_id, training_goal) VALUES (@riley, 'strength')
ON DUPLICATE KEY UPDATE training_goal = VALUES(training_goal);

INSERT INTO user_setup (user_id, experience) VALUES (@riley, 'beginner')
ON DUPLICATE KEY UPDATE experience = VALUES(experience);

DELETE FROM user_equipment WHERE user_id = @riley;
INSERT INTO user_equipment (user_id, equipment) VALUES (@riley, 'full_gym');

INSERT INTO user_plans (user_id, plan_id, started_at) VALUES (@riley, @plan, '2026-09-28 12:00:00')
ON DUPLICATE KEY UPDATE plan_id = VALUES(plan_id), started_at = VALUES(started_at);

-- Times are UTC, like the ones the API saves. The newest workout finished at 01:30 UTC on October 10, which is
-- 9:30 PM on Friday, October 9 in New York, so the history page must show it as Friday, October 9.
-- Deleting the sessions also deletes their sets.
DELETE FROM workout_sessions WHERE user_id = @riley;
INSERT INTO workout_sessions (user_id, plan_id, plan_name, day_name, focus, exercises, started_at, completed_at) VALUES
    (@riley, @plan, 'Beginner Fundamentals', 'Full body A', 'Form and technique',
        JSON_ARRAY('Goblet squat', 'Push-up', 'Dumbbell row'), '2026-09-28 21:20:00', '2026-09-28 22:00:00'),
    (@riley, @plan, 'Beginner Fundamentals', 'Full body B', 'Form and technique',
        JSON_ARRAY('Hip hinge', 'Dumbbell press', 'Lat pulldown'), '2026-09-30 21:20:00', '2026-09-30 22:00:00'),
    (@riley, @plan, 'Beginner Fundamentals', 'Full body C', 'Form and technique',
        JSON_ARRAY('Split squat', 'Incline push-up', 'Cable row'), '2026-10-02 21:20:00', '2026-10-02 22:00:00'),
    (@riley, @plan, 'Beginner Fundamentals', 'Full body A', 'Form and technique',
        JSON_ARRAY('Goblet squat', 'Push-up', 'Dumbbell row'), '2026-10-05 21:20:00', '2026-10-05 22:00:00'),
    (@riley, @plan, 'Beginner Fundamentals', 'Full body B', 'Form and technique',
        JSON_ARRAY('Hip hinge', 'Dumbbell press', 'Lat pulldown'), '2026-10-07 21:20:00', '2026-10-07 22:00:00'),
    (@riley, @plan, 'Beginner Fundamentals', 'Full body C', 'Form and technique',
        JSON_ARRAY('Split squat', 'Incline push-up', 'Cable row'), '2026-10-10 00:50:00', '2026-10-10 01:30:00');

-- Each workout's sets, matched to its session by the finish time above. A weight of 0 is a bodyweight set.
INSERT INTO workout_sets (session_id, exercise, set_number, weight_lb, reps, logged_at, updated_at)
SELECT s.id, v.exercise, v.set_number, v.weight_lb, v.reps,
       s.started_at + INTERVAL v.minute MINUTE, s.started_at + INTERVAL v.minute MINUTE
FROM workout_sessions s
JOIN (
    SELECT '2026-09-28 22:00:00' AS completed_at, 'Goblet squat' AS exercise, 1 AS set_number, 25 AS weight_lb, 10 AS reps, 3 AS minute
    UNION ALL SELECT '2026-09-28 22:00:00', 'Goblet squat', 2, 25, 10, 6
    UNION ALL SELECT '2026-09-28 22:00:00', 'Goblet squat', 3, 25, 10, 9
    UNION ALL SELECT '2026-09-28 22:00:00', 'Push-up', 1, 0, 8, 15
    UNION ALL SELECT '2026-09-28 22:00:00', 'Push-up', 2, 0, 8, 18
    UNION ALL SELECT '2026-09-28 22:00:00', 'Push-up', 3, 0, 6, 21
    UNION ALL SELECT '2026-09-28 22:00:00', 'Dumbbell row', 1, 25, 10, 27
    UNION ALL SELECT '2026-09-28 22:00:00', 'Dumbbell row', 2, 25, 10, 30
    UNION ALL SELECT '2026-09-28 22:00:00', 'Dumbbell row', 3, 25, 10, 33

    UNION ALL SELECT '2026-09-30 22:00:00', 'Hip hinge', 1, 40, 10, 3
    UNION ALL SELECT '2026-09-30 22:00:00', 'Hip hinge', 2, 40, 10, 6
    UNION ALL SELECT '2026-09-30 22:00:00', 'Hip hinge', 3, 40, 10, 9
    UNION ALL SELECT '2026-09-30 22:00:00', 'Dumbbell press', 1, 25, 10, 15
    UNION ALL SELECT '2026-09-30 22:00:00', 'Dumbbell press', 2, 25, 10, 18
    UNION ALL SELECT '2026-09-30 22:00:00', 'Dumbbell press', 3, 25, 10, 21
    UNION ALL SELECT '2026-09-30 22:00:00', 'Lat pulldown', 1, 70, 10, 27
    UNION ALL SELECT '2026-09-30 22:00:00', 'Lat pulldown', 2, 70, 10, 30
    UNION ALL SELECT '2026-09-30 22:00:00', 'Lat pulldown', 3, 70, 10, 33

    UNION ALL SELECT '2026-10-02 22:00:00', 'Split squat', 1, 20, 10, 3
    UNION ALL SELECT '2026-10-02 22:00:00', 'Split squat', 2, 20, 10, 6
    UNION ALL SELECT '2026-10-02 22:00:00', 'Split squat', 3, 20, 10, 9
    UNION ALL SELECT '2026-10-02 22:00:00', 'Incline push-up', 1, 0, 10, 15
    UNION ALL SELECT '2026-10-02 22:00:00', 'Incline push-up', 2, 0, 10, 18
    UNION ALL SELECT '2026-10-02 22:00:00', 'Incline push-up', 3, 0, 10, 21
    UNION ALL SELECT '2026-10-02 22:00:00', 'Cable row', 1, 60, 10, 27
    UNION ALL SELECT '2026-10-02 22:00:00', 'Cable row', 2, 60, 10, 30
    UNION ALL SELECT '2026-10-02 22:00:00', 'Cable row', 3, 60, 10, 33

    UNION ALL SELECT '2026-10-05 22:00:00', 'Goblet squat', 1, 30, 10, 3
    UNION ALL SELECT '2026-10-05 22:00:00', 'Goblet squat', 2, 30, 10, 6
    UNION ALL SELECT '2026-10-05 22:00:00', 'Goblet squat', 3, 30, 10, 9
    UNION ALL SELECT '2026-10-05 22:00:00', 'Push-up', 1, 0, 10, 15
    UNION ALL SELECT '2026-10-05 22:00:00', 'Push-up', 2, 0, 10, 18
    UNION ALL SELECT '2026-10-05 22:00:00', 'Push-up', 3, 0, 8, 21
    UNION ALL SELECT '2026-10-05 22:00:00', 'Dumbbell row', 1, 30, 10, 27
    UNION ALL SELECT '2026-10-05 22:00:00', 'Dumbbell row', 2, 30, 10, 30
    UNION ALL SELECT '2026-10-05 22:00:00', 'Dumbbell row', 3, 30, 10, 33

    UNION ALL SELECT '2026-10-07 22:00:00', 'Hip hinge', 1, 45, 10, 3
    UNION ALL SELECT '2026-10-07 22:00:00', 'Hip hinge', 2, 45, 10, 6
    UNION ALL SELECT '2026-10-07 22:00:00', 'Hip hinge', 3, 45, 10, 9
    UNION ALL SELECT '2026-10-07 22:00:00', 'Dumbbell press', 1, 30, 10, 15
    UNION ALL SELECT '2026-10-07 22:00:00', 'Dumbbell press', 2, 30, 10, 18
    UNION ALL SELECT '2026-10-07 22:00:00', 'Dumbbell press', 3, 30, 10, 21
    UNION ALL SELECT '2026-10-07 22:00:00', 'Lat pulldown', 1, 80, 10, 27
    UNION ALL SELECT '2026-10-07 22:00:00', 'Lat pulldown', 2, 90, 8, 30

    UNION ALL SELECT '2026-10-10 01:30:00', 'Split squat', 1, 25, 10, 3
    UNION ALL SELECT '2026-10-10 01:30:00', 'Split squat', 2, 25, 10, 6
    UNION ALL SELECT '2026-10-10 01:30:00', 'Split squat', 3, 30, 8, 9
    UNION ALL SELECT '2026-10-10 01:30:00', 'Incline push-up', 1, 0, 12, 15
    UNION ALL SELECT '2026-10-10 01:30:00', 'Incline push-up', 2, 0, 12, 18
    UNION ALL SELECT '2026-10-10 01:30:00', 'Incline push-up', 3, 0, 10, 21
    UNION ALL SELECT '2026-10-10 01:30:00', 'Cable row', 1, 70, 10, 27
    UNION ALL SELECT '2026-10-10 01:30:00', 'Cable row', 2, 70, 10, 30
    UNION ALL SELECT '2026-10-10 01:30:00', 'Cable row', 3, 70, 10, 33
) AS v ON s.completed_at = v.completed_at
WHERE s.user_id = @riley;
