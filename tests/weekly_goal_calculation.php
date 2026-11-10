<?php
// Pure calculation checks; no database or shared test accounts needed.
require __DIR__ . '/../api/weekly_goal_calculation.php';

function same($expected, $actual, $label) {
    if ($expected !== $actual) {
        fwrite(STDERR, "$label: expected " . json_encode($expected) . ', got ' . json_encode($actual) . "\n");
        exit(1);
    }
}

$ny = new DateTimeZone(GOAL_TIME_ZONE);
$utc = new DateTimeZone('UTC');
same('2026-10-26', goal_week_start(new DateTimeImmutable('2026-11-02 04:59:59', $utc))->format('Y-m-d'), 'Sunday before NY midnight');
same('2026-11-09', goal_week_start(new DateTimeImmutable('2026-11-09 05:00:00', $utc))->format('Y-m-d'), 'Monday after NY midnight');
same('2026-03-02', goal_week_start(new DateTimeImmutable('2026-03-08 06:59:59', $utc))->format('Y-m-d'), 'DST Sunday');
same('2026-03-09', goal_week_start(new DateTimeImmutable('2026-03-09 04:00:00', $utc))->format('Y-m-d'), 'Monday after DST');

$rows = [
    ['id' => '10', 'completed_at' => '2026-11-02 18:00:00'],
    ['id' => '11', 'completed_at' => '2026-11-02 19:00:00'],
    ['id' => '12', 'completed_at' => '2026-11-04 18:00:00'],
];
[$dates, $credit] = goal_dates_and_credit($rows, $ny, 11);
same(['2026-11-02', '2026-11-04'], $dates, 'distinct days');
same(false, $credit, 'second workout on Monday');
[, $credit] = goal_dates_and_credit($rows, $ny, 12);
same(true, $credit, 'first workout on Wednesday');
[, $credit] = goal_dates_and_credit([
    ['id' => '22', 'completed_at' => '2026-11-04 18:00:00'],
    ['id' => '21', 'completed_at' => '2026-11-04 18:00:00'],
], $ny, 21);
same(false, $credit, 'second completion in the same second with lower id');
same(['completed_count' => 2, 'progress_days' => 2, 'progress_percent' => 67, 'goal_reached' => false], goal_progress_values($dates, 3), 'unfinished goal');
same(['completed_count' => 2, 'progress_days' => 2, 'progress_percent' => 100, 'goal_reached' => true], goal_progress_values($dates, 2), 'reached goal');
echo "ok weekly goal dates, duplicate credit and progress\n";
