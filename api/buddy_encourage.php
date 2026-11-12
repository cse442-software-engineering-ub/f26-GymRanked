<?php
// POST api/buddy_encourage.php {"member_id":12,"message":"Great session today, keep it up!"}
//   -> 201 {"encouragement":{"id":5,"to":"Ben C.","message":"Great session today, keep it up!","sent_at":"2026-11-13T15:04:05Z"}}
//
// Sends an encouragement (story #78, card #71) from the caller to another member of the caller's own group. member_id
// is a member_id from the group view (api/buddy_common.php). The message is trimmed and must be 1 to 140 characters
// (characters, not bytes); it is stored and returned as plain text, so the page must show it as text, never as HTML.
// Only the person it is sent to sees it (in the "encouragements" of their group view); the sender only gets the 201.
//
// Checked in this order: 400 {"error":"Invalid request.","errors":{...}} with errors.member_id "Choose a member of
// your group." (missing or not a whole number) and errors.message "Write a message of 1 to 140 characters."; 404
// {"error":"Group not found."} when the caller is in no group; 404 {"error":"Member not found."} when member_id is not
// a member of the caller's group (the same answer for a member of another group and an id that does not exist);
// 400 with errors.member_id "You can't encourage yourself." Also 400 {"error":"Send a valid JSON object."}, 401 not
// logged in, 405 with Allow: POST, 415/413/403 as the other POST endpoints, 500 {"error":"Database error"}.

require __DIR__ . '/buddy_common.php';

$data = input();
$db = database();
$user_id = workout_user_id($db);

// Checked before anything is written.
$errors = [];
$member_id = $data['member_id'] ?? null;
if (!is_int($member_id) || $member_id < 1) $errors['member_id'] = 'Choose a member of your group.';
$message = is_string($data['message'] ?? null) ? trim($data['message']) : '';
if (mb_strlen($message) < 1 || mb_strlen($message) > BUDDY_MESSAGE_MAX) $errors['message'] = 'Write a message of 1 to 140 characters.';
if ($errors) respond(400, ['error' => 'Invalid request.', 'errors' => $errors]);

$mine = buddy_membership($db, $user_id);
if (!$mine) respond(404, ['error' => 'Group not found.']);

$stmt = $db->prepare(
    'SELECT m.user_id, u.full_name FROM buddy_members m JOIN users u ON u.id = m.user_id WHERE m.id = ? AND m.group_id = ?'
);
$stmt->bind_param('ii', $member_id, $mine['group_id']);
$stmt->execute();
$to = $stmt->get_result()->fetch_assoc();
if (!$to) respond(404, ['error' => 'Member not found.']);
if ((int) $to['user_id'] === $user_id) {
    respond(400, ['error' => 'Invalid request.', 'errors' => ['member_id' => "You can't encourage yourself."]]);
}

$stmt = $db->prepare(
    'INSERT INTO buddy_encouragements (group_id, sender_id, recipient_id, message, created_at)
     VALUES (?, ?, ?, ?, UTC_TIMESTAMP())'
);
$recipient_id = (int) $to['user_id'];
$stmt->bind_param('iiis', $mine['group_id'], $user_id, $recipient_id, $message);
$stmt->execute();
$id = $db->insert_id;

$stmt = $db->prepare('SELECT created_at FROM buddy_encouragements WHERE id = ?');
$stmt->bind_param('i', $id);
$stmt->execute();
$sent = $stmt->get_result()->fetch_assoc();

respond(201, ['encouragement' => [
    'id' => $id,
    'to' => buddy_short_name($to['full_name']),
    'message' => $message,
    'sent_at' => iso_time($sent['created_at']),
]]);
