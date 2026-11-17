-- Exercise alternatives test accounts for task #82 (story #80, frontend of Surya's api/exercise_alternatives.php, #81).
-- Passwords are listed in database/seeds/README.md; only their salted hashes are stored here.
-- Requires database/migrations/001_auth.sql to 016_exercise_alternatives.sql (013 adds users.is_test).
-- Safe to rerun: these two accounts are reset (setup, equipment, plan, personal details and workouts) and no other
-- account is touched. Load it again on the day you test and before each full run, because today's unfinished
-- workout only counts as "today" on the New York date it was loaded.
--
-- Load it from the repo root:
--   mysql --default-character-set=utf8mb4 -u root cse442_2026_fall_team_y_db < database/seeds/exercise_alternatives.sql
-- On aptitude: mysql --default-character-set=utf8mb4 -u UBIT_USERNAME -p cse442_2026_fall_team_y_db < database/seeds/exercise_alternatives.sql
--
-- Accounts (both finished onboarding, selected Full Body Strength and saved personal details):
--   Alex Alternatives alt.alex@example.com  Intermediate, Dumbbells only. Gets 4 Bench press alternatives, none for
--                                           Pull-up (Lat pulldown needs a cable machine), and Romanian deadlift is not
--                                           a supported exercise (404). One finished workout two days ago: Bench press
--                                           135 lb x 5, for checking that history never changes.
--   Gio Gym           alt.gio@example.com   Advanced, Full gym access. Gets 5 Bench press alternatives (the cap) and
--                                           Lat pulldown for Pull-up.
--
-- Today's workout. Each account gets an unfinished session started one minute before the seed was loaded, with the
-- exercises Bench press, Pull-up and Romanian deadlift. api/workout_session.php returns that session as the current
-- one (it checks for today's session before the rest-day rule), so the tests work on any day of the week.

SET @plan = (SELECT id FROM workout_plans WHERE name = 'Full Body Strength');
SET @started = UTC_TIMESTAMP() - INTERVAL 1 MINUTE;
-- Two New York days ago at 17:00 UTC, which is noon or 1 PM in New York, so the date is the same in both time zones.
-- CONVERT_TZ needs MySQL's time zone tables; without them it returns NULL and UTC-5 is used (see weekly_goals.sql).
SET @today_ny = DATE(COALESCE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', 'America/New_York'), UTC_TIMESTAMP() - INTERVAL 5 HOUR));
SET @history_done = TIMESTAMP(@today_ny - INTERVAL 2 DAY, '17:00:00');

INSERT INTO users (full_name, email, password_hash, is_test) VALUES
    ('Alex Alternatives', 'alt.alex@example.com', '$2y$12$fy8PQzGWEzb5n3.DP8Khy.Az/v41GrdqnkPt44lI/29/RhpB8KZYy', 1),
    ('Gio Gym', 'alt.gio@example.com', '$2y$12$mIbYV0G1G1R0iSFMGeKkWOTwAlyYMhE/qRlZ9chZpiT3yhfLtOiBm', 1)
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), password_hash = VALUES(password_hash), is_test = 1;

SET @alex = (SELECT id FROM users WHERE email = 'alt.alex@example.com');
SET @gio = (SELECT id FROM users WHERE email = 'alt.gio@example.com');

DELETE FROM workout_sessions WHERE user_id IN (@alex, @gio);
DELETE FROM user_plans WHERE user_id IN (@alex, @gio);
DELETE FROM user_equipment WHERE user_id IN (@alex, @gio);
DELETE FROM user_setup WHERE user_id IN (@alex, @gio);
DELETE FROM user_preferences WHERE user_id IN (@alex, @gio);
DELETE FROM user_profile WHERE user_id IN (@alex, @gio);

INSERT INTO user_profile (user_id, bodyweight_lb, gender) VALUES (@alex, 175.0, 'man'), (@gio, 190.0, 'man');
INSERT INTO user_preferences (user_id, training_goal) VALUES (@alex, 'strength'), (@gio, 'strength');
INSERT INTO user_setup (user_id, experience) VALUES (@alex, 'intermediate'), (@gio, 'advanced');
INSERT INTO user_equipment (user_id, equipment) VALUES (@alex, 'dumbbells'), (@gio, 'full_gym');
INSERT INTO user_plans (user_id, plan_id) VALUES (@alex, @plan), (@gio, @plan);

-- Alex's finished workout two days ago (history check in story #80, Acceptance Test 6).
INSERT INTO workout_sessions (user_id, plan_id, plan_name, day_name, focus, exercises, started_at, completed_at)
VALUES (@alex, @plan, 'Full Body Strength', 'Full body A', '', JSON_ARRAY('Bench press'),
        @history_done - INTERVAL 40 MINUTE, @history_done);
INSERT INTO workout_sets (session_id, exercise, set_number, weight_lb, reps, logged_at, updated_at)
VALUES (LAST_INSERT_ID(), 'Bench press', 1, 135, 5, @history_done - INTERVAL 30 MINUTE, @history_done - INTERVAL 30 MINUTE);

-- Today's unfinished workouts.
INSERT INTO workout_sessions (user_id, plan_id, plan_name, day_name, focus, exercises, started_at, completed_at) VALUES
    (@alex, @plan, 'Full Body Strength', 'Alternatives check', '', JSON_ARRAY('Bench press', 'Pull-up', 'Romanian deadlift'), @started, NULL),
    (@gio, @plan, 'Full Body Strength', 'Alternatives check', '', JSON_ARRAY('Bench press', 'Pull-up', 'Romanian deadlift'), @started, NULL);

-- Check: should print Alex intermediate dumbbells 2 sessions, Gio advanced full_gym 1 session.
SELECT u.full_name, s.experience, GROUP_CONCAT(DISTINCT e.equipment) AS equipment,
       (SELECT COUNT(*) FROM workout_sessions w WHERE w.user_id = u.id) AS sessions
FROM users u
JOIN user_setup s ON s.user_id = u.id
JOIN user_equipment e ON e.user_id = u.id
WHERE u.id IN (@alex, @gio)
GROUP BY u.id, u.full_name, s.experience
ORDER BY u.full_name;
