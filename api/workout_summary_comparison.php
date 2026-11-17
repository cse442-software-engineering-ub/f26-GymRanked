<?php
// GET api/workout_summary_comparison.php?session_id=7 -> 200
// {"comparisons":{"Bench press":{"last_set":{"weight_lb":185,"reps":9},"best_weight_lb":205}}}
// last_set is the heaviest set (reps break weight ties) in the most recent earlier completed
// session containing that exercise. best_weight_lb is the highest weight across all earlier
// completed sessions. A first-time exercise has null values for both. Only the owner's completed
// sessions are considered; this endpoint never returns another user's workouts.

require __DIR__ . '/workout_common.php';
require_method('GET');
$db = database();
$user_id = workout_user_id($db);
$session_id = filter_var($_GET['session_id'] ?? '', FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
if ($session_id === false) respond(400, ['error' => 'Invalid session id.']);
$session = find_session($db, $session_id, $user_id);
if (!$session) respond(404, ['error' => 'Session not found.']);
if ($session['completed_at'] === null) respond(409, ['error' => 'Workout is still in progress.']);
$completed_at = $session['completed_at'];

$comparisons = [];
foreach (exercise_names($session) as $name) {
    $comparisons[$name] = ['last_set' => null, 'best_weight_lb' => null];
}

$stmt = $db->prepare(
    'SELECT st.exercise, st.weight_lb, st.reps, s.id AS session_id
     FROM workout_sets st JOIN workout_sessions s ON s.id = st.session_id
     WHERE s.user_id = ? AND s.completed_at IS NOT NULL
       AND (s.completed_at < ? OR (s.completed_at = ? AND s.id < ?))
     ORDER BY s.completed_at DESC, s.id DESC, st.weight_lb DESC, st.reps DESC, st.id DESC'
);
$stmt->bind_param('issi', $user_id, $completed_at, $completed_at, $session_id);
$stmt->execute();
$last_session = [];
$rows = $stmt->get_result();
while ($row = $rows->fetch_assoc()) {
    $name = $row['exercise'];
    if (!array_key_exists($name, $comparisons)) continue;
    $weight = json_number($row['weight_lb']);
    if (!isset($last_session[$name])) {
        $last_session[$name] = (int) $row['session_id'];
        $comparisons[$name]['last_set'] = ['weight_lb' => $weight, 'reps' => (int) $row['reps']];
    }
    if ($comparisons[$name]['best_weight_lb'] === null || $weight > $comparisons[$name]['best_weight_lb']) {
        $comparisons[$name]['best_weight_lb'] = $weight;
    }
}
respond(200, ['comparisons' => $comparisons]);
