<?php
// Helpers shared by the workout logging endpoints (story #7): workout_session.php, workout_sets.php,
// complete_workout.php and workout_history.php. Not an endpoint itself.
//
// All times are UTC and are written by the server (UTC_TIMESTAMP()), never taken from the client. Weight is
// in pounds. Errors are JSON {"error": "...", "errors"?: {...}}: 400 bad input, 401 not logged in, 404 not found
// (including another user's session or set), 409 conflict, 500 {"error":"Database error"}.

require __DIR__ . '/auth.php';

// auth.php answers 503 for unexpected errors; for the workout endpoints a failed query is a plain 500.
set_exception_handler(function ($error) {
    error_log(basename($_SERVER['SCRIPT_NAME'] ?? 'workout') . ': ' . $error->getMessage());
    respond(500, ['error' => 'Database error']);
});

const WEIGHT_MAX_LB = 1500;
const REPS_MIN = 1;
const REPS_MAX = 100;
const SET_NUMBER_MAX = 50;
const TRAINING_WEEKDAYS = [
    1 => [0], 2 => [0, 3], 3 => [0, 2, 4], 4 => [0, 1, 3, 4],
    5 => [0, 1, 2, 3, 4], 6 => [0, 1, 2, 3, 4, 5], 7 => [0, 1, 2, 3, 4, 5, 6],
];

// The plan switches days at midnight in New York, including daylight-saving changes.
function workout_today_start_utc() {
    $start = (new DateTimeImmutable('now', new DateTimeZone('America/New_York')))->setTime(0, 0);
    return $start->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s');
}

function workout_session_is_today($session) {
    return $session['started_at'] >= workout_today_start_utc() && $session['started_at'] <= gmdate('Y-m-d H:i:s');
}

// Old or explicitly started sessions cannot accept sets after the plan advances to another day.
function workout_session_is_scheduled_today($db, $user_id, $session) {
    if (!workout_session_is_today($session)) return false;
    $stmt = $db->prepare(
        'SELECT p.id, p.days_per_week FROM user_plans up JOIN workout_plans p ON p.id = up.plan_id WHERE up.user_id = ?'
    );
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $plan = $stmt->get_result()->fetch_assoc();
    if (!$plan || (int) $plan['id'] !== (int) $session['plan_id']) return false;
    $weekdays = TRAINING_WEEKDAYS;
    $today = new DateTimeImmutable('now', new DateTimeZone('America/New_York'));
    $slot = array_search((int) $today->format('N') - 1, $weekdays[(int) $plan['days_per_week']] ?? $weekdays[3], true);
    if ($slot === false) return false;
    $stmt = $db->prepare('SELECT name FROM workout_plan_days WHERE plan_id = ? ORDER BY position');
    $stmt->bind_param('i', $plan['id']);
    $stmt->execute();
    $days = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    return $days && $session['day_name'] === $days[$slot % count($days)]['name'];
}

// The same wording as src/workoutLog/setValidation.js, so the form and the server refuse the same values.
const SET_MESSAGES = [
    'weightEmpty' => 'Enter a weight (0 for bodyweight).',
    'weightNotNumber' => 'Enter a weight as a number.',
    'weightRange' => 'Weight must be between 0 and 1500 lb.',
    'weightDecimals' => 'Use at most 2 decimal places, like 137.25.',
    'repsEmpty' => 'Enter your reps.',
    'repsNotNumber' => 'Enter reps as a number.',
    'repsWhole' => 'Reps must be a whole number.',
    'repsRange' => 'Reps must be between 1 and 100.',
];

function workout_user_id($db) {
    if (empty($_COOKIE['gymrank_session'])) respond(401, ['error' => 'Please log in.']);
    $hash = hash('sha256', $_COOKIE['gymrank_session']);
    $stmt = $db->prepare('SELECT user_id FROM auth_sessions WHERE token_hash = ? AND expires_at > UTC_TIMESTAMP()');
    $stmt->bind_param('s', $hash);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    if (!$row) respond(401, ['error' => 'Please log in.']);
    return (int) $row['user_id'];
}

// "2026-10-13 19:27:47" -> "2026-10-13T19:27:47Z"
function iso_time($datetime) {
    return $datetime === null ? null : str_replace(' ', 'T', $datetime) . 'Z';
}

// DECIMAL columns come back as strings; send whole numbers as 135, not 135.0 or "135.00".
function json_number($value) {
    $number = (float) $value;
    return $number == floor($number) ? (int) $number : $number;
}

// The session with this id if it belongs to the user, else null. $lock holds the row until the transaction ends,
// so a set being saved and Complete can't interleave.
function find_session($db, $session_id, $user_id, $lock = false) {
    $stmt = $db->prepare(
        'SELECT id, plan_id, plan_name, day_name, focus, exercises, started_at, completed_at,
                TIMESTAMPDIFF(SECOND, started_at, completed_at) AS duration_seconds
         FROM workout_sessions WHERE id = ? AND user_id = ?' . ($lock ? ' FOR UPDATE' : '')
    );
    $stmt->bind_param('ii', $session_id, $user_id);
    $stmt->execute();
    return $stmt->get_result()->fetch_assoc();
}

function exercise_names($session) {
    $names = json_decode($session['exercises'], true);
    return is_array($names) ? array_values(array_filter($names, 'is_string')) : [];
}

function set_json($row) {
    return [
        'id' => (int) $row['id'],
        'exercise' => $row['exercise'],
        'set_number' => (int) $row['set_number'],
        'weight_lb' => json_number($row['weight_lb']),
        'reps' => (int) $row['reps'],
        'logged_at' => iso_time($row['logged_at']),
        'updated_at' => iso_time($row['updated_at']),
    ];
}

function find_set($db, $set_id) {
    $stmt = $db->prepare('SELECT id, exercise, set_number, weight_lb, reps, logged_at, updated_at FROM workout_sets WHERE id = ?');
    $stmt->bind_param('i', $set_id);
    $stmt->execute();
    return set_json($stmt->get_result()->fetch_assoc());
}

// The full session as the active workout, completion summary and history screens read it.
function session_json($db, $session) {
    $stmt = $db->prepare(
        'SELECT id, exercise, set_number, weight_lb, reps, logged_at, updated_at
         FROM workout_sets WHERE session_id = ? ORDER BY set_number, id'
    );
    $stmt->bind_param('i', $session['id']);
    $stmt->execute();
    $by_exercise = [];
    foreach ($stmt->get_result()->fetch_all(MYSQLI_ASSOC) as $row) {
        $set = set_json($row);
        unset($set['exercise']);
        $by_exercise[$row['exercise']][] = $set;
    }

    $exercises = [];
    $set_count = $total_reps = $exercise_count = 0;
    $volume = 0.0;
    foreach (exercise_names($session) as $name) {
        $sets = $by_exercise[$name] ?? [];
        $exercises[] = ['name' => $name, 'sets' => $sets];
        if ($sets) $exercise_count++;
        foreach ($sets as $set) {
            $set_count++;
            $total_reps += $set['reps'];
            $volume += $set['weight_lb'] * $set['reps'];
        }
    }

    $completed = $session['completed_at'] !== null;
    return [
        'id' => (int) $session['id'],
        'plan' => $session['plan_name'],
        'name' => $session['day_name'],
        'focus' => $session['focus'],
        'started_at' => iso_time($session['started_at']),
        'completed_at' => iso_time($session['completed_at']),
        'exercises' => $exercises,
        'summary' => $completed ? [
            'exercise_count' => $exercise_count,
            'set_count' => $set_count,
            'total_reps' => $total_reps,
            'total_volume_lb' => json_number(round($volume, 2)),
            'duration_seconds' => (int) $session['duration_seconds'],
        ] : null,
    ];
}

// A request value as plain text for validation: numbers and strings are accepted, nothing else is a number.
// Returns '' when missing, false when it isn't a number or string.
function number_text($raw) {
    if ($raw === null) return '';
    if (is_int($raw) || is_float($raw)) return rtrim(rtrim(sprintf('%.10F', $raw), '0'), '.');
    return is_string($raw) ? trim($raw) : false;
}

// Plain decimal numbers only, so "1e3", "0x10" and "12abc" are refused rather than quietly converted.
function is_plain_number($text) {
    return $text !== false && preg_match('/^-?(\d+\.?\d*|\.\d+)$/', $text) === 1;
}

// Checks weight_lb and reps from the request body. Both are always checked so every problem is reported at once.
// Returns [weight as a "135.50" string, reps as an int], or answers 400 with errors.weight_lb / errors.reps.
function validated_set_values($data) {
    $errors = [];

    $weight = number_text($data['weight_lb'] ?? null);
    if ($weight === '') {
        $errors['weight_lb'] = SET_MESSAGES['weightEmpty'];
    } elseif (!is_plain_number($weight)) {
        $errors['weight_lb'] = SET_MESSAGES['weightNotNumber'];
    } elseif ((float) $weight < 0 || (float) $weight > WEIGHT_MAX_LB) {
        $errors['weight_lb'] = SET_MESSAGES['weightRange'];
    } elseif (strlen(rtrim(explode('.', $weight)[1] ?? '', '0')) > 2) {
        $errors['weight_lb'] = SET_MESSAGES['weightDecimals'];
    }

    $reps = number_text($data['reps'] ?? null);
    if ($reps === '') {
        $errors['reps'] = SET_MESSAGES['repsEmpty'];
    } elseif (!is_plain_number($reps)) {
        $errors['reps'] = SET_MESSAGES['repsNotNumber'];
    } elseif ((float) $reps != floor((float) $reps)) {
        $errors['reps'] = SET_MESSAGES['repsWhole'];
    } elseif ((float) $reps < REPS_MIN || (float) $reps > REPS_MAX) {
        $errors['reps'] = SET_MESSAGES['repsRange'];
    }

    if ($errors) respond(400, ['error' => 'Invalid set', 'errors' => $errors]);
    return [number_format((float) $weight, 2, '.', ''), (int) $reps];
}

// A positive whole number from the request body, or null.
function positive_int($value) {
    return is_int($value) && $value > 0 ? $value : null;
}
