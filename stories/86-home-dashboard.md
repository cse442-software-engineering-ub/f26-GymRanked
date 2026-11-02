# Story 86: As a signed-in user, I want to view my home dashboard after logging in, which is confirmed by the dashboard displaying my account name and workout summary.

- **Tasks:** #70 (home dashboard)
- **Automated in:** `tests/e2e/86-home-dashboard.spec.js`

## Acceptance Test 1: Dashboard shows the signed-in account and saved workout plan

### Setup for this test:

1. Connect to the UB VPN or use the campus network. Open the [Registration page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/register).
2. Register as `Marcus Dashboard` with a unique email such as `dashboard-happy+YOUR_INITIALS-TIMESTAMP@example.com` and `TaskTestPass12!` in both password fields. Confirm that the [Login page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login) says `Account created. Log in to continue.`
3. Sign in. On `Personal details`, enter `180` in **Body weight (lb)**, select **Man**, and select **Save and continue**. On `Choose your training goal`, select **Strength** and **Save goal**. On `How experienced are you?`, select **Beginner** and **Save and continue**. On `What equipment can you use?`, select **Full gym access** and **Save and continue**.
4. On `Choose your workout plan`, select **Choose plan** for **Beginner Fundamentals**. Confirm that the Dashboard opens.

### Steps:

1. Confirm that the address ends in `#/dashboard`, the heading says `Welcome back, Marcus`, and the profile icon says `MD`. Confirm that the weekly card shows `0/3` and `training days logged`, and that `Plan sessions this week` says `0 of 3`.
2. Confirm that `Today's workout` shows `Week of` followed by the current Monday–Sunday range and `Current plan: Beginner Fundamentals`.
3. On Monday, Wednesday, or Friday, confirm that today's workout and exercise names appear. On another day, confirm that the card says `Rest day` and describes the unscheduled day.
4. Refresh. Confirm that the same name, plan, weekly summary, and date range remain.

## Acceptance Test 2: Switching plans updates the dashboard and survives refresh

### Setup for this test:

1. Open the [Registration page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/register) and register `Sofia Switch` using a unique email and `TaskTestPass12!` in both password fields.
2. On the [Login page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login), sign in and confirm `Personal details` opens. Enter `180` in **Body weight (lb)**, select **Man**, and select **Save and continue**. Save **Strength**, **Intermediate**, and **Full gym access** on the separate goal, experience, and equipment pages.
3. On `Choose your workout plan`, choose **Beginner Fundamentals**. Confirm that the Dashboard says `Welcome back, Sofia` and `Current plan: Beginner Fundamentals`.

### Steps:

1. Select **Plans** in the desktop navigation, or open the mobile hamburger menu and select **Plans**. Confirm that `Find your next workout plan` and `Browse all training programs` appear.
2. Find **Bodyweight Basics** and select its **Choose plan** button. Confirm that the dialog says `Switch to Bodyweight Basics?` and `Switching plans now will reset this week's progress.`
3. Select **Switch plan** in the dialog. Confirm that the Dashboard opens with `Switched to Bodyweight Basics. Your week starts over today.` and `Welcome back, Sofia`.
4. Confirm that `Today's workout` shows `Current plan: Bodyweight Basics` and the current `Week of` range.
5. Refresh and confirm that **Bodyweight Basics** remains the current plan.

## Acceptance Test 3: Completed setup without a plan shows the empty state

### Setup for this test:

1. Open the [Registration page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/register) and register `Taylor Empty` using a unique email and `TaskTestPass12!` in both password fields.
2. On the [Login page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login), sign in. On `Personal details`, enter `180` in **Body weight (lb)**, select **Man**, and select **Save and continue**. Save **Strength** on `Choose your training goal`, **Beginner** on `How experienced are you?`, and **Full gym access** on `What equipment can you use?`.
3. Confirm that `Choose your workout plan` opens. Do not choose a plan.

### Steps:

1. Open the [Dashboard](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/dashboard) directly. Confirm that it says `Welcome, Taylor` and `WELCOME TO GYMRANK`, and that `Plan sessions this week` says `No plan`.
2. Confirm that `Today's workout` shows the current `Week of` range and `No workout plan selected`, with no workout or exercise list.
3. Select **Browse workout plans** in that card. Confirm that `Find your next workout plan` opens.

## Acceptance Test 4: Losing the connection shows an error, and Try again brings the Dashboard back

### Setup for this test:

1. On a computer, open the [Registration page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/register) and register `Alex Offline` using a unique email and `TaskTestPass12!` in both password fields.
2. On the [Login page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login), sign in. On `Personal details`, enter `180` in **Body weight (lb)**, select **Man**, and select **Save and continue**. Complete the goal, experience, and equipment pages with **Strength**, **Beginner**, and **Full gym access**; then choose **Beginner Fundamentals**. Confirm that the Dashboard opens.

### Steps:

1. Select **Plans** in the top navigation. Confirm that `Find your next workout plan` appears.
2. Turn off the computer's internet connection (switch off Wi-Fi or unplug the network cable) and keep this page open. Select **Dashboard** in the top navigation. Confirm that the page says `We couldn’t check your account setup. Try again.` with a **Try again** button, and does not show `Welcome back, Alex` or `No workout plan selected`.
3. Turn the internet connection back on, and reconnect to the UB VPN if you use it. Select **Try again**. Confirm that the Dashboard opens with `Welcome back, Alex`, `Current plan: Beginner Fundamentals`, and the current `Week of` range, and does not say `No workout plan selected`.

## Acceptance Test 5: The Dashboard needs you to be logged in

### Setup for this test:

1. Open the [Registration page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/register) and register `Jordan Guard` using a unique email and `TaskTestPass12!` in both password fields.
2. On the [Login page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login), sign in. On `Personal details`, enter `180` in **Body weight (lb)**, select **Man**, and select **Save and continue**. Save **Strength**, **Beginner**, and **Full gym access** on the separate onboarding pages; then choose **Beginner Fundamentals**. Confirm that the Dashboard says `Welcome back, Jordan`.

### Steps:

1. Open the account menu (your initials, top right) and select **Log out**. Confirm that the Login page says `You are logged out.`
2. Open the [Dashboard](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/dashboard) directly. Confirm that the address ends in `#/login`, and that `Welcome back, Jordan` and `Today's workout` are not shown.
3. Log in with the same email and `TaskTestPass12!`. Confirm that the Dashboard opens with `Welcome back, Jordan` and `Current plan: Beginner Fundamentals`.

## Acceptance Test 6: Unfinished onboarding resumes and blocks the dashboard

### Setup for this test:

1. Open a private browser window and visit the [Registration page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/register).
2. Register `Casey Resume` with a unique email and `TaskTestPass12!` in both password fields. On the [Login page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login), sign in and confirm `Personal details` opens. Enter `180` in **Body weight (lb)**, select **Man**, and select **Save and continue**. Confirm that `Choose your training goal` opens.

### Steps:

1. Without choosing a goal, close all private windows. Open a new private window, visit the [Login page](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login), and sign in. Confirm that `Choose your training goal` opens again.
2. Open the [Dashboard URL](https://cattle.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/dashboard) directly. Confirm that the app returns to `Choose your training goal` and does not show `Plan sessions this week`.
3. Select **Strength** and **Save goal**. Confirm that `How experienced are you?` opens.
4. Close all private windows, open a new one, and sign in again. Confirm that `How experienced are you?` resumes instead of the Dashboard or goal page.
5. Select **Beginner** and **Save and continue**. Confirm that `What equipment can you use?` opens. Select **Full gym access** and **Save and continue**. Confirm that `Choose your workout plan` opens.
6. Choose **Beginner Fundamentals**. Confirm that the Dashboard opens with `Welcome back, Casey`, `Plan sessions this week`, and `Current plan: Beginner Fundamentals`.
