<?php
// The optional ?scope= filter shared by api/leaderboard.php and api/weekly_standings.php (Dashboard redesign #136, Buddies
// rankings card #138). Not an endpoint itself.
//
//   scope=everyone (the default) -> everyone who qualifies, exactly as before; the response has none of the keys below
//   scope=buddies                -> only the members of the caller's own workout buddies group (buddy_members, migration
//                                   018). The ranking rules and the response shape do not change, but a member who is not
//                                   ranked is not hidden: the response also has
//                                     "group":    {"name":"Northside Crew","member_count":6}, or null for a caller in no group
//                                     "unranked": [{"name":"Cal M."}, ...] group members with no rank yet, names only
//                                   A caller in no group gets "group": null and empty lists, never anyone else.
//
// The group is always the caller's own, found from the session cookie: there is no group_id, user_id or email parameter.
// Both endpoints call these two functions, so Rankings and the Dashboard get the same data from the same code.

// The scope asked for in the query string, or a 400 for anything but everyone or buddies.
function ranking_scope_param() {
    if (!array_key_exists('scope', $_GET)) return 'everyone';
    $scope = $_GET['scope'];
    if (!is_string($scope) || !in_array($scope, ['everyone', 'buddies'], true)) {
        respond(400, ['error' => 'Invalid request.', 'errors' => ['scope' => 'Use everyone or buddies.']]);
    }
    return $scope;
}

// The caller's buddies group as ['name' => ..., 'ids' => [user ids of every member, the caller included]], or null.
function ranking_group($db, $user_id) {
    $stmt = $db->prepare(
        'SELECT g.id, g.name FROM buddy_members m JOIN buddy_groups g ON g.id = m.group_id WHERE m.user_id = ?'
    );
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $group = $stmt->get_result()->fetch_assoc();
    if (!$group) return null;
    $stmt = $db->prepare('SELECT user_id FROM buddy_members WHERE group_id = ?');
    $stmt->bind_param('i', $group['id']);
    $stmt->execute();
    return ['name' => $group['name'], 'ids' => array_map('intval', array_column($stmt->get_result()->fetch_all(MYSQLI_ASSOC), 'user_id'))];
}

// The "group" key of a Buddies response.
function ranking_group_json($group) {
    return $group === null ? null : ['name' => $group['name'], 'member_count' => count($group['ids'])];
}

// The "unranked" key: [['id' => 5, 'name' => 'Cal Moss'], ...] as [{"name":"Cal M."}], by full name A to Z then id.
function ranking_unranked_json($people) {
    usort($people, fn($a, $b) => strcasecmp($a['name'], $b['name']) ?: strcmp($a['name'], $b['name']) ?: $a['id'] <=> $b['id']);
    return array_map(fn($p) => ['name' => short_name($p['name'])], $people);
}
