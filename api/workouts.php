<?php
require __DIR__ . '/config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$mysqli = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

if ($mysqli->connect_errno) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

$result = $mysqli->query('SELECT id, exercise, reps, weight FROM workouts');

$workouts = [];
while ($row = $result->fetch_assoc()) {
    $workouts[] = $row;
}

echo json_encode($workouts);

$mysqli->close();
