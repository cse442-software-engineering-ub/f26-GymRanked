<?php
require __DIR__ . '/auth.php';
$data = input();
[$email, $password] = credentials($data, true);
$db = database();
throttle($db, 'register', $email);
$name = trim($data['full_name']);
$hash = password_hash($password, PASSWORD_DEFAULT);
try {
    $stmt = $db->prepare('INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)');
    $stmt->bind_param('sss', $name, $email, $hash);
    $stmt->execute();
} catch (mysqli_sql_exception $error) {
    if ($error->getCode() === 1062) respond(409, ['error' => 'This email is already registered.', 'errors' => ['email' => 'This email is already registered. Log in instead.']]);
    throw $error;
}
respond(201, ['message' => 'Account created. You can now log in.']);
