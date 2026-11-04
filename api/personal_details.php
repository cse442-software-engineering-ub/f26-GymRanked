<?php
// GET  api/personal_details.php -> 200 {"bodyweight_lb": 180.5 | null, "gender": "woman" | "man" | "nonbinary" | "prefer_not_to_say" | null,
//                                       "complete": true | false}
// POST api/personal_details.php {"bodyweight_lb":180.5,"gender":"nonbinary"} -> 200, same shape as GET, for what was saved
//
// The signed-in account's body weight (pounds) and gender, entered on the Personal details onboarding page (story #116)
// and used for leaderboard scores (story #10). Stored in user_profile (database/migrations/012_user_profile.sql).
// complete is true only when both are saved. An account that never saved them (every account from before this feature)
// reads as null, null, false, and reading never creates a row.
//
// POST needs both fields; saving again replaces the old values. bodyweight_lb is a JSON number from 50 to 700 with at
// most 1 decimal (a string is refused). gender is one of the four values above; prefer_not_to_say counts as an answer.
// The user always comes from the gymrank_session cookie: a user_id (or anything else) in the body is ignored.
//
// Errors are JSON, with auth.php's wording: 400 {"error":"Invalid request.","errors":{"bodyweight_lb":"...","gender":"..."}}
// with one entry per bad field (or {"error":"Send a valid JSON object."} for a body that is not JSON),
// 401 {"error":"Please log in."}, 405 {"error":"Method not allowed."} with Allow: GET, POST, 415 {"error":"Send application/json."},
// 500 {"error":"Database error"}.

require __DIR__ . '/auth.php';

const GENDERS = ['woman', 'man', 'nonbinary', 'prefer_not_to_say'];
const BODYWEIGHT_MIN_LB = 50;
const BODYWEIGHT_MAX_LB = 700;

set_exception_handler(function ($error) {
    error_log('personal_details.php: ' . $error->getMessage());
    respond(500, ['error' => 'Database error']);
});

function details_user_id($db) {
    $token = $_COOKIE['gymrank_session'] ?? '';
    if (!is_string($token) || $token === '') respond(401, ['error' => 'Please log in.']);
    $hash = hash('sha256', $token);
    $stmt = $db->prepare('SELECT user_id FROM auth_sessions WHERE token_hash = ? AND expires_at > UTC_TIMESTAMP()');
    $stmt->bind_param('s', $hash);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    if (!$row) respond(401, ['error' => 'Please log in.']);
    return (int) $row['user_id'];
}

// The saved details for a user, as the JSON body both GET and POST return. Whole numbers are written as 175, not 175.0.
function saved_details($db, $user_id) {
    $stmt = $db->prepare('SELECT bodyweight_lb, gender FROM user_profile WHERE user_id = ?');
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $weight = $row && $row['bodyweight_lb'] !== null ? (float) $row['bodyweight_lb'] : null;
    if ($weight !== null && $weight == floor($weight)) $weight = (int) $weight;
    $gender = $row ? $row['gender'] : null;
    return ['bodyweight_lb' => $weight, 'gender' => $gender, 'complete' => $weight !== null && $gender !== null];
}

$method = $_SERVER['REQUEST_METHOD'] ?? '';
if ($method !== 'GET' && $method !== 'POST') {
    header('Allow: GET, POST');
    respond(405, ['error' => 'Method not allowed.']);
}

// No cookie at all: refuse without touching the database (like setup.php and theme.php).
if (empty($_COOKIE['gymrank_session'])) respond(401, ['error' => 'Please log in.']);

if ($method === 'GET') {
    $db = database();
    respond(200, saved_details($db, details_user_id($db)));
}

// POST: the body is checked before the session, so a bad request never writes anything.
$data = input();
$errors = [];

$weight = $data['bodyweight_lb'] ?? null;
// A JSON number only. "180" is refused, and so is anything with more than one decimal (180.55).
$weight_ok = (is_int($weight) || is_float($weight))
    && is_finite($weight)
    && $weight >= BODYWEIGHT_MIN_LB && $weight <= BODYWEIGHT_MAX_LB
    && abs($weight * 10 - round($weight * 10)) < 1e-6;
if (!$weight_ok) $errors['bodyweight_lb'] = 'Enter a body weight from ' . BODYWEIGHT_MIN_LB . ' to ' . BODYWEIGHT_MAX_LB . ' lb.';

$gender = $data['gender'] ?? null;
if (!is_string($gender) || !in_array($gender, GENDERS, true)) $errors['gender'] = 'Choose a gender.';

if ($errors) respond(400, ['error' => 'Invalid request.', 'errors' => $errors]);

$db = database();
$user_id = details_user_id($db);
// Sent as text so the DECIMAL column gets exactly one decimal, with no float rounding on the way.
$weight_text = number_format($weight, 1, '.', '');
$stmt = $db->prepare(
    'INSERT INTO user_profile (user_id, bodyweight_lb, gender) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE bodyweight_lb = VALUES(bodyweight_lb), gender = VALUES(gender)'
);
$stmt->bind_param('iss', $user_id, $weight_text, $gender);
$stmt->execute();
respond(200, saved_details($db, $user_id));
