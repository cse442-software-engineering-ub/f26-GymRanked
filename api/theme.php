<?php
// GET  api/theme.php                    -> 200 {"theme": "dark" | "light"}   ("dark" when the account never chose)
// POST api/theme.php {"theme":"light"}  -> 200 {"theme": "light"}           saves it for the signed-in account
//
// The signed-in account's colour theme (Implement Persistent User Theme Preference). Stored in user_theme
// (database/migrations/010_user_theme.sql); reading never creates a row. The frontend side is src/theme/theme.js.
//
// Errors are JSON, with auth.php's wording: 400 {"error":"Invalid theme"} or {"error":"Send a valid JSON object."},
// 401 {"error":"Please log in."}, 405 {"error":"Method not allowed."}, 415 {"error":"Send application/json."},
// 500 {"error":"Database error"}.

require __DIR__ . '/auth.php';

const THEMES = ['dark', 'light'];

set_exception_handler(function ($error) {
    error_log('theme.php: ' . $error->getMessage());
    respond(500, ['error' => 'Database error']);
});

function theme_user_id($db) {
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

$method = $_SERVER['REQUEST_METHOD'] ?? '';
if ($method !== 'GET' && $method !== 'POST') {
    header('Allow: GET, POST');
    respond(405, ['error' => 'Method not allowed.']);
}

// No cookie at all: refuse without touching the database (like setup.php and preferences.php).
if (empty($_COOKIE['gymrank_session'])) respond(401, ['error' => 'Please log in.']);

if ($method === 'GET') {
    $db = database();
    $user_id = theme_user_id($db);
    $stmt = $db->prepare('SELECT theme FROM user_theme WHERE user_id = ?');
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    respond(200, ['theme' => $row ? $row['theme'] : 'dark']);
}

// POST: the body is checked before the session, so a bad request never writes anything.
$data = input();
$theme = $data['theme'] ?? null;
// Exact lower-case values only: "LIGHT", "", null and numbers are all refused.
if (!is_string($theme) || !in_array($theme, THEMES, true)) respond(400, ['error' => 'Invalid theme']);

$db = database();
$user_id = theme_user_id($db);
$stmt = $db->prepare(
    'INSERT INTO user_theme (user_id, theme) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE theme = VALUES(theme)'
);
$stmt->bind_param('is', $user_id, $theme);
$stmt->execute();
respond(200, ['theme' => $theme]);
