import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url))

// Local runs only: check the database is ready, then reset this machine's login and sign-up counters, so
// repeated runs don't hit the API's 15-minute limit. Prints no credentials.
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
$db->query('DELETE FROM auth_attempts WHERE attempt_key IN (' . implode(',', $keys) . ')');
echo "ok";
`

export default function globalSetup() {
  if (process.env.E2E_BASE_URL) return

  let output
  try {
    output = execFileSync('php', ['-r', CHECK_LOCAL_DATABASE], { cwd: REPO_ROOT, encoding: 'utf8' })
  } catch (error) {
    output = `${error.stdout ?? ''}` || error.message
  }
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
