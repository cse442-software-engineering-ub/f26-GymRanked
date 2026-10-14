<?php
// POST api/complete_workout.php {"session_id":7} -> 200 {"session_id":7,"completed_at":"2026-10-13T20:12:59Z"}
//
// Marks the logged-in user's workout session completed, at the server's current time. After that its sets can no
// longer be saved or corrected, and api/workout_session.php returns its summary (including duration_seconds).
// Completing is done once: the session row is locked while it is checked and updated, so two requests at the same
// time give one 200 and one 409, and completed_at never changes afterwards.
//
// 400 bad session_id, or no sets logged yet ("Log at least one set"); 401 not logged in;
// 404 unknown session (or another user's); 405 not POST; 409 already completed ("Workout already completed").

require __DIR__ . '/workout_common.php';

$data = input();
$db = database();
$user_id = workout_user_id($db);

$session_id = positive_int($data['session_id'] ?? null);
if ($session_id === null) respond(400, ['error' => 'session_id must be a whole number.']);

$db->begin_transaction();
$session = find_session($db, $session_id, $user_id, true);
if (!$session) respond(404, ['error' => 'Session not found']);
if ($session['completed_at'] !== null) respond(409, ['error' => 'Workout already completed']);

$stmt = $db->prepare('SELECT COUNT(*) AS sets FROM workout_sets WHERE session_id = ?');
$stmt->bind_param('i', $session_id);
$stmt->execute();
if ((int) $stmt->get_result()->fetch_assoc()['sets'] === 0) respond(400, ['error' => 'Log at least one set']);

$stmt = $db->prepare('UPDATE workout_sessions SET completed_at = UTC_TIMESTAMP() WHERE id = ?');
$stmt->bind_param('i', $session_id);
$stmt->execute();
$session = find_session($db, $session_id, $user_id);
$db->commit();
respond(200, ['session_id' => $session_id, 'completed_at' => iso_time($session['completed_at'])]);
