<?php
require __DIR__ . '/../api/weekly123_fixtures.php';
function check123($condition, $message) { if (!$condition) throw new RuntimeException($message); }
$zone = new DateTimeZone('America/New_York');
foreach (['2026-11-09 00:01:00', '2026-11-10 12:00:00', '2026-03-09 12:00:00', '2026-11-02 12:00:00'] as $value) {
    $now = new DateTimeImmutable($value, $zone);
    $monday = goal_week_start($now);
    check123($monday->format('N') === '1', 'week is not Monday');
    check123($monday->format('Y-m-d') <= $now->format('Y-m-d'), 'week starts in future');
    foreach (WEEKLY123_TEST_ACCOUNTS as $number => $aliases) {
        check123($number >= 1 && $number <= 16, 'bad test number');
        foreach ($aliases as $alias) {
            $spec = weekly123_spec($alias);
            foreach ($spec['current'] ?? [] as $offset) {
                $date = weekly123_date($monday, $offset === 0 ? 'today' : $offset, $now);
                check123($date <= $now, 'future current-week workout');
            }
            foreach ($spec['previous'] ?? [] as $offset) {
                $date = weekly123_date($monday->modify('-7 days'), $offset, $now);
                check123($date < $monday, 'historical workout in current week');
            }
        }
    }
}
check123(weekly123_spec('progress')['current'] === [0], 'progress fixture');
check123(empty(weekly123_spec('one')['current']) && weekly123_spec('one')['active'], 'one fixture');
check123(weekly123_spec('finish')['target'] === 1 && weekly123_spec('finish')['active'], 'finish fixture');
check123(weekly123_spec('duplicate')['previous'] === [0, 0, 1], 'duplicate fixture');
check123(weekly123_spec('history')['previous'] === [0, 2, 4], 'Wednesday-Friday history fixture');
$spring = weekly123_date(goal_week_start(new DateTimeImmutable('2026-03-09 12:00:00', $zone))->modify('-7 days'), 4, new DateTimeImmutable('2026-03-09 12:00:00', $zone));
$fall = weekly123_date(goal_week_start(new DateTimeImmutable('2026-11-02 12:00:00', $zone))->modify('-7 days'), 4, new DateTimeImmutable('2026-11-02 12:00:00', $zone));
check123($spring->setTimezone(new DateTimeZone('UTC'))->format('H:i') === '17:00', 'spring DST fixture time');
check123($fall->setTimezone(new DateTimeZone('UTC'))->format('H:i') === '16:00', 'fall DST fixture time');
$before_rollover = new DateTimeImmutable('2026-11-15 23:59:59', $zone);
$after_rollover = new DateTimeImmutable('2026-11-16 00:00:00', $zone);
check123(goal_week_start($before_rollover)->format('Y-m-d') === '2026-11-09', 'Sunday week boundary');
check123(goal_week_start($after_rollover)->format('Y-m-d') === '2026-11-16', 'Monday rollover');
echo "ok weekly123 Monday, DST, allowlist and no future workouts\n";
