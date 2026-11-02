<?php
// GET api/exercise_guide.php?name=Bench%20press -> 200 {"id","name","instructions":[...],"tips":[...],
//                                                        "video":"https://...mp4","poster":"https://...jpg",
//                                                        "watermarked":true}
//
// How to perform an exercise, from WorkoutX v2 (https://workoutxapp.com/docs.html), for the exercise page
// (src/ExerciseGuide.jsx). The API key (WORKOUTX_API_KEY in config.php) stays on the server. The video and poster
// are signed WorkoutX links that expire after about a day; they are played from WorkoutX, never copied (their
// terms forbid hosting the media), and the exercise is cached in the server's temp folder until an hour before
// they expire so the free plan's 500 requests a month last (warm_exercise_guides.php fills that cache ahead of time).
//
// Errors are JSON: 400 {"error":"Send an exercise name."}, 401 {"error":"Please log in."},
// 404 {"error":"No guide for this exercise."}, 405 {"error":"Method not allowed."},
// 503 {"error":"The exercise guide is unavailable."} (no key set, WorkoutX down, or its quota used up).

require __DIR__ . '/auth.php';

set_exception_handler(function ($error) {
    error_log('exercise_guide.php: ' . $error->getMessage());
    respond(503, ['error' => 'The exercise guide is unavailable.']);
});

require __DIR__ . '/exercise_guide_common.php';

require_method('GET');
if (empty($_COOKIE['gymrank_session'])) respond(401, ['error' => 'Please log in.']);

$name = $_GET['name'] ?? '';
if (!is_string($name) || trim($name) === '' || strlen($name) > 100) respond(400, ['error' => 'Send an exercise name.']);

$db = database(); // also loads config.php
$hash = hash('sha256', $_COOKIE['gymrank_session']);
$stmt = $db->prepare('SELECT user_id FROM auth_sessions WHERE token_hash = ? AND expires_at > UTC_TIMESTAMP()');
$stmt->bind_param('s', $hash);
$stmt->execute();
if (!$stmt->get_result()->fetch_assoc()) respond(401, ['error' => 'Please log in.']);

$ids = require __DIR__ . '/exercise_guide_ids.php';
$id = $ids[strtolower(trim($name))] ?? null;
if ($id === null) respond(404, ['error' => 'No guide for this exercise.']);

if (!defined('WORKOUTX_API_KEY') || WORKOUTX_API_KEY === '') {
    error_log('exercise_guide.php: WORKOUTX_API_KEY is not set in config.php');
    respond(503, ['error' => 'The exercise guide is unavailable.']);
}

$exercise = cached_exercise($id) ?? fetch_exercise($id);
if ($exercise === null) respond(503, ['error' => 'The exercise guide is unavailable.']);

// The response is only built from media links with over an hour left, so the browser may keep it for 30 minutes.
header('Cache-Control: private, max-age=1800');
respond(200, [
    'id' => $exercise['id'],
    'name' => $exercise['name'],
    'instructions' => array_values($exercise['instructions'] ?? []),
    'tips' => array_values($exercise['tips'] ?? []),
    'video' => $exercise['media']['mp4'] ?? null,
    'poster' => $exercise['media']['poster'] ?? null,
    'watermarked' => (bool) ($exercise['media']['watermarked'] ?? false),
]);
