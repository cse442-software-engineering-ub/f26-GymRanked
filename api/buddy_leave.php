<?php
// POST api/buddy_leave.php {"leave":true}
//   -> 200 {"group":null,"me":null,"encouragements":[],"left":{"name":"Morning Lifters","new_owner":"Ben C.","group_deleted":false}}
//
// Leaves the caller's workout buddies group (story "leave a workout buddies group"). Everyone can leave, the owner too,
// and the group stays valid for the members who are left:
// - A member who is not the owner: their membership is deleted. Everyone else's group is unchanged.
// - The owner, with other members: the member who joined longest ago (the next one in the group view's order) becomes
//   the owner, so they now see the invite code. new_owner names them.
// - The owner as the only member: the group is deleted (with its invite code and the messages sent in it), because a
//   group with no members can't have an owner. group_deleted is true.
// After leaving, the caller is in no group, so they can join another group or create one. The answer has the same
// body as GET api/buddy_group.php for someone in no group, plus "left". Messages the caller sent stay in their sent
// history (api/buddy_sent.php) unless the group was deleted.
//
// Checked in this order: 400 {"error":"Invalid request.","errors":{"leave":"Use true."}}; 404 {"error":"Group not
// found."} when the caller is in no group (for example, they already left in another tab). Also 400 {"error":"Send a
// valid JSON object."}, 401 not logged in, 405 with Allow: POST, 415/413/403 as the other POST endpoints, 500
// {"error":"Database error"}.
//
// Two leaves at the same moment (the owner and the last other member, say) take turns on the group's row, so the
// second one sees what the first one did and the group never ends up with an owner who isn't a member.

require __DIR__ . '/buddy_common.php';

$data = input();
$db = database();
$user_id = workout_user_id($db);

if (($data['leave'] ?? null) !== true) respond(400, ['error' => 'Invalid request.', 'errors' => ['leave' => 'Use true.']]);

$db->begin_transaction();
try {
    buddy_lock_user($db, $user_id);
    $mine = buddy_membership($db, $user_id);
    if (!$mine) {
        $db->rollback();
        respond(404, ['error' => 'Group not found.']);
    }
    $group_id = (int) $mine['group_id'];

    // Take turns with any other leave from this group, then read the owner again: it may have changed while waiting.
    $stmt = $db->prepare('SELECT owner_id FROM buddy_groups WHERE id = ? FOR UPDATE');
    $stmt->bind_param('i', $group_id);
    $stmt->execute();
    $owner_id = (int) $stmt->get_result()->fetch_assoc()['owner_id'];

    $new_owner = null;
    $deleted = false;
    if ($owner_id === $user_id) {
        $stmt = $db->prepare(
            'SELECT m.user_id, u.full_name FROM buddy_members m JOIN users u ON u.id = m.user_id
             WHERE m.group_id = ? AND m.user_id <> ? ORDER BY m.joined_at, m.id LIMIT 1'
        );
        $stmt->bind_param('ii', $group_id, $user_id);
        $stmt->execute();
        $next = $stmt->get_result()->fetch_assoc();
        if ($next) {
            $next_id = (int) $next['user_id'];
            $stmt = $db->prepare('UPDATE buddy_groups SET owner_id = ? WHERE id = ?');
            $stmt->bind_param('ii', $next_id, $group_id);
            $stmt->execute();
            $new_owner = buddy_short_name($next['full_name']);
        } else {
            // Deleting the group deletes its (last) membership and its messages too (ON DELETE CASCADE).
            $stmt = $db->prepare('DELETE FROM buddy_groups WHERE id = ?');
            $stmt->bind_param('i', $group_id);
            $stmt->execute();
            $deleted = true;
        }
    }
    if (!$deleted) {
        $stmt = $db->prepare('DELETE FROM buddy_members WHERE user_id = ? AND group_id = ?');
        $stmt->bind_param('ii', $user_id, $group_id);
        $stmt->execute();
    }
    $db->commit();
} catch (mysqli_sql_exception $error) {
    $db->rollback();
    throw $error;
}

respond(200, buddy_view($db, $user_id) + [
    'left' => ['name' => $mine['name'], 'new_owner' => $new_owner, 'group_deleted' => $deleted],
]);
