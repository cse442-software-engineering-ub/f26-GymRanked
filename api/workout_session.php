<?php
// POST api/workout_session.php {}                    -> 201 {"session": {...}} a new session for today's workout
//                                                       200 {"session": {...}} the user's current session, if there is one
// POST api/workout_session.php {"day_position": 2}   -> same, but starting that day of the plan (1, 2, 3...)
// GET  api/workout_session.php?id=7                  -> 200 {"session": {...}}
//
// session = {"id":7,"plan":"Push Pull Legs","name":"Push","focus":"Chest, shoulders, triceps",
//            "started_at":"2026-10-13T19:27:47Z","completed_at":null,
//            "exercises":[{"name":"Bench press","sets":[{"id":1,"set_number":1,"weight_lb":135,"reps":8,
//                                                        "logged_at":"...Z","updated_at":"...Z"}]}, ...],
//            "summary":null}
// summary is null until the workout is completed, then {"exercise_count":3,"set_count":4,"total_reps":36,
// "total_volume_lb":2553.5,"duration_seconds":2710}.
//
// The exercises come from the user's current plan (api/current_plan.php), in order, and are copied into the session
// when it starts. Without day_position the day is today's scheduled training day (same schedule as
// src/weeklySchedule.js, in America/New_York time, UB's time zone). The user's current session is their most recent
// one of the plan selected now started within the last 24 hours, finished or not: starting returns it instead of
// making a second one, so reopening an unfinished workout (or the completed one) is the same call. After the user
// switches plans, the earlier plan's session is left alone and starting makes a new one for the new plan.
//
// 400 day_position isn't a whole number / bad id, 401 not logged in, 404 unknown session (or another user's) or
// no such plan day, 405 wrong method, 409 no plan selected, rest day, or a day with no exercises.

require __DIR__ . '/workout_common.php';

// Training weekdays (0 = Monday) for a plan with N days per week; the rest are rest days. Keep in sync with
// TRAINING_WEEKDAYS in src/weeklySchedule.js.
const TRAINING_WEEKDAYS = [
    1 => [0], 2 => [0, 3], 3 => [0, 2, 4], 4 => [0, 1, 3, 4], 5 => [0, 1, 2, 3, 4], 6 => [0, 1, 2, 3, 4, 5], 7 => [0, 1, 2, 3, 4, 5, 6],
];

function plan_days($db, $plan_id) {
    $stmt = $db->prepare('SELECT position, name, focus, exercises FROM workout_plan_days WHERE plan_id = ? ORDER BY position');
    $stmt->bind_param('i', $plan_id);
    $stmt->execute();
    return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
}

$method = $_SERVER['REQUEST_METHOD'] ?? '';
if ($method !== 'GET' && $method !== 'POST') {
    header('Allow: GET, POST');
    respond(405, ['error' => 'Method not allowed.']);
}

if ($method === 'GET') {
    $db = database();
    $user_id = workout_user_id($db);
    $id = filter_var($_GET['id'] ?? '', FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    if ($id === false) respond(400, ['error' => 'Invalid session id.']);
    $session = find_session($db, $id, $user_id);
    if (!$session) respond(404, ['error' => 'Session not found']);
    respond(200, ['session' => session_json($db, $session)]);
}

$data = input();
$db = database();
$user_id = workout_user_id($db);

$day_position = $data['day_position'] ?? null;
if ($day_position !== null && !is_int($day_position)) respond(400, ['error' => 'day_position must be a whole number.']);

// Locking the user's row makes two starts at once (a double click, two tabs) take turns, so one session is made.
$db->begin_transaction();
$stmt = $db->prepare('SELECT id FROM users WHERE id = ? FOR UPDATE');
$stmt->bind_param('i', $user_id);
$stmt->execute();
$stmt->get_result();

$stmt = $db->prepare(
    'SELECT p.id, p.name, p.days_per_week FROM user_plans up JOIN workout_plans p ON p.id = up.plan_id WHERE up.user_id = ?'
);
$stmt->bind_param('i', $user_id);
$stmt->execute();
$plan = $stmt->get_result()->fetch_assoc();

$days = $plan ? plan_days($db, (int) $plan['id']) : [];
$day = null;
if ($day_position !== null) {
    if (!$plan) respond(409, ['error' => 'No workout plan selected']);
    foreach ($days as $candidate) {
        if ((int) $candidate['position'] === $day_position) $day = $candidate;
    }
    if (!$day) respond(404, ['error' => 'Plan day not found']);
}

// Only a session of the plan selected now counts, so switching plans starts the new plan's workout instead of
// reopening the old plan's day. (With no plan selected there is nothing to compare, so any recent session counts.)
$plan_id = $plan ? (int) $plan['id'] : 0;
$stmt = $db->prepare(
    'SELECT id FROM workout_sessions WHERE user_id = ? AND started_at > UTC_TIMESTAMP() - INTERVAL 24 HOUR
     AND (? = 0 OR plan_id = ?) ORDER BY started_at DESC, id DESC LIMIT 1'
);
$stmt->bind_param('iii', $user_id, $plan_id, $plan_id);
$stmt->execute();
$current = $stmt->get_result()->fetch_assoc();
if ($current) {
    $session = find_session($db, (int) $current['id'], $user_id);
    $db->commit();
    respond(200, ['session' => session_json($db, $session)]);
}

if (!$plan) respond(409, ['error' => 'No workout plan selected']);
if (!$day) {
    $today = new DateTimeImmutable('now', new DateTimeZone('America/New_York'));
    $slot = array_search((int) $today->format('N') - 1, TRAINING_WEEKDAYS[(int) $plan['days_per_week']] ?? TRAINING_WEEKDAYS[3], true);
    if ($slot === false || !$days) respond(409, ['error' => 'Rest day']);
    $day = $days[$slot % count($days)];
}

$exercises = json_decode($day['exercises'] ?? 'null', true);
$exercises = is_array($exercises) ? array_values(array_filter($exercises, 'is_string')) : [];
if (!$exercises) respond(409, ['error' => 'This plan day has no exercises']);

$exercises_json = json_encode($exercises);
$stmt = $db->prepare(
    'INSERT INTO workout_sessions (user_id, plan_id, plan_name, day_name, focus, exercises, started_at)
     VALUES (?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())'
);
$stmt->bind_param('iissss', $user_id, $plan_id, $plan['name'], $day['name'], $day['focus'], $exercises_json);
$stmt->execute();
$session = find_session($db, $db->insert_id, $user_id);
$db->commit();
respond(201, ['session' => session_json($db, $session)]);
