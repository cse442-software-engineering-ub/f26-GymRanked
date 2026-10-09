<?php
// GET api/plans.php -> [{"id":1,"name":"...","level":"beginner","duration_weeks":"8","days_per_week":3,
//                         "goals":["strength"],"required_equipment":["barbell"]}, ...]
//
// Public catalog of workout plans for the workout plan library screen; not tied to a
// logged-in user. One plan's details come from plan.php. Every response is JSON, including errors, so the frontend never gets
// an HTML error page.

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

if (!is_file(__DIR__ . '/config.php')) {
    error_log('plans.php: api/config.php is missing');
    respond(500, ['error' => 'Database error']);
}
require __DIR__ . '/config.php';

// Throw on database errors so the catch below turns them into a JSON 500.
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {
    $db = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    $db->set_charset('utf8mb4');

    $result = $db->query(
        'SELECT id, name, level, duration_weeks, days_per_week FROM workout_plans ORDER BY id'
    );

    // goals and required_equipment come from 008_plan_requirements.sql; [] when a plan has none.
    $goals = [];
    foreach ($db->query('SELECT plan_id, goal FROM workout_plan_goals ORDER BY goal')->fetch_all(MYSQLI_ASSOC) as $r) {
        $goals[(int) $r['plan_id']][] = $r['goal'];
    }
    $equipment = [];
    foreach ($db->query('SELECT plan_id, equipment FROM workout_plan_equipment ORDER BY equipment')->fetch_all(MYSQLI_ASSOC) as $r) {
        $equipment[(int) $r['plan_id']][] = $r['equipment'];
    }

    $plans = [];
    while ($row = $result->fetch_assoc()) {
        $row['id'] = (int) $row['id'];
        $row['days_per_week'] = (int) $row['days_per_week'];
        $row['goals'] = $goals[$row['id']] ?? [];
        $row['required_equipment'] = $equipment[$row['id']] ?? [];
        $plans[] = $row;
    }

    respond(200, $plans);
} catch (mysqli_sql_exception $e) {
    error_log('plans.php: ' . $e->getMessage());
    respond(500, ['error' => 'Database error']);
}
