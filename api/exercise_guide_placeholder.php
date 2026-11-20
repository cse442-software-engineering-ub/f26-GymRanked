<?php
// GET api/exercise_guide_placeholder.php?name=Bench%20press -> 200 {"exercise":"Bench press","placeholder":true,
//   "steps":[{"image":null,"instruction":"<one sentence>","credit":"<where it came from>"}]}
//
// TEMPORARY, task #91. A stand-in for the backup pictures and instructions Surya is adding in task #92, so the
// exercise guide's fallback (src/GuideFallback.jsx) can be built and tested before they exist. It returns the same
// shape the frontend expects from #92 (steps of image, instruction and credit) with one step: no picture and a
// one-sentence description. When #92's data is in, delete this file and src/guideFallbackPlaceholder.js and point
// src/ExerciseGuide.jsx at #92's steps.
//
// Errors are JSON: 400 {"error":"Send an exercise name."}, 401 {"error":"Please log in."},
// 405 {"error":"Method not allowed."}.

require __DIR__ . '/auth.php';

require_method('GET');
if (empty($_COOKIE['gymrank_session'])) respond(401, ['error' => 'Please log in.']);

$name = $_GET['name'] ?? '';
if (!is_string($name) || trim($name) === '' || strlen($name) > 100) respond(400, ['error' => 'Send an exercise name.']);
$name = trim($name);

$db = database();
$hash = hash('sha256', $_COOKIE['gymrank_session']);
$stmt = $db->prepare('SELECT user_id FROM auth_sessions WHERE token_hash = ? AND expires_at > UTC_TIMESTAMP()');
$stmt->bind_param('s', $hash);
$stmt->execute();
if (!$stmt->get_result()->fetch_assoc()) respond(401, ['error' => 'Please log in.']);

respond(200, [
    'exercise' => $name,
    'placeholder' => true,
    'steps' => [[
        'image' => null,
        'instruction' => "Do each rep of the $name slowly and under control through its full range of motion, "
            . 'keeping your core braced and your form steady.',
        'credit' => 'Placeholder text from GymRank until backup pictures are added.',
    ]],
]);
