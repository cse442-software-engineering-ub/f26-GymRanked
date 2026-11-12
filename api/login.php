<?php
require __DIR__ . '/auth.php';
$data = input();
[$email, $password] = credentials($data);
if (isset($data['remember']) && !is_bool($data['remember'])) respond(400, ['error' => 'Remember must be a boolean.']);
$db = database();
throttle($db, 'login', $email);
$stmt = $db->prepare('SELECT id, full_name, email, password_hash FROM users WHERE email = ?');
$stmt->bind_param('s', $email);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();
$dummy = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.';
$valid = password_verify($password, $user['password_hash'] ?? $dummy);
if (!$user || !$valid) respond(401, ['error' => 'Invalid email or password.']);
require_once __DIR__ . '/weekly123_fixtures.php';
$test = weekly123_marker($data, $email);
if ($test) {
    $db->begin_transaction();
    // The same user lock serializes reset, workout completion and weekly target writes.
    $stmt = $db->prepare('SELECT id FROM users WHERE id = ? FOR UPDATE');
    $stmt->bind_param('i', $user['id']); $stmt->execute(); $stmt->get_result();
    if (!weekly123_start($db, (int) $user['id'], $test[0], $test[1])) {
        $db->rollback();
        respond(409, ['error' => 'This test account is in use in another browser. Finish that test or try again later.']);
    }
}
clear_session($db);
$token = bin2hex(random_bytes(32));
$hash = hash('sha256', $token);
$remember = $data['remember'] ?? false;
$expiry = time() + ($remember ? 30 * 86400 : 8 * 3600);
$expires = gmdate('Y-m-d H:i:s', $expiry);
$stmt = $db->prepare('INSERT INTO auth_sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)');
$stmt->bind_param('sis', $hash, $user['id'], $expires);
$stmt->execute();
if ($test) $db->commit();
setcookie('gymrank_session', $token, cookie_options($remember ? $expiry : 0));
unset($user['password_hash']);
respond(200, ['user' => $user]);
