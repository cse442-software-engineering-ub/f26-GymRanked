<?php
// POST api/buddy_join.php {"code":"7KQ2MXP9"} -> 200 the group view (api/buddy_common.php) after joining that group
//
// Joins the workout buddies group (story #78, card #71) whose invite code this is. Any logged-in user who is not in a
// group can join; the owner does not approve. There is no email: the owner reads the code on their own page and shares
// it. A code is 8 characters from A-H J-N P-Z 2-9 and works for 7 days; the server is strict (capital letters only).
//
// Checked in this order: 400 {"error":"Invalid request.","errors":{"code":"Enter the 8-character invite code."}} when
// the code is missing, not a string, or not 8 allowed characters; 409 {"error":"You are already in a workout buddies
// group."} when the caller is already in a group (before the code is looked up, so someone in a group learns nothing
// about codes); 404 {"error":"That invite code isn't valid or has expired."} when no group has the code or its 7 days
// are over (the same words for both, so nobody can tell which). Also 400 {"error":"Send a valid JSON object."},
// 401 not logged in, 405 with Allow: POST, 415/413/403 as the other POST endpoints, 500 {"error":"Database error"}.

require __DIR__ . '/buddy_common.php';

$data = input();
$db = database();
$user_id = workout_user_id($db);

// Checked before anything is written.
$code = $data['code'] ?? null;
if (!is_string($code) || !preg_match(BUDDY_CODE_PATTERN, $code)) {
    respond(400, ['error' => 'Invalid request.', 'errors' => ['code' => 'Enter the 8-character invite code.']]);
}

$db->begin_transaction();
try {
    buddy_lock_user($db, $user_id);
    if (buddy_membership($db, $user_id)) {
        $db->rollback();
        respond(409, ['error' => BUDDY_ALREADY]);
    }
    $stmt = $db->prepare('SELECT id FROM buddy_groups WHERE invite_code = ? AND invite_expires_at > UTC_TIMESTAMP()');
    $stmt->bind_param('s', $code);
    $stmt->execute();
    $group = $stmt->get_result()->fetch_assoc();
    if (!$group) {
        $db->rollback();
        respond(404, ['error' => "That invite code isn't valid or has expired."]);
    }
    $group_id = (int) $group['id'];
    $stmt = $db->prepare('INSERT INTO buddy_members (group_id, user_id, joined_at) VALUES (?, ?, UTC_TIMESTAMP())');
    $stmt->bind_param('ii', $group_id, $user_id);
    $stmt->execute();
    $db->commit();
} catch (mysqli_sql_exception $error) {
    // Two joins at the same time: the unique key on user_id lets one through.
    $db->rollback();
    if (buddy_duplicate($error, 'user_id')) respond(409, ['error' => BUDDY_ALREADY]);
    throw $error;
}

respond(200, buddy_view($db, $user_id));
