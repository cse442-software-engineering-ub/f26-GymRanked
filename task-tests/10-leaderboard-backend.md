# DRAFT for PM review: Leaderboard rankings backend (USAPL scoring)

Task, Sprint 3 | @mansurna. Backend for story #10. Card number: TBD. The pasteable version is `10-leaderboard-backend.html`; this file is the same text.

Ready to paste into the backend task card's description. The buttons copy exactly what is shown: plain lines, with each test's number and name in bold. There are no tables, so it pastes the same way every time.

DRAFT for PM review before the card moves to In Progress. Run the tests in order on aptitude. It needs the personal details backend (body weight and gender) first. The response fields and expected results are agreed with Samuel (his reply of this week); the points he changed are in the contract below. Research #114 is the baseline and is not this task.

The method is settled: the PM confirmed DOTS. Open questions that need an answer before the tests are final: (1) Story #10 and Samuel's page use Bronze to Diamond tiers with ratio cutoffs that are not USAPL, and no source gives DOTS cutoffs, so these tests rank per lift and have no tier field until a sourced tier table is agreed (PM, Samuel). (2) Nonbinary and Prefer not to say members choose the men's or women's table when they join (agreed with Samuel); the PM confirms that letting people choose is acceptable (PM). (3) A saved table is remembered when someone leaves and rejoins, so scoring_table is required only until one is saved (Samuel to confirm). (4) Casey Morgan's numbers in story #10 are replaced by the numbers in this card, and Samuel updates stories/10-leaderboard.md and his card from the Expected scores (Samuel).

## Contract these tests assume

One new endpoint, api/leaderboard.php, for the logged-in user. It reads finished workouts (workout_sessions.completed_at is not NULL) and their sets (workout_sets), and each user's body weight and gender from user_profile (the personal details backend). The user always comes from the gymrank_session cookie. There is no way to ask for another user's data, and any user_id sent is ignored.

GET api/leaderboard.php?board=overall (or bench, squat, deadlift). board defaults to overall. Any other parameter is ignored.

POST api/leaderboard.php {"join": true} puts the logged-in user on the leaderboard. DELETE api/leaderboard.php takes them off and keeps their workouts, personal details and chosen scoring table.

Scoring table. DOTS has a men's and a women's table. For a saved gender of man or woman the table always follows the gender, and any scoring_table sent is ignored (it is not stored). For nonbinary and prefer_not_to_say the user chooses: POST {"join": true, "scoring_table": "men"} or {"join": true, "scoring_table": "women"}. It is required until one is saved: without it, or with any other value, POST returns 400 {"error":"Invalid request.","errors":{"scoring_table":"Choose a scoring table."}} and nobody is joined. Sending the same POST again while joined changes the table. DELETE keeps the saved table, so joining again remembers it and {"join": true} alone is enough. One combined board for everyone, because DOTS is made to compare men and women. Rows never show gender or the table.

Where "joined" is stored: user_profile.leaderboard_joined_at (DATETIME, UTC). NULL means not on the leaderboard. The chosen table is user_profile.scoring_table (ENUM men, women; NULL when none). A user who never saved personal details has no user_profile row; joining creates one with body weight and gender NULL.

GET returns 200: {"board", "ranked_count", "workouts_needed", "rows": [{"rank", "name", "score", "lift", "is_me", "gap_before"}], "me": {...}}.

- ranked_count is the number of people on that board. An empty board returns ranked_count 0 and rows [] (status 200). workouts_needed is 3 (the page does not hard-code it).

- rows is the top 10 plus everyone tied with 10th place (so a tie at 10 is never cut), plus the logged-in user and the one person either side of them when they are on the board and outside the top 10. name is first name and last initial ("Ana C."), shortened on the server. lift is the lift that gave the score (bench, squat or deadlift) and is null on the overall board. score is a JSON number with at most 2 decimals (51.00 is sent as 51). A row never has an email, user id, body weight, gender, scoring table or estimated 1RM.

- gap_before is true on the first row that comes after a jump in the list (from the top section to the logged-in user and the person above them), and false on every other row. A gap in rank numbers cannot show this, because ties also skip numbers (1, 2, 2, 4).

- me: {"ranked", "rank", "score", "reason", "joined", "bodyweight_lb", "gender", "scoring_table", "lifts": {"bench", "squat", "deadlift"}, "workouts_done"}. me shows only the logged-in user's own values. lifts holds their best estimated 1RMs in lb (at most 2 decimals), null for a lift never logged. scoring_table is "men", "women" or null: the table actually used (the gender's table for man and woman, the saved choice otherwise). workouts_done is always present.

- me.ranked, me.rank, me.score and me.reason are for the board asked for. When the user is not on that board: ranked false, rank null, score null and reason set. When ranked, reason is null.

- reason is one value even when several apply, the first of: test_account, not_joined, no_bodyweight, needs_scoring_table, too_few_workouts, no_lift, missing_lifts. no_bodyweight means no body weight or gender is saved (api/personal_details.php saves them together). needs_scoring_table means the gender is nonbinary or prefer_not_to_say and no table is saved (this happens when someone joined as man or woman and later changed their gender in Personal details). no_lift means no counted set for the lift of that board (on Overall: for none of the three lifts). missing_lifts is only given on Overall: the user is ranked on at least one lift board but is missing one or two lifts (the nulls in me.lifts say which).

Errors, all JSON: 401 {"error":"Please log in."}; 405 {"error":"Method not allowed."} with an Allow: GET, POST, DELETE header; 400 {"error":"Invalid request.","errors":{...}} for a bad board or a bad POST body, with one entry per bad field (errors.board: Use overall, bench, squat or deadlift. errors.join: Use true. errors.scoring_table: Choose a scoring table.); 500 {"error":"Database error"}.

Who is ranked on a board: all of these are true. The user pressed Join. users.is_test is 0. A body weight and a gender are saved, and the scoring table (see above) is known. They have at least 3 finished workouts (completed_at is not NULL). They have a counted set of the lift of that board (on Overall: of all three lifts).

Data. New migration database/migrations/013_leaderboard.sql (012 is the personal details table, and 011 is already used on dev) adds users.is_test TINYINT(1) NOT NULL DEFAULT 0, set only by seeds or SQL and never by the app, user_profile.leaderboard_joined_at DATETIME NULL (UTC) and user_profile.scoring_table ENUM('men','women') NULL. It can be run more than once, says in its top comment how to apply it locally, on aptitude and on cattle, and changes no existing row. Every existing account starts not joined, with no table, and not a test account. The workout tables do not change. api/personal_details.php keeps updating only body weight and gender, so saving details never changes joined or the table.

## Scoring (DOTS) and source

Score = lift_kg x 500 / (a + b*x + c*x^2 + d*x^3 + e*x^4), where x is body weight in kg. Kilograms are pounds x 0.45359237 (the exact definition), for the lift and for body weight.

Men: a = -307.75076, b = 24.0900756, c = -0.1918759221, d = 0.0007391293, e = -0.000001093.

Women: a = -57.96288, b = 13.6175032, c = -0.1126655495, d = 0.0005158568, e = -0.0000010706.

Body weight is limited to 40 to 210 kg for men's table and 40 to 150 kg for the women's table before the formula is used (the limits of the OpenPowerlifting reference implementation). The API accepts 50 to 700 lb, so the limit matters above about 330 lb on the women's table and above about 463 lb on the men's table.

Source: the coefficients and the body weight limits are those of the OpenPowerlifting implementation of DOTS, https://gitlab.com/openpowerlifting/opl-data/-/blob/main/crates/coefficients/src/dots.rs . The PM confirmed that the method is DOTS, which USAPL uses for Open Best Lifter awards (a secondary summary, powerliftingrecords.com citing BarBend, dates this to 2022-01-01 and gives no rule number). This source goes in the task card and in the comment at the top of api/leaderboard.php.

What is scored: USAPL applies DOTS to a meet total of competition lifts. GymRank feeds it estimated 1RMs from logged workouts (Epley, sets of 1 to 10 reps), not meet lifts, so a score is a GymRank score on the DOTS scale and is not an official USAPL result.

Estimated 1RM (e1RM): Epley: weight_lb x (1 + reps / 30) per set. A lift's e1RM is its best set over all finished workouts. It is not rounded before scoring. Only exactly Bench press, Back squat and Deadlift count (Goblet squat, Romanian deadlift and other variations do not), only sets of 1 to 10 reps and more than 0 lb count, and only sets in finished workouts count.

Lift board score: the DOTS score of that lift's e1RM alone (DOTS is defined for a powerlifting total, so this is an adaptation for single lifts). Overall score: the DOTS score of the sum of the three lifts' e1RMs (a total, the way USAPL uses DOTS), only for people who have all three lifts. Overall rows have lift null.

Rounding and ties: a score is rounded half up to 2 decimals. Ranks are decided on the rounded score, so two people who both show 243.63 always share a rank, even when their unrounded scores differ (Rex Tully below). Compare whole hundredths (integers), not floating point numbers.

Order: highest score first. People with the same score share a rank and the next rank is skipped (1, 2, 2, 4). Tied people are listed by full name A to Z, then by user id. Boards cover all time.

## Test data (database/seeds/leaderboard.sql)

Loaded with the seed (Test 1). It adds new accounts only and changes none of Marcus, Dana, Riley, Taylor, Sean, Priya or Jordan, so stories 7, 8, 9 and 18 keep their numbers. Every account has an @example.com email of the form first.last@example.com and has finished onboarding. Password: Rank-Test-2026! unless a different one is listed. The accounts that story #10's acceptance tests log in as (Casey, Luis, Robin, Noor and Max) use the passwords agreed with Samuel. The number in a password is only a label, not the person's lift. Weights are lb; bests are e1RMs from sets of 1 to 10 reps. Each best comes from one set in one finished workout; the person's other finished workouts hold lighter sets of the same lift, so they only add to the workout count.

Ana Cole, man, 200 lb, joined, 5 finished workouts. Bench press 210, Back squat 264, Deadlift 360.

Ben Ortiz, man, 200 lb, joined, 4 finished workouts. Bench press 210, Back squat 312, Deadlift 312.

Cy Park, woman, 200 lb, joined, 3 finished workouts. Bench press 180, Back squat 324, Deadlift 288.

Dee Sharma, man, 200 lb, joined, 6 finished workouts. Bench press 208, Back squat 240, Deadlift 336. One extra unfinished workout (day_name "Pending test workout") with a Bench press set of 250 x 5.

Eli Ford, man, 200 lb, joined, 3 finished workouts. Bench press 240 only.

Gus Hart, man, 200 lb, joined, 2 finished workouts. Bench press 240. One extra unfinished workout (day_name "Pending test workout") with a Bench press set of 200 x 6.

Hana Reyes, man, no body weight saved, joined, 3 finished workouts. Bench press 240. Personal details never saved: no body weight and no gender.

Ivy Chen, man, 200 lb, NOT joined, 3 finished workouts. Bench press 180 (150 x 6). She also has a finished Bench press set of 300 x 12 (more than 10 reps) and one unfinished workout (day_name "Pending test workout") with a Bench press set of 400 x 3.

Zed Quinn, man, 200 lb, joined, 0 workouts. No sets.

Nova Lane, nonbinary, chose the women table, 160 lb, joined, 4 finished workouts. Bench press 95, Back squat 140, Deadlift 185. A nonbinary member who chose the women's table and is ranked.

Sky Moreno, prefer not to say, 180 lb, NOT joined, 3 finished workouts. Bench press 165. Prefer not to say, no table chosen yet.

Pia Lund, woman, 150 lb, joined, 3 finished workouts. Only Goblet squat and Romanian deadlift sets, which do not count: no counted lift.

Rex Tully, man, 200 lb, joined, 3 finished workouts. Bench press 185.3 lb x 4 reps, an e1RM of 210.0067 lb. He scores 61.35 on Bench like Ana and Ben (210 lb) and shows why ties are decided on the rounded score.

Noor Haddad, woman, 170 lb, joined, 3 finished workouts. Bench press 150 only, no squat or deadlift: ranked on Bench press and not on Overall. Password Noor-Bench150!

Robin Hale, woman, 150 lb, joined, 2 finished workouts. Bench press 135. Only 2 finished workouts, so unranked. Password Robin-Bench135!

Max Tester, man, 180 lb, joined, 10 finished workouts. Bench press 250, Back squat 300, Deadlift 600, users.is_test = 1. Password Max-Tester600!

Casey Morgan, man, 200 lb, joined, 12 finished workouts. Bench press 140, Back squat 190, Deadlift 205. The viewer for the pinned-row tests. Password Casey-Deadlift330!

Luis Ortega, man, 170 lb, joined, 9 finished workouts. Bench press 115, Back squat 180, Deadlift 205. A second ranked member just above Casey. Password Luis-Squat285!

Everyone listed here has a user_profile row with the body weight, gender, scoring table and joined state shown. Hana's row is missing body weight and gender. Rows for the 44 demo members are in the next section.

## Demo members (44, in database/seeds/leaderboard.sql)

44 more ranked members so the boards are long enough to need a top 10 and a pinned row. All joined, all with all three lifts, none a test account, email first.last@example.com, password Demo-Member-2026!. Each lift is the person's best e1RM in lb, from one set in their first finished workout (for example 105 lb x 10 reps for an e1RM of 140). Every demo member scores below Dee Sharma on Overall, Bench press and Back squat, and below Ben Ortiz on Deadlift, so the ranks of Cy, Ana, Ben and Dee do not depend on them. A few demo members tie with each other, as on a real board.

Aaron Adams, man, 160 lb, 6 finished workouts. Bench press 80, Back squat 105, Deadlift 130.

Bella Brooks, man, 150 lb, 10 finished workouts. Bench press 90, Back squat 140, Deadlift 170.

Carlos Cruz, man, 185 lb, 11 finished workouts. Bench press 80, Back squat 130, Deadlift 130.

Dina Diaz, man, 210 lb, 10 finished workouts. Bench press 160, Back squat 190, Deadlift 195.

Ethan Evans, woman, 150 lb, 3 finished workouts. Bench press 70, Back squat 100, Deadlift 120.

Fatima Fox, man, 235 lb, 7 finished workouts. Bench press 115, Back squat 225, Deadlift 260.

Grant Gray, man, 200 lb, 11 finished workouts. Bench press 165, Back squat 175, Deadlift 245.

Hiro Hayes, woman, 145 lb, 11 finished workouts. Bench press 65, Back squat 100, Deadlift 110.

Isla Ito, man, 155 lb, 8 finished workouts. Bench press 95, Back squat 110, Deadlift 140.

Jamal Jones, man, 255 lb, 5 finished workouts. Bench press 120, Back squat 230, Deadlift 195.

Kira Khan, man, 210 lb, 12 finished workouts. Bench press 125, Back squat 150, Deadlift 155.

Liam Lopez, woman, 175 lb, 6 finished workouts. Bench press 70, Back squat 100, Deadlift 100.

Maya Meyer, man, 235 lb, 10 finished workouts. Bench press 115, Back squat 190, Deadlift 185.

Nate Nash, woman, 115 lb, 11 finished workouts. Bench press 60, Back squat 85, Deadlift 95.

Olive Owens, woman, 195 lb, 8 finished workouts. Bench press 85, Back squat 170, Deadlift 155.

Paolo Price, woman, 145 lb, 3 finished workouts. Bench press 75, Back squat 125, Deadlift 120.

Quinn Ramos, man, 245 lb, 5 finished workouts. Bench press 135, Back squat 215, Deadlift 270.

Rosa Singh, woman, 140 lb, 7 finished workouts. Bench press 85, Back squat 115, Deadlift 130.

Sam Tran, man, 255 lb, 7 finished workouts. Bench press 140, Back squat 150, Deadlift 200.

Tara Vance, man, 165 lb, 7 finished workouts. Bench press 85, Back squat 125, Deadlift 130.

Umar Walsh, man, 175 lb, 10 finished workouts. Bench press 110, Back squat 130, Deadlift 175.

Vera Young, man, 150 lb, 7 finished workouts. Bench press 70, Back squat 120, Deadlift 105.

Wes Zhou, woman, 195 lb, 6 finished workouts. Bench press 135, Back squat 145, Deadlift 205.

Xena Baker, man, 170 lb, 9 finished workouts. Bench press 95, Back squat 100, Deadlift 115.

Yuri Chang, man, 185 lb, 11 finished workouts. Bench press 130, Back squat 185, Deadlift 185.

Zoe Dunn, woman, 175 lb, 7 finished workouts. Bench press 100, Back squat 130, Deadlift 130.

Abel Ellis, man, 180 lb, 7 finished workouts. Bench press 100, Back squat 185, Deadlift 160.

Bree Flynn, woman, 180 lb, 12 finished workouts. Bench press 65, Back squat 120, Deadlift 155.

Cole Grant, woman, 185 lb, 11 finished workouts. Bench press 85, Back squat 120, Deadlift 120.

Dara Hale, man, 180 lb, 6 finished workouts. Bench press 75, Back squat 135, Deadlift 140.

Eden Ivanov, man, 255 lb, 9 finished workouts. Bench press 135, Back squat 140, Deadlift 220.

Finn Jain, woman, 115 lb, 5 finished workouts. Bench press 55, Back squat 70, Deadlift 70.

Gia Kerr, man, 180 lb, 11 finished workouts. Bench press 70, Back squat 115, Deadlift 140.

Hugo Lowe, man, 235 lb, 11 finished workouts. Bench press 130, Back squat 125, Deadlift 150.

Ines Moss, man, 200 lb, 7 finished workouts. Bench press 135, Back squat 150, Deadlift 165.

Jude Nunez, man, 245 lb, 4 finished workouts. Bench press 170, Back squat 205, Deadlift 245.

Kai Okafor, man, 215 lb, 8 finished workouts. Bench press 115, Back squat 150, Deadlift 175.

Lena Pratt, man, 240 lb, 4 finished workouts. Bench press 135, Back squat 210, Deadlift 200.

Milo Quade, woman, 170 lb, 7 finished workouts. Bench press 95, Back squat 150, Deadlift 140.

Nina Rowe, man, 155 lb, 4 finished workouts. Bench press 70, Back squat 145, Deadlift 120.

Omar Stone, woman, 120 lb, 10 finished workouts. Bench press 55, Back squat 70, Deadlift 60.

Pearl Tate, man, 185 lb, 11 finished workouts. Bench press 105, Back squat 115, Deadlift 165.

Reid Usher, woman, 160 lb, 8 finished workouts. Bench press 85, Back squat 90, Deadlift 100.

Sana Voss, man, 150 lb, 9 finished workouts. Bench press 115, Back squat 140, Deadlift 130.

## Expected scores

Each score is computed from the formula above with the data above. "none" means the person is not on that board.

Ana Cole: Bench press 61.35, Back squat 77.12, Deadlift 105.17, Overall 243.63.

Ben Ortiz: Bench press 61.35, Back squat 91.14, Deadlift 91.14, Overall 243.63.

Cy Park: Bench press 72.54, Back squat 130.56, Deadlift 116.06, Overall 319.16.

Dee Sharma: Bench press 60.76, Back squat 70.11, Deadlift 98.15, Overall 229.03.

Eli Ford: Bench press 70.11, Back squat none, Deadlift none, Overall none.

Nova Lane: Bench press 42.72, Back squat 62.95, Deadlift 83.18, Overall 188.85.

Noor Haddad: Bench press 65.32, Back squat none, Deadlift none, Overall none.

Rex Tully: Bench press 61.35, Back squat none, Deadlift none, Overall none.

Casey Morgan: Bench press 40.90, Back squat 55.50, Deadlift 59.89, Overall 156.29.

Luis Ortega: Bench press 36.78, Back squat 57.56, Deadlift 65.56, Overall 159.90.

Everyone else in the test data (Gus, Hana, Ivy, Zed, Sky, Pia, Robin, Max) is on no board until a test changes that.

Overall board (ranked_count 51), top section: rank 1 Cy P. 319.16, rank 2 Ana C. 243.63, rank 2 Ben O. 243.63, rank 4 Dee S. 229.03, rank 5 Wes Z. 197.65, rank 6 Nova L. 188.85, rank 7 Grant G. 170.89, rank 8 Milo Q. 167.64, rank 9 Olive O. 167.09, rank 10 Jude N. 165.93, rank 10 Quinn R. 165.93. Casey M. is rank 15 and Luis O. rank 14.

Bench press board (ranked_count 54), top section: rank 1 Cy P. 72.54, rank 2 Eli F. 70.11, rank 3 Noor H. 65.32, rank 4 Ana C. 61.35, rank 4 Ben O. 61.35, rank 4 Rex T. 61.35, rank 7 Dee S. 60.76, rank 8 Wes Z. 55.02, rank 9 Grant G. 48.20, rank 10 Dina D. 45.66. lift is bench on every row.

Back squat board (ranked_count 51), top section: rank 1 Cy P. 130.56, rank 2 Ben O. 91.14, rank 3 Ana C. 77.12, rank 4 Dee S. 70.11, rank 5 Olive O. 69.28, rank 6 Milo Q. 65.32, rank 7 Nova L. 62.95, rank 8 Fatima F. 61.18, rank 9 Jamal J. 60.67, rank 10 Paolo P. 59.43.

Deadlift board (ranked_count 51), top section: rank 1 Cy P. 116.06, rank 2 Ana C. 105.17, rank 3 Dee S. 98.15, rank 4 Ben O. 91.14, rank 5 Wes Z. 83.54, rank 6 Nova L. 83.18, rank 7 Quinn R. 72.26, rank 8 Grant G. 71.57, rank 9 Fatima F. 70.70, rank 10 Bree F. 65.58.

## Setup for all tests

Step 1: Connect to the UB VPN or the campus network.

Step 2: On aptitude apply database/migrations/012_user_profile.sql and 013_leaderboard.sql, then load database/seeds/test_users.sql, database/seeds/personal_details.sql and database/seeds/leaderboard.sql, following ServerOperationsGuide.md and database/seeds/README.md. Test 1 does the seed load. The expected numbers assume nobody else has joined the leaderboard on that database; if other people have, compare the order of the people named here and not ranked_count or the ranks of people far down.

Step 3: In a terminal, set the variables and log the people in. Each person gets their own cookie file. Run each line:

API=https://aptitude.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/api

J='Content-Type: application/json'

while read -r p pw; do curl -s -c $p.jar -H "$J" -d '{"email":"'$p'@example.com","password":"'$pw'"}' $API/login.php; done <<'EOF'
ana.cole Rank-Test-2026!
ben.ortiz Rank-Test-2026!
cy.park Rank-Test-2026!
dee.sharma Rank-Test-2026!
eli.ford Rank-Test-2026!
gus.hart Rank-Test-2026!
hana.reyes Rank-Test-2026!
ivy.chen Rank-Test-2026!
zed.quinn Rank-Test-2026!
nova.lane Rank-Test-2026!
sky.moreno Rank-Test-2026!
pia.lund Rank-Test-2026!
noor.haddad Noor-Bench150!
robin.hale Robin-Bench135!
max.tester Max-Tester600!
rex.tully Rank-Test-2026!
luis.ortega Luis-Squat285!
casey.morgan Casey-Deadlift330!
EOF

Write A, B, C, DEE, ELI, G, H, I, Z, NOVA, SKY, PIA, REX, NOOR, ROBIN, MAX, CASEY and LUIS for curl -s -b ana.cole.jar and so on for each person (for example NOOR is curl -s -b noor.haddad.jar). Put each URL in quotes, because it contains ?. Add -w ' %{http_code}\n' to print the status code. Pipe to python3 -m json.tool to read the output.

Step 4: Keep a mysql session open on aptitude (mysql -u UBIT_USERNAME -p cse442_2026_fall_team_y_db) for the tests that read or change a row.

### Test 1: The seed loads, can be re-run, and matches the test data

Seeded data used: every account in Test data and the 44 demo members, plus the seven existing test accounts (Marcus, Dana, Riley, Taylor, Sean, Priya, Jordan), which must not change.

Step 1: Load database/seeds/leaderboard.sql as in database/seeds/README.md, then load it a second time.

Step 2: In mysql run SELECT u.email, u.is_test, p.bodyweight_lb, p.gender, p.scoring_table, p.leaderboard_joined_at IS NOT NULL AS joined FROM users u LEFT JOIN user_profile p ON p.user_id = u.id WHERE u.email IN ('ana.cole@example.com','ben.ortiz@example.com','cy.park@example.com','dee.sharma@example.com','eli.ford@example.com','gus.hart@example.com','hana.reyes@example.com','ivy.chen@example.com','zed.quinn@example.com','nova.lane@example.com','sky.moreno@example.com','pia.lund@example.com','rex.tully@example.com','noor.haddad@example.com','robin.hale@example.com','max.tester@example.com','casey.morgan@example.com','luis.ortega@example.com') ORDER BY u.email;

Step 3: Run SELECT u.email, COUNT(*) AS finished FROM users u JOIN workout_sessions s ON s.user_id = u.id WHERE s.completed_at IS NOT NULL AND u.email LIKE '%@example.com' GROUP BY u.email; and compare the leaderboard people with the test data. Run SELECT COUNT(*) FROM users WHERE email LIKE '%@example.com'; to count the accounts.

Step 4: Run SELECT email FROM users WHERE email IN ('marcus.malone@example.com','dana.lee@example.com','riley.brooks@example.com','taylor.reed@example.com','sean.obrien@example.com','priya.shah@example.com','jordan.kim@example.com'); and note how many workouts each of Marcus, Dana, Riley, Taylor and Sean has.

Step 5: Log in as casey.morgan@example.com, luis.ortega@example.com, robin.hale@example.com, noor.haddad@example.com and max.tester@example.com with the passwords in the test data.

Expected outcome: step 1 prints no error and the second load changes nothing (the same 62 new accounts, no duplicates). Step 2 shows exactly the body weight, gender, scoring table, joined state and is_test described in the test data: Hana has no body weight, Ivy and Sky are not joined, Nova is nonbinary with scoring_table women and only Max Tester has is_test 1. Step 3 shows the finished-workout counts in the test data. Step 4 shows the same accounts and workout counts as before the seed was loaded. Step 5: all five log in.

### Test 2: Signed-out and wrong-method requests are refused

Seeded data used: Ana Cole (logged in as A). The first three steps use no account.

Step 1: With no cookie run curl -s -w ' %{http_code}\n' "$API/leaderboard.php".

Step 2: With a made-up cookie run curl -s -w ' %{http_code}\n' -b 'gymrank_session=abc' "$API/leaderboard.php?board=bench".

Step 3: With no cookie run curl -s -w ' %{http_code}\n' -X POST -H "$J" -d '{"join":true}' "$API/leaderboard.php", then the same with -X DELETE.

Step 4: Run A -i -X PUT -H "$J" -d '{}' "$API/leaderboard.php".

Expected outcome: steps 1 to 3 print {"error":"Please log in."} 401 and no names or scores, and nobody is joined or removed. Step 4 returns status 405, the header Allow: GET, POST, DELETE and {"error":"Method not allowed."}.

### Test 3: Invalid requests return 400 and ignore other parameters

Seeded data used: Ana Cole (man, 200 lb, joined, 5 finished workouts; bench 210; squat 264; deadlift 360). Sky Moreno (prefer not to say, 180 lb, not joined, 3 finished workouts; bench 165). Sky is the prefer-not-to-say member who has not chosen a table.

Step 1: Run A -w ' %{http_code}\n' "$API/leaderboard.php?board=biceps".

Step 2: Run A -w ' %{http_code}\n' -X POST -H "$J" -d '{"join":"yes"}' "$API/leaderboard.php", then with -d '{}' and with -d 'not json'.

Step 3: Run SKY -w ' %{http_code}\n' -X POST -H "$J" -d '{"join":true}' "$API/leaderboard.php", then with -d '{"join":true,"scoring_table":"other"}'.

Step 4: Run A "$API/leaderboard.php?board=bench" and A "$API/leaderboard.php?board=bench&user_id=999&tier=gold".

Expected outcome: step 1 returns 400 {"error":"Invalid request.","errors":{"board":"Use overall, bench, squat or deadlift."}}. Step 2 returns 400 with errors.join (Use true.) for each body. Step 3 returns 400 {"error":"Invalid request.","errors":{"scoring_table":"Choose a scoring table."}} both times, and Sky is still not joined (SELECT leaderboard_joined_at FROM user_profile WHERE user_id = (SELECT id FROM users WHERE email = 'sky.moreno@example.com'); prints NULL). Step 4: both responses are identical, because user_id and tier are ignored.

### Test 4: Scores and order are exact on every board

Seeded data used: Ana Cole (man, 200 lb, joined, 5 finished workouts; bench 210; squat 264; deadlift 360). Ben Ortiz (man, 200 lb, joined, 4 finished workouts; bench 210; squat 312; deadlift 312). Cy Park (woman, 200 lb, joined, 3 finished workouts; bench 180; squat 324; deadlift 288). Dee Sharma (man, 200 lb, joined, 6 finished workouts; bench 208; squat 240; deadlift 336). The other 47 accounts on Overall are Nova, Casey, Luis and the 44 demo members; Eli, Noor and Rex are on the Bench press board only.

Step 1: Run A "$API/leaderboard.php?board=overall".

Step 2: Run A "$API/leaderboard.php?board=bench", then board=squat, then board=deadlift.

Step 3: Recompute one score by hand: Ana's Bench press e1RM is 210 lb, which is 95.2544 kg (210 x 0.45359237), and her body weight is 200 lb, which is 90.7185 kg. Put 90.7185 into the men's formula to get 500 divided by 776.36, which is 0.64403, and multiply 95.2544 by it.

Step 4: Recompute Ana's Overall score the same way from the sum of her three e1RMs, 834 lb, which is 378.3 kg.

Expected outcome: step 1 returns the Overall board from Expected scores: ranked_count 51, the first rows rank 1 Cy P. 319.16, rank 2 Ana C. 243.63, rank 2 Ben O. 243.63, rank 4 Dee S. 229.03, with lift null on every row and is_me true only on Ana's row, and workouts_needed 3. Step 2 returns the three lift boards from Expected scores, with the ranked_count, ranks and scores given there and lift set to the board's lift. Step 3: the hand calculation gives 61.35, the same as the API. Step 4 gives 243.63, the same as her Overall score, which is the DOTS score of the total and is not the sum of the three rounded lift scores (61.35 + 77.12 + 105.17 = 243.64). Every score is a JSON number with at most 2 decimals, never a string.

### Test 5: People with the same score share a rank and the next rank is skipped

Seeded data used: Ana Cole (man, 200 lb, joined, 5 finished workouts; bench 210; squat 264; deadlift 360). Ben Ortiz (man, 200 lb, joined, 4 finished workouts; bench 210; squat 312; deadlift 312). Rex Tully (man, 200 lb, joined, 3 finished workouts; bench 210.01). Dee Sharma (man, 200 lb, joined, 6 finished workouts; bench 208; squat 240; deadlift 336). Jude Nunez and Quinn Ramos (demo members, Overall 165.93 each) tie for 10th place.

Step 1: Run A "$API/leaderboard.php?board=overall".

Step 2: Run A "$API/leaderboard.php?board=bench".

Step 3: In mysql find Rex's best bench press set: SELECT t.weight_lb, t.reps FROM workout_sets t JOIN workout_sessions s ON s.id = t.session_id WHERE s.user_id = (SELECT id FROM users WHERE email = 'rex.tully@example.com') AND t.exercise = 'Bench press' ORDER BY t.weight_lb * (1 + t.reps / 30) DESC LIMIT 1;

Expected outcome: step 1: Ana C. and Ben O. both have rank 2 and score 243.63, Ana is listed before Ben (name A to Z), Dee S. has rank 4, and no row has rank 3. The response has 11 rows, because Jude N. and Quinn R. are both rank 10, tied with 10th place, and neither is cut. Step 2: Ana C., Ben O. and Rex T. all have rank 4 and score 61.35, listed Ana, Ben, Rex (name A to Z), Dee S. has rank 7, and no row has rank 5 or 6. Step 3: Rex's set is 185.3 lb x 4, an e1RM of 210.0067 lb, which is higher than Ana's 210 before rounding. They share a rank because the scores are compared after rounding to 2 decimals, so Rex is not placed above Ana. No row has gap_before true in these two responses, because ties are not gaps.

### Test 6: Top 10 plus you and one person either side, with gap_before

Seeded data used: Casey Morgan (man, 200 lb, joined, 12 finished workouts; bench 140; squat 190; deadlift 205). Luis Ortega (man, 170 lb, joined, 9 finished workouts; bench 115; squat 180; deadlift 205). Ben Ortiz (man, 200 lb, joined, 4 finished workouts; bench 210; squat 312; deadlift 312). Cy Park (woman, 200 lb, joined, 3 finished workouts; bench 180; squat 324; deadlift 288). The 44 demo members fill the places between Dee and Luis.

Step 1: Run CASEY "$API/leaderboard.php?board=overall".

Step 2: Run LUIS "$API/leaderboard.php?board=overall".

Step 3: Run B "$API/leaderboard.php?board=overall" and C "$API/leaderboard.php?board=overall".

Step 4: Run CASEY "$API/leaderboard.php?board=squat".

Expected outcome: step 1: rows are the top 10 plus everyone tied with 10th place, 11 rows in all (rank 1 Cy P. 319.16, rank 2 Ana C. 243.63, rank 2 Ben O. 243.63, rank 4 Dee S. 229.03, rank 5 Wes Z. 197.65, rank 6 Nova L. 188.85, rank 7 Grant G. 170.89, rank 8 Milo Q. 167.64, rank 9 Olive O. 167.09, rank 10 Jude N. 165.93, rank 10 Quinn R. 165.93), followed by Luis O., Casey M. and the person below Casey: (gap_before) rank 14 Luis O. 159.90, rank 15 Casey M. 156.29, rank 16 Dina D. 155.52. gap_before is true only on the row for rank 14 (Luis O.) and false on every other row, ranked_count is 51, me.ranked is true, me.rank is 15, me.score is 156.29, and is_me is true only on Casey's row. Step 2: the first 11 rows are the same, then (gap_before) rank 13 Rosa S. 160.21, rank 14 Luis O. 159.90, rank 15 Casey M. 156.29, with gap_before true only on the row for rank 13. Step 3: Ben and Cy are inside the top 10, so rows has exactly 11 entries (the top 10 plus the person tied with 10th place) and no gap_before is true. Step 4: me.rank, me.score and the rows are for the Back squat board (rank 19, score 55.50), not for Overall.

### Test 7: A lift board leaves out people who never logged that lift

Seeded data used: Eli Ford (man, 200 lb, joined, 3 finished workouts; bench 240). Noor Haddad (woman, 170 lb, joined, 3 finished workouts; bench 150).

Step 1: Run ELI "$API/leaderboard.php?board=bench".

Step 2: Run ELI "$API/leaderboard.php?board=squat", then board=deadlift, then board=overall.

Step 3: Run NOOR "$API/leaderboard.php?board=bench", then NOOR "$API/leaderboard.php?board=overall" and NOOR "$API/leaderboard.php?board=squat".

Expected outcome: step 1: Eli F. is on the board with rank 2 and score 70.11, and me shows ranked true, rank 2, score 70.11, reason null and lifts with bench 240 and squat and deadlift null. Step 2: Eli F. is not in rows for the Squat or Deadlift board, and those two me objects show ranked false, rank null, score null and reason no_lift. On Overall his me shows ranked false, rank null, score null and reason missing_lifts (he is ranked on Bench and is missing the Back squat and the Deadlift, which the nulls in me.lifts show). None of this is an error. Step 3: Noor H. is rank 3 on Bench with score 65.32, and is not on Overall (reason missing_lifts) or on Back squat (reason no_lift).

### Test 8: The score uses the saved gender

Seeded data used: Cy Park (woman, 200 lb, joined, 3 finished workouts; bench 180; squat 324; deadlift 288). Ana Cole (man, 200 lb, joined, 5 finished workouts; bench 210; squat 264; deadlift 360). Ben Ortiz (man, 200 lb, joined, 4 finished workouts; bench 210; squat 312; deadlift 312). Dee Sharma (man, 200 lb, joined, 6 finished workouts; bench 208; squat 240; deadlift 336).

Step 1: Run C "$API/leaderboard.php?board=overall" and note Cy's score (319.16, woman).

Step 2: In mysql run UPDATE user_profile SET gender = 'man' WHERE user_id = (SELECT id FROM users WHERE email = 'cy.park@example.com');

Step 3: Run C "$API/leaderboard.php?board=overall".

Step 4: In mysql run UPDATE user_profile SET gender = 'woman' WHERE user_id = (SELECT id FROM users WHERE email = 'cy.park@example.com'); and run step 3 again.

Expected outcome: step 3: Cy's Overall score is 231.37 at rank 3, and her me.scoring_table is men. Ana C. 243.63 and Ben O. 243.63 are rank 1. Step 4: Cy is back to 319.16 at rank 1 and me.scoring_table is women. Rows never show the gender or the table.

### Test 9: Nonbinary and prefer not to say members choose their scoring table

Seeded data used: Nova Lane (nonbinary, table women, 160 lb, joined, 4 finished workouts; bench 95; squat 140; deadlift 185). Sky Moreno (prefer not to say, 180 lb, not joined, 3 finished workouts; bench 165). Ana Cole (man, 200 lb, joined, 5 finished workouts; bench 210; squat 264; deadlift 360).

Step 1: Run NOVA "$API/leaderboard.php?board=overall" and SKY "$API/leaderboard.php?board=bench".

Step 2: Run SKY -w ' %{http_code}\n' -X POST -H "$J" -d '{"join":true,"scoring_table":"women"}' "$API/leaderboard.php", then SKY "$API/leaderboard.php?board=bench".

Step 3: Run SKY -X POST -H "$J" -d '{"join":true,"scoring_table":"men"}' "$API/leaderboard.php", then SKY "$API/leaderboard.php?board=bench".

Step 4: Run SKY -X DELETE "$API/leaderboard.php", then in mysql SELECT scoring_table, leaderboard_joined_at FROM user_profile WHERE user_id = (SELECT id FROM users WHERE email = 'sky.moreno@example.com'); then SKY -X POST -H "$J" -d '{"join":true}' "$API/leaderboard.php" and SKY "$API/leaderboard.php?board=bench".

Step 5: Run A -X POST -H "$J" -d '{"join":true,"scoring_table":"women"}' "$API/leaderboard.php", then A "$API/leaderboard.php?board=bench" and in mysql SELECT scoring_table FROM user_profile WHERE user_id = (SELECT id FROM users WHERE email = 'ana.cole@example.com');

Step 6: Undo: SKY -X DELETE "$API/leaderboard.php", and in mysql UPDATE user_profile SET scoring_table = NULL WHERE user_id = (SELECT id FROM users WHERE email = 'sky.moreno@example.com');

Expected outcome: step 1: Nova is ranked on Overall (rank 6, score 188.85) with me.scoring_table women, and Sky's me shows ranked false, reason not_joined and scoring_table null. Step 2: the join returns 200 and Sky is on the Bench board with score 69.82 (rank 3), me.scoring_table women and reason null. Step 3: the same POST again changes the table: her score becomes 51.00 (rank 9) and me.scoring_table is men. Step 4: DELETE returns 200 and the SELECT shows scoring_table men and a NULL leaderboard_joined_at; joining again with only {"join":true} returns 200 and she is back with 51.00 and men, because the choice was remembered. Step 5: Ana (a man) is joined with 200, me.scoring_table stays men, her Bench score is unchanged at 61.35, and the SELECT prints NULL, because the table follows the gender and what was sent is ignored. Step 6 takes Sky off the board.

### Test 10: Changing gender after joining asks for a scoring table

Seeded data used: Ben Ortiz (man, 200 lb, joined, 4 finished workouts; bench 210; squat 312; deadlift 312). Ana Cole (man, 200 lb, joined, 5 finished workouts; bench 210; squat 264; deadlift 360).

Step 1: Run B -H "$J" -d '{"bodyweight_lb":200,"gender":"nonbinary"}' "$API/personal_details.php", then B "$API/leaderboard.php?board=overall" and A "$API/leaderboard.php?board=overall".

Step 2: Run B -X POST -H "$J" -d '{"join":true,"scoring_table":"men"}' "$API/leaderboard.php", then B "$API/leaderboard.php?board=overall".

Step 3: Undo: B -H "$J" -d '{"bodyweight_lb":200,"gender":"man"}' "$API/personal_details.php", and in mysql UPDATE user_profile SET scoring_table = NULL WHERE user_id = (SELECT id FROM users WHERE email = 'ben.ortiz@example.com');

Expected outcome: step 1: Ben's me shows ranked false, rank null, score null, reason needs_scoring_table, joined true and scoring_table null. He is not in Ana's rows and ranked_count is 50. Step 2: the POST returns 200 and Ben is back at rank 2 with 243.63, tied with Ana, and me.scoring_table is men. Step 3 returns him to a man whose table follows his gender.

### Test 11: Fewer than 3 finished workouts is not ranked

Seeded data used: Gus Hart (man, 200 lb, joined, 2 finished workouts; bench 240). Zed Quinn (man, 200 lb, joined, 0 finished workouts; no counted lifts). Eli Ford (man, 200 lb, joined, 3 finished workouts; bench 240). Gus also has an unfinished workout named "Pending test workout" with a Bench press set of 200 x 6.

Step 1: Run G "$API/leaderboard.php?board=bench" and Z "$API/leaderboard.php?board=bench".

Step 2: In mysql finish Gus's extra workout: UPDATE workout_sessions SET completed_at = UTC_TIMESTAMP() WHERE day_name = 'Pending test workout' AND user_id = (SELECT id FROM users WHERE email = 'gus.hart@example.com');

Step 3: Run G "$API/leaderboard.php?board=bench".

Step 4: Put the workout back: UPDATE workout_sessions SET completed_at = NULL WHERE day_name = 'Pending test workout' AND user_id = (SELECT id FROM users WHERE email = 'gus.hart@example.com');

Expected outcome: step 1: Gus's me is ranked false, rank null, score null, reason too_few_workouts, workouts_done 2 and workouts_needed 3, and Zed gets status 200 with ranked false, reason too_few_workouts and workouts_done 0 (not an error, even though he also has no lift). Neither is in rows. Step 3: Gus is on the Bench press board with score 70.11, ranked true and workouts_done 3, tied with Eli F. at rank 2 and listed after him (name A to Z). Step 4 returns him to workouts_done 2.

### Test 12: Joining and body weight are required

Seeded data used: Ivy Chen (man, 200 lb, not joined, 3 finished workouts; bench 180). Hana Reyes (man, no body weight, joined, 3 finished workouts; bench 240). Pia Lund (woman, 150 lb, joined, 3 finished workouts; no counted lifts). Hana has no user_profile body weight or gender.

Step 1: Run I "$API/leaderboard.php?board=bench", H "$API/leaderboard.php?board=bench" and PIA "$API/leaderboard.php?board=bench".

Step 2: Run I -w ' %{http_code}\n' -X POST -H "$J" -d '{"join":true}' "$API/leaderboard.php", then I "$API/leaderboard.php?board=bench".

Step 3: Save Hana's details with H -H "$J" -d '{"bodyweight_lb":190,"gender":"man"}' "$API/personal_details.php", then H "$API/leaderboard.php?board=bench".

Step 4: Undo: I -X DELETE "$API/leaderboard.php", and in mysql UPDATE user_profile SET bodyweight_lb = NULL, gender = NULL WHERE user_id = (SELECT id FROM users WHERE email = 'hana.reyes@example.com');

Expected outcome: step 1: Ivy's me has ranked false and reason not_joined, Hana's has reason no_bodyweight, and Pia's has reason no_lift (she has 3 workouts but only Goblet squat and Romanian deadlift sets, which do not count). None of them is in rows. Step 2: the join returns 200, and Ivy is on the Bench press board with score 52.58 at rank 9. Step 3: Hana joined before she had a body weight; now she is on the board with score 71.99 (240 lb at 190 lb) at rank 2, and the personal details POST did not change her joined state. Step 4 takes both back off.

### Test 13: Only counted sets count

Seeded data used: Ivy Chen (man, 200 lb, not joined, 3 finished workouts; bench 180). Pia Lund (woman, 150 lb, joined, 3 finished workouts; no counted lifts). Ivy also has a finished 300 x 12 bench press set and an unfinished workout "Pending test workout" with a 400 x 3 bench press set. Pia only has Goblet squat and Romanian deadlift sets.

Step 1: Join Ivy again: I -X POST -H "$J" -d '{"join":true}' "$API/leaderboard.php", then I "$API/leaderboard.php?board=bench" and note her score and me.lifts.bench.

Step 2: In mysql finish Ivy's extra workout: UPDATE workout_sessions SET completed_at = UTC_TIMESTAMP() WHERE day_name = 'Pending test workout' AND user_id = (SELECT id FROM users WHERE email = 'ivy.chen@example.com'); then run I "$API/leaderboard.php?board=bench".

Step 3: Put it back: UPDATE workout_sessions SET completed_at = NULL WHERE day_name = 'Pending test workout' AND user_id = (SELECT id FROM users WHERE email = 'ivy.chen@example.com'); then run I "$API/leaderboard.php?board=bench".

Step 4: Run PIA "$API/leaderboard.php?board=overall".

Expected outcome: step 1: Ivy's Bench press is 180 (her 300 x 12 set and her unfinished 400 x 3 set are ignored) and her score is 52.58. Step 2: her Bench press e1RM becomes 440 and her score 128.54, rank 1 on the Bench press board. Step 3: she is back to 180 and 52.58. Step 4: Pia's lifts are all null and her reason is no_lift, because Goblet squat and Romanian deadlift do not count.

### Test 14: Test accounts never appear

Seeded data used: Max Tester (man, 180 lb, joined, 10 finished workouts, is_test 1; bench 250; squat 300; deadlift 600). Ana Cole (man, 200 lb, joined, 5 finished workouts; bench 210; squat 264; deadlift 360).

Step 1: Run MAX -w ' %{http_code}\n' "$API/leaderboard.php?board=deadlift" and A "$API/leaderboard.php?board=deadlift".

Step 2: Run A "$API/leaderboard.php?board=overall", then board=bench, board=squat and board=deadlift, and look for Max T. in rows.

Step 3: In mysql run UPDATE users SET is_test = 0 WHERE email = 'max.tester@example.com'; then run A "$API/leaderboard.php?board=deadlift".

Step 4: Put it back: UPDATE users SET is_test = 1 WHERE email = 'max.tester@example.com'; then run A "$API/leaderboard.php?board=deadlift" again.

Step 5: Run MAX -w ' %{http_code}\n' -X POST -H "$J" -d '{"is_test":0}' "$API/leaderboard.php".

Step 6: In mysql run UPDATE user_profile SET leaderboard_joined_at = NULL WHERE user_id = (SELECT id FROM users WHERE email = 'max.tester@example.com'); then MAX "$API/leaderboard.php?board=overall", and set it back with UPDATE user_profile SET leaderboard_joined_at = UTC_TIMESTAMP() WHERE user_id = (SELECT id FROM users WHERE email = 'max.tester@example.com');

Expected outcome: step 1: Max's own request returns 200 with ranked false and reason test_account (not an error), and Ana's Deadlift board does not contain him. Step 2: Max T. is in no rows on any board. Step 3: with the flag at 0 he is rank 1 on the Deadlift board (600 lb at 180 lb, score 185.45), which shows the flag is the only thing keeping him off. Step 4: he is gone again. Step 5 returns 400 (there is no join key) and is_test stays 1 (SELECT is_test FROM users WHERE email = 'max.tester@example.com'; prints 1), because the app has no way to set it. Step 6: his reason is still test_account when he is not joined, because test_account wins over every other reason.

### Test 15: Reasons come in a fixed order when several apply

Seeded data used: Zed Quinn (man, 200 lb, joined, 0 finished workouts; no counted lifts). Max Tester (man, 180 lb, joined, 10 finished workouts, is_test 1; bench 250; squat 300; deadlift 600).

Step 1: In mysql run UPDATE user_profile SET leaderboard_joined_at = NULL, bodyweight_lb = NULL, gender = NULL WHERE user_id = (SELECT id FROM users WHERE email = 'zed.quinn@example.com'); then Z "$API/leaderboard.php?board=bench".

Step 2: UPDATE user_profile SET leaderboard_joined_at = UTC_TIMESTAMP() WHERE user_id = (SELECT id FROM users WHERE email = 'zed.quinn@example.com'); then Z "$API/leaderboard.php?board=bench".

Step 3: UPDATE user_profile SET bodyweight_lb = 200, gender = 'nonbinary' WHERE user_id = (SELECT id FROM users WHERE email = 'zed.quinn@example.com'); then Z "$API/leaderboard.php?board=bench".

Step 4: UPDATE user_profile SET gender = 'man' WHERE user_id = (SELECT id FROM users WHERE email = 'zed.quinn@example.com'); then Z "$API/leaderboard.php?board=bench".

Step 5: Restore Zed: nothing else to undo, he is back to his seeded state (joined, 200 lb, man).

Expected outcome: step 1: reason not_joined (it wins over no_bodyweight). Step 2: reason no_bodyweight. Step 3: reason needs_scoring_table. Step 4: reason too_few_workouts, because he has 0 workouts, even though he also has no lift (no_lift comes later in the order). The full order is test_account, not_joined, no_bodyweight, needs_scoring_table, too_few_workouts, no_lift, missing_lifts, and Test 7 and Test 12 show missing_lifts and no_lift.

### Test 16: Other people's data stays private

Seeded data used: Ana Cole (man, 200 lb, joined, 5 finished workouts; bench 210; squat 264; deadlift 360). Ben Ortiz (man, 200 lb, joined, 4 finished workouts; bench 210; squat 312; deadlift 312).

Step 1: Run A "$API/leaderboard.php?board=overall" and look at every key in every object in rows.

Step 2: Search the whole response for any email address, @, a user id, a body weight, a gender word (man, woman, nonbinary), a scoring table word (men, women) or an e1RM in lb outside Ana's own me.

Step 3: Run B "$API/leaderboard.php?board=overall" and compare me with Ana's.

Expected outcome: every row has exactly the keys rank, name, score, lift, is_me and gap_before. Names are shortened ("Cy P.", never "Cy Park"). Step 2 finds none of those values anywhere outside Ana's own me. Step 3: Ben's me shows only Ben's values (lifts 210, 312 and 312, body weight 200, gender man, scoring_table men), and no value from Ana.

### Test 17: Leaving and joining take effect straight away

Seeded data used: Ana Cole (man, 200 lb, joined, 5 finished workouts; bench 210; squat 264; deadlift 360). Ben Ortiz (man, 200 lb, joined, 4 finished workouts; bench 210; squat 312; deadlift 312). Cy Park (woman, 200 lb, joined, 3 finished workouts; bench 180; squat 324; deadlift 288). Dee Sharma (man, 200 lb, joined, 6 finished workouts; bench 208; squat 240; deadlift 336).

Step 1: Run B "$API/leaderboard.php?board=overall" and note that Ana C. is in rows.

Step 2: Run A -w ' %{http_code}\n' -X DELETE "$API/leaderboard.php", then B "$API/leaderboard.php?board=overall" and A "$API/leaderboard.php?board=overall".

Step 3: In mysql run SELECT COUNT(*) FROM workout_sessions s JOIN users u ON u.id = s.user_id WHERE u.email = 'ana.cole@example.com'; and SELECT bodyweight_lb, gender FROM user_profile WHERE user_id = (SELECT id FROM users WHERE email = 'ana.cole@example.com');

Step 4: Run A -X POST -H "$J" -d '{"join":true}' "$API/leaderboard.php", then B "$API/leaderboard.php?board=overall".

Expected outcome: step 2: DELETE returns 200. Ana C. is not in Ben's rows, ranked_count is 50, Cy P. is rank 1 and Ben O. is rank 2, and Ana's own me shows ranked false with reason not_joined. Step 3: her workouts (5 finished) and her body weight 200 and gender man are unchanged. Step 4: Ana C. is back at rank 2 with 243.63 and ranked_count is 51.

### Test 18: A newly finished workout moves a score

Seeded data used: Dee Sharma (man, 200 lb, joined, 6 finished workouts; bench 208; squat 240; deadlift 336). Dee also has an unfinished workout "Pending test workout" with a Bench press set of 250 x 5.

Step 1: Run DEE "$API/leaderboard.php?board=bench" and note Dee's score (60.76, rank 7).

Step 2: In mysql finish Dee's extra workout: UPDATE workout_sessions SET completed_at = UTC_TIMESTAMP() WHERE day_name = 'Pending test workout' AND user_id = (SELECT id FROM users WHERE email = 'dee.sharma@example.com'); then run DEE "$API/leaderboard.php?board=bench".

Step 3: Put it back: UPDATE workout_sessions SET completed_at = NULL WHERE day_name = 'Pending test workout' AND user_id = (SELECT id FROM users WHERE email = 'dee.sharma@example.com'); then run DEE "$API/leaderboard.php?board=bench".

Expected outcome: step 2: Dee's Bench press e1RM becomes 291.67 (250 x (1 + 5/30), not rounded before scoring; me.lifts.bench shows 291.67), her score becomes 85.20 and she is rank 1, with Cy P. at rank 2. Her Overall score also rises to 253.47. Step 3: she is back to 60.76 and rank 7.

### Test 19: Saved body weight feeds the score

Seeded data used: Ana Cole (man, 200 lb, joined, 5 finished workouts; bench 210; squat 264; deadlift 360). Ben Ortiz (man, 200 lb, joined, 4 finished workouts; bench 210; squat 312; deadlift 312).

Step 1: Run A "$API/leaderboard.php?board=bench" and note Ana's score (61.35) and Ben's.

Step 2: Run A -H "$J" -d '{"bodyweight_lb":190,"gender":"man"}' "$API/personal_details.php", then A "$API/leaderboard.php?board=bench".

Step 3: Run B "$API/leaderboard.php?board=bench".

Step 4: Put it back: A -H "$J" -d '{"bodyweight_lb":200,"gender":"man"}' "$API/personal_details.php".

Expected outcome: step 2: Ana's Bench press score changes from 61.35 to 62.99 on the very next request (the same 210 lb lift at 190 lb), me.bodyweight_lb is 190, and she is still joined. Step 3: Ben's score is still 61.35, because only the account that saved the details changed. Step 4 returns Ana to 61.35.

### Test 20: An empty board returns an empty list

Seeded data used: the whole leaderboard.sql seed on a local database, loaded again at the end.

Step 1: On a local database (not aptitude, because this takes everyone off the board), load the migrations and seeds as in Setup, then run UPDATE user_profile SET leaderboard_joined_at = NULL;

Step 2: Run A "$API/leaderboard.php?board=overall" against the local server, then board=bench.

Step 3: Load database/seeds/leaderboard.sql again.

Expected outcome: step 2 returns status 200 with ranked_count 0, rows [] and workouts_needed 3, and Ana's me shows ranked false, rank null, score null and reason not_joined. Step 3 puts the seeded people back on the boards.

### Test 21: Existing stories are unchanged

Seeded data used: the existing test_users.sql, workout_history.sql, exercise_progress.sql and exercise_progress_ranges.sql accounts (Marcus, Dana, Riley, Taylor, Sean, Priya, Jordan), which must be unchanged after leaderboard.sql is loaded.

Step 1: Run the checks of stories #7, #8 and #9 as their task tests say (for example node tests/workout-session-api.mjs against a local server for story #7, then load database/seeds/exercise_progress.sql again afterwards).

Step 2: Run npm test.

Step 3: Open the history and progress numbers for Riley, Taylor and Marcus in stories/9-workout-history.md and stories/8-exercise-progress.md and compare them with the API responses of api/workout_history.php and api/exercise_progress.php.

Expected outcome: all of these return exactly what they returned before the leaderboard seed and migration 013 were added. The leaderboard accounts appear in none of them.

### Test 22: The migration, code and docs are in place

Seeded data used: the accounts and counts from Test 1; migration 013 changes none of them.

Step 1: In mysql run SELECT COUNT(*) FROM users; and SELECT COUNT(*) FROM user_profile; and note the numbers. Run database/migrations/013_leaderboard.sql again, then repeat the two counts.

Step 2: Run SHOW COLUMNS FROM users LIKE 'is_test'; and SHOW COLUMNS FROM user_profile LIKE 'leaderboard_joined_at'; and SHOW COLUMNS FROM user_profile LIKE 'scoring_table';

Step 3: Open api/leaderboard.php. Confirm it starts with a comment block in the style of api/exercise_progress.php (request, response, status codes), requires a login before reading any data, takes the user only from the session cookie, uses prepared statements, and has the DOTS coefficients, the body weight limits and both sources (the OpenPowerlifting dots.rs link and the USAPL note) in comments, and says it scores estimated 1RMs and not meet lifts.

Step 4: Run php -l api/leaderboard.php.

Step 5: Open ARCHITECTURE.md and database/seeds/README.md.

Step 6: Run npm run build and npm test.

Expected outcome: step 1 prints no error and both counts are unchanged. Step 2 shows is_test TINYINT(1) NOT NULL DEFAULT 0, leaderboard_joined_at DATETIME NULL and scoring_table ENUM('men','women') NULL. Step 3 shows the comment block and no query that takes a user id from the request. Step 4 prints No syntax errors detected in api/leaderboard.php. Step 5: ARCHITECTURE.md lists leaderboard.php with its parameters, the DOTS formula and its sources, and the seeds README describes leaderboard.sql with its 62 accounts, their passwords and which ones story #10's acceptance tests use. Step 6: the build succeeds and the existing unit tests pass.
