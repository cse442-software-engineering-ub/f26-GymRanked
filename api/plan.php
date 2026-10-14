<?php
// GET api/plan.php?id=1 -> {"id":1,"name":"...","level":"intermediate","duration_weeks":"6-8","days_per_week":5,
//                           "description":"...","required_equipment":["barbell"],
//                           "days":[{"name":"Push","focus":"...","duration_minutes":45,
//                                    "exercises":["Bench press", "Overhead press", "Triceps pushdown"]}, ...]}
//
// One plan from the public catalog, for the plan details screen and dashboard; not tied to a
// logged-in user. 400 for a missing or non-integer id, 404 for an unknown one.
// Every response is JSON, including errors, so the frontend never gets an HTML error page.

declare(strict_types=1);

ini_set('display_errors', '0');
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

function respond(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'] ?? '';
if ($method !== 'GET') {
    header('Allow: GET');
    respond(405, ['error' => 'Method not allowed']);
}

$id = filter_var($_GET['id'] ?? '', FILTER_VALIDATE_INT);
if ($id === false) {
    respond(400, ['error' => 'Invalid plan id']);
}

if (!is_file(__DIR__ . '/config.php')) {
    error_log('plan.php: api/config.php is missing');
    respond(500, ['error' => 'Database error']);
}
require __DIR__ . '/config.php';

// Throw on database errors so the catch below turns them into a JSON 500.
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {
    $db = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    $db->set_charset('utf8mb4');

    $stmt = $db->prepare(
        'SELECT id, name, level, duration_weeks, days_per_week, description FROM workout_plans WHERE id = ?'
    );
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $plan = $stmt->get_result()->fetch_assoc();
    if ($plan === null) {
        respond(404, ['error' => 'Plan not found']);
    }
    $plan['id'] = (int) $plan['id'];
    $plan['days_per_week'] = (int) $plan['days_per_week'];

    $stmt = $db->prepare('SELECT equipment FROM workout_plan_equipment WHERE plan_id = ? ORDER BY equipment');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $plan['required_equipment'] = array_column($stmt->get_result()->fetch_all(MYSQLI_ASSOC), 'equipment');

    $stmt = $db->prepare(
        'SELECT name, focus, duration_minutes, exercises FROM workout_plan_days WHERE plan_id = ? ORDER BY position'
    );
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $plan['days'] = [];
    foreach ($stmt->get_result()->fetch_all(MYSQLI_ASSOC) as $day) {
        $day['duration_minutes'] = (int) $day['duration_minutes'];
        $day['exercises'] = $day['exercises'] === null ? [] : json_decode($day['exercises'], true);
        $plan['days'][] = $day;
    }

    respond(200, $plan);
} catch (mysqli_sql_exception $e) {
    error_log('plan.php: ' . $e->getMessage());
    respond(500, ['error' => 'Database error']);
}
