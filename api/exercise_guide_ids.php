<?php
// Which WorkoutX exercise (https://workoutxapp.com/docs.html) shows how to perform each plan exercise.
// Keys are the lowercase exercise names seeded in database/migrations/007_plan_day_exercises.sql; values are
// WorkoutX v2 ids. WorkoutX's name search is substring-only and capped at 10 results on the free plan, so the
// ids are chosen by hand instead of guessed at request time. An exercise missing here simply shows no guide.
// Some entries are the closest movement WorkoutX has, not an exact match (noted on the line).
// To add one, find the id with GET /v2/exercises?name=... and add a line.
//
// Not mapped, because WorkoutX has no usable match: acceleration sprint, broad jump, medicine ball throw.
return [
    // Barbell lifts
    'bench press' => 'ex_SAWOOH',             // Barbell Bench Press
    'competition bench press' => 'ex_SAWOOH',
    'close-grip bench press' => 'ex_LXSQ4R',  // Close Grip Barbell Bench Press
    'back squat' => 'ex_NYXKHR',              // Barbell Squat Back Pov
    'competition squat' => 'ex_NYXKHR',
    'paused squat' => 'ex_NYXKHR',
    'deadlift' => 'ex_XXOOG7',                // Barbell Deadlift
    'competition deadlift' => 'ex_XXOOG7',
    'paused deadlift' => 'ex_XXOOG7',
    'romanian deadlift' => 'ex_YH6XGY',       // Barbell Romanian Deadlift
    'single-leg romanian deadlift' => 'ex_PPQLO7', // Single Leg Romanian Deadlift Dumbbell
    'overhead press' => 'ex_JTJOKW',          // Barbell Seated Overhead Press
    'barbell row' => 'ex_BSX3LE',             // Barbell Bent Over Row Pronate Grip
    'barbell hip thrust' => 'ex_A7RLPO',      // Barbell Hip Thrust
    'bulgarian split squat' => 'ex_MCMDNU',   // Barbell Bulgarian Split Squat

    // Dumbbell
    'dumbbell curl' => 'ex_B5ZYR5',           // Dumbbell Curls
    'dumbbell press' => 'ex_2OSXDM',          // Dumbbell Bench Press
    'incline dumbbell press' => 'ex_X7I4K2',  // Dumbbell Incline Bench Press
    'dumbbell row' => 'ex_KLHF6Q',            // Dumbbell Bent-Over Row
    'split squat' => 'ex_UPPE6L',             // Dumbbell Split Squat
    'walking lunge' => 'ex_M5ZE3K',           // Plate Overhead Walking Lunge (closest; held overhead)
    'lateral raise' => 'ex_UDDGLG',           // Leaning Dumbbell Lateral Raise (closest)
    'goblet squat' => 'ex_3BK5ZX',            // Dumbbell Goblet Squat
    'reverse lunge' => 'ex_ICW4BA',           // Dumbbell Reverse Lunge on the Spot
    'step-up' => 'ex_C3CK7L',                 // Dumbbell Step Up on Bench

    // Machines and cables
    'lat pulldown' => 'ex_VH3ZJM',            // Cable Close Grip Front Lat Pulldown
    'leg press' => 'ex_VDLDOK',               // Horizontal Leg Press
    'leg curl' => 'ex_JZUL5J',                // Lying Leg Curl Machine
    'seated cable row' => 'ex_54HIOG',        // Cable Seated Row
    'cable row' => 'ex_54HIOG',
    'triceps pushdown' => 'ex_LLJJAG',        // Cable Pushdown
    'triceps extension' => 'ex_6XZ43G',       // Barbell Standing Overhead Triceps Extension (closest)
    'back extension' => 'ex_LVM2OL',          // Back Extension Machine
    'cable kickback' => 'ex_IZFMME',          // Cable Individual Glute Kickbacks
    'hip hinge' => 'ex_75KJUM',               // Good Mornings Dumbbells (closest)

    // Cardio, mobility and drills (loose matches: WorkoutX has no exact version of these)
    'easy walk' => 'ex_YOPLC7',               // Treadmill Walk
    'hip mobility' => 'ex_6CQAL6',            // Kneeling Hip Flexor Stretch
    'shoulder mobility' => 'ex_TZZDK6',       // Arm Circles Backward
    'a-skip' => 'ex_YWP75I',                  // Skipping
    'sprint drill' => 'ex_P6L7T7',            // High Knees

    // Bodyweight
    'push-up' => 'ex_PKMXFR',                 // Normal Push-Up
    'incline push-up' => 'ex_BYAIRV',         // Incline Push-Up (On Box)
    'pike push-up' => 'ex_QV7N32',            // Pike Push Up
    'pull-up' => 'ex_D3NEEI',                 // Pull Up Wide Grip Front View
    'inverted row' => 'ex_V5EGB3',            // Suspension Trainer With Grips Inverted Row
    'bench dip' => 'ex_QBHLZ6',               // Bench Dip (Knees Bent)
    'bodyweight squat' => 'ex_KNIBLJ',        // Bodyweight Squat
    'calf raise' => 'ex_H3VK5N',              // Bodyweight Standing Calf Raise
    'box jump' => 'ex_3BVVUH',                // Box Jump
    'glute bridge' => 'ex_WCBO3J',            // Barbell Glute Bridge (closest; no bodyweight version)

    // Core
    'plank' => 'ex_IZRBLY',                   // High Plank
    'side plank' => 'ex_ICALYP',              // Side Plank
    'hanging leg raise' => 'ex_RNWUMP',       // Hanging Leg Raises (the only version WorkoutX has)
    'bird dog' => 'ex_5DV46E',                // Bird Dog
    'dead bug' => 'ex_7ALPEC',                // Dead Bug
    'superman hold' => 'ex_FEUHM5',           // Superman
];
