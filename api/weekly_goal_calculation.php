<?php
// Shared counting rules for the live weekly goal and immutable workout snapshots.
// Stored workout times are UTC; week boundaries and distinct days are New York dates.

require_once __DIR__ . '/counted_workouts.php';

const GOAL_TIME_ZONE = 'America/New_York';
const GOAL_DEFAULT_DAYS = 3;

function goal_week_start($date) {
    $start = $date->setTimezone(new DateTimeZone(GOAL_TIME_ZONE))->setTime(0, 0);
    return $start->modify('-' . ((int) $start->format('N') - 1) . ' days');
}

function goal_saved_target($db, $user_id, $week) {
    $stmt = $db->prepare('SELECT target_days FROM user_weekly_goals WHERE user_id = ? AND week_start = ?');
    $stmt->bind_param('is', $user_id, $week);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    return $row ? (int) $row['target_days'] : null;
}

function goal_target_for_week($db, $user_id, $week) {
    $saved = goal_saved_target($db, $user_id, $week);
    if ($saved !== null) return $saved;
    $stmt = $db->prepare(
        'SELECT target_days FROM user_weekly_goals WHERE user_id = ? AND week_start < ?
         ORDER BY week_start DESC LIMIT 1'
    );
    $stmt->bind_param('is', $user_id, $week);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    return $row ? (int) $row['target_days'] : GOAL_DEFAULT_DAYS;
}

// If $through is supplied, include only workouts up to that UTC time. A workout without a saved set never counts. An
// unfinished workout from an earlier day counts (api/counted_workouts.php); its row's completed_at is the time it
// belongs to, which for an unfinished one is when it was started. Completion takes the user-row lock, so no later
// completion for this user can enter this query.
function goal_completed_workouts($db, $user_id, $week_start, $next_start, $through = null) {
    $utc = new DateTimeZone('UTC');
    $from = $week_start->setTimezone($utc)->format('Y-m-d H:i:s');
    $to = $next_start->setTimezone($utc)->format('Y-m-d H:i:s');
    $counted = counted_workout_sql('s');
    $at = counted_workout_time_sql('s');
    $stmt = $db->prepare(
        "SELECT s.id, $at AS completed_at FROM workout_sessions s
         WHERE s.user_id = ? AND $counted AND $at >= ? AND $at < ?
           AND (? IS NULL OR $at <= ?)
           AND EXISTS (SELECT 1 FROM workout_sets st WHERE st.session_id = s.id)
         ORDER BY $at, s.id"
    );
    $stmt->bind_param('issss', $user_id, $from, $to, $through, $through);
    $stmt->execute();
    return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
}

function goal_dates_and_credit($rows, $zone, $session_id = null) {
    $dates = [];
    $current_day = null;
    $other_days = [];
    $utc = new DateTimeZone('UTC');
    foreach ($rows as $row) {
        $day = (new DateTimeImmutable($row['completed_at'], $utc))->setTimezone($zone)->format('Y-m-d');
        if ($session_id !== null && (int) $row['id'] === $session_id) $current_day = $day;
        else $other_days[$day] = true;
        $dates[$day] = true;
    }
    if ($session_id !== null && $current_day === null) throw new RuntimeException('Completed session missing from weekly goal');
    return [array_keys($dates), $current_day !== null && !isset($other_days[$current_day])];
}

function goal_progress_values($dates, $target) {
    $count = count($dates);
    $progress = min($count, $target);
    return [
        'completed_count' => $count,
        'progress_days' => $progress,
        'progress_percent' => (int) round($progress * 100 / $target),
        'goal_reached' => $count >= $target,
    ];
}
