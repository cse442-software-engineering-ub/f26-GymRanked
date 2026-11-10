<?php
// The swap rules for api/exercise_alternatives.php, kept free of database and HTTP code so
// tests/exercise_alternatives.php can run them directly. Not an endpoint itself.

const ALTERNATIVES_MAX = 5;
const ALTERNATIVES_LEVEL_RANK = ['beginner' => 0, 'intermediate' => 1, 'advanced' => 2];

// Can someone with $owned equipment do an exercise that needs $needed? Full gym covers everything and
// bodyweight exercises need nothing.
function equipment_fits($needed, $owned) {
    return $needed === 'bodyweight' || in_array('full_gym', $owned, true) || in_array($needed, $owned, true);
}

// $source is the exercise being swapped and $candidates every supported exercise, each
// ['name', 'movement', 'level', 'equipment']. $experience is the user's level (null counts as beginner)
// and $owned their equipment list. Returns up to ALTERNATIVES_MAX candidates with the same movement, not the
// source itself, needing only owned equipment and no harder than $experience, closest level to the source first.
function pick_alternatives($source, $candidates, $experience, $owned) {
    $user_rank = ALTERNATIVES_LEVEL_RANK[$experience ?? ''] ?? 0;
    $source_rank = ALTERNATIVES_LEVEL_RANK[$source['level']];
    $fits = array_values(array_filter($candidates, function ($c) use ($source, $user_rank, $owned) {
        return $c['movement'] === $source['movement']
            && strtolower($c['name']) !== strtolower($source['name'])
            && ALTERNATIVES_LEVEL_RANK[$c['level']] <= $user_rank
            && equipment_fits($c['equipment'], $owned);
    }));
    usort($fits, function ($a, $b) use ($source_rank) {
        return abs(ALTERNATIVES_LEVEL_RANK[$a['level']] - $source_rank) <=> abs(ALTERNATIVES_LEVEL_RANK[$b['level']] - $source_rank)
            ?: strcmp($a['name'], $b['name']);
    });
    return array_slice($fits, 0, ALTERNATIVES_MAX);
}
