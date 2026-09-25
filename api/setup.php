<?php
// GET  api/setup.php -> {"experience": "beginner" | "intermediate" | "advanced" | null, "equipment": [...]}
// POST api/setup.php  body {"experience": "...", "equipment": ["...", ...]} -> saves both for the logged-in user
//
// The logged-in user comes from $_SESSION['user_id'], which the login endpoint sets.
// Every response is JSON, including errors, so the frontend never gets an HTML error page.

declare(strict_types=1);

ini_set('display_errors', '0');
header('Content-Type: application/json');

const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced'];

// Same order as the Figma chips and the ENUM in database/003_user_setup.sql.
const EQUIPMENT_OPTIONS = [
    'bodyweight', 'dumbbells', 'barbell', 'kettlebells',
    'resistance_bands', 'cable_machine', 'pullup_bar', 'full_gym',
];

function respond(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body);
    exit;
}

// Only GET and POST are supported.
$method = $_SERVER['REQUEST_METHOD'] ?? '';
if ($method !== 'GET' && $method !== 'POST') {
    header('Allow: GET, POST');
    respond(405, ['error' => 'Method not allowed']);
}

// Must be logged in.
session_start();
if (!isset($_SESSION['user_id'])) {
    respond(401, ['error' => 'Not logged in']);
}
$userId = (int) $_SESSION['user_id'];

// Validate POST input before touching the database, so a bad request never saves anything.
$experience = null;
$equipment = [];
if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!is_array($data)) {
        respond(400, ['error' => 'Invalid JSON']);
    }

    $experience = $data['experience'] ?? null;
    if (!is_string($experience) || !in_array($experience, EXPERIENCE_LEVELS, true)) {
        respond(400, ['error' => 'Invalid experience']);
    }

    // Must be a non-empty JSON array of known options. "bodyweight" covers users with no equipment.
    $equipment = $data['equipment'] ?? null;
    if (!is_array($equipment) || $equipment === [] || !array_is_list($equipment)) {
        respond(400, ['error' => 'Invalid equipment']);
    }
    foreach ($equipment as $item) {
        if (!is_string($item) || !in_array($item, EQUIPMENT_OPTIONS, true)) {
            respond(400, ['error' => 'Invalid equipment']);
        }
    }
    // Drop duplicates and put them in the standard order.
    $equipment = array_values(array_intersect(EQUIPMENT_OPTIONS, $equipment));
}

if (!is_file(__DIR__ . '/config.php')) {
    error_log('setup.php: api/config.php is missing');
    respond(500, ['error' => 'Database error']);
}
require __DIR__ . '/config.php';

// Throw on database errors so the catch below turns them into a JSON 500.
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

$db = null;
try {
    $db = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    $db->set_charset('utf8mb4');

    if ($method === 'GET') {
        $stmt = $db->prepare('SELECT experience FROM user_setup WHERE user_id = ?');
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        $stmt->bind_result($savedExperience);
        $found = $stmt->fetch();
        $stmt->close();

        $stmt = $db->prepare('SELECT equipment FROM user_equipment WHERE user_id = ? ORDER BY equipment');
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        $stmt->bind_result($item);
        $savedEquipment = [];
        while ($stmt->fetch()) {
            $savedEquipment[] = $item;
        }
        $stmt->close();

        respond(200, [
            'experience' => $found ? $savedExperience : null,
            'equipment' => $savedEquipment,
        ]);
    }

    // POST: save experience and replace the equipment list together.
    // The transaction means either everything saves or nothing does.
    $db->begin_transaction();

    $stmt = $db->prepare(
        'INSERT INTO user_setup (user_id, experience) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE experience = ?'
    );
    $stmt->bind_param('iss', $userId, $experience, $experience);
    $stmt->execute();
    $stmt->close();

    $stmt = $db->prepare('DELETE FROM user_equipment WHERE user_id = ?');
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $stmt->close();

    $stmt = $db->prepare('INSERT INTO user_equipment (user_id, equipment) VALUES (?, ?)');
    foreach ($equipment as $item) {
        $stmt->bind_param('is', $userId, $item);
        $stmt->execute();
    }
    $stmt->close();

    $db->commit();
    respond(200, ['experience' => $experience, 'equipment' => $equipment]);
} catch (mysqli_sql_exception $e) {
    if ($db instanceof mysqli) {
        try {
            $db->rollback();
        } catch (mysqli_sql_exception) {
            // Connection is already gone; nothing to roll back.
        }
    }
    error_log('setup.php: ' . $e->getMessage());
    respond(500, ['error' => 'Database error']);
}
