<?php
// WorkoutX lookup and cache shared by exercise_guide.php (the endpoint) and warm_exercise_guides.php (the cache
// warmer). Not an endpoint itself. Needs WORKOUTX_API_KEY from config.php to be defined by the caller.

const WORKOUTX_URL = 'https://api.workoutxapp.com/v2/exercises/';
const MEDIA_MIN_LIFE_SECONDS = 3600;

// A cached exercise is reused while its media links have more than an hour left.
function media_is_fresh($exercise) {
    $expires = strtotime($exercise['media']['expiresAt'] ?? '');
    return $expires !== false && $expires - time() > MEDIA_MIN_LIFE_SECONDS;
}

function guide_cache_file($id) {
    return sys_get_temp_dir() . '/gymrank_workoutx_' . $id . '.json';
}

// The cached exercise for this WorkoutX id if its media links are still fresh, else null. Never calls WorkoutX.
function cached_exercise($id) {
    $file = guide_cache_file($id);
    if (!is_readable($file)) return null;
    $cached = json_decode((string) file_get_contents($file), true);
    return is_array($cached) && media_is_fresh($cached) ? $cached : null;
}

// Asks WorkoutX for the exercise and caches it. Returns the exercise, or null if WorkoutX failed (the HTTP
// status is logged).
function fetch_exercise($id) {
    $curl = curl_init(WORKOUTX_URL . rawurlencode($id));
    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 8,
        CURLOPT_HTTPHEADER => ['X-WorkoutX-Key: ' . WORKOUTX_API_KEY],
    ]);
    $response = curl_exec($curl);
    $status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);

    $exercise = $status === 200 ? json_decode((string) $response, true) : null;
    if (!is_array($exercise) || !media_is_fresh($exercise)) {
        error_log("exercise_guide: WorkoutX answered $status for $id");
        return null;
    }
    // Write to a temp name and rename so a concurrent request never reads half a file.
    $file = guide_cache_file($id);
    $temp = $file . '.' . getmypid();
    if (file_put_contents($temp, json_encode($exercise)) !== false) rename($temp, $file);
    return $exercise;
}
