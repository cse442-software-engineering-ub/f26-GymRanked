<?php
// Checks the counting rule of api/counted_workouts.php (card #134); no database needed.
// Run: php tests/counted_workouts.php
require __DIR__ . '/../api/counted_workouts.php';

function same($expected, $actual, $label) {
    if ($expected !== $actual) {
        fwrite(STDERR, "$label: expected " . json_encode($expected) . ', got ' . json_encode($actual) . "\n");
        exit(1);
    }
    echo "PASS $label\n";
}

$ny = new DateTimeZone('America/New_York');

// "Today" starts at New York midnight, as a UTC time, including across a daylight-saving change.
same('2026-11-23 05:00:00', counted_workout_day_start_utc(new DateTimeImmutable('2026-11-23 15:30:00', $ny)), 'winter midnight is 05:00 UTC');
same('2026-07-01 04:00:00', counted_workout_day_start_utc(new DateTimeImmutable('2026-07-01 00:00:00', $ny)), 'summer midnight is 04:00 UTC');
same('2026-11-01 04:00:00', counted_workout_day_start_utc(new DateTimeImmutable('2026-11-01 23:59:59', $ny)), 'the day the clocks go back starts 04:00 UTC');
same('2026-11-23 05:00:00', counted_workout_day_start_utc(new DateTimeImmutable('2026-11-23 00:00:00', $ny)), 'the first second of a day is today');

// The condition: finished, or unfinished from before today's start with a saved set. Today's unfinished one is not.
$sql = counted_workout_sql('s', new DateTimeImmutable('2026-11-23 15:30:00', $ny));
same(true, str_contains($sql, 's.completed_at IS NOT NULL'), 'a finished workout counts');
same(true, str_contains($sql, "s.started_at < '2026-11-23 05:00:00'"), 'an unfinished one counts only from before today');
same(true, str_contains($sql, 'workout_sets counted_sets WHERE counted_sets.session_id = s.id'), 'an unfinished one needs a saved set');
same('COALESCE(x.completed_at, x.started_at)', counted_workout_time_sql('x'), 'an unfinished workout belongs to the time it started');
