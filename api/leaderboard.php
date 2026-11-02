<?php
// GET api/leaderboard.php[?board=overall|bench|squat|deadlift] -> 200
//   {"board":"overall","ranked_count":51,"workouts_needed":3,
//    "rows":[{"rank":1,"name":"Cy P.","score":319.16,"lift":null,"is_me":false,"gap_before":false}, ...],
//    "me":{"ranked":true,"rank":2,"score":243.63,"reason":null,"joined":true,"bodyweight_lb":200,"gender":"man",
//          "scoring_table":"men","lifts":{"bench":210,"squat":264,"deadlift":360},"workouts_done":5}}
// POST   api/leaderboard.php {"join":true[,"scoring_table":"men"|"women"]} -> 200 {"joined":true,"scoring_table":"men"|"women"|null}
// DELETE api/leaderboard.php -> 200 {"joined":false,"scoring_table":"men"|"women"|null}
//
// Rankings for story #10, calculated on every request from the finished workouts of the people who joined (nothing is
// stored but the join and the scoring table). The user always comes from the gymrank_session cookie: there is no way to
// ask for another user's data, and a user_id (or any other parameter) in the request is ignored.
//
// Score (DOTS). Score = lift_kg x 500 / (a + b*x + c*x^2 + d*x^3 + e*x^4), x = body weight in kg, kg = lb x 0.45359237.
// The coefficients and the body weight limits (40 to 210 kg on the men's table, 40 to 150 kg on the women's) are those of
// the OpenPowerlifting implementation:
//   https://gitlab.com/openpowerlifting/opl-data/-/blob/main/crates/coefficients/src/dots.rs
// The PM confirmed that the method is DOTS, which USAPL uses for Open Best Lifter awards (a secondary summary,
// powerliftingrecords.com citing BarBend, dates this to 2022-01-01 and gives no rule number).
// USAPL applies DOTS to a meet total of competition lifts; this feeds it ESTIMATED 1RMs from logged
// workouts (Epley, sets of 1 to 10 reps), not meet lifts, so a score is a GymRank score on the DOTS scale and not an
// official USAPL result.
// - e1RM = Epley, weight_lb x (1 + reps / 30), best set over all finished workouts, not rounded before scoring. Only
//   exactly "Bench press", "Back squat" and "Deadlift" count, sets of 1 to 10 reps and more than 0 lb, in finished
//   workouts (completed_at is not NULL).
// - A lift board scores that lift's e1RM alone (DOTS is defined for a total, so this is an adaptation). Overall scores the
//   SUM of the three e1RMs (a total) and only exists for people with all three lifts. Overall rows have lift null.
// - Scores are rounded half up to 2 decimals and ranks are decided on the rounded score (compared as whole hundredths),
//   so two people who both show 243.63 always share a rank. Highest first; ties share a rank and the next rank is skipped
//   (1, 2, 2, 4); tied people are listed by full name A to Z, then user id. All time.
// - The table: a man uses the men's, a woman the women's. A nonbinary or prefer_not_to_say member chooses one with
//   POST scoring_table (required until one is saved; sending the same POST again while joined changes it; DELETE keeps it).
//   For man and woman a scoring_table in the request is ignored and not stored. One combined board for everyone.
//
// Who is ranked on a board: joined, users.is_test = 0, body weight and gender saved with a known table, at least 3 finished
// workouts, and a counted set of the board's lift (Overall: of all three).
//
// rows = the top 10 plus everyone tied with 10th place, then (when the caller is on the board and outside that) the caller and
// the person either side of them. name is "First L." (shortened here, so a full name never leaves the server). A row never
// has an email, id, body weight, gender, scoring table or e1RM. gap_before is true on the first row after a jump in the list.
// me.rank, me.score and me.reason are for the board asked for; reason (null when ranked) is the first that applies of
// test_account, not_joined, no_bodyweight, needs_scoring_table, too_few_workouts, no_lift, missing_lifts (Overall only:
// ranked on some lift but missing one or two; me.lifts shows which).
//
// 400 {"error":"Invalid request.","errors":{"board"|"join"|"scoring_table": "..."}}, 401 {"error":"Please log in."},
// 405 with Allow: GET, POST, DELETE, 500 {"error":"Database error"}.
//
// ponytail: every joined user is read and ranked in PHP on each request, which is fine for hundreds or a few thousand
// members; past that, keep the best lifts in a small table updated when a workout is completed.

require __DIR__ . '/workout_common.php';

const WORKOUTS_NEEDED = 3;
const TOP_ROWS = 10;
const BOARDS = ['overall', 'bench', 'squat', 'deadlift'];
const LIFT_NAMES = ['bench' => 'Bench press', 'squat' => 'Back squat', 'deadlift' => 'Deadlift'];
const KG_PER_LB = 0.45359237;
const DOTS_TABLES = [
    // a, b, c, d, e and the body weight limits in kg
    'men' => ['coef' => [-307.75076, 24.0900756, -0.1918759221, 0.0007391293, -0.000001093], 'min' => 40, 'max' => 210],
    'women' => ['coef' => [-57.96288, 13.6175032, -0.1126655495, 0.0005158568, -0.0000010706], 'min' => 40, 'max' => 150],
];

$method = $_SERVER['REQUEST_METHOD'] ?? '';
if (!in_array($method, ['GET', 'POST', 'DELETE'], true)) {
    header('Allow: GET, POST, DELETE');
    respond(405, ['error' => 'Method not allowed.']);
}
// No cookie at all: refuse without touching the database.
if (empty($_COOKIE['gymrank_session'])) respond(401, ['error' => 'Please log in.']);

// ---------------------------------------------------------------- numbers
// Whole numbers are sent as 51, not 51.0.
function number_json($value) { return $value == floor($value) ? (int) $value : $value; }
function cents_json($cents) { return $cents % 100 === 0 ? intdiv($cents, 100) : $cents / 100; }

// DOTS points for a lift in lb at a body weight in lb, as whole hundredths (rounded half up).
function dots_cents($lift_lb, $bodyweight_lb, $table) {
    $t = DOTS_TABLES[$table];
    $x = min(max($bodyweight_lb * KG_PER_LB, $t['min']), $t['max']);
    $c = $t['coef'];
    $denominator = $c[0] + $c[1] * $x + $c[2] * $x ** 2 + $c[3] * $x ** 3 + $c[4] * $x ** 4;
    return (int) round(round($lift_lb * KG_PER_LB * 500 / $denominator, 2, PHP_ROUND_HALF_UP) * 100);
}

// The scoring table used for a user: the gender's for man and woman, the saved choice otherwise (or null).
function table_for($gender, $chosen) {
    if ($gender === 'man') return 'men';
    if ($gender === 'woman') return 'women';
    return in_array($gender, ['nonbinary', 'prefer_not_to_say'], true) ? $chosen : null;
}

// "Ana Cole" -> "Ana C.", "Sean O'Brien" -> "Sean O."; a one-word name stays as it is.
function short_name($full_name) {
    $parts = preg_split('/\s+/u', trim($full_name));
    if (count($parts) < 2) return $parts[0];
    return $parts[0] . ' ' . mb_strtoupper(mb_substr($parts[count($parts) - 1], 0, 1)) . '.';
}

// ---------------------------------------------------------------- POST and DELETE
function profile_row($db, $user_id) {
    $stmt = $db->prepare('SELECT gender, scoring_table, leaderboard_joined_at FROM user_profile WHERE user_id = ?');
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    return $stmt->get_result()->fetch_assoc() ?: ['gender' => null, 'scoring_table' => null, 'leaderboard_joined_at' => null];
}

function membership($db, $user_id) {
    $row = profile_row($db, $user_id);
    return ['joined' => $row['leaderboard_joined_at'] !== null, 'scoring_table' => table_for($row['gender'], $row['scoring_table'])];
}

if ($method === 'DELETE') {
    $db = database();
    $user_id = workout_user_id($db);
    $stmt = $db->prepare('UPDATE user_profile SET leaderboard_joined_at = NULL WHERE user_id = ?');
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    respond(200, membership($db, $user_id));
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
    $sent_table = $data['scoring_table'] ?? null;

    $db = database();
    $user_id = workout_user_id($db);
    $profile = profile_row($db, $user_id);

    // Only a nonbinary or prefer_not_to_say member chooses; for everyone else what was sent is ignored and not stored.
    $store_table = null;
    if (in_array($profile['gender'], ['nonbinary', 'prefer_not_to_say'], true)) {
        if (in_array($sent_table, ['men', 'women'], true)) {
            $store_table = $sent_table;
        } elseif ($sent_table !== null || $profile['scoring_table'] === null) {
            respond(400, ['error' => 'Invalid request.', 'errors' => ['scoring_table' => 'Choose a scoring table.']]);
        }
    }

    // The first join sets the time; joining again keeps it. A user who never saved details gets a row with only these.
    $stmt = $db->prepare(
        'INSERT INTO user_profile (user_id, leaderboard_joined_at, scoring_table) VALUES (?, UTC_TIMESTAMP(), ?)
         ON DUPLICATE KEY UPDATE leaderboard_joined_at = COALESCE(leaderboard_joined_at, UTC_TIMESTAMP()),
                                 scoring_table = COALESCE(VALUES(scoring_table), scoring_table)'
    );
    $stmt->bind_param('is', $user_id, $store_table);
    $stmt->execute();
    respond(200, membership($db, $user_id));
}

// ---------------------------------------------------------------- GET
$board = 'overall';
if (array_key_exists('board', $_GET)) {
    if (!is_string($_GET['board']) || !in_array($_GET['board'], BOARDS, true)) {
        respond(400, ['error' => 'Invalid request.', 'errors' => ['board' => 'Use overall, bench, squat or deadlift.']]);
    }
    $board = $_GET['board'];
}

$db = database();
$me_id = workout_user_id($db);

// Everyone who joined, plus the caller whether or not they did.
$stmt = $db->prepare(
    'SELECT u.id, u.full_name, u.is_test, p.bodyweight_lb, p.gender, p.scoring_table, p.leaderboard_joined_at,
            (SELECT COUNT(*) FROM workout_sessions s WHERE s.user_id = u.id AND s.completed_at IS NOT NULL) AS workouts
     FROM users u LEFT JOIN user_profile p ON p.user_id = u.id
     WHERE u.id = ? OR p.leaderboard_joined_at IS NOT NULL'
);
$stmt->bind_param('i', $me_id);
$stmt->execute();
$people = [];
foreach ($stmt->get_result()->fetch_all(MYSQLI_ASSOC) as $row) {
    $row['id'] = (int) $row['id'];
    $row['q'] = [];   // lift => best of weight x (30 + reps) in hundredths: e1RM in lb = q / 3000
    $people[$row['id']] = $row;
}

// The best counted set of each lift: exact names (BINARY, because the column compares case-insensitively), 1 to 10 reps,
// more than 0 lb, finished workouts only. weight x (30 + reps) is exact DECIMAL arithmetic.
$stmt = $db->prepare(
    'SELECT s.user_id, st.exercise, MAX(st.weight_lb * (30 + st.reps)) AS best
     FROM workout_sets st JOIN workout_sessions s ON s.id = st.session_id
     WHERE s.completed_at IS NOT NULL AND st.weight_lb > 0 AND st.reps BETWEEN 1 AND 10
       AND BINARY st.exercise IN (\'Bench press\', \'Back squat\', \'Deadlift\')
       AND (s.user_id = ? OR s.user_id IN (SELECT user_id FROM user_profile WHERE leaderboard_joined_at IS NOT NULL))
     GROUP BY s.user_id, st.exercise'
);
$stmt->bind_param('i', $me_id);
$stmt->execute();
$lift_of = array_flip(LIFT_NAMES);
foreach ($stmt->get_result()->fetch_all(MYSQLI_ASSOC) as $row) {
    $people[(int) $row['user_id']]['q'][$lift_of[$row['exercise']]] = (int) round((float) $row['best'] * 100);
}

// Score of one person on the asked board in hundredths, or null when they have no lift for it.
function board_score_cents($person, $board, $table) {
    $bodyweight = (float) $person['bodyweight_lb'];
    if ($board === 'overall') {
        if (count($person['q']) < count(LIFT_NAMES)) return null;
        return dots_cents(array_sum($person['q']) / 3000, $bodyweight, $table);
    }
    return isset($person['q'][$board]) ? dots_cents($person['q'][$board] / 3000, $bodyweight, $table) : null;
}

// Why a person is not ranked on this board, in the fixed order; null when none applies.
function unranked_reason($person, $board, $table) {
    if ($person['is_test']) return 'test_account';
    if ($person['leaderboard_joined_at'] === null) return 'not_joined';
    if ($person['bodyweight_lb'] === null || $person['gender'] === null) return 'no_bodyweight';
    if ($table === null) return 'needs_scoring_table';
    if ((int) $person['workouts'] < WORKOUTS_NEEDED) return 'too_few_workouts';
    if ($board === 'overall') {
        if (!$person['q']) return 'no_lift';
        return count($person['q']) < count(LIFT_NAMES) ? 'missing_lifts' : null;
    }
    return isset($person['q'][$board]) ? null : 'no_lift';
}

$entries = [];   // everyone ranked on this board
foreach ($people as $id => $person) {
    $table = table_for($person['gender'], $person['scoring_table']);
    if (unranked_reason($person, $board, $table) !== null) continue;
    $entries[] = ['id' => $id, 'name' => $person['full_name'], 'cents' => board_score_cents($person, $board, $table)];
}
usort($entries, function ($a, $b) {
    return $b['cents'] <=> $a['cents'] ?: strcasecmp($a['name'], $b['name']) ?: strcmp($a['name'], $b['name']) ?: $a['id'] <=> $b['id'];
});
$previous = null;
foreach ($entries as $i => &$entry) {
    $entry['rank'] = ($previous !== null && $previous['cents'] === $entry['cents']) ? $previous['rank'] : $i + 1;
    $previous = $entry;
}
unset($entry);

// The top 10 and everyone tied with 10th place, then the caller and one person either side.
$count = count($entries);
$keep = [];
$top = min(TOP_ROWS, $count);
while ($top < $count && $entries[$top]['cents'] === $entries[TOP_ROWS - 1]['cents']) $top++;
for ($i = 0; $i < $top; $i++) $keep[$i] = true;
$my_index = null;
foreach ($entries as $i => $entry) if ($entry['id'] === $me_id) $my_index = $i;
if ($my_index !== null) {
    foreach ([$my_index - 1, $my_index, $my_index + 1] as $i) if ($i >= 0 && $i < $count) $keep[$i] = true;
}
ksort($keep);
$rows = [];
$last = null;
foreach (array_keys($keep) as $i) {
    $e = $entries[$i];
    $rows[] = [
        'rank' => $e['rank'],
        'name' => short_name($e['name']),
        'score' => cents_json($e['cents']),
        'lift' => $board === 'overall' ? null : $board,
        'is_me' => $e['id'] === $me_id,
        'gap_before' => $last !== null && $i !== $last + 1,
    ];
    $last = $i;
}

// The caller's own numbers.
$me = $people[$me_id];
$table = table_for($me['gender'], $me['scoring_table']);
$reason = unranked_reason($me, $board, $table);
$ranked = $reason === null;
$lifts = [];
foreach (array_keys(LIFT_NAMES) as $lift) {
    $lifts[$lift] = isset($me['q'][$lift]) ? number_json(round($me['q'][$lift] / 3000, 2)) : null;
}
respond(200, [
    'board' => $board,
    'ranked_count' => $count,
    'workouts_needed' => WORKOUTS_NEEDED,
    'rows' => $rows,
    'me' => [
        'ranked' => $ranked,
        'rank' => $ranked ? $entries[$my_index]['rank'] : null,
        'score' => $ranked ? cents_json($entries[$my_index]['cents']) : null,
        'reason' => $reason,
        'joined' => $me['leaderboard_joined_at'] !== null,
        'bodyweight_lb' => $me['bodyweight_lb'] !== null ? number_json((float) $me['bodyweight_lb']) : null,
        'gender' => $me['gender'],
        'scoring_table' => $table,
        'lifts' => $lifts,
        'workouts_done' => (int) $me['workouts'],
    ],
]);
