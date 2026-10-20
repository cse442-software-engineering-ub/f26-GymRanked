<?php
// GET api/exercise_progress.php[?from=2026-09-01&to=2026-10-31&bucket=week|month] -> 200
//   {"from":"2026-09-01"|null,"to":"2026-10-31"|null,"bucket":"week",
//    "summary":{"workouts":6,"sets":21,"total_volume_lb":19020,"new_prs":9,"strength_gain_pct":12.4},
//    "exercises":[{"exercise":"Bench press","sessions":6,"sets":10,"total_reps":57,"volume_lb":11100,
//       "best_weight_lb":220,"best_reps":null,"first_e1rm_lb":234,"last_e1rm_lb":260,"strength_change_lb":26,
//       "strength_change_pct":11.1,"new_prs":4,
//       "points":[{"date":"2026-09-02","best_weight_lb":190,"reps":6,"e1rm_lb":234,"best_reps":null,"volume_lb":2760}, ...]}, ...],
//    "volume_trend":[{"period_start":"2026-08-31","volume_lb":4770,"workouts":1}, ...],
//    "prs":[{"exercise":"Bench press","date":"2026-10-09","weight_lb":220,"reps":3}, ...]}
//
// Performance totals and trends for the logged-in user's completed workouts (story #8). Unfinished workouts and other
// users' workouts are never counted, and there is no way to ask for another user's data. Nothing is cut off: every
// completed workout is read, unlike workout_history.php's 100.
//
// Dates are America/New_York calendar days (the same zone workout_session.php uses for "today"). from and to are
// optional, inclusive, YYYY-MM-DD; with neither, all history is covered. bucket (default week) sets volume_trend:
// week = Monday to Sunday, month = calendar month. period_start is the bucket's first day. Weights are pounds.
//
// Definitions (agreed with the story #8 frontend):
// - volume = sum of weight_lb x reps; a 0 lb (bodyweight) set adds 0.
// - e1RM = Epley, weight_lb x (1 + reps / 30), 0 lb sets ignored, a workout's best set, 1 decimal (half up).
// - first_e1rm_lb / last_e1rm_lb = e1RM in the first / last workout of the range with a weighted set of the exercise;
//   strength_change_lb = last - first, strength_change_pct = that / first x 100 (1 decimal). All four are null unless
//   there are at least two such workouts. summary.strength_gain_pct is the same figure over the summed e1RMs.
// - best_weight_lb = heaviest weight in the range (null if all bodyweight); best_reps = most reps in one 0 lb set.
// - new PR = a workout whose heaviest weight for an exercise beats every earlier completed workout's (any date, not only
//   the range). A workout whose heaviest weight is 0 lb has a rep PR instead: its most reps in one 0 lb set beats every
//   earlier 0 lb set. The first time an exercise is logged and ties are not PRs; one per exercise per workout.
// - points = one entry per workout in the range that has the exercise, oldest first. A bodyweight workout has
//   best_weight_lb, reps and e1rm_lb null and best_reps set; a weighted one has best_reps null.
// - exercises are A to Z; volume_trend runs from the first to the last workout's bucket with empty buckets in between
//   (and is [] when the range has no workouts); prs are newest first, then by exercise name.
// Values that cannot be worked out are null, never 0.
//
// 400 {"error":"Invalid request.","errors":{"from"|"to"|"bucket": "..."}}, 401 not logged in, 405 not GET.

require __DIR__ . '/workout_common.php';

const PROGRESS_ZONE = 'America/New_York';

require_method('GET');
$db = database();
$user_id = workout_user_id($db);

// ---------------------------------------------------------------- request
function progress_date_param($name, &$errors) {
    if (!array_key_exists($name, $_GET)) return null;
    $value = $_GET[$name];
    if (is_string($value) && preg_match('/^(\d{4})-(\d{2})-(\d{2})$/D', $value, $m) && checkdate((int) $m[2], (int) $m[3], (int) $m[1])) {
        return $value;
    }
    $errors[$name] = 'Use a date like 2026-09-01.';
    return null;
}

$errors = [];
$from = progress_date_param('from', $errors);
$to = progress_date_param('to', $errors);
$bucket = $_GET['bucket'] ?? 'week';
if (!in_array($bucket, ['week', 'month'], true)) $errors['bucket'] = 'Use week or month.';
if ($from !== null && $to !== null && $to < $from) $errors['to'] = 'The end date must be on or after the start date.';
if ($errors) respond(400, ['error' => 'Invalid request.', 'errors' => $errors]);

// ---------------------------------------------------------------- numbers
// Weights stay whole cents and e1RMs whole tenths of a pound until they are printed, so rounding never depends on floats.
function cents_json($cents) { return $cents % 100 === 0 ? intdiv($cents, 100) : $cents / 100; }
function tenths_json($tenths) { return $tenths % 10 === 0 ? intdiv($tenths, 10) : $tenths / 10; }

// weight_lb x (1 + reps / 30) in tenths of a pound, half up.
function e1rm_tenths($cents, $reps) { return intdiv(2 * $cents * (30 + $reps) + 300, 600); }

// $change / $base x 100 in tenths of a percent, half away from zero. $base is positive.
function pct_tenths($change, $base) {
    $tenths = intdiv(2 * abs($change) * 1000 + $base, 2 * $base);
    return $change < 0 ? -$tenths : $tenths;
}

// ---------------------------------------------------------------- every completed workout, oldest first
$stmt = $db->prepare('SELECT id, completed_at FROM workout_sessions WHERE user_id = ? AND completed_at IS NOT NULL ORDER BY completed_at, id');
$stmt->bind_param('i', $user_id);
$stmt->execute();
$utc = new DateTimeZone('UTC');
$new_york = new DateTimeZone(PROGRESS_ZONE);
$workouts = [];   // session id => ['date' => 'YYYY-MM-DD' (New York), 'sets' => [exercise => [[cents, reps], ...]]]
foreach ($stmt->get_result()->fetch_all(MYSQLI_ASSOC) as $row) {
    $date = (new DateTimeImmutable($row['completed_at'], $utc))->setTimezone($new_york)->format('Y-m-d');
    $workouts[(int) $row['id']] = ['date' => $date, 'sets' => []];
}

$stmt = $db->prepare(
    'SELECT st.session_id, st.exercise, st.weight_lb, st.reps
     FROM workout_sets st JOIN workout_sessions s ON s.id = st.session_id
     WHERE s.user_id = ? AND s.completed_at IS NOT NULL ORDER BY st.session_id, st.set_number, st.id'
);
$stmt->bind_param('i', $user_id);
$stmt->execute();
foreach ($stmt->get_result()->fetch_all(MYSQLI_ASSOC) as $row) {
    $workouts[(int) $row['session_id']]['sets'][$row['exercise']][] = [(int) round((float) $row['weight_lb'] * 100), (int) $row['reps']];
}

// ---------------------------------------------------------------- per workout and exercise, with PRs
$best_weight = [];   // exercise => heaviest weight (cents) in earlier workouts
$best_reps = [];     // exercise => most reps in one 0 lb set in earlier workouts
$entries = [];       // [workout index, date, exercise, facts] in time order
$index = 0;
foreach ($workouts as $workout) {
    foreach ($workout['sets'] as $name => $sets) {
        $top = max(array_column($sets, 0));
        $zero_reps = null;
        $volume = $total_reps = 0;
        $reps_at_top = 0;
        $e1rm = null;
        foreach ($sets as [$cents, $reps]) {
            $volume += $cents * $reps;
            $total_reps += $reps;
            if ($cents === $top) $reps_at_top = max($reps_at_top, $reps);
            if ($cents === 0) $zero_reps = max($zero_reps ?? 0, $reps);
            else $e1rm = max($e1rm ?? 0, e1rm_tenths($cents, $reps));
        }
        if ($top > 0) {
            $pr = isset($best_weight[$name]) && $top > $best_weight[$name];
            $best_weight[$name] = max($best_weight[$name] ?? 0, $top);
        } else {
            $pr = isset($best_reps[$name]) && $zero_reps > $best_reps[$name];
        }
        if ($zero_reps !== null) $best_reps[$name] = max($best_reps[$name] ?? 0, $zero_reps);
        $entries[] = [
            'index' => $index, 'date' => $workout['date'], 'exercise' => $name, 'pr' => $pr,
            'top' => $top, 'reps_at_top' => $reps_at_top, 'zero_reps' => $zero_reps, 'e1rm' => $e1rm,
            'volume' => $volume, 'sets' => count($sets), 'reps' => $total_reps,
        ];
    }
    $index++;
}

// ---------------------------------------------------------------- the requested range
$in_range = function ($date) use ($from, $to) {
    return ($from === null || $date >= $from) && ($to === null || $date <= $to);
};

$summary_volume = $summary_sets = 0;
$range_workouts = [];   // workout index => volume (cents)
$index = 0;
foreach ($workouts as $workout) {
    if ($in_range($workout['date'])) $range_workouts[$index] = ['date' => $workout['date'], 'volume' => 0];
    $index++;
}

$exercises = [];
$prs = [];
foreach ($entries as $entry) {
    if (!isset($range_workouts[$entry['index']])) continue;
    $name = $entry['exercise'];
    $range_workouts[$entry['index']]['volume'] += $entry['volume'];
    $summary_volume += $entry['volume'];
    $summary_sets += $entry['sets'];
    if (!isset($exercises[$name])) {
        $exercises[$name] = ['sessions' => 0, 'sets' => 0, 'reps' => 0, 'volume' => 0, 'best' => 0, 'best_reps' => null, 'e1rms' => [], 'prs' => 0, 'points' => []];
    }
    $e = &$exercises[$name];
    $e['sessions']++;
    $e['sets'] += $entry['sets'];
    $e['reps'] += $entry['reps'];
    $e['volume'] += $entry['volume'];
    $e['best'] = max($e['best'], $entry['top']);
    if ($entry['zero_reps'] !== null) $e['best_reps'] = max($e['best_reps'] ?? 0, $entry['zero_reps']);
    if ($entry['e1rm'] !== null) $e['e1rms'][] = $entry['e1rm'];
    $bodyweight = $entry['top'] === 0;
    $e['points'][] = [
        'date' => $entry['date'],
        'best_weight_lb' => $bodyweight ? null : cents_json($entry['top']),
        'reps' => $bodyweight ? null : $entry['reps_at_top'],
        'e1rm_lb' => $bodyweight ? null : tenths_json($entry['e1rm']),
        'best_reps' => $bodyweight ? $entry['zero_reps'] : null,
        'volume_lb' => cents_json($entry['volume']),
    ];
    if ($entry['pr']) {
        $e['prs']++;
        $prs[] = [
            'index' => $entry['index'], 'exercise' => $name, 'date' => $entry['date'],
            'weight_lb' => $bodyweight ? 0 : cents_json($entry['top']),
            'reps' => $bodyweight ? $entry['zero_reps'] : $entry['reps_at_top'],
        ];
    }
    unset($e);
}

// ---------------------------------------------------------------- response
uksort($exercises, function ($a, $b) { return strcasecmp($a, $b) ?: strcmp($a, $b); });
$sum_first = $sum_last = 0;
$changing = 0;
$exercise_rows = [];
foreach ($exercises as $name => $e) {
    $first = $last = $change = $pct = null;
    if (count($e['e1rms']) >= 2) {
        $first_t = $e['e1rms'][0];
        $last_t = $e['e1rms'][count($e['e1rms']) - 1];
        $first = tenths_json($first_t);
        $last = tenths_json($last_t);
        $change = tenths_json($last_t - $first_t);
        $pct = tenths_json(pct_tenths($last_t - $first_t, $first_t));
        $sum_first += $first_t;
        $sum_last += $last_t;
        $changing++;
    }
    $exercise_rows[] = [
        'exercise' => $name,
        'sessions' => $e['sessions'],
        'sets' => $e['sets'],
        'total_reps' => $e['reps'],
        'volume_lb' => cents_json($e['volume']),
        'best_weight_lb' => $e['best'] > 0 ? cents_json($e['best']) : null,
        'best_reps' => $e['best_reps'],
        'first_e1rm_lb' => $first,
        'last_e1rm_lb' => $last,
        'strength_change_lb' => $change,
        'strength_change_pct' => $pct,
        'new_prs' => $e['prs'],
        'points' => $e['points'],
    ];
}

// volume_trend: one bucket per period from the first workout's to the last workout's, empty ones included.
function bucket_start($date, $bucket) {
    $day = new DateTimeImmutable($date, new DateTimeZone('UTC'));
    if ($bucket === 'month') return $day->format('Y-m-01');
    return $day->modify('-' . ((int) $day->format('N') - 1) . ' days')->format('Y-m-d');
}

$trend = [];
if ($range_workouts) {
    $totals = [];
    foreach ($range_workouts as $w) {
        $key = bucket_start($w['date'], $bucket);
        $totals[$key] = ($totals[$key] ?? ['volume' => 0, 'workouts' => 0]);
        $totals[$key]['volume'] += $w['volume'];
        $totals[$key]['workouts']++;
    }
    $dates = array_column($range_workouts, 'date');
    $period = bucket_start(min($dates), $bucket);
    $last_period = bucket_start(max($dates), $bucket);
    while ($period <= $last_period) {
        $t = $totals[$period] ?? ['volume' => 0, 'workouts' => 0];
        $trend[] = ['period_start' => $period, 'volume_lb' => cents_json($t['volume']), 'workouts' => $t['workouts']];
        $next = new DateTimeImmutable($period, new DateTimeZone('UTC'));
        $period = ($bucket === 'month' ? $next->modify('first day of next month') : $next->modify('+7 days'))->format('Y-m-d');
    }
}

usort($prs, function ($a, $b) {
    return strcmp($b['date'], $a['date']) ?: strcmp($a['exercise'], $b['exercise']) ?: $b['index'] <=> $a['index'];
});
$pr_rows = array_map(function ($pr) { unset($pr['index']); return $pr; }, $prs);

respond(200, [
    'from' => $from,
    'to' => $to,
    'bucket' => $bucket,
    'summary' => [
        'workouts' => count($range_workouts),
        'sets' => $summary_sets,
        'total_volume_lb' => cents_json($summary_volume),
        'new_prs' => count($prs),
        'strength_gain_pct' => $changing ? tenths_json(pct_tenths($sum_last - $sum_first, $sum_first)) : null,
    ],
    'exercises' => $exercise_rows,
    'volume_trend' => $trend,
    'prs' => $pr_rows,
]);
