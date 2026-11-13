<?php
// Authenticated, test-server-only release. It never resets data or ends the GymRank login session.
require __DIR__ . '/workout_common.php';
require __DIR__ . '/weekly123_fixtures.php';
$data = input();
if (!weekly123_enabled()) respond(404, ['error' => 'Not found.']);
$client = $data['client_id'] ?? null;
$run = $data['run_id'] ?? null;
if (!is_string($client) || !is_string($run)) respond(400, ['error' => 'Invalid test run.']);
$db = database();
$user_id = workout_user_id($db);
$db->begin_transaction();
$stmt = $db->prepare('SELECT client_id, run_id FROM weekly123_test_runs WHERE user_id = ? FOR UPDATE');
$stmt->bind_param('i', $user_id); $stmt->execute();
$lease = $stmt->get_result()->fetch_assoc();
if (!$lease || !hash_equals($lease['client_id'], $client) || !hash_equals($lease['run_id'], $run)) {
    $db->rollback();
    respond(403, ['error' => 'This test run does not own the account.']);
}
$stmt = $db->prepare('DELETE FROM weekly123_test_runs WHERE client_id = ? AND run_id = ?');
$stmt->bind_param('ss', $client, $run); $stmt->execute();
$db->commit();
respond(200, ['finished' => true]);
