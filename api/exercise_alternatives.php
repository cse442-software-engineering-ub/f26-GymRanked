<?php
// GET api/exercise_alternatives.php?exercise=Bench%20press
//   -> 200 {"exercise":"Bench press","movement":"horizontal_push",
//           "alternatives":[{"name":"Dumbbell press","level":"beginner","equipment":"dumbbells"}, ...]}
//
// Exercises the logged-in user could do instead of the one sent (task #81, shown by the panel in #82): same
// movement, only equipment from their saved setup (api/setup.php), and no harder than their experience level.
// "alternatives" is [] when nothing fits, for example when no equipment is saved. The rules are in
// exercise_alternatives_common.php and the supported exercises in database/migrations/016_exercise_alternatives.sql.
//
// Errors are JSON: 400 {"error":"Send an exercise name."}, 401 {"error":"Please log in."},
// 404 {"error":"No alternatives for this exercise."} (not one of the supported exercises),
// 405 {"error":"Method not allowed."}, 500 {"error":"Database error"}.

require __DIR__ . '/workout_common.php';
require __DIR__ . '/exercise_alternatives_common.php';

require_method('GET');
$db = database();
$user_id = workout_user_id($db);

$name = $_GET['exercise'] ?? '';
if (!is_string($name) || trim($name) === '' || strlen($name) > 100) respond(400, ['error' => 'Send an exercise name.']);

$exercises = $db->query('SELECT name, movement, level, equipment FROM exercises')->fetch_all(MYSQLI_ASSOC);
$source = null;
foreach ($exercises as $exercise) {
    if (strtolower($exercise['name']) === strtolower(trim($name))) $source = $exercise;
}
if ($source === null) respond(404, ['error' => 'No alternatives for this exercise.']);

$stmt = $db->prepare('SELECT experience FROM user_setup WHERE user_id = ?');
$stmt->bind_param('i', $user_id);
$stmt->execute();
$setup = $stmt->get_result()->fetch_assoc();

$stmt = $db->prepare('SELECT equipment FROM user_equipment WHERE user_id = ?');
$stmt->bind_param('i', $user_id);
$stmt->execute();
$owned = array_column($stmt->get_result()->fetch_all(MYSQLI_ASSOC), 'equipment');

$alternatives = array_map(function ($c) {
    return ['name' => $c['name'], 'level' => $c['level'], 'equipment' => $c['equipment']];
}, pick_alternatives($source, $exercises, $setup['experience'] ?? null, $owned));

respond(200, ['exercise' => $source['name'], 'movement' => $source['movement'], 'alternatives' => $alternatives]);
