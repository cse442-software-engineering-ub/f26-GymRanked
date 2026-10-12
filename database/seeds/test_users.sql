-- Fake GymRank accounts for local and dev testing. Never run on production.
-- Passwords are listed in database/seeds/README.md; only their salted hashes are stored here.
-- Requires database/migrations/001_auth.sql to 006_user_plans.sql. Safe to rerun: existing test
-- accounts are reset to these values and real accounts are left alone.
INSERT INTO users (full_name, email, password_hash) VALUES
    ('Marcus Malone', 'marcus.malone@example.com', '$2y$12$3pUDEW97t3uZ8XGHUe1f9.NZMcoA1hvDNyqY/FWSMpB9QognHcjY6'),
    ('Dana Lee', 'dana.lee@example.com', '$2y$12$ilvzcKfmnppM1yr3It5XBOfllR.nBueEM.AMEg50pHJo7sZHF3XYa'),
    ('Priya Shah', 'priya.shah@example.com', '$2y$12$4lNk3Tkk.b3DqRkf6nNBLuJdToeiMzmaUuwNSleFt1AmMyjFeMX8m'),
    ('Sean O''Brien', 'sean.obrien@example.com', '$2y$12$YIS4MbGpV1OEPZEPBoGJ6uKkJ7eRK.NyXHhxv3Y2lfxwCofTO83AK'),
    ('Jordan Kim', 'jordan.kim@example.com', '$2y$12$eBZ6DaifKJgMOa4xf/paxOtz3qf0QNw6zXgCZY5eKRoZ73bCl.cJq')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), password_hash = VALUES(password_hash);

-- Each test account has finished onboarding (Strength, Beginner, Full gym access) and has no plan, so logging in
-- opens the Dashboard with "Welcome, <first name>" (story #18). Without a goal and setup the app sends the account
-- to "Choose your training goal" instead.
INSERT INTO user_preferences (user_id, training_goal)
    SELECT id, 'strength' FROM users WHERE email IN (
        'marcus.malone@example.com', 'dana.lee@example.com', 'priya.shah@example.com',
        'sean.obrien@example.com', 'jordan.kim@example.com')
ON DUPLICATE KEY UPDATE training_goal = VALUES(training_goal);

INSERT INTO user_setup (user_id, experience)
    SELECT id, 'beginner' FROM users WHERE email IN (
        'marcus.malone@example.com', 'dana.lee@example.com', 'priya.shah@example.com',
        'sean.obrien@example.com', 'jordan.kim@example.com')
ON DUPLICATE KEY UPDATE experience = VALUES(experience);

DELETE FROM user_equipment WHERE user_id IN (
    SELECT id FROM users WHERE email IN (
        'marcus.malone@example.com', 'dana.lee@example.com', 'priya.shah@example.com',
        'sean.obrien@example.com', 'jordan.kim@example.com'));
INSERT INTO user_equipment (user_id, equipment)
    SELECT id, 'full_gym' FROM users WHERE email IN (
        'marcus.malone@example.com', 'dana.lee@example.com', 'priya.shah@example.com',
        'sean.obrien@example.com', 'jordan.kim@example.com');

DELETE FROM user_plans WHERE user_id IN (
    SELECT id FROM users WHERE email IN (
        'marcus.malone@example.com', 'dana.lee@example.com', 'priya.shah@example.com',
        'sean.obrien@example.com', 'jordan.kim@example.com'));
