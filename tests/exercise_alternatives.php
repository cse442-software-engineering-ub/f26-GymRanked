<?php
// Checks the swap rules of api/exercise_alternatives_common.php. Run from the repo root:
// php tests/exercise_alternatives.php (prints PASS or FAIL lines, exits 1 on a FAIL).

require __DIR__ . '/../api/exercise_alternatives_common.php';

$all = [
    ['name' => 'Bench press', 'movement' => 'horizontal_push', 'level' => 'intermediate', 'equipment' => 'barbell'],
    ['name' => 'Incline dumbbell press', 'movement' => 'horizontal_push', 'level' => 'intermediate', 'equipment' => 'dumbbells'],
    ['name' => 'Dumbbell press', 'movement' => 'horizontal_push', 'level' => 'beginner', 'equipment' => 'dumbbells'],
    ['name' => 'Push-up', 'movement' => 'horizontal_push', 'level' => 'beginner', 'equipment' => 'bodyweight'],
    ['name' => 'Incline push-up', 'movement' => 'horizontal_push', 'level' => 'beginner', 'equipment' => 'bodyweight'],
    ['name' => 'Back squat', 'movement' => 'squat', 'level' => 'intermediate', 'equipment' => 'barbell'],
    ['name' => 'Goblet squat', 'movement' => 'squat', 'level' => 'beginner', 'equipment' => 'dumbbells'],
];
$bench = $all[0];

// [description, experience, equipment, source, expected names in order]
$cases = [
    ['dumbbells only, intermediate: closest level first', 'intermediate', ['dumbbells'], $bench,
        ['Incline dumbbell press', 'Dumbbell press', 'Incline push-up', 'Push-up']],
    ['bodyweight only: just bodyweight moves', 'intermediate', ['bodyweight'], $bench, ['Incline push-up', 'Push-up']],
    ['beginner never gets harder moves', 'beginner', ['dumbbells', 'barbell'], $bench,
        ['Dumbbell press', 'Incline push-up', 'Push-up']],
    ['full gym covers every equipment', 'intermediate', ['full_gym'], $bench,
        ['Incline dumbbell press', 'Dumbbell press', 'Incline push-up', 'Push-up']],
    ['no equipment saved: bodyweight is still possible', 'intermediate', [], $bench, ['Incline push-up', 'Push-up']],
    ['no experience saved counts as beginner', null, ['dumbbells'], $bench, ['Dumbbell press', 'Incline push-up', 'Push-up']],
    ['only the same movement', 'intermediate', ['barbell', 'dumbbells'], $all[5], ['Goblet squat']],
    ['source excluded, name case ignored', 'intermediate', ['bodyweight'], ['name' => 'push-UP'] + $all[3], ['Incline push-up']],
];

$failed = 0;
foreach ($cases as [$label, $experience, $owned, $source, $expected]) {
    $got = array_column(pick_alternatives($source, $all, $experience, $owned), 'name');
    $ok = $got === $expected;
    $failed += $ok ? 0 : 1;
    echo ($ok ? 'PASS ' : 'FAIL ') . $label . ($ok ? '' : ' got [' . implode(', ', $got) . '] expected [' . implode(', ', $expected) . ']') . "\n";
}

// At most ALTERNATIVES_MAX results.
$many = [];
for ($i = 0; $i < 9; $i++) $many[] = ['name' => "Move $i", 'movement' => 'squat', 'level' => 'beginner', 'equipment' => 'bodyweight'];
$ok = count(pick_alternatives(['name' => 'Other', 'movement' => 'squat', 'level' => 'beginner'], $many, 'beginner', [])) === ALTERNATIVES_MAX;
$failed += $ok ? 0 : 1;
echo ($ok ? 'PASS ' : 'FAIL ') . "capped at " . ALTERNATIVES_MAX . "\n";

exit($failed ? 1 : 0);
