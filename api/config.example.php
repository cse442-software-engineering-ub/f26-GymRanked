<?php
// Copy this file to config.php and fill in your real UBIT credentials.
// config.php is gitignored and must never be committed.
define('DB_HOST', 'localhost');
define('DB_NAME', 'cse442_2026_fall_team_y_db');
define('DB_USER', 'your_ubit_username');
define('DB_PASS', 'your_person_number');
// Key from the WorkoutX developer portal (https://workoutxapp.com/docs.html), for api/exercise_guide.php.
define('WORKOUTX_API_KEY', 'your_workoutx_key');
// Card #123 resets stay off by default. Enable only in ignored config.php on local/test aptitude.
define('GYMRANK_WEEKLY123_RESET', false);
define('GYMRANK_WEEKLY123_ENV', 'off'); // 'local' or 'aptitude' only on the matching host
