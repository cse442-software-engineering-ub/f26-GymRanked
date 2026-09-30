<?php
// GET  api/preferences.php -> {"training_goal": "strength" | "fat_loss" | "aerobic" | null}
// POST api/preferences.php  body {"training_goal": "..."} -> saves it for the logged-in user
//
<<<<<<< HEAD
// The logged-in user comes from the gymrank_session cookie set by api/login.php,
// checked against auth_sessions the same way api/session.php does (see AUTHENTICATION.md).
=======
// The logged-in user comes from $_SESSION['user_id'], which the login endpoint sets.
>>>>>>> f16c30b729dfe6daa5f4ec57cd479a5967581a9f
// Every response is JSON, including errors, so the frontend never gets an HTML error page.

declare(strict_types=1);

ini_set('display_errors', '0');
<<<<<<< HEAD
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
=======
header('Content-Type: application/json');
>>>>>>> f16c30b729dfe6daa5f4ec57cd479a5967581a9f

const TRAINING_GOALS = ['strength', 'fat_loss', 'aerobic'];

function respond(int $status, array $body): void
{
    http_response_code($status);
<<<<<<< HEAD
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

=======
    echo json_encode($body);
    exit;
}

>>>>>>> f16c30b729dfe6daa5f4ec57cd479a5967581a9f
// Only GET and POST are supported.
$method = $_SERVER['REQUEST_METHOD'] ?? '';
if ($method !== 'GET' && $method !== 'POST') {
    header('Allow: GET, POST');
    respond(405, ['error' => 'Method not allowed']);
}

<<<<<<< HEAD
// No cookie at all: reject without touching the database.
if (empty($_COOKIE['gymrank_session'])) {
    respond(401, ['error' => 'Not logged in']);
}
=======
// Must be logged in.
session_start();
if (!isset($_SESSION['user_id'])) {
    respond(401, ['error' => 'Not logged in']);
}
$userId = (int) $_SESSION['user_id'];

// Validate POST input before touching the database.
$goal = null;
if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!is_array($data)) {
        respond(400, ['error' => 'Invalid JSON']);
    }
    $goal = $data['training_goal'] ?? null;
    if (!is_string($goal) || !in_array($goal, TRAINING_GOALS, true)) {
        respond(400, ['error' => 'Invalid training_goal']);
    }
}
>>>>>>> f16c30b729dfe6daa5f4ec57cd479a5967581a9f

if (!is_file(__DIR__ . '/config.php')) {
    error_log('preferences.php: api/config.php is missing');
    respond(500, ['error' => 'Database error']);
}
require __DIR__ . '/config.php';

// Throw on database errors so the catch below turns them into a JSON 500.
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {
<<<<<<< HEAD
    $db = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    $db->set_charset('utf8mb4');

    $userId = current_user_id($db);
    if ($userId === null) {
        respond(401, ['error' => 'Not logged in']);
    }

=======
    // Match these constant names to api/config.php and workouts.php.
    $db = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    $db->set_charset('utf8mb4');

>>>>>>> f16c30b729dfe6daa5f4ec57cd479a5967581a9f
    if ($method === 'GET') {
        $stmt = $db->prepare('SELECT training_goal FROM user_preferences WHERE user_id = ?');
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        $stmt->bind_result($savedGoal);
        $found = $stmt->fetch();
        respond(200, ['training_goal' => $found ? $savedGoal : null]);
    }

<<<<<<< HEAD
    // POST: JSON only, like the team's auth endpoints (also blocks cross-site form posts).
    $contentType = strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0]));
    if ($contentType !== 'application/json') {
        respond(415, ['error' => 'Send application/json.']);
    }
    $data = json_decode((string) file_get_contents('php://input'), true);
    if (!is_array($data)) {
        respond(400, ['error' => 'Invalid JSON']);
    }
    $goal = $data['training_goal'] ?? null;
    if (!is_string($goal) || !in_array($goal, TRAINING_GOALS, true)) {
        respond(400, ['error' => 'Invalid training_goal']);
    }

    // Insert the first goal, or replace the existing one (one row per user).
=======
    // POST: insert the first goal, or replace the existing one (one row per user).
>>>>>>> f16c30b729dfe6daa5f4ec57cd479a5967581a9f
    $stmt = $db->prepare(
        'INSERT INTO user_preferences (user_id, training_goal) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE training_goal = ?'
    );
    $stmt->bind_param('iss', $userId, $goal, $goal);
    $stmt->execute();
    respond(200, ['training_goal' => $goal]);
} catch (mysqli_sql_exception $e) {
    error_log('preferences.php: ' . $e->getMessage());
    respond(500, ['error' => 'Database error']);
}
