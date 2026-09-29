<?php
// GET  api/current_plan.php -> {"plan":{"id":1,"name":"...","level":"...","duration_weeks":"6-8","days_per_week":5},"week":3}
//                              or {"plan":null,"week":null} when the user hasn't picked one yet
// POST api/current_plan.php {"plan_id":2} -> same shape, for the newly selected plan
//
// The logged-in user's current workout plan, used by the Select button in the workout plan
// library. Requires the gymrank_session cookie (401 without it). POST reuses auth.php's JSON-only
// and same-site checks. Every response is JSON, including errors.

require __DIR__ . '/auth.php';

set_exception_handler(function ($error) {
    error_log('current_plan.php: ' . $error->getMessage());
    respond(500, ['error' => 'Database error']);
});

function session_user_id($db) {
    if (empty($_COOKIE['gymrank_session'])) respond(401, ['error' => 'Please log in.']);
    $hash = hash('sha256', $_COOKIE['gymrank_session']);
    $stmt = $db->prepare('SELECT user_id FROM auth_sessions WHERE token_hash = ? AND expires_at > UTC_TIMESTAMP()');
    $stmt->bind_param('s', $hash);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    if (!$row) respond(401, ['error' => 'Please log in.']);
    return (int) $row['user_id'];
}

function current_plan($db, $user_id) {
    // Week 1 is the first seven days after selecting the plan.
    $stmt = $db->prepare(
        'SELECT p.id, p.name, p.level, p.duration_weeks, p.days_per_week,
                FLOOR(TIMESTAMPDIFF(DAY, up.started_at, CURRENT_TIMESTAMP) / 7) + 1 AS week
         FROM user_plans up JOIN workout_plans p ON p.id = up.plan_id
         WHERE up.user_id = ?'
    );
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $plan = $stmt->get_result()->fetch_assoc();
    if (!$plan) return ['plan' => null, 'week' => null];
    $week = (int) $plan['week'];
    unset($plan['week']);
    $plan['id'] = (int) $plan['id'];
    $plan['days_per_week'] = (int) $plan['days_per_week'];
    return ['plan' => $plan, 'week' => $week];
}

$method = $_SERVER['REQUEST_METHOD'] ?? '';
if ($method !== 'GET' && $method !== 'POST') {
    header('Allow: GET, POST');
    respond(405, ['error' => 'Method not allowed']);
}

if ($method === 'GET') {
    $db = database();
    respond(200, current_plan($db, session_user_id($db)));
}

$data = input();
$plan_id = $data['plan_id'] ?? null;
if (!is_int($plan_id)) respond(400, ['error' => 'Invalid plan id']);

$db = database();
$user_id = session_user_id($db);

$stmt = $db->prepare('SELECT id FROM workout_plans WHERE id = ?');
$stmt->bind_param('i', $plan_id);
$stmt->execute();
if (!$stmt->get_result()->fetch_assoc()) respond(404, ['error' => 'Plan not found']);

// Re-selecting the current plan keeps its start date; a different plan starts over at week 1.
$stmt = $db->prepare(
    'INSERT INTO user_plans (user_id, plan_id) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE
       started_at = IF(plan_id = VALUES(plan_id), started_at, CURRENT_TIMESTAMP),
       plan_id = VALUES(plan_id)'
);
$stmt->bind_param('ii', $user_id, $plan_id);
$stmt->execute();

respond(200, current_plan($db, $user_id));
