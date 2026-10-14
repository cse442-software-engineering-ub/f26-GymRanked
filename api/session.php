<?php
require __DIR__ . '/auth.php';
require_method('GET');
if (empty($_COOKIE['gymrank_session'])) respond(401, ['error' => 'Please log in.']);
$db = database();
$hash = hash('sha256', $_COOKIE['gymrank_session']);
$stmt = $db->prepare('SELECT users.id, users.full_name, users.email FROM auth_sessions JOIN users ON users.id = auth_sessions.user_id WHERE token_hash = ? AND expires_at > UTC_TIMESTAMP()');
$stmt->bind_param('s', $hash);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();
if (!$user) respond(401, ['error' => 'Please log in.']);
respond(200, ['user' => $user]);
