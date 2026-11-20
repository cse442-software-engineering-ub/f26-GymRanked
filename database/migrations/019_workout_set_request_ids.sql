-- Apply after 009_workout_sessions.sql to existing local or shared databases.
-- Nullable for older clients and seeded historical sets; new clients send a unique ID per save attempt.
ALTER TABLE workout_sets
  ADD COLUMN request_id VARCHAR(64) NULL,
  ADD UNIQUE KEY uq_workout_sets_request (session_id, request_id);
