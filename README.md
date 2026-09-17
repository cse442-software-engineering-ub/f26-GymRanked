# GymRank POC

Minimal proof of concept: React frontend fetches workout data from a PHP
backend backed by MySQL.

## Folder structure

```
.
├── api/
│   ├── config.example.php # template, copy to config.php and fill in credentials
│   ├── config.php         # gitignored, holds your real DB credentials (not committed)
│   └── workouts.php       # PHP endpoint, returns workouts as JSON
├── src/
│   ├── App.jsx
│   ├── WorkoutList.jsx    # fetches and renders workout data
│   ├── main.jsx
│   └── index.css
├── index.html
├── vite.config.js         # base path set for the aptitude deployment subpath
└── package.json
```

## Local setup

Requires Node 20+ (tested on Node v20.20.0) and npm.

```
npm install
cp api/config.example.php api/config.php   # fill in your real credentials
npm run dev
```

`WorkoutList` fetches from `api/workouts.php`, so you also need a local PHP
server running for real data to show up (otherwise you'll see a JSON parse
error, since Vite serves back `index.html` for unknown routes). In a second
terminal:

```
php -S localhost:8000 -t api
```

`vite.config.js` proxies `/CSE442/2026-Fall/cse-442y/api/*` to
`localhost:8000` in dev, so the frontend and PHP server just need to both be
running.

Note: `DB_HOST` is `localhost`, which PHP resolves to a Unix socket on
whatever machine is running the PHP process. On the aptitude server that's
its own MySQL instance; on your laptop it's whatever MySQL you have
installed locally (see below). Without a local MySQL server running, the
PHP server will fail to connect with `mysqli_sql_exception: No such file or
directory` -- in that case you're only testing the frontend and the dev
proxy wiring, not the live query.

### Optional: local MySQL for testing the real query

If you want `workouts.php` to return real data locally instead of just
exercising the frontend/proxy path:

```
brew install mysql
brew services start mysql
```

`brew services start` can take ~15 seconds to finish initializing before
the socket at `/tmp/mysql.sock` appears -- if `mysql -u root -e "SELECT 1"`
fails right after starting, wait a few seconds and retry.

Then create a database, table, and a user matching whatever you put in
`api/config.php`:

```
mysql -u root -e "
CREATE DATABASE IF NOT EXISTS cse442_2026_fall_team_y_db;
CREATE TABLE IF NOT EXISTS cse442_2026_fall_team_y_db.workouts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exercise VARCHAR(255) NOT NULL,
    reps INT NOT NULL,
    weight INT NOT NULL
);
INSERT INTO cse442_2026_fall_team_y_db.workouts (exercise, reps, weight) VALUES
    ('Squat', 5, 225),
    ('Bench Press', 8, 135),
    ('Deadlift', 3, 315);
CREATE USER IF NOT EXISTS 'DB_USER'@'localhost' IDENTIFIED BY 'DB_PASS';
GRANT ALL PRIVILEGES ON cse442_2026_fall_team_y_db.* TO 'DB_USER'@'localhost';
FLUSH PRIVILEGES;
"
```

Replace `DB_USER` / `DB_PASS` with the same values you put in
`api/config.php`, so the same config file works locally and on the real
server.

## Build

```
npm run build
```

Outputs static assets to `dist/`, built with the base path
`/CSE442/2026-Fall/cse-442y/` already baked in.

## Backend configuration

`api/config.php` holds your real UBIT username and person number as
`DB_USER` / `DB_PASS`. It's gitignored -- never remove it from `.gitignore`
or commit it. If it doesn't exist yet, copy `api/config.example.php` to
`api/config.php` and fill in your credentials.

Expected table:

```sql
CREATE TABLE workouts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exercise VARCHAR(255) NOT NULL,
    reps INT NOT NULL,
    weight INT NOT NULL
);
```

## Server access

Both `aptitude.cse.buffalo.edu` (test) and `cattle.cse.buffalo.edu` (prod)
sit behind UB's firewall -- you must be on the campus network or UB VPN to
reach them, including their web pages and phpMyAdmin, not just SSH.

Login for both SSH and MySQL on either server is your UBIT username and
your 8-digit person number as the password.

This POC targets **aptitude** (the test server, updated within a sprint).
`cattle` holds the team's released code and is only updated at the end of a
sprint -- not part of this POC's deploy flow.

### Creating the table via phpMyAdmin

As an alternative to the CLI, phpMyAdmin is available at
`https://aptitude.cse.buffalo.edu/phpmyadmin/` (also behind the VPN). Log in
with the same UBIT username/person number, select
`cse442_2026_fall_team_y_db` in the sidebar, open the **SQL** tab, and run the
same `CREATE TABLE` / `INSERT` statements from the Backend configuration
section above, then **Go**.

## Deploy to the aptitude server

Build first:

```
npm run build
```

Then copy `dist/` (frontend) and `api/` (backend) to the server, replacing
`UBIT_USERNAME` with your own:

```
scp -r dist/* UBIT_USERNAME@aptitude.cse.buffalo.edu:/data/web/CSE442/2026-Fall/cse-442y/
scp -r api UBIT_USERNAME@aptitude.cse.buffalo.edu:/data/web/CSE442/2026-Fall/cse-442y/
```

`/data/web/CSE442/2026-Fall/cse-442y/` is the team's shared web folder on
aptitude (absolute path, leading slash required). `api/config.php` is
gitignored but is a real local file, so `scp -r api` still copies it along
with everything else -- the server will have your real credentials without
them ever touching git.

After copying, verify the site loads at:

```
https://aptitude.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/
```
