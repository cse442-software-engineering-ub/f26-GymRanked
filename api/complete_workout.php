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
require __DIR__ . '/weekly_goal_calculation.php';

$data = input();
$db = database();
$user_id = workout_user_id($db);

$session_id = positive_int($data['session_id'] ?? null);
if ($session_id === null) respond(400, ['error' => 'session_id must be a whole number.']);

$db->begin_transaction();
// The same user-row lock is taken by weekly_goal.php when a target is saved. A completion therefore snapshots the
// target either before or after that save, never midway through it. It also serializes two completions for this user.
$lock = $db->prepare('SELECT id FROM users WHERE id = ? FOR UPDATE');
$lock->bind_param('i', $user_id);
$lock->execute();
$lock->get_result();
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

// Store the result in the completion transaction. If its goal query or insert fails, completion rolls back too;
// an already-completed workout never exists without the snapshot after migration 016 is applied.
$zone = new DateTimeZone(GOAL_TIME_ZONE);
$completed = new DateTimeImmutable($session['completed_at'], new DateTimeZone('UTC'));
$week_start = goal_week_start($completed);
$next_start = $week_start->modify('+7 days');
$week = $week_start->format('Y-m-d');
$target = goal_target_for_week($db, $user_id, $week);
[$dates, $credited] = goal_dates_and_credit(
    goal_completed_workouts($db, $user_id, $week_start, $next_start, $session['completed_at']),
    $zone,
    $session_id
);
$dates_json = json_encode($dates, JSON_THROW_ON_ERROR);
$credited_day = $credited ? 1 : 0;
$stmt = $db->prepare(
    'INSERT INTO workout_weekly_goal_snapshots (session_id, week_start, target_days, completed_dates, credited_day)
     VALUES (?, ?, ?, ?, ?)'
);
$stmt->bind_param('isisi', $session_id, $week, $target, $dates_json, $credited_day);
$stmt->execute();
$db->commit();
respond(200, ['session_id' => $session_id, 'completed_at' => iso_time($session['completed_at'])]);
