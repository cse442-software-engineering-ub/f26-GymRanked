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
require __DIR__ . '/weekly_goal_calculation.php';

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
$week_start = goal_week_start(new DateTimeImmutable('now', $zone));
$next_start = $week_start->modify('+7 days');
$date_text = fn($date) => $date->format('Y-m-d');

// The whole response for the current state.
function goal_json($db, $user_id, $week_start, $next_start, $zone) {
    $week = $week_start->format('Y-m-d');
    [$dates] = goal_dates_and_credit(goal_completed_workouts($db, $user_id, $week_start, $next_start), $zone);

    $saved = goal_saved_target($db, $user_id, $week) !== null;
    $target = goal_target_for_week($db, $user_id, $week);

    $progress = goal_progress_values($dates, $target);
    $next = goal_saved_target($db, $user_id, $next_start->format('Y-m-d'));
    return [
        'time_zone' => GOAL_TIME_ZONE,
        'week_start' => $week,
        'week_end' => $week_start->modify('+6 days')->format('Y-m-d'),
        'target_days' => $target,
        'target_locked' => $saved || $progress['completed_count'] > 0,
        'completed_dates' => $dates,
        ...$progress,
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

$db->begin_transaction();
// Serialize target changes with completion snapshots for this account.
$lock = $db->prepare('SELECT id FROM users WHERE id = ? FOR UPDATE');
$lock->bind_param('i', $user_id);
$lock->execute();
$lock->get_result();

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
    if (goal_completed_workouts($db, $user_id, $week_start, $next_start)) {
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
$db->commit();
respond(200, goal_json($db, $user_id, $week_start, $next_start, $zone));
