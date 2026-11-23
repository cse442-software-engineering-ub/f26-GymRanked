<?php
// GET api/buddy_sent.php
//   -> 200 {"sent":[{"id":5,"to":"Ben C.","message":"Great session today, keep it up!","sent_at":"2026-11-23T15:04:05Z"}]}
//
// The encouragements the logged-in user has sent (story "sent encouragements"), newest first, at most 50. Each one has
// who it went to (first name and last initial, like the rest of Buddies), the message as plain text (the page must show
// it as text, never as HTML) and when it was sent (UTC). The sender always comes from the gymrank_session cookie, so
// there is no way to ask for someone else's sent messages; nobody else's messages are ever in the list. Messages sent
// in an earlier group stay in the list after leaving it, unless that group was deleted (api/buddy_leave.php). Someone
// who has sent nothing gets {"sent":[]}.
//
// 401 not logged in, 405 with Allow: GET, 500 {"error":"Database error"}.

require __DIR__ . '/buddy_common.php';

const BUDDY_SENT_LIMIT = 50;

require_method('GET');
$db = database();
$user_id = workout_user_id($db);

$stmt = $db->prepare(
    'SELECT e.id, e.message, e.created_at, u.full_name FROM buddy_encouragements e JOIN users u ON u.id = e.recipient_id
     WHERE e.sender_id = ? ORDER BY e.id DESC LIMIT ' . BUDDY_SENT_LIMIT
);
$stmt->bind_param('i', $user_id);
$stmt->execute();
$sent = [];
foreach ($stmt->get_result() as $row) {
    $sent[] = [
        'id' => (int) $row['id'],
        'to' => buddy_short_name($row['full_name']),
        'message' => $row['message'],
        'sent_at' => iso_time($row['created_at']),
    ];
}

respond(200, ['sent' => $sent]);
