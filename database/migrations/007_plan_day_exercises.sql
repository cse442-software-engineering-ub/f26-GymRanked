-- Exercise names for the dashboard's Today's workout card.
-- Apply after 005_workout_plan_details.sql to each local or shared database
-- before deploying the matching plan.php change:
-- mysql -u DB_USER -p cse442_2026_fall_team_y_db < database/migrations/007_plan_day_exercises.sql
-- Re-running this migration updates the seeded exercise lists without adding duplicates.

SET @add_exercises = IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE() AND table_name = 'workout_plan_days' AND column_name = 'exercises') = 0,
  'ALTER TABLE workout_plan_days ADD COLUMN exercises JSON NULL',
  'DO 0'
);
PREPARE add_exercises FROM @add_exercises;
EXECUTE add_exercises;
DEALLOCATE PREPARE add_exercises;

UPDATE workout_plan_days d
JOIN workout_plans p ON p.id = d.plan_id
SET d.exercises = CASE CONCAT(p.name, ':', d.position)
  WHEN 'Push Pull Legs:1' THEN JSON_ARRAY('Bench press', 'Overhead press', 'Triceps pushdown')
  WHEN 'Push Pull Legs:2' THEN JSON_ARRAY('Barbell row', 'Lat pulldown', 'Dumbbell curl')
  WHEN 'Push Pull Legs:3' THEN JSON_ARRAY('Back squat', 'Romanian deadlift', 'Walking lunge')
  WHEN 'Full Body Strength:1' THEN JSON_ARRAY('Back squat', 'Bench press', 'Barbell row')
  WHEN 'Full Body Strength:2' THEN JSON_ARRAY('Bench press', 'Romanian deadlift', 'Lat pulldown')
  WHEN 'Full Body Strength:3' THEN JSON_ARRAY('Deadlift', 'Overhead press', 'Split squat')
  WHEN 'Upper/Lower Hypertrophy:1' THEN JSON_ARRAY('Incline dumbbell press', 'Seated cable row', 'Lateral raise')
  WHEN 'Upper/Lower Hypertrophy:2' THEN JSON_ARRAY('Leg press', 'Romanian deadlift', 'Leg curl')
  WHEN 'Upper/Lower Hypertrophy:3' THEN JSON_ARRAY('Easy walk', 'Hip mobility', 'Shoulder mobility')
  WHEN '5/3/1 Strength Cycle:1' THEN JSON_ARRAY('Back squat', 'Bulgarian split squat', 'Hanging leg raise')
  WHEN '5/3/1 Strength Cycle:2' THEN JSON_ARRAY('Bench press', 'Dumbbell row', 'Triceps extension')
  WHEN '5/3/1 Strength Cycle:3' THEN JSON_ARRAY('Deadlift', 'Pull-up', 'Back extension')
  WHEN 'Beginner Fundamentals:1' THEN JSON_ARRAY('Goblet squat', 'Push-up', 'Dumbbell row')
  WHEN 'Beginner Fundamentals:2' THEN JSON_ARRAY('Hip hinge', 'Dumbbell press', 'Lat pulldown')
  WHEN 'Beginner Fundamentals:3' THEN JSON_ARRAY('Split squat', 'Incline push-up', 'Cable row')
  WHEN 'Powerlifting Peak:1' THEN JSON_ARRAY('Competition squat', 'Paused squat', 'Plank')
  WHEN 'Powerlifting Peak:2' THEN JSON_ARRAY('Competition bench press', 'Close-grip bench press', 'Barbell row')
  WHEN 'Powerlifting Peak:3' THEN JSON_ARRAY('Competition deadlift', 'Paused deadlift', 'Lat pulldown')
  WHEN 'Bodyweight Basics:1' THEN JSON_ARRAY('Push-up', 'Bench dip', 'Pike push-up')
  WHEN 'Bodyweight Basics:2' THEN JSON_ARRAY('Inverted row', 'Pull-up', 'Superman hold')
  WHEN 'Bodyweight Basics:3' THEN JSON_ARRAY('Bodyweight squat', 'Reverse lunge', 'Glute bridge')
  WHEN 'Athletic Performance:1' THEN JSON_ARRAY('Sprint drill', 'Acceleration sprint', 'A-skip')
  WHEN 'Athletic Performance:2' THEN JSON_ARRAY('Back squat', 'Bench press', 'Barbell row')
  WHEN 'Athletic Performance:3' THEN JSON_ARRAY('Box jump', 'Medicine ball throw', 'Broad jump')
  WHEN 'Glute Focus:1' THEN JSON_ARRAY('Barbell hip thrust', 'Back squat', 'Cable kickback')
  WHEN 'Glute Focus:2' THEN JSON_ARRAY('Romanian deadlift', 'Walking lunge', 'Glute bridge')
  WHEN 'Glute Focus:3' THEN JSON_ARRAY('Dumbbell row', 'Push-up', 'Dead bug')
  WHEN 'Marathon Strength Support:1' THEN JSON_ARRAY('Step-up', 'Single-leg Romanian deadlift', 'Calf raise')
  WHEN 'Marathon Strength Support:2' THEN JSON_ARRAY('Push-up', 'Dumbbell row', 'Overhead press')
  WHEN 'Marathon Strength Support:3' THEN JSON_ARRAY('Side plank', 'Bird dog', 'Hip mobility')
  ELSE d.exercises
END;
