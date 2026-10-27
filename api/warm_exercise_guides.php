<?php
// Command line only: php api/warm_exercise_guides.php
//
// Fetches every exercise in exercise_guide_ids.php from WorkoutX into the cache that exercise_guide.php reads, so
// the first person to open each guide doesn't wait ~3 s for WorkoutX. Exercises whose cache is still fresh are
// skipped, and fetches are spaced out to stay under the free plan's 30 requests a minute. Each run spends at
// most one WorkoutX request per mapped exercise (500 a month on the free plan, and 46 exercises are mapped). The
// media links last about a day, so run it only before a demo or after a deploy, not on a daily schedule, which
// would use most of the month's requests whether or not anyone opens a guide.

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require __DIR__ . '/config.php';
require __DIR__ . '/exercise_guide_common.php';

if (!defined('WORKOUTX_API_KEY') || WORKOUTX_API_KEY === '') {
    fwrite(STDERR, "WORKOUTX_API_KEY is not set in api/config.php\n");
    exit(1);
}

$ids = array_unique(array_values(require __DIR__ . '/exercise_guide_ids.php'));
$failed = 0;
foreach ($ids as $id) {
    if (cached_exercise($id) !== null) {
        echo "$id already cached\n";
        continue;
    }
    if (fetch_exercise($id) === null) {
        echo "$id FAILED\n";
        $failed++;
    } else {
        echo "$id cached\n";
    }
    sleep(3);
}
exit($failed > 0 ? 1 : 0);
