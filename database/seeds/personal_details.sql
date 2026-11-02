-- Fake accounts that look like they were created before body weight and gender existed (story #116, card #117).
-- Each has finished onboarding (Strength, Beginner, Full gym access), has the Beginner Fundamentals plan and has
-- no user_profile row, so the Dashboard opens with its plan and offers "Add personal details".
-- Requires database/migrations/001_auth.sql to 012_user_profile.sql. Safe to rerun: these four accounts are reset
-- to these values (including deleting any saved body weight and gender) and every other account is left alone.
-- All four use the password listed in database/seeds/README.md; only its salted hash is stored here.
INSERT INTO users (full_name, email, password_hash) VALUES
    ('Personal Details1', 'personal-details1@test.com', '$2y$12$lEnvcHcEptiMThWxrEfieONWHFcYcL5Sa9caVu.zlpnpRpmmltRoG'),
    ('Personal Details2', 'personal-details2@test.com', '$2y$12$lEnvcHcEptiMThWxrEfieONWHFcYcL5Sa9caVu.zlpnpRpmmltRoG'),
    ('Personal Details3', 'personal-details3@test.com', '$2y$12$lEnvcHcEptiMThWxrEfieONWHFcYcL5Sa9caVu.zlpnpRpmmltRoG'),
    ('Personal Details4', 'personal-details4@test.com', '$2y$12$lEnvcHcEptiMThWxrEfieONWHFcYcL5Sa9caVu.zlpnpRpmmltRoG')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), password_hash = VALUES(password_hash);

INSERT INTO user_preferences (user_id, training_goal)
    SELECT id, 'strength' FROM users WHERE email IN ('personal-details1@test.com', 'personal-details2@test.com', 'personal-details3@test.com', 'personal-details4@test.com')
ON DUPLICATE KEY UPDATE training_goal = VALUES(training_goal);

INSERT INTO user_setup (user_id, experience)
    SELECT id, 'beginner' FROM users WHERE email IN ('personal-details1@test.com', 'personal-details2@test.com', 'personal-details3@test.com', 'personal-details4@test.com')
ON DUPLICATE KEY UPDATE experience = VALUES(experience);

DELETE FROM user_equipment WHERE user_id IN (SELECT id FROM users WHERE email IN ('personal-details1@test.com', 'personal-details2@test.com', 'personal-details3@test.com', 'personal-details4@test.com'));
INSERT INTO user_equipment (user_id, equipment)
    SELECT id, 'full_gym' FROM users WHERE email IN ('personal-details1@test.com', 'personal-details2@test.com', 'personal-details3@test.com', 'personal-details4@test.com');

DELETE FROM user_plans WHERE user_id IN (SELECT id FROM users WHERE email IN ('personal-details1@test.com', 'personal-details2@test.com', 'personal-details3@test.com', 'personal-details4@test.com'));
INSERT INTO user_plans (user_id, plan_id)
    SELECT id, (SELECT id FROM workout_plans WHERE name = 'Beginner Fundamentals')
    FROM users WHERE email IN ('personal-details1@test.com', 'personal-details2@test.com', 'personal-details3@test.com', 'personal-details4@test.com');

DELETE FROM user_profile WHERE user_id IN (SELECT id FROM users WHERE email IN ('personal-details1@test.com', 'personal-details2@test.com', 'personal-details3@test.com', 'personal-details4@test.com'));
