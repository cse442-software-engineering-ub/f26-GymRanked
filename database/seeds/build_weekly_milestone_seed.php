<?php
// Card #123 account bootstrap, for a developer to review and load once on the test server.
// No workout dates are generated here. A tester's explicit Start Test login prepares one fixture.
$aliases = [
    'progress', 'zero', 'one', 'finish', 'duplicate', 'cancel', 'recovery',
    'summary', 'boundary', 'failure', 'other', 'history', 'legacy',
];
$hash = '$2y$12$KH2XzC8xBmU8rJJo/bsghOXd1l29sJozEoum/6eoOZLGF8auwwTIC';
$quote = fn($value) => "'" . str_replace("'", "''", $value) . "'";
echo "-- Card #123 dedicated account bootstrap; no workouts or dates are changed.\n";
echo "-- Requires migration 013 for users.is_test. Apply only to the non-production test database.\n";
echo "START TRANSACTION;\n";
echo "INSERT INTO users (full_name, email, password_hash, is_test) VALUES\n";
$rows = [];
foreach ($aliases as $alias) {
    $rows[] = '  (' . $quote('Weekly ' . ucfirst($alias)) . ', '
        . $quote("weekly123-$alias@example.com") . ', ' . $quote($hash) . ', 1)';
}
echo implode(",\n", $rows), "\n";
echo "ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), password_hash = VALUES(password_hash), is_test = 1;\n";
echo "COMMIT;\n";
echo "SELECT email FROM users WHERE email IN (", implode(', ', array_map(fn($alias) => $quote("weekly123-$alias@example.com"), $aliases)), ") ORDER BY email;\n";
