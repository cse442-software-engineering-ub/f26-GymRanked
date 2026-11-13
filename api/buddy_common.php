<?php
// Helpers shared by the workout buddies endpoints (story #78, card #71): buddy_group.php, buddy_join.php and
// buddy_encourage.php. Not an endpoint itself.
//
// A group is private: it is joined with an 8-character invite code (no email), and only its members see its member
// list. Everyone is shown as first name and last initial ("Olivia G."); no email or user id leaves the server (the
// member_id in the responses is the id of the membership). Times are UTC, written by the server.
//
// Every endpoint answers with the same "group view" (see buddy_view), JSON errors, and the status codes of the other
// workout endpoints: 400 bad input, 401 not logged in, 404 not found, 409 conflict, 500 {"error":"Database error"}.

require __DIR__ . '/workout_common.php';

const BUDDY_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I or O, no 0 or 1
const BUDDY_CODE_PATTERN = '/\A[A-HJ-NP-Z2-9]{8}\z/'; // \z, not $, so "7KQ2MXP9\n" is refused
const BUDDY_CODE_DAYS = 7;
const BUDDY_NAME_MAX = 40;
const BUDDY_MESSAGE_MAX = 140;
const BUDDY_INBOX_LIMIT = 20;
const BUDDY_ALREADY = 'You are already in a workout buddies group.';

// "Ana Cole" -> "Ana C.", "Sean O'Brien" -> "Sean O."; a one-word name stays as it is. The same shortening as
// api/leaderboard.php (that file is an endpoint, so the four lines are repeated here rather than required).
function buddy_short_name($full_name) {
    $parts = preg_split('/\s+/u', trim($full_name));
    if (count($parts) < 2) return $parts[0];
    return $parts[0] . ' ' . mb_strtoupper(mb_substr($parts[count($parts) - 1], 0, 1)) . '.';
}

// A fresh invite code such as "7KQ2MXP9".
function buddy_new_code() {
    $code = '';
    for ($i = 0; $i < 8; $i++) $code .= BUDDY_CODE_CHARS[random_int(0, strlen(BUDDY_CODE_CHARS) - 1)];
    return $code;
}

// The caller's membership (member_id, group_id, group name, owner, invite code and expiry), or null when in no group.
function buddy_membership($db, $user_id) {
    $stmt = $db->prepare(
        'SELECT m.id AS member_id, m.group_id, g.name, g.owner_id, g.invite_code, g.invite_expires_at
         FROM buddy_members m JOIN buddy_groups g ON g.id = m.group_id WHERE m.user_id = ?'
    );
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    return $stmt->get_result()->fetch_assoc();
}

// Locking the user's row (inside a transaction) makes two creates or joins by the same person at once take turns, so
// the second one sees the first's membership and gets the 409. (Locking the empty membership row instead can deadlock.)
function buddy_lock_user($db, $user_id) {
    $stmt = $db->prepare('SELECT id FROM users WHERE id = ? FOR UPDATE');
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $stmt->get_result();
}

// True when a duplicate-key error (1062) was raised for the unique key with this name. MySQL names the key as
// 'invite_code' or 'buddy_groups.invite_code' depending on its version, so only the end of the name is compared.
function buddy_duplicate($error, $key) {
    return $error->getCode() === 1062 && str_contains($error->getMessage(), $key . "'");
}

// The group view every endpoint returns:
//   {"group":{"name","member_count","invite_code","invite_expires_at","members":[{"member_id","name","is_me","is_owner"}]},
//    "me":{"member_id","is_owner"},"encouragements":[{"id","from","message","sent_at"}]}
// Members are listed owner first, then by when they joined. invite_code and invite_expires_at are filled in for the
// owner only. encouragements are the last 20 sent to the caller, newest first. A caller in no group gets
// {"group":null,"me":null,"encouragements":[]} (not an error).
function buddy_view($db, $user_id) {
    $mine = buddy_membership($db, $user_id);
    if (!$mine) return ['group' => null, 'me' => null, 'encouragements' => []];
    $owner_id = (int) $mine['owner_id'];

    $stmt = $db->prepare(
        'SELECT m.id, m.user_id, u.full_name FROM buddy_members m JOIN users u ON u.id = m.user_id
         WHERE m.group_id = ? ORDER BY (m.user_id = ?) DESC, m.joined_at, m.id'
    );
    $stmt->bind_param('ii', $mine['group_id'], $owner_id);
    $stmt->execute();
    $members = [];
    foreach ($stmt->get_result() as $row) {
        $members[] = [
            'member_id' => (int) $row['id'],
            'name' => buddy_short_name($row['full_name']),
            'is_me' => (int) $row['user_id'] === $user_id,
            'is_owner' => (int) $row['user_id'] === $owner_id,
        ];
    }

    $stmt = $db->prepare(
        'SELECT e.id, e.message, e.created_at, u.full_name FROM buddy_encouragements e JOIN users u ON u.id = e.sender_id
         WHERE e.recipient_id = ? AND e.group_id = ? ORDER BY e.id DESC LIMIT ' . BUDDY_INBOX_LIMIT
    );
    $stmt->bind_param('ii', $user_id, $mine['group_id']);
    $stmt->execute();
    $encouragements = [];
    foreach ($stmt->get_result() as $row) {
        $encouragements[] = [
            'id' => (int) $row['id'],
            'from' => buddy_short_name($row['full_name']),
            'message' => $row['message'],
            'sent_at' => iso_time($row['created_at']),
        ];
    }

    $is_owner = $owner_id === $user_id;
    return [
        'group' => [
            'name' => $mine['name'],
            'member_count' => count($members),
            'invite_code' => $is_owner ? $mine['invite_code'] : null,
            'invite_expires_at' => $is_owner ? iso_time($mine['invite_expires_at']) : null,
            'members' => $members,
        ],
        'me' => ['member_id' => (int) $mine['member_id'], 'is_owner' => $is_owner],
        'encouragements' => $encouragements,
    ];
}
