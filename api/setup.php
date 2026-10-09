<?php
// GET  api/setup.php -> {"experience": "beginner" | "intermediate" | "advanced" | null, "equipment": [...]}
// POST api/setup.php  body {"experience": "..."} and/or {"equipment": ["...", ...]}
//   -> saves whichever of the two is sent for the logged-in user and leaves the other as it was.
//      Responds with the full saved setup, same shape as GET.
//
// The logged-in user comes from the gymrank_session cookie set by api/login.php,
// checked against auth_sessions the same way api/session.php does (see AUTHENTICATION.md).
// Every response is JSON, including errors, so the frontend never gets an HTML error page.

declare(strict_types=1);

ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced'];

// Same order as the Figma chips and the ENUM in database/migrations/002_user_setup.sql.
const EQUIPMENT_OPTIONS = [
    'bodyweight', 'dumbbells', 'barbell', 'kettlebells',
    'resistance_bands', 'cable_machine', 'pullup_bar', 'full_gym',
];

function respond(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_SLASHES);
    exit;
}

// Returns the logged-in user's id, or null if the cookie is missing, unknown or expired.
function current_user_id(mysqli $db): ?int
{
    $token = $_COOKIE['gymrank_session'] ?? '';
    if (!is_string($token) || $token === '') {
        return null;
    }
    $hash = hash('sha256', $token);
    $stmt = $db->prepare('SELECT user_id FROM auth_sessions WHERE token_hash = ? AND expires_at > UTC_TIMESTAMP()');
    $stmt->bind_param('s', $hash);
    $stmt->execute();
    $stmt->bind_result($userId);
    $found = $stmt->fetch();
    $stmt->close();
    return $found ? (int) $userId : null;
}

// Only GET and POST are supported.
$method = $_SERVER['REQUEST_METHOD'] ?? '';
if ($method !== 'GET' && $method !== 'POST') {
    header('Allow: GET, POST');
    respond(405, ['error' => 'Method not allowed']);
}

// No cookie at all: reject without touching the database.
if (empty($_COOKIE['gymrank_session'])) {
    respond(401, ['error' => 'Not logged in']);
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

    $userId = current_user_id($db);
    if ($userId === null) {
        respond(401, ['error' => 'Not logged in']);
    }

    // Validate POST input before writing anything, so a bad request never saves anything.
    $saveExperience = false;
    $saveEquipment = false;
    $experience = null;
    $equipment = [];
    if ($method === 'POST') {
        // JSON only, like the team's auth endpoints (also blocks cross-site form posts).
        $contentType = strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0]));
        if ($contentType !== 'application/json') {
            respond(415, ['error' => 'Send application/json.']);
        }
        $data = json_decode((string) file_get_contents('php://input'), true);
        if (!is_array($data)) {
            respond(400, ['error' => 'Invalid JSON']);
        }

        // Each field is optional, but at least one must be sent. A key that is present must be valid,
        // so {"experience": null} is rejected rather than treated as "not sent".
        $saveExperience = array_key_exists('experience', $data);
        $saveEquipment = array_key_exists('equipment', $data);
        if (!$saveExperience && !$saveEquipment) {
            respond(400, ['error' => 'Nothing to save']);
        }

        if ($saveExperience) {
            $experience = $data['experience'];
            if (!is_string($experience) || !in_array($experience, EXPERIENCE_LEVELS, true)) {
                respond(400, ['error' => 'Invalid experience']);
            }
        }

        // Must be a non-empty JSON array of known options. "bodyweight" covers users with no equipment.
        if ($saveEquipment) {
            $equipment = $data['equipment'];
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
    }

    // Reads the saved setup; used by GET and to build the POST response.
    $readSetup = function () use ($db, $userId): array {
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

        return ['experience' => $found ? $savedExperience : null, 'equipment' => $savedEquipment];
    };

    if ($method === 'GET') {
        respond(200, $readSetup());
    }

    // POST: save only the fields that were sent.
    // The transaction means either everything saves or nothing does.
    $db->begin_transaction();

    if ($saveExperience) {
        $stmt = $db->prepare(
            'INSERT INTO user_setup (user_id, experience) VALUES (?, ?)
             ON DUPLICATE KEY UPDATE experience = ?'
        );
        $stmt->bind_param('iss', $userId, $experience, $experience);
        $stmt->execute();
        $stmt->close();
    }

    if ($saveEquipment) {
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
    }

    $db->commit();
    respond(200, $readSetup());
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
