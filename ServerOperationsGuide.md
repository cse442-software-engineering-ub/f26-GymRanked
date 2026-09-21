# Server Operations Guide

How to deploy, test, debug, and recover the GymRank app on the CSE 442 servers.
Everything here comes from the repo (`README.md`, `vite.config.js`, `api/`). Anything that could not
be confirmed from the repo is marked **[VERIFY]**. Run it once, then replace the marker with the real result.

Never put real credentials in this file, in commits, or in task comments. Use the placeholders below.

| Placeholder | Meaning |
| --- | --- |
| `UBIT_USERNAME` | Your UBIT username |
| `<PERSON_NUMBER>` | Your 8-digit UB person number (the SSH and MySQL password) |

## 1. Servers and access

| Server | Role | Updated |
| --- | --- | --- |
| `aptitude.cse.buffalo.edu` | Test | Any time during a sprint |
| `cattle.cse.buffalo.edu` | Production (team's released code) | End of a sprint only |

- Both servers are behind UB's firewall. You must be on the campus network or **UB VPN** to reach them.
  This covers SSH, the web pages, and phpMyAdmin.
- SSH and MySQL login on both is `UBIT_USERNAME` plus `<PERSON_NUMBER>`.
- Do not deploy or change shared server data unless your task card says to.

```bash
ssh UBIT_USERNAME@aptitude.cse.buffalo.edu
```

| Item | Value |
| --- | --- |
| Team web folder on aptitude | `/data/web/CSE442/2026-Fall/cse-442y/` (absolute path, leading slash required) |
| Site URL (aptitude) | `https://aptitude.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/` |
| Web folder and URL on cattle | **[VERIFY]** probably the same pattern with `cattle`. Confirm before the first prod release. |

## 2. Deployment

The frontend is a static Vite build. The backend is PHP files copied as-is. The base path
`/CSE442/2026-Fall/cse-442y/` is set in `vite.config.js` and baked into the build. Do not change it.

**Deploy to aptitude (test):**

```bash
# 1. Start from the branch/commit you intend to ship, with a clean tree
git status

# 2. Build the frontend into dist/
npm ci
npm run build

# 3. Copy frontend and backend to the server
scp -r dist/* UBIT_USERNAME@aptitude.cse.buffalo.edu:/data/web/CSE442/2026-Fall/cse-442y/
scp -r api UBIT_USERNAME@aptitude.cse.buffalo.edu:/data/web/CSE442/2026-Fall/cse-442y/
```

Notes:

- `api/config.php` is gitignored but is a real local file, so `scp -r api` copies it too. The server gets
  your credentials without them going through git. Check that your local `api/config.php` is the one you
  want on the server.
- `dist/` and `api/config.php` are never committed. They only exist on your machine and the server.
- Deploying to cattle (prod) is done once at the end of a sprint. **[VERIFY]** the exact cattle steps with
  the course staff or team lead. They are not documented in the repo.

**Check the deploy:**

1. Open `https://aptitude.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/` (on VPN). The workout list should render.
2. Call the API directly:

   ```bash
   curl -s https://aptitude.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/api/workouts.php
   ```

   Expect a JSON array of `{id, exercise, reps, weight}` rows.

## 3. Testing

There is **no automated test or lint script** in `package.json` (only `dev`, `build`, `preview`).
Do not report a test suite as passing.

**Before deploying (local):**

```bash
npm run build              # must finish with no errors
php -l api/workouts.php    # PHP syntax check, expect "No syntax errors detected"
php -l api/config.example.php
```

**Run the app locally:**

```bash
cp api/config.example.php api/config.php   # first time only, then fill in credentials
npm run dev                                # terminal 1: Vite
php -S localhost:8000 -t api               # terminal 2: PHP, from the repo root
```

Vite proxies `/CSE442/2026-Fall/cse-442y/api/*` to `localhost:8000`. Without a local MySQL server you
are only testing the frontend and the proxy, not the real query. See the README for optional local
MySQL setup.

**Pass/fail on the server:**

| Check | Pass |
| --- | --- |
| Site URL loads | Workout list is visible |
| `curl .../api/workouts.php` | JSON array of workouts, HTTP 200 |
| Database connection | No `Database connection failed` error (see Troubleshooting) |

## 4. Logs

To debug the app, use two tools: the browser's Network tab (what the API sent back) and phpMyAdmin
(what is in the database).

### Read the Network tab (browser)

Use this to see whether the frontend reached the API and what the API answered.

1. Open the site (on VPN): `https://aptitude.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/`
2. Open DevTools: right-click, **Inspect**, then the **Network** tab. (Mac: `Cmd+Option+I`, Windows: `F12`.)
3. Reload the page with the tab open.
4. Filter by **Fetch/XHR** and click the `workouts.php` request.
5. Read these parts:
   - **Headers**: the *Status Code* (200 = fine, 404 = wrong path, 500 = server or database error) and the *Request URL*.
   - **Response** (or **Preview**): the body. A healthy response is a JSON array of `{id, exercise, reps, weight}`.
6. Check the **Console** tab for red errors from the frontend.

What the results mean:

| You see | Meaning | Go to |
| --- | --- | --- |
| Status 200, JSON array | API and database are working | Nothing to fix |
| Status 500, `{"error":"Database connection failed"}` | `api/workouts.php` could not log in to MySQL | Troubleshooting |
| Status 404 | Wrong URL or `api/` not copied to the server | Troubleshooting |
| Status 200 but the response is HTML, or "JSON parse error" in the Console | The request got a web page instead of the API | Troubleshooting |

### Check the database (phpMyAdmin)

Use this to see whether the data is really in the database and to catch SQL errors.

1. Open `https://aptitude.cse.buffalo.edu/phpmyadmin/` (on VPN) and log in with `UBIT_USERNAME` / `<PERSON_NUMBER>`.
2. Select `cse442_2026_fall_team_y_db` in the sidebar, then the `workouts` table.
3. Click **Browse** to see the current rows. The list on the site should match these rows.
4. To run the same query the API uses, open the **SQL** tab, run `SELECT id, exercise, reps, weight FROM workouts;`, and click **Go**.
5. Read the result: rows appear in a table, and any SQL error shows in a red box with the MySQL error text.

If the login fails, the same credentials will fail for the API too, so the problem is `api/config.php`.

## 5. Database access

| Item | Value |
| --- | --- |
| Database | `cse442_2026_fall_team_y_db` |
| Host | `localhost` (each server uses its own MySQL, via socket) |
| User / password | `UBIT_USERNAME` / `<PERSON_NUMBER>` |
| Table | `workouts` (`id`, `exercise`, `reps`, `weight`) |

**Command line (after SSH to the server):**

```bash
mysql -u UBIT_USERNAME -p cse442_2026_fall_team_y_db
```

```sql
SHOW TABLES;
SELECT * FROM workouts LIMIT 5;
```

**phpMyAdmin (browser, on VPN):** `https://aptitude.cse.buffalo.edu/phpmyadmin/`. Log in with the same
credentials, pick `cse442_2026_fall_team_y_db` in the sidebar, and use the **SQL** tab.

**Schema** (also in the README):

```sql
CREATE TABLE workouts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exercise VARCHAR(255) NOT NULL,
    reps INT NOT NULL,
    weight INT NOT NULL
);
```

Schema changes must go in a versioned SQL file (e.g. `database.sql`) with steps for updating existing
databases. Do not rely on undocumented manual changes.

## 6. Permissions

- **Access:** each teammate uses their own UBIT login on the servers and database. A teammate who cannot
  log in should ask course staff. **[VERIFY]** how new teammates are added.
- **Credentials:** `api/config.php` holds `DB_USER` and `DB_PASS`. It is gitignored. Never remove it from
  `.gitignore` and never commit it. `api/config.example.php` holds placeholders only.
- **File permissions on the server:** the repo does not specify them. **[VERIFY]** and record the real
  values. Check them with:

  ```bash
  ls -l /data/web/CSE442/2026-Fall/cse-442y/
  ls -l /data/web/CSE442/2026-Fall/cse-442y/api/
  ```

  Record here: owner/group and mode for `config.php`, `workouts.php`, and the web files.
  `config.php` should not be world-readable if the server setup allows it.
- **Shared folder:** `/data/web/CSE442/2026-Fall/cse-442y/` is shared by the whole team. A `scp` overwrites
  what is there, so tell the team before you deploy.

## 7. Recovery

The commands below are standard, but none of them have been run against the team servers yet.
**[VERIFY]** each once and note the result.

### Bad deploy: roll back the site

The server has no history, so roll back by rebuilding a known-good commit and copying it again.

```bash
git log --oneline                    # find the last good commit
git checkout <good-commit>           # detached HEAD is fine for a rebuild
npm ci
npm run build
scp -r dist/* UBIT_USERNAME@aptitude.cse.buffalo.edu:/data/web/CSE442/2026-Fall/cse-442y/
scp -r api UBIT_USERNAME@aptitude.cse.buffalo.edu:/data/web/CSE442/2026-Fall/cse-442y/
git checkout -                       # return to your branch
```

Old hashed files in `assets/` can stay on the server. `index.html` decides which ones load.

### Lost or wrong `config.php`

```bash
cp api/config.example.php api/config.php    # then fill in credentials locally
scp api/config.php UBIT_USERNAME@aptitude.cse.buffalo.edu:/data/web/CSE442/2026-Fall/cse-442y/api/
```

### Database: back up

Run before any risky change to shared data.

```bash
mysqldump -u UBIT_USERNAME -p --set-gtid-purged=OFF cse442_2026_fall_team_y_db > workouts_backup.sql
```

`--set-gtid-purged=OFF` keeps the dump restorable. Without it, restoring on a MySQL server with GTIDs
enabled can fail with `ERROR 3546: @@GLOBAL.GTID_PURGED cannot be changed`. (Tested on local MySQL.)

Keep the dump out of git. It may contain real data.

### Database: restore

```bash
mysql -u UBIT_USERNAME -p cse442_2026_fall_team_y_db < workouts_backup.sql
```

If there is no backup and the table is gone, recreate it with the schema in section 5 and re-insert the data.

## 8. Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Cannot SSH or open the site | Not on campus network or VPN | Connect to UB VPN |
| HTTP 500 `Database connection failed` | Wrong or missing `config.php`, or wrong DB credentials | Check `api/config.php` on the server (section 7), test the login with `mysql -u UBIT_USERNAME -p` |
| `mysqli_sql_exception: No such file or directory` (local) | No local MySQL running | Start MySQL or test only frontend and proxy (README) |
| JSON parse error in browser (local) | `php -S` not running, so Vite returned `index.html` | Start `php -S localhost:8000 -t api` |
| Blank page or 404 on assets on the server | Build made with a different base path, or `dist/` not fully copied | Rebuild without changing `base` in `vite.config.js`, copy `dist/*` again |
| Empty list, no error | `workouts` table is empty | Insert rows or check the table with `SELECT * FROM workouts;` |

## Open items to confirm

- [ ] Cattle (prod) web folder, URL, and release steps
- [ ] Real file owner/permissions on the server
- [ ] `mysqldump` / restore run successfully on aptitude
- [ ] How new teammates get server and DB access
