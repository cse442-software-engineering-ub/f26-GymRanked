-- Workout buddies test accounts for story #78 (card #71): six accounts, buddy-<name>@example.com.
-- The password is Buddy-Test-78! for all of them; only its salted hash is stored here.
-- Requires database/migrations/001_auth.sql to 018_workout_buddies.sql. Adds new accounts only. Safe to rerun: these six
-- accounts' names, password, setup, groups, memberships and messages are reset to the ones below, and no other account
-- or group is touched. It needs no MySQL time zone tables and can be loaded on any day. The accounts are marked
-- users.is_test = 1, so they are never listed on a leaderboard.
--
-- Load it from the repo root:
--   mysql --default-character-set=utf8mb4 -u root cse442_2026_fall_team_y_db < database/seeds/workout_buddies.sql
--
--   Olivia Grant  buddy-olivia@example.com  owner of "Morning Lifters" (invite code 7KQ2MXP9, 7 days from the load)
--   Ben Cruz      buddy-ben@example.com     member of "Morning Lifters", with one message waiting from Olivia
--   Nina Park     buddy-nina@example.com    no group (joins "Morning Lifters" with the code)
--   Cal Moss      buddy-cal@example.com     no group (creates a group)
--   Omar Reyes    buddy-omar@example.com    no group, never joins one (the outside account)
--   Pete Lowe     buddy-pete@example.com    owner of "Late Starters" (invite code 4MXT8H2R, expired yesterday)

INSERT INTO users (full_name, email, password_hash) VALUES
    ('Olivia Grant', 'buddy-olivia@example.com', '$2y$12$z3ZI6of./NLBZElPEHIANulFB/Ta1riDNKmIG7Ag23Hvqn6mwV2Ye'),
    ('Ben Cruz',     'buddy-ben@example.com',    '$2y$12$z3ZI6of./NLBZElPEHIANulFB/Ta1riDNKmIG7Ag23Hvqn6mwV2Ye'),
    ('Nina Park',    'buddy-nina@example.com',   '$2y$12$z3ZI6of./NLBZElPEHIANulFB/Ta1riDNKmIG7Ag23Hvqn6mwV2Ye'),
    ('Cal Moss',     'buddy-cal@example.com',    '$2y$12$z3ZI6of./NLBZElPEHIANulFB/Ta1riDNKmIG7Ag23Hvqn6mwV2Ye'),
    ('Omar Reyes',   'buddy-omar@example.com',   '$2y$12$z3ZI6of./NLBZElPEHIANulFB/Ta1riDNKmIG7Ag23Hvqn6mwV2Ye'),
    ('Pete Lowe',    'buddy-pete@example.com',   '$2y$12$z3ZI6of./NLBZElPEHIANulFB/Ta1riDNKmIG7Ag23Hvqn6mwV2Ye')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), password_hash = VALUES(password_hash);

UPDATE users SET is_test = 1 WHERE email LIKE 'buddy-%@example.com';

SET @olivia = (SELECT id FROM users WHERE email = 'buddy-olivia@example.com');
SET @ben    = (SELECT id FROM users WHERE email = 'buddy-ben@example.com');
SET @pete   = (SELECT id FROM users WHERE email = 'buddy-pete@example.com');

-- A finished setup (Strength, Beginner, Full gym access), so logging in opens the Dashboard instead of an onboarding step.
INSERT INTO user_preferences (user_id, training_goal)
    SELECT id, 'strength' FROM users WHERE email LIKE 'buddy-%@example.com'
ON DUPLICATE KEY UPDATE training_goal = VALUES(training_goal);

INSERT INTO user_setup (user_id, experience)
    SELECT id, 'beginner' FROM users WHERE email LIKE 'buddy-%@example.com'
ON DUPLICATE KEY UPDATE experience = VALUES(experience);

DELETE FROM user_equipment WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'buddy-%@example.com');
INSERT INTO user_equipment (user_id, equipment)
    SELECT id, 'full_gym' FROM users WHERE email LIKE 'buddy-%@example.com';

-- Reset: deleting a group deletes its members and messages. Then drop any other trace of these accounts (a membership
-- in someone else's group, messages they sent or received).
DELETE FROM buddy_groups WHERE owner_id IN (SELECT id FROM users WHERE email LIKE 'buddy-%@example.com');
DELETE FROM buddy_members WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'buddy-%@example.com');
DELETE FROM buddy_encouragements WHERE sender_id IN (SELECT id FROM users WHERE email LIKE 'buddy-%@example.com')
    OR recipient_id IN (SELECT id FROM users WHERE email LIKE 'buddy-%@example.com');

INSERT INTO buddy_groups (name, owner_id, invite_code, invite_expires_at, created_at) VALUES
    ('Morning Lifters', @olivia, '7KQ2MXP9', UTC_TIMESTAMP() + INTERVAL 7 DAY, UTC_TIMESTAMP() - INTERVAL 2 DAY),
    ('Late Starters',   @pete,   '4MXT8H2R', UTC_TIMESTAMP() - INTERVAL 1 DAY, UTC_TIMESTAMP() - INTERVAL 8 DAY);

SET @morning = (SELECT id FROM buddy_groups WHERE invite_code = '7KQ2MXP9');
SET @late    = (SELECT id FROM buddy_groups WHERE invite_code = '4MXT8H2R');

INSERT INTO buddy_members (group_id, user_id, joined_at) VALUES
    (@morning, @olivia, UTC_TIMESTAMP() - INTERVAL 2 DAY),
    (@morning, @ben,    UTC_TIMESTAMP() - INTERVAL 1 DAY),
    (@late,    @pete,   UTC_TIMESTAMP() - INTERVAL 8 DAY);

INSERT INTO buddy_encouragements (group_id, sender_id, recipient_id, message, created_at)
VALUES (@morning, @olivia, @ben, 'Nice work on leg day!', UTC_TIMESTAMP() - INTERVAL 1 HOUR);

-- The member ids the task tests use (<OLIVIA>, <BEN>, <PETE>) and the invite codes.
SELECT g.name AS group_name, u.full_name, m.id AS member_id, g.invite_code, g.invite_expires_at
FROM buddy_members m
JOIN buddy_groups g ON g.id = m.group_id
JOIN users u ON u.id = m.user_id
WHERE g.id IN (@morning, @late)
ORDER BY g.id, m.id;
