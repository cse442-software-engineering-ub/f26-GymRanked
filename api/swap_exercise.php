<?php
// POST api/swap_exercise.php {"session_id":7,"exercise":"Bench press","replacement":"Dumbbell press"}
//   -> 200 {"session": {...}} the session as api/workout_session.php sends it, with the replacement in the
//      exercise's place
//
// Switches one exercise of the logged-in user's unfinished workout for one of its alternatives (story #80, task #82,
// from the alternatives dialog). Only that session changes: the plan, other workouts and history stay the same, and
// the exercise keeps its position, so its page (#/workout/exercise/N) shows the replacement. The replacement must be
// one api/exercise_alternatives.php offers this user for the exercise (same rules, exercise_alternatives_common.php).
//
// Errors are JSON: 400 bad input, the exercise isn't in this workout, or the replacement isn't an alternative that
// fits the user's setup; 401 not logged in; 404 unknown session (or another user's) or an exercise with no
// alternatives; 405 not POST; 409 the workout is completed, the exercise already has saved sets, or the replacement
// is already in the workout; 500 {"error":"Database error"}.

require __DIR__ . '/workout_common.php';
require __DIR__ . '/exercise_alternatives_common.php';

require_method('POST');
$data = input();
$db = database();
$user_id = workout_user_id($db);

$session_id = positive_int($data['session_id'] ?? null);
if ($session_id === null) respond(400, ['error' => 'session_id must be a whole number.']);
$exercise = is_string($data['exercise'] ?? null) ? trim($data['exercise']) : '';
if ($exercise === '' || strlen($exercise) > 100) respond(400, ['error' => 'exercise is required (up to 100 characters).']);
$replacement = is_string($data['replacement'] ?? null) ? trim($data['replacement']) : '';
if ($replacement === '' || strlen($replacement) > 100) respond(400, ['error' => 'replacement is required (up to 100 characters).']);

// The row lock makes a switch, a set being saved and Complete take turns.
$db->begin_transaction();
$session = find_session($db, $session_id, $user_id, true);
if (!$session) respond(404, ['error' => 'Session not found']);
if ($session['completed_at'] !== null) respond(409, ['error' => 'Workout already completed']);

$names = exercise_names($session);
$position = array_search($exercise, $names, true);
if ($position === false) respond(400, ['error' => "That exercise isn't part of this workout."]);

$stmt = $db->prepare('SELECT COUNT(*) AS sets FROM workout_sets WHERE session_id = ? AND exercise = ?');
$stmt->bind_param('is', $session_id, $exercise);
$stmt->execute();
if ((int) $stmt->get_result()->fetch_assoc()['sets'] > 0) {
    respond(409, ['error' => "You've saved sets for $exercise, so it can't be switched in this workout."]);
}

$exercises = $db->query('SELECT name, movement, level, equipment FROM exercises')->fetch_all(MYSQLI_ASSOC);
$source = null;
foreach ($exercises as $candidate) {
    if (strtolower($candidate['name']) === strtolower($exercise)) $source = $candidate;
}
if ($source === null) respond(404, ['error' => 'No alternatives for this exercise.']);

$stmt = $db->prepare('SELECT experience FROM user_setup WHERE user_id = ?');
$stmt->bind_param('i', $user_id);
$stmt->execute();
$setup = $stmt->get_result()->fetch_assoc();

$stmt = $db->prepare('SELECT equipment FROM user_equipment WHERE user_id = ?');
$stmt->bind_param('i', $user_id);
$stmt->execute();
$owned = array_column($stmt->get_result()->fetch_all(MYSQLI_ASSOC), 'equipment');

$chosen = null;
foreach (pick_alternatives($source, $exercises, $setup['experience'] ?? null, $owned) as $alternative) {
    if (strtolower($alternative['name']) === strtolower($replacement)) $chosen = $alternative['name'];
}
if ($chosen === null) respond(400, ['error' => "$replacement isn't an alternative to $exercise that fits your setup."]);
foreach ($names as $name) {
    if (strtolower($name) === strtolower($chosen)) respond(409, ['error' => "$chosen is already in this workout."]);
}

$names[$position] = $chosen;
$names_json = json_encode($names);
$stmt = $db->prepare('UPDATE workout_sessions SET exercises = ? WHERE id = ?');
$stmt->bind_param('si', $names_json, $session_id);
$stmt->execute();
$session = find_session($db, $session_id, $user_id);
$db->commit();
respond(200, ['session' => session_json($db, $session)]);
