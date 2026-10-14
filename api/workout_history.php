<?php
// GET api/workout_history.php -> 200 {"sessions":[{"id":7,"name":"Push","plan":"Push Pull Legs",
//     "started_at":"2026-10-13T19:27:47Z","completed_at":"2026-10-13T20:12:59Z","duration_seconds":2712,
//     "exercise_count":3,"set_count":4,"total_volume_lb":2553.5}, ...]}
//
// The logged-in user's completed workouts, most recently completed first (at most 100). Unfinished sessions and
// other users' sessions are never included. exercise_count counts exercises with at least one set;
// total_volume_lb is the sum of weight × reps in pounds. Open one with api/workout_session.php?id= for its sets.
//
// 401 not logged in, 405 not GET.

require __DIR__ . '/workout_common.php';

require_method('GET');
$db = database();
$user_id = workout_user_id($db);

$stmt = $db->prepare(
    'SELECT s.id, s.day_name, s.plan_name, s.started_at, s.completed_at,
            TIMESTAMPDIFF(SECOND, s.started_at, s.completed_at) AS duration_seconds,
            COUNT(DISTINCT st.exercise) AS exercise_count, COUNT(st.id) AS set_count,
            COALESCE(SUM(st.weight_lb * st.reps), 0) AS total_volume_lb
     FROM workout_sessions s LEFT JOIN workout_sets st ON st.session_id = s.id
     WHERE s.user_id = ? AND s.completed_at IS NOT NULL
     GROUP BY s.id ORDER BY s.completed_at DESC, s.id DESC LIMIT 100'
);
$stmt->bind_param('i', $user_id);
$stmt->execute();

$sessions = [];
foreach ($stmt->get_result()->fetch_all(MYSQLI_ASSOC) as $row) {
    $sessions[] = [
        'id' => (int) $row['id'],
        'name' => $row['day_name'],
        'plan' => $row['plan_name'],
        'started_at' => iso_time($row['started_at']),
        'completed_at' => iso_time($row['completed_at']),
        'duration_seconds' => (int) $row['duration_seconds'],
        'exercise_count' => (int) $row['exercise_count'],
        'set_count' => (int) $row['set_count'],
        'total_volume_lb' => json_number($row['total_volume_lb']),
    ];
}
respond(200, ['sessions' => $sessions]);
