-- Set entry and return navigation test accounts (cards #141 and the return-to-origin task, stories #7, #4, #12):
-- setentry-1 to setentry-15 and returnto-1 to returnto-16, one per acceptance test. Each has finished onboarding
-- (Strength, Intermediate, Full gym access), has the Push Pull Legs plan started today and has no workout started
-- today, so its first workout is clean. All use the password listed in database/seeds/README.md; only its salted
-- hash is stored here.
-- Requires database/migrations/001_auth.sql to 012_user_profile.sql. Safe to rerun: these accounts are reset to this
-- state (their workouts, with their sets, are deleted) and every other account is left alone.
--
-- Load it from the repo root:
--   mysql --default-character-set=utf8mb4 -u root cse442_2026_fall_team_y_db < database/seeds/set_entry.sql

INSERT INTO users (full_name, email, password_hash) VALUES
    ('Set Entry 1', 'setentry-1@example.com', '$2y$12$rnJ97md/JZ.shEF.zG8gpuEon1jYKPlLpUWtc.tTGMkyz1PXQ5Kdy'),
    ('Set Entry 2', 'setentry-2@example.com', '$2y$12$rnJ97md/JZ.shEF.zG8gpuEon1jYKPlLpUWtc.tTGMkyz1PXQ5Kdy'),
    ('Set Entry 3', 'setentry-3@example.com', '$2y$12$rnJ97md/JZ.shEF.zG8gpuEon1jYKPlLpUWtc.tTGMkyz1PXQ5Kdy'),
    ('Set Entry 4', 'setentry-4@example.com', '$2y$12$rnJ97md/JZ.shEF.zG8gpuEon1jYKPlLpUWtc.tTGMkyz1PXQ5Kdy'),
    ('Set Entry 5', 'setentry-5@example.com', '$2y$12$rnJ97md/JZ.shEF.zG8gpuEon1jYKPlLpUWtc.tTGMkyz1PXQ5Kdy'),
    ('Set Entry 6', 'setentry-6@example.com', '$2y$12$rnJ97md/JZ.shEF.zG8gpuEon1jYKPlLpUWtc.tTGMkyz1PXQ5Kdy'),
    ('Set Entry 7', 'setentry-7@example.com', '$2y$12$rnJ97md/JZ.shEF.zG8gpuEon1jYKPlLpUWtc.tTGMkyz1PXQ5Kdy'),
    ('Set Entry 8', 'setentry-8@example.com', '$2y$12$rnJ97md/JZ.shEF.zG8gpuEon1jYKPlLpUWtc.tTGMkyz1PXQ5Kdy'),
    ('Set Entry 9', 'setentry-9@example.com', '$2y$12$rnJ97md/JZ.shEF.zG8gpuEon1jYKPlLpUWtc.tTGMkyz1PXQ5Kdy'),
    ('Set Entry 10', 'setentry-10@example.com', '$2y$12$rnJ97md/JZ.shEF.zG8gpuEon1jYKPlLpUWtc.tTGMkyz1PXQ5Kdy'),
    ('Set Entry 11', 'setentry-11@example.com', '$2y$12$rnJ97md/JZ.shEF.zG8gpuEon1jYKPlLpUWtc.tTGMkyz1PXQ5Kdy'),
    ('Set Entry 12', 'setentry-12@example.com', '$2y$12$rnJ97md/JZ.shEF.zG8gpuEon1jYKPlLpUWtc.tTGMkyz1PXQ5Kdy'),
    ('Set Entry 13', 'setentry-13@example.com', '$2y$12$rnJ97md/JZ.shEF.zG8gpuEon1jYKPlLpUWtc.tTGMkyz1PXQ5Kdy'),
    ('Set Entry 14', 'setentry-14@example.com', '$2y$12$rnJ97md/JZ.shEF.zG8gpuEon1jYKPlLpUWtc.tTGMkyz1PXQ5Kdy'),
    ('Set Entry 15', 'setentry-15@example.com', '$2y$12$rnJ97md/JZ.shEF.zG8gpuEon1jYKPlLpUWtc.tTGMkyz1PXQ5Kdy'),
    ('Return To 1', 'returnto-1@example.com', '$2y$12$rnJ97md/JZ.shEF.zG8gpuEon1jYKPlLpUWtc.tTGMkyz1PXQ5Kdy'),
    ('Return To 2', 'returnto-2@example.com', '$2y$12$rnJ97md/JZ.shEF.zG8gpuEon1jYKPlLpUWtc.tTGMkyz1PXQ5Kdy'),
    ('Return To 3', 'returnto-3@example.com', '$2y$12$rnJ97md/JZ.shEF.zG8gpuEon1jYKPlLpUWtc.tTGMkyz1PXQ5Kdy'),
    ('Return To 4', 'returnto-4@example.com', '$2y$12$rnJ97md/JZ.shEF.zG8gpuEon1jYKPlLpUWtc.tTGMkyz1PXQ5Kdy'),
    ('Return To 5', 'returnto-5@example.com', '$2y$12$rnJ97md/JZ.shEF.zG8gpuEon1jYKPlLpUWtc.tTGMkyz1PXQ5Kdy'),
    ('Return To 6', 'returnto-6@example.com', '$2y$12$rnJ97md/JZ.shEF.zG8gpuEon1jYKPlLpUWtc.tTGMkyz1PXQ5Kdy'),
    ('Return To 7', 'returnto-7@example.com', '$2y$12$rnJ97md/JZ.shEF.zG8gpuEon1jYKPlLpUWtc.tTGMkyz1PXQ5Kdy'),
    ('Return To 8', 'returnto-8@example.com', '$2y$12$rnJ97md/JZ.shEF.zG8gpuEon1jYKPlLpUWtc.tTGMkyz1PXQ5Kdy'),
    ('Return To 9', 'returnto-9@example.com', '$2y$12$rnJ97md/JZ.shEF.zG8gpuEon1jYKPlLpUWtc.tTGMkyz1PXQ5Kdy'),
    ('Return To 10', 'returnto-10@example.com', '$2y$12$rnJ97md/JZ.shEF.zG8gpuEon1jYKPlLpUWtc.tTGMkyz1PXQ5Kdy'),
    ('Return To 11', 'returnto-11@example.com', '$2y$12$rnJ97md/JZ.shEF.zG8gpuEon1jYKPlLpUWtc.tTGMkyz1PXQ5Kdy'),
    ('Return To 12', 'returnto-12@example.com', '$2y$12$rnJ97md/JZ.shEF.zG8gpuEon1jYKPlLpUWtc.tTGMkyz1PXQ5Kdy'),
    ('Return To 13', 'returnto-13@example.com', '$2y$12$rnJ97md/JZ.shEF.zG8gpuEon1jYKPlLpUWtc.tTGMkyz1PXQ5Kdy'),
    ('Return To 14', 'returnto-14@example.com', '$2y$12$rnJ97md/JZ.shEF.zG8gpuEon1jYKPlLpUWtc.tTGMkyz1PXQ5Kdy'),
    ('Return To 15', 'returnto-15@example.com', '$2y$12$rnJ97md/JZ.shEF.zG8gpuEon1jYKPlLpUWtc.tTGMkyz1PXQ5Kdy'),
    ('Return To 16', 'returnto-16@example.com', '$2y$12$rnJ97md/JZ.shEF.zG8gpuEon1jYKPlLpUWtc.tTGMkyz1PXQ5Kdy')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), password_hash = VALUES(password_hash);

INSERT INTO user_preferences (user_id, training_goal)
    SELECT id, 'strength' FROM users WHERE email IN ('setentry-1@example.com', 'setentry-2@example.com', 'setentry-3@example.com', 'setentry-4@example.com', 'setentry-5@example.com', 'setentry-6@example.com', 'setentry-7@example.com', 'setentry-8@example.com', 'setentry-9@example.com', 'setentry-10@example.com', 'setentry-11@example.com', 'setentry-12@example.com', 'setentry-13@example.com', 'setentry-14@example.com', 'setentry-15@example.com', 'returnto-1@example.com', 'returnto-2@example.com', 'returnto-3@example.com', 'returnto-4@example.com', 'returnto-5@example.com', 'returnto-6@example.com', 'returnto-7@example.com', 'returnto-8@example.com', 'returnto-9@example.com', 'returnto-10@example.com', 'returnto-11@example.com', 'returnto-12@example.com', 'returnto-13@example.com', 'returnto-14@example.com', 'returnto-15@example.com', 'returnto-16@example.com')
ON DUPLICATE KEY UPDATE training_goal = VALUES(training_goal);

INSERT INTO user_setup (user_id, experience)
    SELECT id, 'intermediate' FROM users WHERE email IN ('setentry-1@example.com', 'setentry-2@example.com', 'setentry-3@example.com', 'setentry-4@example.com', 'setentry-5@example.com', 'setentry-6@example.com', 'setentry-7@example.com', 'setentry-8@example.com', 'setentry-9@example.com', 'setentry-10@example.com', 'setentry-11@example.com', 'setentry-12@example.com', 'setentry-13@example.com', 'setentry-14@example.com', 'setentry-15@example.com', 'returnto-1@example.com', 'returnto-2@example.com', 'returnto-3@example.com', 'returnto-4@example.com', 'returnto-5@example.com', 'returnto-6@example.com', 'returnto-7@example.com', 'returnto-8@example.com', 'returnto-9@example.com', 'returnto-10@example.com', 'returnto-11@example.com', 'returnto-12@example.com', 'returnto-13@example.com', 'returnto-14@example.com', 'returnto-15@example.com', 'returnto-16@example.com')
ON DUPLICATE KEY UPDATE experience = VALUES(experience);

DELETE FROM user_equipment WHERE user_id IN (SELECT id FROM users WHERE email IN ('setentry-1@example.com', 'setentry-2@example.com', 'setentry-3@example.com', 'setentry-4@example.com', 'setentry-5@example.com', 'setentry-6@example.com', 'setentry-7@example.com', 'setentry-8@example.com', 'setentry-9@example.com', 'setentry-10@example.com', 'setentry-11@example.com', 'setentry-12@example.com', 'setentry-13@example.com', 'setentry-14@example.com', 'setentry-15@example.com', 'returnto-1@example.com', 'returnto-2@example.com', 'returnto-3@example.com', 'returnto-4@example.com', 'returnto-5@example.com', 'returnto-6@example.com', 'returnto-7@example.com', 'returnto-8@example.com', 'returnto-9@example.com', 'returnto-10@example.com', 'returnto-11@example.com', 'returnto-12@example.com', 'returnto-13@example.com', 'returnto-14@example.com', 'returnto-15@example.com', 'returnto-16@example.com'));
INSERT INTO user_equipment (user_id, equipment)
    SELECT id, 'full_gym' FROM users WHERE email IN ('setentry-1@example.com', 'setentry-2@example.com', 'setentry-3@example.com', 'setentry-4@example.com', 'setentry-5@example.com', 'setentry-6@example.com', 'setentry-7@example.com', 'setentry-8@example.com', 'setentry-9@example.com', 'setentry-10@example.com', 'setentry-11@example.com', 'setentry-12@example.com', 'setentry-13@example.com', 'setentry-14@example.com', 'setentry-15@example.com', 'returnto-1@example.com', 'returnto-2@example.com', 'returnto-3@example.com', 'returnto-4@example.com', 'returnto-5@example.com', 'returnto-6@example.com', 'returnto-7@example.com', 'returnto-8@example.com', 'returnto-9@example.com', 'returnto-10@example.com', 'returnto-11@example.com', 'returnto-12@example.com', 'returnto-13@example.com', 'returnto-14@example.com', 'returnto-15@example.com', 'returnto-16@example.com');

DELETE FROM user_plans WHERE user_id IN (SELECT id FROM users WHERE email IN ('setentry-1@example.com', 'setentry-2@example.com', 'setentry-3@example.com', 'setentry-4@example.com', 'setentry-5@example.com', 'setentry-6@example.com', 'setentry-7@example.com', 'setentry-8@example.com', 'setentry-9@example.com', 'setentry-10@example.com', 'setentry-11@example.com', 'setentry-12@example.com', 'setentry-13@example.com', 'setentry-14@example.com', 'setentry-15@example.com', 'returnto-1@example.com', 'returnto-2@example.com', 'returnto-3@example.com', 'returnto-4@example.com', 'returnto-5@example.com', 'returnto-6@example.com', 'returnto-7@example.com', 'returnto-8@example.com', 'returnto-9@example.com', 'returnto-10@example.com', 'returnto-11@example.com', 'returnto-12@example.com', 'returnto-13@example.com', 'returnto-14@example.com', 'returnto-15@example.com', 'returnto-16@example.com'));
INSERT INTO user_plans (user_id, plan_id)
    SELECT id, (SELECT id FROM workout_plans WHERE name = 'Push Pull Legs')
    FROM users WHERE email IN ('setentry-1@example.com', 'setentry-2@example.com', 'setentry-3@example.com', 'setentry-4@example.com', 'setentry-5@example.com', 'setentry-6@example.com', 'setentry-7@example.com', 'setentry-8@example.com', 'setentry-9@example.com', 'setentry-10@example.com', 'setentry-11@example.com', 'setentry-12@example.com', 'setentry-13@example.com', 'setentry-14@example.com', 'setentry-15@example.com', 'returnto-1@example.com', 'returnto-2@example.com', 'returnto-3@example.com', 'returnto-4@example.com', 'returnto-5@example.com', 'returnto-6@example.com', 'returnto-7@example.com', 'returnto-8@example.com', 'returnto-9@example.com', 'returnto-10@example.com', 'returnto-11@example.com', 'returnto-12@example.com', 'returnto-13@example.com', 'returnto-14@example.com', 'returnto-15@example.com', 'returnto-16@example.com');

-- No workout started: deleting the sessions also deletes their sets.
DELETE FROM workout_sessions WHERE user_id IN (SELECT id FROM users WHERE email IN ('setentry-1@example.com', 'setentry-2@example.com', 'setentry-3@example.com', 'setentry-4@example.com', 'setentry-5@example.com', 'setentry-6@example.com', 'setentry-7@example.com', 'setentry-8@example.com', 'setentry-9@example.com', 'setentry-10@example.com', 'setentry-11@example.com', 'setentry-12@example.com', 'setentry-13@example.com', 'setentry-14@example.com', 'setentry-15@example.com', 'returnto-1@example.com', 'returnto-2@example.com', 'returnto-3@example.com', 'returnto-4@example.com', 'returnto-5@example.com', 'returnto-6@example.com', 'returnto-7@example.com', 'returnto-8@example.com', 'returnto-9@example.com', 'returnto-10@example.com', 'returnto-11@example.com', 'returnto-12@example.com', 'returnto-13@example.com', 'returnto-14@example.com', 'returnto-15@example.com', 'returnto-16@example.com'));
