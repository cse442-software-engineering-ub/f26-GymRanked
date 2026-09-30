<?php
require __DIR__ . '/auth.php';
input();
$db = database();
clear_session($db);
setcookie('gymrank_session', '', cookie_options(time() - 3600));
respond(200, ['message' => 'You are logged out.']);
