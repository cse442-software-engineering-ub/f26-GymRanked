<?php
// Card #123 fixtures are prepared only after a dedicated account's password was verified.
// The caller owns the user-row lock and transaction. No web route includes this file directly.
require_once __DIR__ . '/weekly_goal_calculation.php';

const WEEKLY123_LEASE_HOURS = 4;
const WEEKLY123_TEST_ACCOUNTS = [
    1 => ['progress'], 2 => ['zero'], 3 => ['one'], 4 => ['finish'],
    5 => ['duplicate'], 6 => ['cancel'], 7 => ['recovery'], 8 => ['summary'],
    9 => ['boundary'], 10 => ['failure'], 11 => ['progress', 'other'],
    12 => ['finish'], 13 => ['progress'], 14 => ['history'],
    15 => ['legacy'], 16 => ['duplicate'],
];

function weekly123_enabled() {
    require_once __DIR__ . '/config.php';
    if (!defined('GYMRANK_WEEKLY123_RESET') || GYMRANK_WEEKLY123_RESET !== true) return false;
    $mode = defined('GYMRANK_WEEKLY123_ENV') ? GYMRANK_WEEKLY123_ENV : '';
    $host = strtolower(gethostname());
    if ($mode === 'aptitude') return $host === 'aptitude' || $host === 'aptitude.cse.buffalo.edu';
    return $mode === 'local' && PHP_SAPI === 'cli-server'
        && in_array(DB_HOST, ['localhost', '127.0.0.1', '::1'], true)
        && in_array($_SERVER['SERVER_NAME'] ?? '', ['localhost', '127.0.0.1'], true);
}

function weekly123_marker($data, $email) {
    if (!array_key_exists('weekly123_run', $data)) return null;
    $run = $data['weekly123_run'];
    if (!is_array($run) || !is_int($run['test'] ?? null)
        || !is_string($run['client_id'] ?? null) || !is_string($run['run_id'] ?? null)
        || !preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $run['client_id'] ?? '')
        || !preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $run['run_id'] ?? '')) {
        respond(400, ['error' => 'Invalid card #123 test start.']);
    }
    $alias = substr($email, strlen('weekly123-'), -strlen('@example.com'));
    if (!str_starts_with($email, 'weekly123-') || !str_ends_with($email, '@example.com')
        || !in_array($alias, WEEKLY123_TEST_ACCOUNTS[$run['test']] ?? [], true)) {
        respond(403, ['error' => 'This account is not assigned to that card #123 test.']);
    }
    if (!weekly123_enabled()) respond(403, ['error' => 'Card #123 test resets are disabled here.']);
    return [$run, $alias];
}

function weekly123_spec($alias) {
    return match ($alias) {
        'progress' => ['target' => 3, 'current' => [0]],
        'zero' => ['target' => 3],
        'one' => ['target' => 3, 'active' => true],
        'finish' => ['target' => 1, 'active' => true],
        'duplicate' => ['target' => 3, 'previous' => [0, 0, 1], 'sets' => 2],
        'cancel' => ['target' => 3, 'active' => true],
        'recovery' => ['target' => 3, 'previous' => [2, 4]],
        'summary' => ['target' => 3, 'previous' => [0, 0, 1]],
        'boundary' => ['target' => 3, 'previous' => [0, 2, 4]],
        'failure' => ['target' => 1, 'active' => true],
        'other' => ['target' => 2],
        'history' => ['target' => 4, 'previous_target' => 3, 'previous' => [0, 2]],
        'legacy' => ['target' => 3, 'previous' => [0], 'legacy' => true],
    };
}

function weekly123_date($monday, $offset, $now) {
    if ($offset === 'today') return $now;
    return $monday->modify(($offset < 0 ? '' : '+') . $offset . ' days')->setTime(12, 0);
}

function weekly123_session($db, $user_id, $plan, $when, &$dates, $week, $target, $sets, $legacy = false, $active = false) {
    $utc = new DateTimeZone('UTC');
    $finished = $when->setTimezone($utc)->format('Y-m-d H:i:s');
    $started = $active ? $finished : $when->modify('-40 minutes')->setTimezone($utc)->format('Y-m-d H:i:s');
    $completed = $active ? null : $finished;
    $exercises = json_encode(['Goblet squat']);
    $stmt = $db->prepare("INSERT INTO workout_sessions (user_id, plan_id, plan_name, day_name, focus, exercises, started_at, completed_at)
        VALUES (?, ?, 'Beginner Fundamentals', 'Full body A', 'Form and technique', ?, ?, ?)");
    $stmt->bind_param('iisss', $user_id, $plan, $exercises, $started, $completed);
    $stmt->execute();
    $session_id = $db->insert_id;
    $stmt = $db->prepare("INSERT INTO workout_sets (session_id, exercise, set_number, weight_lb, reps, logged_at, updated_at)
        VALUES (?, 'Goblet squat', ?, 135, 8, ?, ?)");
    for ($number = 1; $number <= $sets; $number++) {
        $stmt->bind_param('iiss', $session_id, $number, $finished, $finished);
        $stmt->execute();
    }
    if ($active || $legacy) return;
    $day = $when->format('Y-m-d');
    $credited = !in_array($day, $dates, true);
    if ($credited) $dates[] = $day;
    $json = json_encode($dates, JSON_THROW_ON_ERROR);
    $credit = $credited ? 1 : 0;
    $stmt = $db->prepare('INSERT INTO workout_weekly_goal_snapshots (session_id, week_start, target_days, completed_dates, credited_day) VALUES (?, ?, ?, ?, ?)');
    $stmt->bind_param('isisi', $session_id, $week, $target, $json, $credit);
    $stmt->execute();
}

function weekly123_prepare($db, $user_id, $alias, $now) {
    $spec = weekly123_spec($alias);
    $monday = goal_week_start($now);
    $previous = $monday->modify('-7 days');
    $week = $monday->format('Y-m-d');
    $last_week = $previous->format('Y-m-d');
    $plan = $db->query("SELECT id FROM workout_plans WHERE name = 'Beginner Fundamentals'")->fetch_assoc()['id'] ?? null;
    if (!$plan) throw new RuntimeException('Card #123 plan is missing');
    $stmt = $db->prepare('UPDATE users SET is_test = 1 WHERE id = ?');
    $stmt->bind_param('i', $user_id); $stmt->execute();
    $stmt = $db->prepare('DELETE FROM auth_sessions WHERE user_id = ?');
    $stmt->bind_param('i', $user_id); $stmt->execute();
    // Session deletion cascades to sets and immutable snapshots. The user and any other account remain intact.
    foreach (['workout_sessions', 'user_weekly_goals', 'user_plans', 'user_equipment', 'user_setup', 'user_preferences', 'user_profile'] as $table) {
        $stmt = $db->prepare("DELETE FROM $table WHERE user_id = ?");
        $stmt->bind_param('i', $user_id);
        $stmt->execute();
    }
    $stmt = $db->prepare('INSERT INTO user_profile (user_id, bodyweight_lb, gender) VALUES (?, 180, \'man\')');
    $stmt->bind_param('i', $user_id); $stmt->execute();
    $stmt = $db->prepare("INSERT INTO user_preferences (user_id, training_goal) VALUES (?, 'strength')");
    $stmt->bind_param('i', $user_id); $stmt->execute();
    $stmt = $db->prepare("INSERT INTO user_setup (user_id, experience) VALUES (?, 'beginner')");
    $stmt->bind_param('i', $user_id); $stmt->execute();
    $stmt = $db->prepare("INSERT INTO user_equipment (user_id, equipment) VALUES (?, 'full_gym')");
    $stmt->bind_param('i', $user_id); $stmt->execute();
    $stmt = $db->prepare('INSERT INTO user_plans (user_id, plan_id) VALUES (?, ?)');
    $stmt->bind_param('ii', $user_id, $plan); $stmt->execute();
    $stmt = $db->prepare('INSERT INTO user_weekly_goals (user_id, week_start, target_days, created_at, updated_at) VALUES (?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())');
    $stmt->bind_param('isi', $user_id, $week, $spec['target']); $stmt->execute();
    if (!empty($spec['previous'])) {
        $old_target = $spec['previous_target'] ?? 3;
        $stmt->bind_param('isi', $user_id, $last_week, $old_target); $stmt->execute();
        $dates = [];
        foreach ($spec['previous'] as $offset) {
            weekly123_session($db, $user_id, $plan, weekly123_date($previous, $offset, $now), $dates, $last_week, $old_target, $spec['sets'] ?? 1, !empty($spec['legacy']));
        }
    }
    $dates = [];
    foreach ($spec['current'] ?? [] as $offset) {
        weekly123_session($db, $user_id, $plan, weekly123_date($monday, $offset === 0 ? 'today' : $offset, $now), $dates, $week, $spec['target'], $spec['sets'] ?? 1);
    }
    if (!empty($spec['active'])) weekly123_session($db, $user_id, $plan, $now, $dates, $week, $spec['target'], 1, false, true);
}

function weekly123_start($db, $user_id, $run, $alias) {
    $stmt = $db->prepare('SELECT client_id, run_id, lease_until FROM weekly123_test_runs WHERE user_id = ? FOR UPDATE');
    $stmt->bind_param('i', $user_id); $stmt->execute();
    $lease = $stmt->get_result()->fetch_assoc();
    if ($lease && $lease['client_id'] !== $run['client_id'] && $lease['lease_until'] > gmdate('Y-m-d H:i:s')) {
        return false; // The other tester's account is untouched.
    }
    if ($lease && $lease['client_id'] === $run['client_id'] && $lease['run_id'] === $run['run_id']) {
        $until = gmdate('Y-m-d H:i:s', time() + WEEKLY123_LEASE_HOURS * 3600);
        $stmt = $db->prepare('UPDATE weekly123_test_runs SET lease_until = ? WHERE user_id = ?');
        $stmt->bind_param('si', $until, $user_id); $stmt->execute();
        return true;
    }
    weekly123_prepare($db, $user_id, $alias, new DateTimeImmutable('now', new DateTimeZone(GOAL_TIME_ZONE)));
    $until = gmdate('Y-m-d H:i:s', time() + WEEKLY123_LEASE_HOURS * 3600);
    $stmt = $db->prepare('INSERT INTO weekly123_test_runs (user_id, client_id, run_id, test_number, started_at, lease_until) VALUES (?, ?, ?, ?, UTC_TIMESTAMP(), ?) ON DUPLICATE KEY UPDATE client_id = VALUES(client_id), run_id = VALUES(run_id), test_number = VALUES(test_number), started_at = VALUES(started_at), lease_until = VALUES(lease_until)');
    $stmt->bind_param('issis', $user_id, $run['client_id'], $run['run_id'], $run['test'], $until); $stmt->execute();
    return true;
}
