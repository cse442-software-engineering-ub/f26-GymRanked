-- 016_exercise_alternatives.sql
-- The exercises api/exercise_alternatives.php can swap between (task #81, used by the alternatives panel in #82).
--
-- Requires: nothing else. The equipment values match user_equipment in 002_user_setup.sql, and the names match the
-- exercise names seeded in 007_plan_day_exercises.sql (compared case-insensitively).
--
-- Apply locally:
--   mysql -u root cse442_2026_fall_team_y_db < database/migrations/016_exercise_alternatives.sql
-- On the dev server, only when a task card says to (see ServerOperationsGuide.md):
--   mysql -u UBIT_USERNAME -p cse442_2026_fall_team_y_db < database/migrations/016_exercise_alternatives.sql
--
-- Safe to run more than once: the table is created if missing and the seed rows are updated in place.
--
-- Swap rules (applied by the API): an alternative has the same movement as the exercise being swapped, needs
-- equipment the user has ('full_gym' covers everything, and bodyweight exercises are always available), and is
-- not harder than the user's experience level. The closest level to the original comes first.
--
-- Supported set for now: four movements, 16 exercises. To support another exercise, add a row here (a new
-- migration for shared databases) and, if it is a new movement, at least two exercises with that movement.

CREATE TABLE IF NOT EXISTS exercises (
  name VARCHAR(100) NOT NULL PRIMARY KEY,
  movement ENUM('horizontal_push', 'squat', 'horizontal_pull', 'vertical_pull') NOT NULL,
  level ENUM('beginner', 'intermediate', 'advanced') NOT NULL,
  equipment ENUM(
    'bodyweight', 'dumbbells', 'barbell', 'kettlebells',
    'resistance_bands', 'cable_machine', 'pullup_bar', 'full_gym'
  ) NOT NULL,
  KEY idx_exercises_movement (movement)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

INSERT INTO exercises (name, movement, level, equipment) VALUES
  ('Bench press',            'horizontal_push', 'intermediate', 'barbell'),
  ('Close-grip bench press', 'horizontal_push', 'intermediate', 'barbell'),
  ('Incline dumbbell press', 'horizontal_push', 'intermediate', 'dumbbells'),
  ('Dumbbell press',         'horizontal_push', 'beginner',     'dumbbells'),
  ('Push-up',                'horizontal_push', 'beginner',     'bodyweight'),
  ('Incline push-up',        'horizontal_push', 'beginner',     'bodyweight'),
  ('Back squat',             'squat',           'intermediate', 'barbell'),
  ('Goblet squat',           'squat',           'beginner',     'dumbbells'),
  ('Split squat',            'squat',           'beginner',     'dumbbells'),
  ('Leg press',              'squat',           'beginner',     'full_gym'),
  ('Bodyweight squat',       'squat',           'beginner',     'bodyweight'),
  ('Barbell row',            'horizontal_pull', 'intermediate', 'barbell'),
  ('Dumbbell row',           'horizontal_pull', 'beginner',     'dumbbells'),
  ('Seated cable row',       'horizontal_pull', 'beginner',     'cable_machine'),
  ('Pull-up',                'vertical_pull',   'intermediate', 'pullup_bar'),
  ('Lat pulldown',           'vertical_pull',   'beginner',     'cable_machine')
ON DUPLICATE KEY UPDATE
  movement = VALUES(movement), level = VALUES(level), equipment = VALUES(equipment);
