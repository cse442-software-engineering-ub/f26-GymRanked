<?php
// Generate card #123's SQL for the CURRENT New York week; this script never connects to a database.
// Run Wednesday-Sunday, then load the output before the manual tests. --date=YYYY-MM-DD is for local review.

$zone = new DateTimeZone('America/New_York');
$utc = new DateTimeZone('UTC');
$arg = $argv[1] ?? null;
if ($arg !== null && !preg_match('/^--date=\d{4}-\d{2}-\d{2}$/', $arg)) {
    fwrite(STDERR, "Usage: php build_weekly_milestone_seed.php [--date=YYYY-MM-DD]\n");
    exit(1);
}
$today = $arg ? new DateTimeImmutable(substr($arg, 7), $zone) : new DateTimeImmutable('now', $zone);
if ((int) $today->format('N') < 3) {
    fwrite(STDERR, "Run this seed Wednesday-Sunday so two earlier training dates exist this week.\n");
    exit(1);
}
$monday = $today->setTime(0, 0)->modify('-' . ((int) $today->format('N') - 1) . ' days');
$last_monday = $monday->modify('-7 days');
$day = fn($date) => $date->format('Y-m-d');
$quoted = fn($value) => "'" . str_replace("'", "''", $value) . "'";
$hash = '$2y$12$KH2XzC8xBmU8rJJo/bsghOXd1l29sJozEoum/6eoOZLGF8auwwTIC';

// Offsets are New York weekdays, Monday=0. 'today' uses the actual time when the SQL is loaded.
// Each account's completed sessions are in chronological order. A second session on one date earns no new day.
$cases = [
    'progress' => ['days' => [0, 2]],
    'zero' => ['days' => []],
    'one' => ['days' => [0], 'active' => true],
    'finish' => ['days' => [0, 1], 'active' => true],
    'duplicate' => ['days' => [0, 0, 1], 'sets' => 2],
    'cancel' => ['days' => [0], 'active' => true],
    'recovery' => ['days' => [0, 2]],
    'summary' => ['days' => [0, 0, 1]],
    'boundary' => ['days' => [-7, -5, -3]],
    'failure' => ['days' => [0, 1], 'active' => true],
    'other' => ['days' => [], 'target' => 2],
    'history' => ['days' => [-7, -5], 'target' => 4, 'previous_target' => 3],
    'legacy' => ['days' => [-7], 'legacy' => true],
];

function emit($sql) { echo $sql, "\n"; }
function timestamp_for($date, $today, $occurrence, $quoted) {
    if ($date->format('Y-m-d') === $today->format('Y-m-d')) return 'UTC_TIMESTAMP() - INTERVAL 10 MINUTE';
    $hour = 18 + $occurrence;
    return $quoted($date->setTime($hour, 0)->setTimezone(new DateTimeZone('UTC'))
        ->format('Y-m-d H:i:s'));
}

emit('-- Card #123 only. Generated for New York week ' . $day($monday) . ' through ' . $day($monday->modify('+6 days')) . '.');
emit('-- Requires migrations 001-016. Load Wednesday-Sunday before each test run; active sessions expire after today.');
emit('-- Only the 13 explicitly named weekly123-* accounts below are reset. Do not load on cattle.');
emit('START TRANSACTION;');
// Copy the users.email collation so the scoped JOINs work across databases with different defaults.
emit('CREATE TEMPORARY TABLE seed_123_emails AS SELECT email FROM users WHERE 1 = 0;');
emit('INSERT INTO seed_123_emails (email) VALUES');
$values = [];
foreach ($cases as $name => $_) $values[] = '  (' . $quoted("weekly123-$name@example.com") . ')';
emit(implode(",\n", $values) . ';');
emit("SET @plan = (SELECT id FROM workout_plans WHERE name = 'Beginner Fundamentals');");
emit('INSERT INTO users (full_name, email, password_hash, is_test) VALUES');
$values = [];
foreach ($cases as $name => $_) {
    $values[] = '  (' . $quoted('Weekly ' . ucfirst($name)) . ', ' . $quoted("weekly123-$name@example.com") . ', ' . $quoted($hash) . ', 0)';
}
emit(implode(",\n", $values) . "\nON DUPLICATE KEY UPDATE full_name = VALUES(full_name), password_hash = VALUES(password_hash), is_test = 0;");
foreach (['workout_sessions', 'user_weekly_goals', 'user_plans', 'user_equipment', 'user_setup', 'user_preferences', 'user_profile'] as $table) {
    emit("DELETE FROM $table WHERE user_id IN (SELECT u.id FROM users u JOIN seed_123_emails e ON e.email = u.email);");
}

foreach ($cases as $name => $case) {
    $email = $quoted("weekly123-$name@example.com");
    $uid = "(SELECT id FROM users WHERE email = $email)";
    $target = $case['target'] ?? 3;
    emit("INSERT INTO user_profile (user_id, bodyweight_lb, gender) VALUES ($uid, 180.0, 'man');");
    emit("INSERT INTO user_preferences (user_id, training_goal) VALUES ($uid, 'strength');");
    emit("INSERT INTO user_setup (user_id, experience) VALUES ($uid, 'beginner');");
    emit("INSERT INTO user_equipment (user_id, equipment) VALUES ($uid, 'full_gym');");
    emit("INSERT INTO user_plans (user_id, plan_id) VALUES ($uid, @plan);");
    emit("INSERT INTO user_weekly_goals (user_id, week_start, target_days, created_at, updated_at) VALUES ($uid, " . $quoted($day($monday)) . ", $target, UTC_TIMESTAMP(), UTC_TIMESTAMP());");
    if (isset($case['previous_target'])) {
        emit("INSERT INTO user_weekly_goals (user_id, week_start, target_days, created_at, updated_at) VALUES ($uid, " . $quoted($day($last_monday)) . ", {$case['previous_target']}, UTC_TIMESTAMP(), UTC_TIMESTAMP());");
    }

    $dates_by_week = [];
    $occurrences = [];
    foreach ($case['days'] as $offset) {
        $date = $monday->modify(($offset < 0 ? '' : '+') . $offset . ' days');
        $date_text = $day($date);
        $week = $offset < 0 ? $last_monday : $monday;
        $week_text = $day($week);
        $occurrence = $occurrences[$date_text] ?? 0;
        $occurrences[$date_text] = $occurrence + 1;
        $finished = timestamp_for($date, $today, $occurrence, $quoted);
        $started = "DATE_SUB($finished, INTERVAL 40 MINUTE)";
        $logged = "DATE_ADD($started, INTERVAL 5 MINUTE)";
        emit("INSERT INTO workout_sessions (user_id, plan_id, plan_name, day_name, focus, exercises, started_at, completed_at)");
        emit("SELECT id, @plan, 'Beginner Fundamentals', 'Full body A', 'Form and technique', JSON_ARRAY('Goblet squat'), $started, $finished FROM users WHERE email = $email;");
        emit('SET @seed_123_session = LAST_INSERT_ID();');
        $sets = $case['sets'] ?? 1;
        for ($set = 1; $set <= $sets; $set++) {
            emit('INSERT INTO workout_sets (session_id, exercise, set_number, weight_lb, reps, logged_at, updated_at)');
            emit("VALUES (@seed_123_session, 'Goblet squat', $set, 135, 8, $logged, $logged);");
        }
        if (empty($case['legacy'])) {
            $dates_by_week[$week_text][$date_text] = true;
            $completed = array_keys($dates_by_week[$week_text]);
            $json_dates = implode(', ', array_map($quoted, $completed));
            $credit = $occurrence === 0 ? 1 : 0;
            $snapshot_target = $offset < 0 ? ($case['previous_target'] ?? 3) : $target;
            emit('INSERT INTO workout_weekly_goal_snapshots (session_id, week_start, target_days, completed_dates, credited_day)');
            emit("VALUES (@seed_123_session, " . $quoted($week_text) . ", $snapshot_target, JSON_ARRAY($json_dates), $credit);");
        }
    }
    if (!empty($case['active'])) {
        emit('INSERT INTO workout_sessions (user_id, plan_id, plan_name, day_name, focus, exercises, started_at, completed_at)');
        emit("SELECT id, @plan, 'Beginner Fundamentals', 'Full body A', 'Form and technique', JSON_ARRAY('Goblet squat'), UTC_TIMESTAMP(), NULL FROM users WHERE email = $email;");
        emit('SET @seed_123_session = LAST_INSERT_ID();');
        emit('INSERT INTO workout_sets (session_id, exercise, set_number, weight_lb, reps, logged_at, updated_at)');
        emit("VALUES (@seed_123_session, 'Goblet squat', 1, 135, 8, UTC_TIMESTAMP(), UTC_TIMESTAMP());");
    }
}
emit('DROP TEMPORARY TABLE seed_123_emails;');
emit('COMMIT;');
emit("SELECT u.email, (SELECT COUNT(*) FROM workout_sessions s WHERE s.user_id = u.id AND s.completed_at IS NOT NULL) AS completed_sessions, (SELECT COUNT(*) FROM workout_weekly_goal_snapshots g JOIN workout_sessions s ON s.id = g.session_id WHERE s.user_id = u.id) AS saved_snapshots FROM users u WHERE u.email LIKE 'weekly123-%@example.com' ORDER BY u.email;");
