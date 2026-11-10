<?php
// Optional local MySQL integration check. Everything is rolled back; never run against a shared database.
require __DIR__ . '/../api/config.php';
if (PHP_SAPI !== 'cli' || !in_array(DB_HOST, ['localhost', '127.0.0.1', '::1'], true)
    || (defined('GYMRANK_WEEKLY123_ENV') ? GYMRANK_WEEKLY123_ENV : '') !== 'local') {
    throw new RuntimeException('This check requires the explicitly configured local test database');
}
require __DIR__ . '/../api/weekly123_fixtures.php';
function expect123($condition, $message) { if (!$condition) throw new RuntimeException($message); }
$db = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
$db->set_charset('utf8mb4');
$db->begin_transaction();
try {
    $email = 'weekly123-progress@example.com';
    $stmt = $db->prepare('SELECT id FROM users WHERE email = ? FOR UPDATE');
    $stmt->bind_param('s', $email); $stmt->execute();
    $user = (int) ($stmt->get_result()->fetch_assoc()['id'] ?? 0);
    expect123($user > 0, 'bootstrap accounts missing');
    $client = '00000000-0000-4000-8000-000000000001';
    $first = ['test' => 1, 'client_id' => $client, 'run_id' => '00000000-0000-4000-8000-000000000002'];
    expect123(weekly123_start($db, $user, $first, 'progress'), 'first start failed');
    $count = fn() => (int) $db->query("SELECT COUNT(*) AS n FROM workout_sessions WHERE user_id = $user AND completed_at IS NOT NULL")->fetch_assoc()['n'];
    expect123($count() === 1, 'progress did not get one completed workout');
    $set = $db->query("SELECT st.weight_lb, st.reps FROM workout_sets st JOIN workout_sessions s ON s.id = st.session_id WHERE s.user_id = $user LIMIT 1")->fetch_assoc();
    expect123((float) $set['weight_lb'] === 135.0 && (int) $set['reps'] === 8, 'wrong seeded set');
    $db->query("DELETE FROM workout_sessions WHERE user_id = $user");
    expect123(weekly123_start($db, $user, $first, 'progress') && $count() === 0, 'same run reset after refresh/relogin');
    $other = ['test' => 1, 'client_id' => '00000000-0000-4000-8000-000000000003', 'run_id' => '00000000-0000-4000-8000-000000000004'];
    expect123(!weekly123_start($db, $user, $other, 'progress') && $count() === 0, 'other tester reset an active run');
    $next = ['test' => 13, 'client_id' => $client, 'run_id' => '00000000-0000-4000-8000-000000000005'];
    expect123(weekly123_start($db, $user, $next, 'progress') && $count() === 1, 'new explicit run did not reset');
    $stmt = $db->prepare("SELECT target_days FROM user_weekly_goals WHERE user_id = ? AND week_start = ?");
    $week = goal_week_start(new DateTimeImmutable('now', new DateTimeZone(GOAL_TIME_ZONE)))->format('Y-m-d');
    $stmt->bind_param('is', $user, $week); $stmt->execute();
    expect123((int) $stmt->get_result()->fetch_assoc()['target_days'] === 3, 'wrong current target');
    $history_email = 'weekly123-history@example.com';
    $stmt = $db->prepare('SELECT id FROM users WHERE email = ? FOR UPDATE');
    $stmt->bind_param('s', $history_email); $stmt->execute();
    $history = (int) $stmt->get_result()->fetch_assoc()['id'];
    weekly123_prepare($db, $history, 'history', new DateTimeImmutable('now', new DateTimeZone(GOAL_TIME_ZONE)));
    $stmt = $db->prepare('SELECT g.target_days, g.completed_dates FROM workout_weekly_goal_snapshots g JOIN workout_sessions s ON s.id = g.session_id WHERE s.user_id = ? ORDER BY s.completed_at DESC LIMIT 1');
    $stmt->bind_param('i', $history); $stmt->execute();
    $snapshot = $stmt->get_result()->fetch_assoc();
    expect123((int) $snapshot['target_days'] === 3 && count(json_decode($snapshot['completed_dates'], true)) === 2, 'historical snapshot changed');
    $stmt = $db->prepare('UPDATE user_weekly_goals SET target_days = 5 WHERE user_id = ? AND week_start = ?');
    $stmt->bind_param('is', $history, $week); $stmt->execute();
    $stmt = $db->prepare('SELECT g.target_days FROM workout_weekly_goal_snapshots g JOIN workout_sessions s ON s.id = g.session_id WHERE s.user_id = ? ORDER BY s.completed_at DESC LIMIT 1');
    $stmt->bind_param('i', $history); $stmt->execute();
    expect123((int) $stmt->get_result()->fetch_assoc()['target_days'] === 3, 'historical snapshot followed new goal');
    foreach (['zero', 'one', 'finish', 'duplicate', 'cancel', 'recovery', 'summary', 'boundary', 'failure', 'other', 'legacy'] as $alias) {
        $account_email = "weekly123-$alias@example.com";
        $stmt = $db->prepare('SELECT id FROM users WHERE email = ? FOR UPDATE');
        $stmt->bind_param('s', $account_email); $stmt->execute();
        $account = (int) ($stmt->get_result()->fetch_assoc()['id'] ?? 0);
        expect123($account > 0, "missing $alias account");
        weekly123_prepare($db, $account, $alias, new DateTimeImmutable('now', new DateTimeZone(GOAL_TIME_ZONE)));
    }
    $stmt = $db->prepare("SELECT COUNT(*) AS n FROM workout_sessions WHERE user_id = (SELECT id FROM users WHERE email = 'weekly123-duplicate@example.com') AND completed_at IS NOT NULL");
    $stmt->execute(); expect123((int) $stmt->get_result()->fetch_assoc()['n'] === 3, 'duplicate sessions missing');
    $stmt = $db->prepare("SELECT COUNT(*) AS n FROM workout_weekly_goal_snapshots g JOIN workout_sessions s ON s.id = g.session_id WHERE s.user_id = (SELECT id FROM users WHERE email = 'weekly123-legacy@example.com')");
    $stmt->execute(); expect123((int) $stmt->get_result()->fetch_assoc()['n'] === 0, 'legacy result was invented');
    echo "ok local reset, isolation, repeatability, relogin, concurrent lease and historical snapshot\n";
} finally {
    $db->rollback();
}
