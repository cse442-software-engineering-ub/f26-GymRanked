<?php
// The optional ?scope= filter shared by api/leaderboard.php and api/weekly_standings.php (Dashboard redesign, #136).
// Not an endpoint itself.
//
//   scope=everyone (the default) -> everyone who qualifies, as before
//   scope=buddies                -> only the people in the caller's workout buddies group (buddy_members, migration
//                                   018), the caller included. The ranking rules don't change; the list is just
//                                   shorter, so the ranks are "among your buddies".
//
// A caller in no buddies group gets a list of only themselves (so at most rank 1 of 1); the Dashboard checks
// api/buddy_group.php first and asks them to join a group instead of showing that.

// The scope asked for in the query string, or a 400 for anything but everyone or buddies.
function ranking_scope_param() {
    if (!array_key_exists('scope', $_GET)) return 'everyone';
    $scope = $_GET['scope'];
    if (!is_string($scope) || !in_array($scope, ['everyone', 'buddies'], true)) {
        respond(400, ['error' => 'Invalid request.', 'errors' => ['scope' => 'Use everyone or buddies.']]);
    }
    return $scope;
}

// The user ids allowed in the list: null for everyone, else the caller and their buddies group's members.
function ranking_scope_ids($db, $user_id, $scope) {
    if ($scope !== 'buddies') return null;
    $stmt = $db->prepare(
        'SELECT other.user_id FROM buddy_members mine JOIN buddy_members other ON other.group_id = mine.group_id
         WHERE mine.user_id = ?'
    );
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $ids = [$user_id => true];
    foreach ($stmt->get_result()->fetch_all(MYSQLI_ASSOC) as $row) $ids[(int) $row['user_id']] = true;
    return $ids;
}
