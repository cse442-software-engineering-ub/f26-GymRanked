<?php
// POST api/workout_sets.php {"session_id":7,"exercise":"Bench press","set_number":1,"weight_lb":135,"reps":8}
//      -> 201 {"set":{"id":1,"exercise":"Bench press","set_number":1,"weight_lb":135,"reps":8,
//                     "logged_at":"2026-10-13T19:30:02Z","updated_at":"2026-10-13T19:30:02Z"}}
// POST api/workout_sets.php {"id":1,"weight_lb":137.25,"reps":8}   (correct a saved set)
//      -> 200 {"set": {...}} with a new updated_at; logged_at never changes
//
// Saves or corrects one set of the logged-in user's workout session. weight_lb is pounds, 0 to 1500 with at most
// 2 decimal places (0 = bodyweight); reps is a whole number from 1 to 100; set_number is 1 to 50 and unique per
// exercise in the session. The exercise must be one of the session's exercises (api/workout_session.php).
// Times come from the server; any time in the request is ignored.
//
// 400 bad input: errors.weight_lb / errors.reps hold one message per field, as in src/workoutLog/setValidation.js
// 401 not logged in, 404 unknown session or set (including another user's), 405 not POST,
// 409 the workout is already completed ("Workout already completed") or the set number is taken ("Set already logged").

require __DIR__ . '/workout_common.php';

$data = input();
$db = database();
$user_id = workout_user_id($db);

if (array_key_exists('id', $data)) {
    $set_id = positive_int($data['id']);
    if ($set_id === null) respond(400, ['error' => 'id must be a whole number.']);

    $stmt = $db->prepare(
        'SELECT st.session_id FROM workout_sets st JOIN workout_sessions s ON s.id = st.session_id WHERE st.id = ? AND s.user_id = ?'
    );
    $stmt->bind_param('ii', $set_id, $user_id);
    $stmt->execute();
    $owned = $stmt->get_result()->fetch_assoc();
    if (!$owned) respond(404, ['error' => 'Set not found']);

    $db->begin_transaction();
    $session = find_session($db, (int) $owned['session_id'], $user_id, true);
    if ($session['completed_at'] !== null) respond(409, ['error' => 'Workout already completed']);
    [$weight, $reps] = validated_set_values($data);

    $stmt = $db->prepare('UPDATE workout_sets SET weight_lb = ?, reps = ?, updated_at = UTC_TIMESTAMP() WHERE id = ?');
    $stmt->bind_param('sii', $weight, $reps, $set_id);
    $stmt->execute();
    $db->commit();
    respond(200, ['set' => find_set($db, $set_id)]);
}

$session_id = positive_int($data['session_id'] ?? null);
if ($session_id === null) respond(400, ['error' => 'session_id must be a whole number.']);
$exercise = is_string($data['exercise'] ?? null) ? trim($data['exercise']) : '';
if ($exercise === '' || strlen($exercise) > 100) respond(400, ['error' => 'exercise is required (up to 100 characters).']);
$set_number = $data['set_number'] ?? null;
if (!is_int($set_number) || $set_number < 1 || $set_number > SET_NUMBER_MAX) {
    respond(400, ['error' => 'set_number must be a whole number from 1 to ' . SET_NUMBER_MAX . '.']);
}

// The row lock makes saving a set and completing the workout take turns, so no set lands after Complete.
$db->begin_transaction();
$session = find_session($db, $session_id, $user_id, true);
if (!$session) respond(404, ['error' => 'Session not found']);
if ($session['completed_at'] !== null) respond(409, ['error' => 'Workout already completed']);
if (!in_array($exercise, exercise_names($session), true)) respond(400, ['error' => "That exercise isn't part of this workout."]);
[$weight, $reps] = validated_set_values($data);

try {
    $stmt = $db->prepare(
        'INSERT INTO workout_sets (session_id, exercise, set_number, weight_lb, reps, logged_at, updated_at)
         VALUES (?, ?, ?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())'
    );
    $stmt->bind_param('isisi', $session_id, $exercise, $set_number, $weight, $reps);
    $stmt->execute();
} catch (mysqli_sql_exception $error) {
    if ($error->getCode() !== 1062) throw $error;
    $db->rollback();
    respond(409, ['error' => 'Set already logged']);
}
$set_id = $db->insert_id;
$db->commit();
respond(201, ['set' => find_set($db, $set_id)]);
