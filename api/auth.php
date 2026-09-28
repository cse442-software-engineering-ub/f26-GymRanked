<?php
// Shared authentication helpers. No credentials or exception details go to clients.
ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function respond($status, $body) {
    http_response_code($status);
    echo json_encode($body);
    exit;
}

set_exception_handler(function ($error) {
    respond(503, ['error' => 'Authentication is temporarily unavailable. Please try again.']);
});

function database() {
    require __DIR__ . '/config.php';
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $db = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    $db->set_charset('utf8mb4');
    return $db;
}

function require_method($method) {
    if ($_SERVER['REQUEST_METHOD'] !== $method) {
        header('Allow: ' . $method);
        respond(405, ['error' => 'Method not allowed.']);
    }
}

function input() {
    require_method('POST');
    // JSON-only plus no CORS opt-in prevents cross-origin form submissions.
    if (strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0])) !== 'application/json') {
        respond(415, ['error' => 'Send application/json.']);
    }
    if (($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '') === 'cross-site') {
        respond(403, ['error' => 'Cross-site requests are not allowed.']);
    }
    $raw = file_get_contents('php://input', false, null, 0, 8193);
    if (strlen($raw) > 8192) respond(413, ['error' => 'Request too large.']);
    $data = json_decode($raw);
    if (!is_object($data)) respond(400, ['error' => 'Send a valid JSON object.']);
    return (array) $data;
}

function credentials($data, $registration = false) {
    $email = is_string($data['email'] ?? null) ? strtolower(trim($data['email'])) : '';
    $password = is_string($data['password'] ?? null) ? $data['password'] : '';
    $errors = [];
    if (!$email || strlen($email) > 254 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'Enter a valid email address.';
    }
    if ($password === '') $errors['password'] = 'Enter your password.';
    if (strlen($password) > 72 || str_contains($password, "\0")) {
        $errors['password'] = 'Use a password of at most 72 bytes without null characters.';
    }
    if ($registration && (strlen($password) < 12 || !preg_match('/[a-zA-Z]/', $password) || !preg_match('/[0-9]/', $password) || !preg_match('/[^a-zA-Z0-9]/', $password))) {
        $errors['password'] = 'Use 12+ characters with letters, numbers & symbols.';
    }
    if ($registration) {
        $name = is_string($data['full_name'] ?? null) ? trim($data['full_name']) : '';
        if ($name === '' || strlen($name) > 100) $errors['full_name'] = 'Enter your full name (up to 100 bytes).';
        if (!is_string($data['confirm_password'] ?? null) || $data['confirm_password'] !== $password) {
            $errors['confirm_password'] = 'Passwords must match.';
        }
    }
    if ($errors) respond(400, ['error' => 'Please check the highlighted fields.', 'errors' => $errors]);
    return [$email, $password];
}

function throttle($db, $action, $email) {
    // Both IP and email limits persist across requests and new cookie jars.
    foreach ([['ip:' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'), 50], ['email:' . $email, 10]] as [$identity, $limit]) {
        $key = hash('sha256', $action . ':' . $identity);
        $stmt = $db->prepare('INSERT INTO auth_attempts (attempt_key, attempts, window_start) VALUES (?, 1, UTC_TIMESTAMP()) ON DUPLICATE KEY UPDATE attempts = IF(window_start < UTC_TIMESTAMP() - INTERVAL 15 MINUTE, 1, attempts + 1), window_start = IF(window_start < UTC_TIMESTAMP() - INTERVAL 15 MINUTE, UTC_TIMESTAMP(), window_start)');
        $stmt->bind_param('s', $key);
        $stmt->execute();
        $stmt = $db->prepare('SELECT attempts FROM auth_attempts WHERE attempt_key = ?');
        $stmt->bind_param('s', $key);
        $stmt->execute();
        if ($stmt->get_result()->fetch_assoc()['attempts'] > $limit) {
            header('Retry-After: 900');
            respond(429, ['error' => 'Too many attempts. Please try again in 15 minutes.']);
        }
    }
}

function cookie_options($expires = 0) {
    return ['expires' => $expires, 'path' => '/', 'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off', 'httponly' => true, 'samesite' => 'Lax'];
}

function clear_session($db) {
    $hash = hash('sha256', $_COOKIE['gymrank_session'] ?? '');
    $stmt = $db->prepare('DELETE FROM auth_sessions WHERE token_hash = ?');
    $stmt->bind_param('s', $hash);
    $stmt->execute();
}
