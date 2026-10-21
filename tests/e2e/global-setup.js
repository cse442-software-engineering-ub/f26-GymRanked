import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url))

// Local runs only: check the database is ready, then reset this machine's login and sign-up counters and the
// seeded Riley, Marcus, Dana and Taylor's login counters, so repeated runs don't hit the API's 15-minute limits. Prints no credentials.
const CHECK_LOCAL_DATABASE = `
require 'api/config.php';
mysqli_report(MYSQLI_REPORT_OFF);
$db = @new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
if ($db->connect_errno) { echo "connect:" . $db->connect_errno; exit(1); }
$missing = [];
foreach (['users', 'auth_attempts', 'workout_plans', 'workout_plan_days', 'user_plans'] as $table) {
    $result = $db->query("SHOW TABLES LIKE '$table'");
    if (!$result || $result->num_rows === 0) $missing[] = $table;
}
if ($missing) { echo "missing:" . implode(',', $missing); exit(1); }
// api/auth.php stores each counter as sha256("<action>:ip:<address>"); reset this machine's.
$keys = [];
foreach (['login', 'register'] as $action) {
    foreach (['127.0.0.1', '::1'] as $address) $keys[] = "'" . hash('sha256', "$action:ip:$address") . "'";
}
// Stories 9 and 8 log in as seeded accounts several times per run; the limit there is 10 per email.
foreach (['riley.brooks', 'marcus.malone', 'dana.lee', 'taylor.reed'] as $name) {
    $keys[] = "'" . hash('sha256', "login:email:$name@example.com") . "'";
}
$db->query('DELETE FROM auth_attempts WHERE attempt_key IN (' . implode(',', $keys) . ')');
echo "ok";
`

// Runs the check and reset above; returns "ok" or what went wrong. Also used by specs whose logins would take a full
// run past the 50-per-IP limit (story 8's resets once more before its own tests), on local runs only.
export function resetLocalCounters() {
  try {
    return execFileSync('php', ['-r', CHECK_LOCAL_DATABASE], { cwd: REPO_ROOT, encoding: 'utf8' })
  } catch (error) {
    return `${error.stdout ?? ''}` || error.message
  }
}

export default function globalSetup() {
  if (process.env.E2E_BASE_URL) return

  const output = resetLocalCounters()
  if (output === 'ok') return

  if (output.startsWith('missing:')) {
    throw new Error(
      `The local database is missing tables: ${output.slice('missing:'.length)}. ` +
        'Apply the files in database/migrations/ (see database/seeds/README.md).',
    )
  }
  if (output.startsWith('connect:')) {
    throw new Error(
      `Can't connect to the local database (MySQL error ${output.slice('connect:'.length)}). ` +
        'Check that MySQL is running and that api/config.php has your local settings.',
    )
  }
  throw new Error(`Local database check failed. Is PHP installed and api/config.php present?\n${output}`)
}
