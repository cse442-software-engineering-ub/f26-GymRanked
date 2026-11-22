-- Remove the temporary Saturday plan after testing. Apply only to the database that received the seed.
-- First switch every test account using this plan to another plan. The guard below leaves the plan intact
-- while any account still selects it. Saved workout sessions keep their copied plan name and sets.

SET @saturday_test_plan_id = (
  SELECT id FROM workout_plans WHERE name = 'TEST ONLY - Saturday Workout - Remove Nov 21'
);

DELETE FROM workout_plans
WHERE id = @saturday_test_plan_id
  AND NOT EXISTS (SELECT 1 FROM user_plans WHERE plan_id = @saturday_test_plan_id);

SELECT CASE
  WHEN EXISTS (SELECT 1 FROM workout_plans WHERE id = @saturday_test_plan_id)
    THEN 'Not removed: switch test accounts to another plan, then rerun this cleanup.'
  ELSE 'Temporary Saturday plan removed.'
END AS cleanup_result;
