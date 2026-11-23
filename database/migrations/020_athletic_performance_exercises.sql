-- Replaces three Athletic Performance exercises that had no "How to perform it" video with ones WorkoutX has:
--   Acceleration sprint  -> Alternate sprint   (WorkoutX "Alternate Sprinter Lunge")
--   Medicine ball throw  -> Kettlebell swing   (WorkoutX "Kettlebell Swing")
--   Broad jump           -> Jump squat         (WorkoutX "Jump Squats Bodyweight")
-- 007_plan_day_exercises.sql already has the new names, so a database built from scratch needs nothing more.
-- Apply to each local or shared database that ran 007 before this change (after 007):
-- mysql -u DB_USER -p cse442_2026_fall_team_y_db < database/migrations/020_athletic_performance_exercises.sql
-- Safe to re-run: it sets the two days' lists to exactly these values. Workouts already logged keep the names
-- they were saved with.

UPDATE workout_plan_days d
JOIN workout_plans p ON p.id = d.plan_id
SET d.exercises = CASE CONCAT(p.name, ':', d.position)
  WHEN 'Athletic Performance:1' THEN JSON_ARRAY('Sprint drill', 'Alternate sprint', 'A-skip')
  WHEN 'Athletic Performance:3' THEN JSON_ARRAY('Box jump', 'Kettlebell swing', 'Jump squat')
  ELSE d.exercises
END
WHERE p.name = 'Athletic Performance' AND d.position IN (1, 3);
