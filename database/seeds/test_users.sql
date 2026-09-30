-- Fake GymRank accounts for local and dev testing. Never run on production.
-- Passwords are listed in database/seeds/README.md; only their salted hashes are stored here.
-- Requires database/migrations/001_auth.sql. Safe to rerun: existing test
-- accounts are reset to these values and real accounts are left alone.
INSERT INTO users (full_name, email, password_hash) VALUES
    ('Marcus Malone', 'marcus.malone@example.com', '$2y$12$3pUDEW97t3uZ8XGHUe1f9.NZMcoA1hvDNyqY/FWSMpB9QognHcjY6'),
    ('Dana Lee', 'dana.lee@example.com', '$2y$12$ilvzcKfmnppM1yr3It5XBOfllR.nBueEM.AMEg50pHJo7sZHF3XYa'),
    ('Priya Shah', 'priya.shah@example.com', '$2y$12$4lNk3Tkk.b3DqRkf6nNBLuJdToeiMzmaUuwNSleFt1AmMyjFeMX8m'),
    ('Sean O''Brien', 'sean.obrien@example.com', '$2y$12$YIS4MbGpV1OEPZEPBoGJ6uKkJ7eRK.NyXHhxv3Y2lfxwCofTO83AK'),
    ('Jordan Kim', 'jordan.kim@example.com', '$2y$12$eBZ6DaifKJgMOa4xf/paxOtz3qf0QNw6zXgCZY5eKRoZ73bCl.cJq')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), password_hash = VALUES(password_hash);
