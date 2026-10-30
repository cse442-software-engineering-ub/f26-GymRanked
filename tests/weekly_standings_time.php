<?php
// Checks the week and reset maths of api/weekly_standings.php for fixed instants, including the weeks the clocks
// change. Run from the repo root: php tests/weekly_standings_time.php (prints PASS or FAIL lines, exits 1 on a FAIL).

require __DIR__ . '/../api/weekly_standings_time.php';

// [instant (UTC), week_start, resets_at]
$cases = [
    ['2026-10-30T18:48:00Z', '2026-10-26', '2026-11-02T05:00:00Z'], // Friday, the week the clocks go back
    ['2026-11-01T03:30:00Z', '2026-10-26', '2026-11-02T05:00:00Z'], // Saturday 11:30 PM, still before the change
    ['2026-11-02T05:00:00Z', '2026-11-02', '2026-11-09T05:00:00Z'], // Monday 00:00 New York, the new week
    ['2027-03-12T18:00:00Z', '2027-03-08', '2027-03-15T04:00:00Z'], // Friday, the week the clocks go forward
    ['2026-10-26T04:00:00Z', '2026-10-26', '2026-11-02T05:00:00Z'], // Monday 00:00 EDT: this week
    ['2026-10-26T03:59:59Z', '2026-10-19', '2026-10-26T04:00:00Z'], // one second earlier: the previous week
];

$failed = 0;
foreach ($cases as [$instant, $week_start, $resets_at]) {
    [$start, $next] = standings_week(new DateTimeImmutable($instant));
    $got = [$start->format('Y-m-d'), utc_iso($next)];
    $ok = $got === [$week_start, $resets_at];
    $failed += $ok ? 0 : 1;
    echo ($ok ? 'PASS ' : 'FAIL ') . "$instant week_start $got[0] resets_at $got[1]" . ($ok ? '' : " (expected $week_start $resets_at)") . "\n";
}
exit($failed ? 1 : 0);
