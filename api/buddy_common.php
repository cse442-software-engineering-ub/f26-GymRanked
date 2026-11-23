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
const BUDDY_NAME_MAX = 40;
const BUDDY_MESSAGE_MAX = 140;
const BUDDY_INBOX_LIMIT = 20;
const BUDDY_ALREADY = 'You are already in a workout buddies group.';
// One encouragement a day from each member to each other member (card #147). A day is an America/New_York calendar
// day, the same boundary as the weekly goal and progress pages.
const BUDDY_DAY_ZONE = 'America/New_York';

// Today's date in BUDDY_DAY_ZONE, as stored in buddy_encouragements.sent_on: "2026-11-23".
function buddy_today() {
    return (new DateTimeImmutable('now', new DateTimeZone(BUDDY_DAY_ZONE)))->format('Y-m-d');
}

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

// The caller's membership (member_id, group_id, group name, owner and invite code), or null when in no group.
function buddy_membership($db, $user_id) {
    $stmt = $db->prepare(
        'SELECT m.id AS member_id, m.group_id, g.name, g.owner_id, g.invite_code
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
//   {"group":{"name","member_count","invite_code",
//             "members":[{"member_id","name","is_me","is_owner","encouraged_today"}]},
//    "me":{"member_id","is_owner"},"encouragements":[{"id","from","message","sent_at"}]}
// Members are listed owner first, then by when they joined. encouraged_today is true when the caller has already sent
// that member an encouragement today (always false on the caller's own row). invite_code is filled in for the owner
// only; it never expires, so there is no expiry field. encouragements are the last 20 sent to the caller, newest
// first. A caller in no group gets {"group":null,"me":null,"encouragements":[]} (not an error).
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
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    // Who the caller has already encouraged today.
    $today = buddy_today();
    $stmt = $db->prepare('SELECT recipient_id FROM buddy_encouragements WHERE sender_id = ? AND sent_on = ?');
    $stmt->bind_param('is', $user_id, $today);
    $stmt->execute();
    $encouraged = [];
    foreach ($stmt->get_result() as $row) $encouraged[(int) $row['recipient_id']] = true;

    $members = [];
    foreach ($rows as $row) {
        $members[] = [
            'member_id' => (int) $row['id'],
            'name' => buddy_short_name($row['full_name']),
            'is_me' => (int) $row['user_id'] === $user_id,
            'is_owner' => (int) $row['user_id'] === $owner_id,
            'encouraged_today' => isset($encouraged[(int) $row['user_id']]),
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
            'members' => $members,
        ],
        'me' => ['member_id' => (int) $mine['member_id'], 'is_owner' => $is_owner],
        'encouragements' => $encouragements,
    ];
}
