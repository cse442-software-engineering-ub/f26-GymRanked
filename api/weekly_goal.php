<?php
// GET api/weekly_goal.php -> 200
//   {"time_zone":"America/New_York","week_start":"2026-10-26","week_end":"2026-11-01","target_days":3,
//    "target_locked":true,"completed_dates":["2026-10-26","2026-10-28"],"completed_count":2,"progress_days":2,
//    "progress_percent":67,"goal_reached":false,
//    "next_week":{"week_start":"2026-11-02","target_days":4,"saved":true}}
// POST api/weekly_goal.php {"target_days":4[,"week":"next"|"current"]} -> 200, the same body as GET
//
// The logged-in user's weekly training-day goal (card #89, the Monday visual brief). The user always comes from the
// gymrank_session cookie: nothing in the request can name another user, so each user's goal and days are their own.
//
// - A week runs Monday to Sunday in America/New_York time (UB's time zone, the same as the leaderboard reset in the
//   brief). week_start and week_end are those two dates, completed_dates are dates in that time zone.
// - completed_dates are the days this week on which the user finished a workout that has at least one saved set (the
//   same rule as api/complete_workout.php), oldest first. A day counts once however many sessions were finished on it.
//   completed_count is that number of days; progress_days is completed_count capped at target_days and
//   progress_percent is progress_days / target_days rounded to a whole percent, so a 4th day on a 3-day goal still
//   reads 3 of 3 and 100%. goal_reached is completed_count >= target_days.
// - Only finished workouts count and they are read from workout_sessions on every request, so the days follow the
//   workout history. Nothing about the plan is used: switching or clearing a plan changes neither the target nor
//   the days already earned.
// - target_days is 1 to 7. Until a target is saved for the week it is the target of the most recent earlier week the user
//   saved, or 3 if there is none (the brief's default). target_locked is true once the week's target is saved or a day is
//   earned, and the current week's target can't be changed after that ("This week's goal is locked so your circle stays
//   fair"). next_week.target_days is null until a target is chosen for next week; choosing again replaces it until next
//   Monday, when it becomes the current week's target. Nothing is written by GET.
// - POST saves "next" (the default) or "current". A current-week target is refused with 409 once locked.
//
// 400 {"error":"Invalid request.","errors":{"target_days"|"week": "..."}}, 401 not logged in, 405 with Allow: GET, POST,
// 409 this week's goal is locked, 415/413/403 as the other POST endpoints, 500 {"error":"Database error"}.

require __DIR__ . '/workout_common.php';

const GOAL_TIME_ZONE = 'America/New_York';
const GOAL_DEFAULT_DAYS = 3;
const GOAL_MIN_DAYS = 1;
const GOAL_MAX_DAYS = 7;

$method = $_SERVER['REQUEST_METHOD'] ?? '';
if (!in_array($method, ['GET', 'POST'], true)) {
    header('Allow: GET, POST');
    respond(405, ['error' => 'Method not allowed.']);
}
$data = $method === 'POST' ? input() : [];
$db = database();
$user_id = workout_user_id($db);

$zone = new DateTimeZone(GOAL_TIME_ZONE);
$week_start = (new DateTimeImmutable('now', $zone))->setTime(0, 0);
$week_start = $week_start->modify('-' . ((int) $week_start->format('N') - 1) . ' days');
$next_start = $week_start->modify('+7 days');
$date_text = fn($date) => $date->format('Y-m-d');

// The target saved for a week (as an int), or null.
function saved_target($db, $user_id, $week) {
    $stmt = $db->prepare('SELECT target_days FROM user_weekly_goals WHERE user_id = ? AND week_start = ?');
    $stmt->bind_param('is', $user_id, $week);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    return $row ? (int) $row['target_days'] : null;
}

// The dates (Y-m-d, New York time, oldest first) of the user's finished workouts with a saved set from this week.
function completed_dates($db, $user_id, $week_start, $next_start, $zone) {
    $utc = new DateTimeZone('UTC');
    $from = $week_start->setTimezone($utc)->format('Y-m-d H:i:s');
    $to = $next_start->setTimezone($utc)->format('Y-m-d H:i:s');
    $stmt = $db->prepare(
        'SELECT s.completed_at FROM workout_sessions s
         WHERE s.user_id = ? AND s.completed_at >= ? AND s.completed_at < ?
           AND EXISTS (SELECT 1 FROM workout_sets st WHERE st.session_id = s.id)
         ORDER BY s.completed_at'
    );
    $stmt->bind_param('iss', $user_id, $from, $to);
    $stmt->execute();
    $dates = [];
    foreach ($stmt->get_result()->fetch_all(MYSQLI_ASSOC) as $row) {
        $dates[(new DateTimeImmutable($row['completed_at'], $utc))->setTimezone($zone)->format('Y-m-d')] = true;
    }
    return array_keys($dates);
}

// The whole response for the current state.
function goal_json($db, $user_id, $week_start, $next_start, $zone) {
    $week = $week_start->format('Y-m-d');
    $dates = completed_dates($db, $user_id, $week_start, $next_start, $zone);

    $target = saved_target($db, $user_id, $week);
    $saved = $target !== null;
    if (!$saved) {
        $stmt = $db->prepare(
            'SELECT target_days FROM user_weekly_goals WHERE user_id = ? AND week_start < ?
             ORDER BY week_start DESC LIMIT 1'
        );
        $stmt->bind_param('is', $user_id, $week);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $target = $row ? (int) $row['target_days'] : GOAL_DEFAULT_DAYS;
    }

    $count = count($dates);
    $progress = min($count, $target);
    $next = saved_target($db, $user_id, $next_start->format('Y-m-d'));
    return [
        'time_zone' => GOAL_TIME_ZONE,
        'week_start' => $week,
        'week_end' => $week_start->modify('+6 days')->format('Y-m-d'),
        'target_days' => $target,
        'target_locked' => $saved || $count > 0,
        'completed_dates' => $dates,
        'completed_count' => $count,
        'progress_days' => $progress,
        'progress_percent' => (int) round($progress * 100 / $target),
        'goal_reached' => $count >= $target,
        'next_week' => [
            'week_start' => $next_start->format('Y-m-d'),
            'target_days' => $next,
            'saved' => $next !== null,
        ],
    ];
}

if ($method === 'GET') respond(200, goal_json($db, $user_id, $week_start, $next_start, $zone));

$errors = [];
$days = $data['target_days'] ?? null;
if (!is_int($days) || $days < GOAL_MIN_DAYS || $days > GOAL_MAX_DAYS) {
    $errors['target_days'] = 'Choose a whole number of days from ' . GOAL_MIN_DAYS . ' to ' . GOAL_MAX_DAYS . '.';
}
$which = $data['week'] ?? 'next';
if ($which !== 'next' && $which !== 'current') $errors['week'] = 'Use "next" or "current".';
if ($errors) respond(400, ['error' => 'Invalid request.', 'errors' => $errors]);

if ($which === 'next') {
    // Choosing again replaces the choice until the week starts.
    $week = $date_text($next_start);
    $stmt = $db->prepare(
        'INSERT INTO user_weekly_goals (user_id, week_start, target_days, created_at, updated_at)
         VALUES (?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())
         ON DUPLICATE KEY UPDATE target_days = VALUES(target_days), updated_at = UTC_TIMESTAMP()'
    );
    $stmt->bind_param('isi', $user_id, $week, $days);
    $stmt->execute();
} else {
    // Only while nothing is saved for this week and no day is earned yet. INSERT IGNORE keeps two requests at the
    // same time from replacing each other: one saves, the other finds the row and gets the 409.
    $week = $date_text($week_start);
    if (completed_dates($db, $user_id, $week_start, $next_start, $zone)) {
        respond(409, ['error' => "This week's goal is locked."]);
    }
    $stmt = $db->prepare(
        'INSERT IGNORE INTO user_weekly_goals (user_id, week_start, target_days, created_at, updated_at)
         VALUES (?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())'
    );
    $stmt->bind_param('isi', $user_id, $week, $days);
    $stmt->execute();
    if ($stmt->affected_rows === 0) respond(409, ['error' => "This week's goal is locked."]);
}
respond(200, goal_json($db, $user_id, $week_start, $next_start, $zone));
