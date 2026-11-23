<?php
// Which workouts count toward rankings and the weekly goal (card #134). One rule, used by api/leaderboard.php,
// api/weekly_standings.php and api/weekly_goal_calculation.php so they can never disagree:
//
// - A finished workout counts, as it always has.
// - A workout left unfinished counts once its New York day is over, as long as it has at least one saved set. Its sets
//   are kept as they were (never completed or deleted for the user); a partial workout simply carries fewer sets, so it
//   earns less on the strength board and still counts as a training day for consistency.
// - Today's workout still in progress does not count until it is finished or the day ends.
// - An unfinished workout with no saved set counts for nothing: there is nothing to keep.
//
// The day a workout belongs to is its finish time, or for an unfinished one the time it was started (sets cannot be
// logged after the day ends, so that is when the work was done). Times are UTC; callers turn them into New York dates.

function counted_workout_day_start_utc($now = null) {
    $now = $now ?? new DateTimeImmutable('now', new DateTimeZone('America/New_York'));
    $start = $now->setTimezone(new DateTimeZone('America/New_York'))->setTime(0, 0);
    return $start->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s');
}

// SQL condition: "this workout counts". $s is the workout_sessions alias. The only value put into the SQL is a date this
// function formats itself, never user input.
function counted_workout_sql($s = 's', $now = null) {
    $day_start = counted_workout_day_start_utc($now);
    return "($s.completed_at IS NOT NULL OR ($s.started_at < '$day_start' AND EXISTS "
        . "(SELECT 1 FROM workout_sets counted_sets WHERE counted_sets.session_id = $s.id)))";
}

// SQL expression: the UTC time a counted workout belongs to.
function counted_workout_time_sql($s = 's') {
    return "COALESCE($s.completed_at, $s.started_at)";
}
