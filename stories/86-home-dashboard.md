# Story 86: As a signed-in user, I want to view my home dashboard after logging in, which is confirmed by the dashboard displaying my account name and workout summary.

- **Tasks:** #70 (home dashboard)
- **Automated in:** `tests/e2e/86-home-dashboard.spec.js`

## Acceptance Test 1: Dashboard shows the signed-in account and saved workout plan

### Setup for this test:

1. Connect to the UB VPN or use the campus network. Open the [Registration page](https://aptitude.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/register).
2. Register as `Marcus Dashboard` with a unique email such as `dashboard-happy+YOUR_INITIALS-TIMESTAMP@example.com` and `TaskTestPass12!` in both password fields. Confirm that the [Login page](https://aptitude.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login) says `Account created. Log in to continue.`
3. Sign in. On `Choose your training goal`, select **Strength** and **Save goal**. On `How experienced are you?`, select **Beginner** and **Save and continue**. On `What equipment can you use?`, select **Full gym access** and **Save and continue**.
4. On `Choose your workout plan`, select **Choose plan** for **Beginner Fundamentals**. Confirm that the Dashboard opens.

### Steps:

1. Confirm that the address ends in `#/dashboard`, the heading says `Welcome back, Marcus`, and the profile icon says `MD`.
2. Confirm that `RANK` says `Getting started`, `WORKOUTS THIS WEEK` says `0 of 3`, and `WEEKLY CONSISTENCY` says `0 weeks`.
3. Confirm that `Today's workout` shows `Week of` followed by the current Monday–Sunday range and `Current plan: Beginner Fundamentals`.
4. On Monday, Wednesday, or Friday, confirm that today's workout and exercise names appear. On another day, confirm that the card says `Rest day` and describes the unscheduled day.
5. Refresh. Confirm that the same name, plan, weekly summary, and date range remain.

## Acceptance Test 2: Switching plans updates the dashboard and survives refresh

### Setup for this test:

1. Open the [Registration page](https://aptitude.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/register) and register `Sofia Switch` using a unique email and `TaskTestPass12!` in both password fields.
2. On the [Login page](https://aptitude.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login), sign in and confirm `Choose your training goal` opens. Save **Strength**, **Intermediate**, and **Full gym access** on the separate goal, experience, and equipment pages.
3. On `Choose your workout plan`, choose **Beginner Fundamentals**. Confirm that the Dashboard says `Welcome back, Sofia` and `Current plan: Beginner Fundamentals`.

### Steps:

1. Select **Plans** in the desktop navigation, or open the mobile hamburger menu and select **Plans**. Confirm that `Workout plan library` and `Browse all training programs.` appear.
2. Find **Bodyweight Basics** and select its **Select** button. Confirm that the dialog says `Switch to Bodyweight Basics?` and warns that switching resets this week's progress.
3. Select **Switch plan** in the dialog. Confirm that the Dashboard opens with `Switched to Bodyweight Basics. Your week starts over today.` and `Welcome back, Sofia`.
4. Confirm that `Today's workout` shows `Current plan: Bodyweight Basics` and the current `Week of` range.
5. Refresh and confirm that **Bodyweight Basics** remains the current plan.

## Acceptance Test 3: Completed setup without a plan shows the empty state

### Setup for this test:

1. Open the [Registration page](https://aptitude.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/register) and register `Taylor Empty` using a unique email and `TaskTestPass12!` in both password fields.
2. On the [Login page](https://aptitude.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login), sign in. Save **Strength** on `Choose your training goal`, **Beginner** on `How experienced are you?`, and **Full gym access** on `What equipment can you use?`.
3. Confirm that `Choose your workout plan` opens. Do not choose a plan.

### Steps:

1. Open the [Dashboard](https://aptitude.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/dashboard) directly. Confirm that it says `Welcome, Taylor` and `WELCOME TO GYMRANK`.
2. Confirm that `WORKOUTS THIS WEEK` says `No plan yet` and `WEEKLY CONSISTENCY` says `0 weeks`.
3. Confirm that `Today's workout` shows the current `Week of` range and `No workout plan selected`, with no workout or exercise list.
4. Select **Browse workout plans** in that card. Confirm that `Workout plan library` opens.

## Acceptance Test 4: Dashboard shows loading states before saved data arrives

### Setup for this test:

1. Open the [Registration page](https://aptitude.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/register) and register `Alex Loading` using a unique email and `TaskTestPass12!` in both password fields.
2. On the [Login page](https://aptitude.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login), sign in. Complete the goal, experience, and equipment pages with **Strength**, **Beginner**, and **Full gym access**; then choose **Beginner Fundamentals**.
3. On a laptop, open Chrome DevTools with F12. In Network, enable **Disable cache** and select **Slow 3G** throttling.

### Steps:

1. Refresh the [Dashboard](https://aptitude.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/dashboard). Confirm that `Checking your account setup…` appears while account requests are pending.
2. Confirm that `Loading today's workout...` appears while the saved plan is fetched.
3. Wait for the requests to finish. Confirm that the loading message disappears and `Welcome back, Alex`, `Current plan: Beginner Fundamentals`, and the current `Week of` range appear.
4. Confirm that the finished card does not say `No workout plan selected`. Return DevTools to **No throttling** and uncheck **Disable cache**.

## Acceptance Test 5: A failed plan request shows an error and can be retried

### Setup for this test:

1. Open the [Registration page](https://aptitude.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/register) and register `Jordan Error` using a unique email and `TaskTestPass12!` in both password fields.
2. On the [Login page](https://aptitude.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login), sign in. Save **Strength**, **Beginner**, and **Full gym access** on the separate onboarding pages; then choose **Beginner Fundamentals**.
3. On a laptop, open Chrome DevTools with F12. In Network request blocking, enable the pattern `*current_plan.php*`. Leave the other API requests unblocked.

### Steps:

1. Refresh the [Dashboard](https://aptitude.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/dashboard) and confirm that the `current_plan.php` request is blocked.
2. Confirm that the page still says `Welcome back, Jordan` and that `Today's workout` shows `Couldn't load your workout summary. Check your connection and try again.` with a **Try again** button. Confirm that `WORKOUTS THIS WEEK` says `Unavailable`, not `No plan yet`.
3. Disable request blocking and select **Try again**. Confirm that the error disappears and `Current plan: Beginner Fundamentals` and today's workout or `Rest day` return.

## Acceptance Test 6: Unfinished onboarding resumes and blocks the dashboard

### Setup for this test:

1. Open a private browser window and visit the [Registration page](https://aptitude.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/register).
2. Register `Casey Resume` with a unique email and `TaskTestPass12!` in both password fields. On the [Login page](https://aptitude.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login), sign in and confirm `Choose your training goal` opens.

### Steps:

1. Without choosing a goal, close all private windows. Open a new private window, visit the [Login page](https://aptitude.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/login), and sign in. Confirm that `Choose your training goal` opens again.
2. Open the [Dashboard URL](https://aptitude.cse.buffalo.edu/CSE442/2026-Fall/cse-442y/#/dashboard) directly. Confirm that the app returns to `Choose your training goal` and does not show `WORKOUTS THIS WEEK`.
3. Select **Strength** and **Save goal**. Confirm that `How experienced are you?` opens.
4. Close all private windows, open a new one, and sign in again. Confirm that `How experienced are you?` resumes instead of the Dashboard or goal page.
5. Select **Beginner** and **Save and continue**. Confirm that `What equipment can you use?` opens. Select **Full gym access** and **Save and continue**. Confirm that `Choose your workout plan` opens.
6. Choose **Beginner Fundamentals**. Confirm that the Dashboard opens with `Welcome back, Casey`, `WORKOUTS THIS WEEK`, and `Current plan: Beginner Fundamentals`.
