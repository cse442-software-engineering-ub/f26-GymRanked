# Registration and sign-in

This implements the Figma Landing/Sign-In and Create Account screens in React,
with email/password authentication backed by PHP and MySQL. The existing workout
endpoint and component are retained. No dashboard or onboarding screens are added.

## Setup

1. Install dependencies with `npm ci --legacy-peer-deps`.
2. Configure the ignored `api/config.php` with a working **local** MySQL account.
   Windows PHP connecting to WSL requires a reachable TCP host and a MySQL user
   permitted to connect from that host. A reachable port alone does not prove
   database authentication works. Local credentials need not match UB credentials.

   If MySQL reports error 1130 (`Host ... is not allowed to connect`), networking
   is working but that account lacks permission for the Windows host. In WSL,
   sign in as a MySQL administrator and create a dedicated local application user
   for the exact host shown in the error (use a real local password, not the text
   below), then put that application's credentials in `api/config.php`:

   ```sql
   CREATE USER 'gymrank_app'@'WINDOWS_HOST_FROM_ERROR'
     IDENTIFIED BY 'CHOOSE_A_LOCAL_PASSWORD';
   GRANT SELECT, INSERT, UPDATE, DELETE
     ON cse442_2026_fall_team_y_db.*
     TO 'gymrank_app'@'WINDOWS_HOST_FROM_ERROR';
   FLUSH PRIVILEGES;
   ```

   Do not grant remote access to MySQL `root`, use `%` as the host, or commit the
   resulting password. A WSL address can change after restart; update `DB_HOST`
   when needed. Running both PHP and MySQL inside WSL permits `DB_HOST=localhost`
   instead and avoids the cross-host grant.
3. Select the configured database and apply the additive migration:

   ```bash
   mysql -h DB_HOST -u DB_USER -p cse442_2026_fall_team_y_db < database/migrations/001_auth.sql
   ```

   Replace host/user placeholders. Enter the password at the prompt. The migration
   adds users, authentication sessions, and attempt counters; it leaves workouts
   untouched. Existing installations must apply it before using these endpoints.
   An authorized maintainer must apply the same migration to shared databases
   before deploying; these changes do not deploy or alter shared data.
4. Start `php -S localhost:8000 -t api` and `npm run dev` in separate terminals.
5. Open `http://localhost:5173/CSE442/2026-Fall/cse-442y/#/login`
   or `http://localhost:5173/CSE442/2026-Fall/cse-442y/#/register`.

Hash routes support reloads on the existing Apache deployment without requiring
new rewrite rules. The Vite deployment base path is unchanged.

## API contract

All paths are relative to `${import.meta.env.BASE_URL}api/`. POST requests require
`Content-Type: application/json`. Errors contain `error` and optionally `errors`
(a map keyed by form field). Responses never include password hashes or tokens.

| Endpoint | Input | Success |
| --- | --- | --- |
| POST register.php | full_name, email, password, confirm_password | 201, message; continue to the static dashboard |
| POST login.php | email, password, optional boolean remember | 200, user; sets HttpOnly session cookie |
| GET session.php | Session cookie | 200, user, or 401 if absent/expired |
| POST logout.php | `{}` and session cookie | 200, message; revokes session and clears cookie |

User objects contain `id`, `full_name`, and `email`. Invalid fields return 400,
duplicate emails 409, invalid credentials 401, unsupported methods 405, wrong
content types 415, oversized bodies 413, throttled attempts 429, and unavailable
database service 503. Login errors do not distinguish unknown email from wrong
password. Email is trimmed/lowercased; password whitespace is preserved.

Passwords require 12+ characters with letters, numbers, and symbols, with a
72-byte maximum for PHP's default bcrypt compatibility. Full names allow up to
100 UTF-8 bytes. Confirmation must match. The server validates independently of
the browser. SQL uses prepared statements and a unique email constraint.

Session tokens are randomly generated and only their SHA-256 hashes are stored.
Normal sessions expire after eight hours and use a browser-session cookie.
Remembered sessions expire after 30 days and use a persistent cookie. Cookies
are HttpOnly, SameSite=Lax, and Secure on HTTPS. Serve production over HTTPS;
if TLS terminates at a proxy, configure PHP's trusted HTTPS indication correctly.
JSON-only POST endpoints do not enable cross-origin requests.

Attempts are limited per action, IP, and normalized email over 15 minutes
(50 per IP, 10 per email, including successful attempts). Maintenance can remove
expired auth_sessions and old auth_attempts rows; do not delete active records.

## Design decisions and scope

- Desktop references: 309:2692 and 309:2746. Mobile: 605:3942 and 624:80.
- The repository has no Simple Design System InputField/Button implementation;
  focused local React components provide those controls with plain CSS.
- Password visibility, confirmation, and strength feedback from mobile are used
  on desktop too. Labels have increased contrast over the desktop design.
- Leaderboard numbers are illustrative and labeled Preview instead of Live.
- The mobile terms/privacy notice is omitted until the team supplies actual
  policies; no invented agreement is presented during registration.
- Google/Apple and password recovery show availability messages. OAuth credentials
  and password-reset email delivery are not configured by this change.
- Successful login and registration continue to the static dashboard. Visiting the
  login route with a valid session also returns to the dashboard. The dashboard does
  not load or submit workout data yet; future feature work can connect its navigation
  and cards without changing the authentication API.
- Inter falls back to the system sans-serif font if not installed locally.

## Verification

Run `npm run build`, PHP syntax checks on every file under api, and `npm test`.
Run the HTTP integration script with
a dedicated local test database configured and the migration applied:

```bash
node tests/auth-api.mjs
```

It creates uniquely named accounts using example.com addresses. Keep these in a
test database; it does not delete user data. Override `AUTH_TEST_BASE` to test a
different local server (default http://localhost:8000). Never target production.
Manual browser checks: empty/invalid fields, mismatch, Show/Hide, navigation,
duplicate account error, valid login, remembered session, refresh, logout, and
API-unavailable feedback. Compare both pages at 1440x900 and 375x812 and use Tab
and Enter to check labels, focus visibility, and keyboard submission.
