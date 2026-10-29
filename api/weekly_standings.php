<?php
// GET    api/weekly_standings.php               -> 200 the standings (below)
// POST   api/weekly_standings.php {"join":true} -> 200 the same body, after joining the weekly competition
// DELETE api/weekly_standings.php               -> 200 the same body, after leaving it (workouts and goals are kept)
//
//   {"time_zone":"America/New_York","week_start":"2026-10-26","week_end":"2026-11-01",
//    "resets_at":"2026-11-02T05:00:00Z","now":"2026-10-30T18:48:00Z","target_days":3,"member_count":8,
//    "rows":[{"rank":1,"name":"Maya R.","progress_days":3,"progress_percent":100,"is_me":false,"gap_before":false}, ...],
//    "me":{"joined":true,"ranked":true,"reason":null,"ranked_from":null,"rank":2,"completed_count":2,
//          "progress_days":2,"progress_percent":67,"goal_reached":false}}
//
// Weekly consistency competition (story #124, card #126, the Monday visual brief page 3). It is separate from the
// all-time strength leaderboard (api/leaderboard.php), which it does not touch. The user always comes from the
// gymrank_session cookie: nothing in the request can name another user, so any user_id or email sent is ignored.
//
// - Each person's target and training days are Surya's rule from api/weekly_goal.php (card #89), worked out here for
//   everyone in a few queries: the target saved for this week, else the most recent earlier saved week, else 3; a day
//   is a New York date with a finished workout that has at least one saved set, and one date counts once. Nothing is
//   stored, so Home, the weekly goal page and these standings can't disagree.
// - progress_days is the days capped at the target, progress_percent is progress_days / target_days rounded to a whole
//   percent, so a 4th day on a 3-day goal still reads 3 of 3 and 100%.
// - The circle is the people with the viewer's target_days who are ranked this week: joined (a row in
//   user_weekly_competition), not a test account (users.is_test), and ranked_from on or before this week's Monday.
//   ranked_from is the Monday after the user joined, so joining mid-week is a practice week: you see your own
//   progress but aren't ranked or listed. Leaving deletes the row, so joining again starts a new practice week.
// - Most days first; people with the same days share a rank and the next rank is skipped (1, 1, 3). Ties are listed by
//   full name A to Z, then by user id. rows is the whole circle (no cut-off), so gap_before is always false: it is
//   there so the page can reuse the strength board's row shape. name is first name and last initial.
// - me.reason is null when ranked, else the first of test_account, not_joined, practice_week; me.ranked_from is the
//   Monday date only for practice_week. A test account is never listed. me.progress_* is filled in for everyone.
// - now is the server's time so the page's countdown doesn't depend on the phone's clock; resets_at is next Monday
//   00:00 New York time in UTC (see weekly_standings_time.php).
//
// 400 {"error":"Invalid request.","errors":{"join":"Use true."}} for a POST body that isn't {"join": true}, 401 not
// logged in, 405 with Allow: GET, POST, DELETE, 415/413/403 as the other POST endpoints, 500 {"error":"Database error"}.

require __DIR__ . '/workout_common.php';
require __DIR__ . '/weekly_standings_time.php';

const STANDINGS_DEFAULT_TARGET = 3; // the same default as api/weekly_goal.php

$method = $_SERVER['REQUEST_METHOD'] ?? '';
if (!in_array($method, ['GET', 'POST', 'DELETE'], true)) {
    header('Allow: GET, POST, DELETE');
    respond(405, ['error' => 'Method not allowed.']);
}

if ($method === 'POST') {
    // Like api/auth.php's input(), except a body that is not a JSON object is "no fields" and so gets the join error.
    if (strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0])) !== 'application/json') {
        respond(415, ['error' => 'Send application/json.']);
    }
    if (($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '') === 'cross-site') {
        respond(403, ['error' => 'Cross-site requests are not allowed.']);
    }
    $raw = file_get_contents('php://input', false, null, 0, 8193);
    if (strlen($raw) > 8192) respond(413, ['error' => 'Request too large.']);
    $data = json_decode($raw);
    $data = is_object($data) ? (array) $data : [];
    // Checked before the session, so a bad request never writes anything.
    if (($data['join'] ?? null) !== true) {
        respond(400, ['error' => 'Invalid request.', 'errors' => ['join' => 'Use true.']]);
    }
}

$db = database();
$user_id = workout_user_id($db);
$now = new DateTimeImmutable('now', new DateTimeZone('UTC'));
[$week_start, $next_start] = standings_week($now);

if ($method === 'POST') {
    // Ranked from the Monday after joining. INSERT IGNORE keeps the first join (and its time) when already joined,
    // and two joins at the same time leave one row.
    $ranked_from = $next_start->format('Y-m-d');
    $stmt = $db->prepare(
        'INSERT IGNORE INTO user_weekly_competition (user_id, joined_at, ranked_from) VALUES (?, UTC_TIMESTAMP(), ?)'
    );
    $stmt->bind_param('is', $user_id, $ranked_from);
    $stmt->execute();
} elseif ($method === 'DELETE') {
    $stmt = $db->prepare('DELETE FROM user_weekly_competition WHERE user_id = ?');
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
}

// ---------------------------------------------------------------- the standings
$week = $week_start->format('Y-m-d');
$utc = new DateTimeZone('UTC');
$from = $week_start->setTimezone($utc)->format('Y-m-d H:i:s');
$to = $next_start->setTimezone($utc)->format('Y-m-d H:i:s');

// The viewer and everyone who joined. ponytail: everything is read and sorted in PHP, fine for a class-sized
// competition; move the ranking into SQL if the number of members ever gets large.
$people = [];
$stmt = $db->prepare(
    'SELECT u.id, u.full_name, u.is_test, c.ranked_from
     FROM users u LEFT JOIN user_weekly_competition c ON c.user_id = u.id
     WHERE u.id = ? OR c.user_id IS NOT NULL'
);
$stmt->bind_param('i', $user_id);
$stmt->execute();
foreach ($stmt->get_result()->fetch_all(MYSQLI_ASSOC) as $row) {
    $people[(int) $row['id']] = [
        'id' => (int) $row['id'],
        'name' => $row['full_name'],
        'is_test' => (int) $row['is_test'] === 1,
        'ranked_from' => $row['ranked_from'],
        'target' => STANDINGS_DEFAULT_TARGET,
        'dates' => [],
    ];
}

// Each person's target: the latest saved week up to this one (this week's if saved, else the most recent earlier).
$stmt = $db->prepare(
    'SELECT g.user_id, g.target_days FROM user_weekly_goals g
     WHERE g.week_start <= ?
       AND g.week_start = (SELECT MAX(g2.week_start) FROM user_weekly_goals g2
                           WHERE g2.user_id = g.user_id AND g2.week_start <= ?)'
);
$stmt->bind_param('ss', $week, $week);
$stmt->execute();
foreach ($stmt->get_result()->fetch_all(MYSQLI_ASSOC) as $row) {
    if (isset($people[(int) $row['user_id']])) $people[(int) $row['user_id']]['target'] = (int) $row['target_days'];
}

// Each person's training days: New York dates of this week's finished workouts that have a saved set.
$stmt = $db->prepare(
    'SELECT s.user_id, s.completed_at FROM workout_sessions s
     WHERE s.completed_at >= ? AND s.completed_at < ?
       AND (s.user_id = ? OR s.user_id IN (SELECT user_id FROM user_weekly_competition))
       AND EXISTS (SELECT 1 FROM workout_sets st WHERE st.session_id = s.id)'
);
$stmt->bind_param('ssi', $from, $to, $user_id);
$stmt->execute();
$zone = new DateTimeZone(STANDINGS_TIME_ZONE);
foreach ($stmt->get_result()->fetch_all(MYSQLI_ASSOC) as $row) {
    $date = (new DateTimeImmutable($row['completed_at'], $utc))->setTimezone($zone)->format('Y-m-d');
    $people[(int) $row['user_id']]['dates'][$date] = true;
}

foreach ($people as &$person) {
    $person['completed'] = count($person['dates']);
    $person['days'] = min($person['completed'], $person['target']);
    $person['percent'] = (int) round($person['days'] * 100 / $person['target']);
    $person['ranked'] = !$person['is_test'] && $person['ranked_from'] !== null && $person['ranked_from'] <= $week;
}
unset($person);

$me = $people[$user_id];
$circle = array_values(array_filter($people, fn($p) => $p['ranked'] && $p['target'] === $me['target']));
usort($circle, fn($a, $b) => $b['days'] <=> $a['days']
    ?: strcasecmp($a['name'], $b['name']) ?: strcmp($a['name'], $b['name']) ?: $a['id'] <=> $b['id']);

// "Ana Cole" -> "Ana C.", "Sean O'Brien" -> "Sean O."; a one-word name stays as it is (as in api/leaderboard.php).
function short_name($full_name) {
    $parts = preg_split('/\s+/u', trim($full_name));
    if (count($parts) < 2) return $parts[0];
    return $parts[0] . ' ' . mb_strtoupper(mb_substr($parts[count($parts) - 1], 0, 1)) . '.';
}

$rows = [];
$my_rank = null;
foreach ($circle as $i => $person) {
    $rank = ($i > 0 && $circle[$i - 1]['days'] === $person['days']) ? $rows[$i - 1]['rank'] : $i + 1;
    $is_me = $person['id'] === $user_id;
    if ($is_me) $my_rank = $rank;
    $rows[] = [
        'rank' => $rank,
        'name' => short_name($person['name']),
        'progress_days' => $person['days'],
        'progress_percent' => $person['percent'],
        'is_me' => $is_me,
        'gap_before' => false,
    ];
}

$reason = $me['is_test'] ? 'test_account' : ($me['ranked_from'] === null ? 'not_joined' : (!$me['ranked'] ? 'practice_week' : null));
respond(200, [
    'time_zone' => STANDINGS_TIME_ZONE,
    'week_start' => $week,
    'week_end' => $week_start->modify('+6 days')->format('Y-m-d'),
    'resets_at' => utc_iso($next_start),
    'now' => utc_iso($now),
    'target_days' => $me['target'],
    'member_count' => count($rows),
    'rows' => $rows,
    'me' => [
        'joined' => $me['ranked_from'] !== null,
        'ranked' => $me['ranked'],
        'reason' => $reason,
        'ranked_from' => $reason === 'practice_week' ? $me['ranked_from'] : null,
        'rank' => $my_rank,
        'completed_count' => $me['completed'],
        'progress_days' => $me['days'],
        'progress_percent' => $me['percent'],
        'goal_reached' => $me['completed'] >= $me['target'],
    ],
]);
