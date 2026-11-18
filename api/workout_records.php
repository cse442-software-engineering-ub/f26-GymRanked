<?php
// GET api/workout_records.php?session_id=7 -> 200
//   {"session_id":7,"new_pr_count":1,"exercises":[
//     {"exercise":"Bench press","metric":"weight","top_set":{"weight_lb":105,"reps":5},
//      "previous":{"weight_lb":100,"reps":5,"completed_at":"2026-11-05T15:00:00Z"},"change":5,
//      "best_before":{"weight_lb":100,"reps":5},"is_baseline":false,"is_pr":true}]}
//
// Comparisons and personal records for one COMPLETED workout of the logged-in user (story #12, card #137, read by the
// workout summary, card #128). Nothing is stored: every request works the answer out from workout_sets, so it can never
// disagree with the saved sets. The user always comes from the gymrank_session cookie; another user's session is a 404
// and any user_id or email in the request is ignored.
//
// - top set: if the workout's heaviest weight for the exercise is above 0 lb, the heaviest weight and, for that weight,
//   the most reps (metric "weight"); if it is 0 lb (bodyweight), the most reps in one set (metric "reps"). Same rule as
//   api/exercise_progress.php, so the Progress page and the summary agree on what a new PR is.
// - Only the user's own workouts completed EARLIER than this one are used: completed_at before it, or the same second
//   with a lower session id. Unfinished workouts, other users' workouts and later workouts are never read, so a summary
//   opened later still shows what it showed on the day, and two workouts on one day have separate results.
// - previous = the most recent earlier workout with a result of the same kind (a weighted top set, or for bodyweight a
//   0 lb set, as api/exercise_progress.php counts them); best_before = the best of those. change is this top weight minus
//   previous in lb (metric "reps": this reps minus previous reps). The previous workout is not always the best one.
// - is_baseline: no earlier result, so previous, change and best_before are null. A baseline is not a PR. A result that
//   only matches best_before is not a PR either: is_pr means the top weight (metric "reps": the reps) is above best_before.
// - Only exercises with a saved set are listed, in the workout's exercise order. new_pr_count = how many have is_pr.
//
// 400 {"error":"Invalid request.","errors":{"session_id":"Use a whole number."}}, 401 not logged in, 404
// {"error":"Session not found"}, 405 with Allow: GET, 409 {"error":"Workout not completed"}, 500 {"error":"Database error"}.
//
// ponytail: reads every earlier set of the user on each request, fine for the few thousand sets of a gym-goer's history;
// past that, keep each exercise's running best in a small table written when a workout is completed.

require __DIR__ . '/workout_common.php';

require_method('GET');
$db = database();
$user_id = workout_user_id($db);

$raw = $_GET['session_id'] ?? null;
if (!is_string($raw) || !preg_match('/^[1-9][0-9]{0,17}$/D', $raw)) {
    respond(400, ['error' => 'Invalid request.', 'errors' => ['session_id' => 'Use a whole number.']]);
}
$session_id = (int) $raw;

$session = find_session($db, $session_id, $user_id);
if (!$session) respond(404, ['error' => 'Session not found']);
if ($session['completed_at'] === null) respond(409, ['error' => 'Workout not completed']);

// Weights are whole cents until printed, so comparing and subtracting never depends on floats.
function set_pairs($db, $sql, ...$params) {
    $stmt = $db->prepare($sql);
    $stmt->bind_param(...$params);
    $stmt->execute();
    return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
}

// [heaviest weight in cents, most reps at that weight, most reps in one 0 lb set or null] for a list of [cents, reps].
function set_facts($sets) {
    $top = max(array_column($sets, 0));
    $reps_at_top = $zero_reps = null;
    foreach ($sets as [$cents, $reps]) {
        if ($cents === $top) $reps_at_top = max($reps_at_top ?? 0, $reps);
        if ($cents === 0) $zero_reps = max($zero_reps ?? 0, $reps);
    }
    return ['top' => $top, 'reps_at_top' => $reps_at_top, 'zero_reps' => $zero_reps];
}

$mine = [];   // exercise => [[cents, reps], ...] in this workout
foreach (set_pairs($db, 'SELECT exercise, weight_lb, reps FROM workout_sets WHERE session_id = ? ORDER BY set_number, id', 'i', $session_id) as $row) {
    $mine[$row['exercise']][] = [(int) round((float) $row['weight_lb'] * 100), (int) $row['reps']];
}

$earlier = [];   // exercise => [completed_at, [[cents, reps], ...]] per earlier workout, oldest first
$completed_at = $session['completed_at'];
foreach (set_pairs(
    $db,
    'SELECT s.id, s.completed_at, st.exercise, st.weight_lb, st.reps
     FROM workout_sets st JOIN workout_sessions s ON s.id = st.session_id
     WHERE s.user_id = ? AND s.completed_at IS NOT NULL AND (s.completed_at < ? OR (s.completed_at = ? AND s.id < ?))
     ORDER BY s.completed_at, s.id, st.set_number, st.id',
    'issi', $user_id, $completed_at, $completed_at, $session_id
) as $row) {
    $earlier[$row['exercise']][(int) $row['id']]['at'] = $row['completed_at'];
    $earlier[$row['exercise']][(int) $row['id']]['sets'][] = [(int) round((float) $row['weight_lb'] * 100), (int) $row['reps']];
}

$result = [];
$new_prs = 0;
foreach (exercise_names($session) as $name) {
    if (empty($mine[$name])) continue;
    $facts = set_facts($mine[$name]);
    $bodyweight = $facts['top'] === 0;
    $cents = $bodyweight ? 0 : $facts['top'];
    $reps = $bodyweight ? $facts['zero_reps'] : $facts['reps_at_top'];

    $previous = $best = null;   // [completed_at, cents, reps]
    foreach ($earlier[$name] ?? [] as $workout) {
        $f = set_facts($workout['sets']);
        if ($bodyweight ? $f['zero_reps'] === null : $f['top'] === 0) continue;
        $r = $bodyweight ? [$workout['at'], 0, $f['zero_reps']] : [$workout['at'], $f['top'], $f['reps_at_top']];
        $previous = $r;
        if ($best === null || $r[1] > $best[1] || ($r[1] === $best[1] && $r[2] > $best[2])) $best = $r;
    }

    $is_pr = $best !== null && ($bodyweight ? $reps > $best[2] : $cents > $best[1]);
    $new_prs += $is_pr ? 1 : 0;
    $result[] = [
        'exercise' => $name,
        'metric' => $bodyweight ? 'reps' : 'weight',
        'top_set' => ['weight_lb' => json_number($cents / 100), 'reps' => $reps],
        'previous' => $previous === null ? null : [
            'weight_lb' => json_number($previous[1] / 100), 'reps' => $previous[2], 'completed_at' => iso_time($previous[0]),
        ],
        'change' => $previous === null ? null : ($bodyweight ? $reps - $previous[2] : json_number(($cents - $previous[1]) / 100)),
        'best_before' => $best === null ? null : ['weight_lb' => json_number($best[1] / 100), 'reps' => $best[2]],
        'is_baseline' => $previous === null,
        'is_pr' => $is_pr,
    ];
}

respond(200, ['session_id' => $session_id, 'new_pr_count' => $new_prs, 'exercises' => $result]);
