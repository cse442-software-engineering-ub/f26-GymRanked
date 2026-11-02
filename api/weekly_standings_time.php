<?php
// The week and its reset time for api/weekly_standings.php (card #126). No output and no database, so
// tests/weekly_standings_time.php can run it for fixed instants. Not an endpoint itself.
//
// A week is Monday 00:00 to Sunday in America/New_York time (UB's time zone, the same week as api/weekly_goal.php).
// The next Monday is found in that time zone and then converted, so the week the clocks change is 167 or 169
// hours long and resets_at is not "now + 7 days".

const STANDINGS_TIME_ZONE = 'America/New_York';

// [this week's Monday 00:00, next Monday 00:00], both DateTimeImmutable in New York time.
function standings_week($now) {
    $local = $now->setTimezone(new DateTimeZone(STANDINGS_TIME_ZONE))->setTime(0, 0);
    $start = $local->modify('-' . ((int) $local->format('N') - 1) . ' days');
    return [$start, $start->modify('+7 days')];
}

// "2026-11-02T05:00:00Z"
function utc_iso($moment) {
    return $moment->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d\TH:i:s\Z');
}
