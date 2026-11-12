<?php
// GET  api/buddy_group.php                                       -> 200 the group view of the logged-in user
// POST api/buddy_group.php {"create":true,"name":"Morning Lifters"} -> 201 the group view, the caller is its owner
//
// Workout buddies (story #78, card #71). The group view (buddy_common.php) is
//   {"group":{"name":"Morning Lifters","member_count":3,"invite_code":null,"invite_expires_at":null,
//             "members":[{"member_id":11,"name":"Olivia G.","is_me":false,"is_owner":true}, ...]},
//    "me":{"member_id":15,"is_owner":false},
//    "encouragements":[{"id":4,"from":"Olivia G.","message":"Nice work on leg day!","sent_at":"2026-11-13T15:00:00Z"}]}
// A caller in no group gets {"group":null,"me":null,"encouragements":[]} with status 200. Only the owner sees
// invite_code (8 characters, valid for 7 days) and invite_expires_at; everyone else gets null. The user always comes
// from the gymrank_session cookie, so there is no way to ask about another user or group.
//
// Creating: name is trimmed and must be 1 to 40 characters. One group per person, so a caller already in a group gets
// 409 {"error":"You are already in a workout buddies group."}. Members join with api/buddy_join.php.
//
// 400 {"error":"Invalid request.","errors":{"create":"Use true.","name":"Name your group in 1 to 40 characters."}},
// 400 {"error":"Send a valid JSON object."}, 401 not logged in, 405 with Allow: GET, POST, 415/413/403 as the other
// POST endpoints, 500 {"error":"Database error"}.

require __DIR__ . '/buddy_common.php';

$method = $_SERVER['REQUEST_METHOD'] ?? '';
if ($method !== 'GET' && $method !== 'POST') {
    header('Allow: GET, POST');
    respond(405, ['error' => 'Method not allowed.']);
}

if ($method === 'GET') {
    $db = database();
    respond(200, buddy_view($db, workout_user_id($db)));
}

$data = input();
$db = database();
$user_id = workout_user_id($db);

// Checked before anything is written.
$errors = [];
if (($data['create'] ?? null) !== true) $errors['create'] = 'Use true.';
$name = is_string($data['name'] ?? null) ? trim($data['name']) : '';
if (mb_strlen($name) < 1 || mb_strlen($name) > BUDDY_NAME_MAX) $errors['name'] = 'Name your group in 1 to 40 characters.';
if ($errors) respond(400, ['error' => 'Invalid request.', 'errors' => $errors]);

$db->begin_transaction();
try {
    buddy_lock_user($db, $user_id);
    if (buddy_membership($db, $user_id)) {
        $db->rollback();
        respond(409, ['error' => BUDDY_ALREADY]);
    }
    // A code another group already has is refused by its unique key, so try again with a new one.
    $group_id = 0;
    for ($try = 0; $try < 5 && !$group_id; $try++) {
        try {
            $code = buddy_new_code();
            $days = BUDDY_CODE_DAYS;
            $stmt = $db->prepare(
                'INSERT INTO buddy_groups (name, owner_id, invite_code, invite_expires_at, created_at)
                 VALUES (?, ?, ?, UTC_TIMESTAMP() + INTERVAL ? DAY, UTC_TIMESTAMP())'
            );
            $stmt->bind_param('sisi', $name, $user_id, $code, $days);
            $stmt->execute();
            $group_id = $db->insert_id;
        } catch (mysqli_sql_exception $error) {
            if (!buddy_duplicate($error, 'invite_code')) throw $error;
        }
    }
    if (!$group_id) throw new RuntimeException('No free invite code.');
    $stmt = $db->prepare('INSERT INTO buddy_members (group_id, user_id, joined_at) VALUES (?, ?, UTC_TIMESTAMP())');
    $stmt->bind_param('ii', $group_id, $user_id);
    $stmt->execute();
    $db->commit();
} catch (mysqli_sql_exception $error) {
    // Two creates at the same time: the unique key on user_id lets one through, and its group is rolled back here.
    $db->rollback();
    if (buddy_duplicate($error, 'user_id')) respond(409, ['error' => BUDDY_ALREADY]);
    throw $error;
}

respond(201, buddy_view($db, $user_id));
