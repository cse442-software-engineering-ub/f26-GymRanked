# Story 131: As a lifter, I want to choose a page from a menu grouped by activity, which is confirmed by seeing that page open with its section highlighted.

- **Tasks:** Nicholas's task (the menu map: labels, order, links and which section stays highlighted) and #133 (how the menu works on every signed-in page, Samuel)
- **Automated in:** not automated yet

**Proposal** from task #133 for the redesign review, to agree with Nicholas, who leads the story and writes its file in `stories/` and the text on card #131. The story text is the PM's. These acceptance tests are written for someone who has never used GymRank, run on Cattle, and use no developer tools.

Test account: `week-casey@example.com`, password `Weekly-Test-Compete!` (Casey Lin). It has a workout plan and an unfinished workout started today with one saved set. Ask the team to load the weekly test accounts on the day of the test.

## Acceptance Test 1: Choose a page from the menu on a computer

### Steps:

1. On a computer, open the Login page, type `week-casey@example.com` and `Weekly-Test-Compete!` and click "Log in". Check that the Dashboard opens and that a menu runs down the left side of the page.
2. Read the menu. Check that under "Training" it lists Dashboard, Workouts, Plans and Progress, that under "Community" it lists Rankings and Buddies, and that "Casey Lin" with "View profile" is at the bottom. Check that Dashboard is the highlighted row.
3. Click "Workouts". Check that the Workouts page opens, that Workouts is now the highlighted row and Dashboard is not, and that the menu stayed where it was.
4. Click "Plans", then "Progress", then "Rankings", then "Buddies". Check each time that the page with that name opens and that its row is the only highlighted one.
5. Check that there is no bar of links across the top of any of these pages.

Expected outcome: every page in the menu opens from the menu, the row for the open page is highlighted, and the menu stays in place the whole time.

## Acceptance Test 2: A page inside a section keeps its section highlighted

### Steps:

1. Log in as Casey on a computer. Click "Plans" in the menu, then click "View plan" on the current plan. Check that the plan's details open and that Plans is still highlighted.
2. Click "Back to plan library". Check that the plan library opens.
3. Click "Progress" in the menu, then click "Workout history". Check that Workout history opens and that Progress is still highlighted.
4. Click "Workouts" in the menu, then click "Resume workout". Check that the workout opens and that Workouts is highlighted.

Expected outcome: plan details keeps Plans highlighted, workout history keeps Progress highlighted, and a workout keeps Workouts highlighted.

## Acceptance Test 3: Choose a page from the menu on a phone

### Steps:

1. On a phone, open the Login page and log in as Casey. Check that the Dashboard opens with a "Menu" button at the top and no menu down the side.
2. Tap "Menu". Check that the menu opens from the side with the same rows as on a computer: Dashboard, Workouts, Plans, Progress, Rankings, Buddies, and "Casey Lin" with "View profile". Check that Dashboard is highlighted.
3. Tap "Progress". Check that the menu closes by itself and the Progress page opens.
4. Tap "Menu". Check that Progress is now highlighted.
5. Tap the "Close" button (the ×) at the top of the menu. Check that the menu closes and the Progress page is still open.
6. Tap "Menu", then tap "Casey Lin". Check that the menu closes and the Profile page opens.

Expected outcome: on a phone the same pages are reached from "Menu", the menu closes after a page is chosen, and the open section is highlighted.

## Acceptance Test 4: Use the phone menu with a keyboard

### Steps:

1. On a computer, make the browser window as narrow as it goes (about the width of a phone), so the "Menu" button shows. Log in as Casey.
2. Press the Tab key until "Menu" has an orange outline, then press the Enter key. Check that the menu opens.
3. Press Tab several times. Check that the orange outline moves through the rows of the menu and never jumps to the page behind it.
4. Press the Escape key (Esc, top left of the keyboard). Check that the menu closes and that the orange outline is back on "Menu".
5. Press Enter, press Tab until "Buddies" is outlined, and press Enter. Check that the menu closes and "Workout buddies" opens.

Expected outcome: the menu can be opened, used and closed with the keyboard alone, and closing it with Escape returns to the "Menu" button.

## Acceptance Test 5: Visit Buddies during a workout and come back to the same workout

### Steps:

1. On a phone, log in as Casey. Tap "Menu", then "Workouts". Check that today's workout shows "Resume workout".
2. Tap "Resume workout". Check that the workout opens and shows one saved set.
3. Tap "Menu". Check that the menu opens over the workout and that Workouts is highlighted.
4. Tap "Buddies". Check that "Workout buddies" opens.
5. Tap "Menu", then "Workouts". Check that the workout still shows "Resume workout".
6. Tap "Resume workout". Check that the same workout opens with the same saved set, listed once.

Expected outcome: the menu is available in the middle of a workout, and leaving for another page and coming back resumes the same workout with nothing lost.

## Acceptance Test 6: Profile and Log out are easy to reach, and pages before login have no menu

### Steps:

1. Log in as Casey on a computer. Click "Casey Lin" at the bottom of the menu. Check that the Profile page opens.
2. Click "Log out" at the bottom of the menu. Check that the Login page opens and says "You are logged out.", and that it shows no menu.
3. Click "Create an account". Check that this page shows no menu either.

Expected outcome: Profile and Log out are one click away on every signed-in page, and the menu appears only after logging in.
