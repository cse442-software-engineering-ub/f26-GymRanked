<?php
// GET api/workout_weekly_goal.php?session_id=N -> {snapshot: {...}} for a newly completed workout,
// or {snapshot:null, reason:"not_saved"} for a workout completed before migration 016.
// Reading this endpoint never changes the workout, goal, or snapshot.

require __DIR__ . '/workout_common.php';
require __DIR__ . '/weekly_goal_calculation.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    header('Allow: GET');
    respond(405, ['error' => 'Method not allowed.']);
}
$db = database();
$user_id = workout_user_id($db);
$session_id = filter_var($_GET['session_id'] ?? '', FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
if ($session_id === false) respond(400, ['error' => 'Invalid session id.']);

$stmt = $db->prepare(
    'SELECT s.completed_at, g.week_start, g.target_days, g.completed_dates, g.credited_day
     FROM workout_sessions s LEFT JOIN workout_weekly_goal_snapshots g ON g.session_id = s.id
     WHERE s.id = ? AND s.user_id = ?'
);
$stmt->bind_param('ii', $session_id, $user_id);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();
if (!$row) respond(404, ['error' => 'Session not found']);
if ($row['completed_at'] === null) respond(409, ['error' => 'Workout still in progress']);
if ($row['week_start'] === null) respond(200, ['snapshot' => null, 'reason' => 'not_saved']);

$dates = json_decode($row['completed_dates'], true, 512, JSON_THROW_ON_ERROR);
if (!is_array($dates)) throw new RuntimeException('Invalid weekly snapshot');
$target = (int) $row['target_days'];
$start = new DateTimeImmutable($row['week_start'], new DateTimeZone(GOAL_TIME_ZONE));
respond(200, ['snapshot' => [
    'week_start' => $row['week_start'],
    'week_end' => $start->modify('+6 days')->format('Y-m-d'),
    'target_days' => $target,
    'completed_dates' => $dates,
    'credited_day' => (bool) $row['credited_day'],
    ...goal_progress_values($dates, $target),
]]);
