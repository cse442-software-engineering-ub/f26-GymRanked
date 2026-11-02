Task Test 1: Recommended plans match goal, experience and equipment
Setup for this test:
Open the Aptitude login page, click “Create an account”, and create rec-full@test.com with the password ABC12345678@ (Full name: Rec Full). Log in with it.
On “Choose your training goal” click “Strength” and “Save goal”. On “How experienced are you?” click “Intermediate” and “Save and continue”. On “What equipment can you use?” click “Full gym access” and “Save and continue”.
Steps:
“Choose your workout plan” should open. It should say “Plans for strength that fit your experience and equipment. Pick one to start.” and “Your setup” should read “Strength · Intermediate · Full gym access”.
Exactly 5 plan cards should be listed, in this order: Push Pull Legs, Upper/Lower Hypertrophy, Athletic Performance, Full Body Strength, Beginner Fundamentals. Each card should have a green dot and a “Choose plan” button.
5/3/1 Strength Cycle and Powerlifting Peak (Advanced) and Glute Focus, Bodyweight Basics and Marathon Strength Support (not strength plans) should not appear.
Click “Edit” next to “Your setup”, then change the goal to “Aerobic fitness”, the experience to “Beginner” and the equipment to “Bodyweight only”, saving each step. Only “Bodyweight Basics” should be listed, with a green dot. “Beginner Fundamentals” should not appear, because it needs dumbbells and a cable machine.
Click “Edit” again and change the goal to “Strength” (Beginner and Bodyweight only stay). No plan cards should appear, and the page should say “No plans match your goal, level and equipment yet.” with a “Browse all plans” link.

Task Test 2: The plan library lists recommended plans first, then the rest once
Setup for this test:
Sign in on Aptitude with rec-full@test.com as the email and ABC12345678@ as the password, and set “Strength”, “Intermediate” and “Full gym access” as in Task Test 1 (use “Edit” on “Your setup” if the account already has other answers).
Steps:
Click “Plans” on the navigation bar. “Workout plan library” should open with “Your setup” reading “Strength · Intermediate · Full gym access”.
Under the label “Recommended for you” the plans should be: Push Pull Legs, Upper/Lower Hypertrophy, Athletic Performance, Full Body Strength, Beginner Fundamentals.
Under the label “More plans” the plans should be: 5/3/1 Strength Cycle, Powerlifting Peak, Bodyweight Basics, Glute Focus, Marathon Strength Support.
Count the cards. There should be 10, and no plan should appear twice. Each card should still show its name, level and length, days per week, an equipment dot and a “Select” button.
Click “Edit”, change the setup to “Aerobic fitness”, “Beginner” and “Bodyweight only”, then open “Plans” again. “Recommended for you” should list only Bodyweight Basics. “More plans” should list the other 9 plans in this order: Push Pull Legs, Full Body Strength, Upper/Lower Hypertrophy, 5/3/1 Strength Cycle, Beginner Fundamentals, Powerlifting Peak, Athletic Performance, Glute Focus, Marathon Strength Support.
Hover over the red dot on Beginner Fundamentals. It should say “Insufficient equipment” and “Needs Dumbbells and Cable machine”.
Refresh the page. The same order should appear.

Task Test 3: With no matching plans the library keeps its normal order
Setup for this test:
Sign in on Aptitude with rec-full@test.com as the email and ABC12345678@ as the password.
Click “Edit” on “Your setup” and change the setup to “Strength”, “Beginner” and “Bodyweight only”.
Steps:
Click “Plans” on the navigation bar. “Workout plan library” should open with “Your setup” reading “Strength · Beginner · Bodyweight only”.
The labels “Recommended for you” and “More plans” should not appear.
All 10 plans should be listed in this order: Push Pull Legs, Full Body Strength, Upper/Lower Hypertrophy, 5/3/1 Strength Cycle, Beginner Fundamentals, Powerlifting Peak, Bodyweight Basics, Athletic Performance, Glute Focus, Marathon Strength Support.
Full Body Strength and Beginner Fundamentals should have red dots.

Task Test 4: Recommendations need a finished setup and a login
Setup for this test:
On the Aptitude login page click “Create an account” and create rec-new@test.com with the password ABC12345678@ (Full name: Rec New). Log in with it. Stay on “Choose your training goal”.
Steps:
Open the Aptitude site’s #/recommended page by changing the end of the address to #/recommended. “Choose your training goal” should open instead, with no plan cards.
Change the end of the address to #/plans. “Choose your training goal” should open again.
Click “Strength” and “Save goal”, then change the end of the address to #/plans. “How experienced are you?” should open instead of the library.
Click “Log out”, then change the end of the address to #/plans. The login page should open, showing “Log in to GymRank”.

Task Test 5: Plan details and selecting a recommended plan still work
Setup for this test:
Sign in on Aptitude with rec-select@test.com as the email and ABC12345678@ as the password (create it first with “Create an account” if it doesn’t exist, and use “Strength”, “Intermediate” and “Full gym access”). The account must have no workout plan yet.
Steps:
Click “Plans” on the navigation bar, then click the “Upper/Lower Hypertrophy” card anywhere except its “Select” button. Its details page should open, showing “Upper/Lower Hypertrophy”, “4 days/wk” and “Intermediate · 10 weeks”.
Click “Plans” in the breadcrumb. The library should open with “Push Pull Legs” first under “Recommended for you”.
Click “Select” on “Push Pull Legs”. No warning dialog should appear, because there is no current plan. The Dashboard should open, its “Getting started” checklist should say “You're following Push Pull Legs”, and a message should say “Push Pull Legs is now your plan. Week 1 starts today.”
Click “Plans” on the navigation bar. “Push Pull Legs” should still be first, with an orange border and a greyed-out “Current plan” button.
Click “Workouts” on the navigation bar. The weekly plan should show “Push Pull Legs — Week 1”.

Task Test 6: Switching plans and cancelling still work from the library
Setup for this test:
Complete Task Test 5 first, signed in as rec-select@test.com, so that “Push Pull Legs” is the current plan.
Steps:
Click “Plans” on the navigation bar and click “Select” on “Full Body Strength”. A dialog should open with “Switch to Full Body Strength?”, the text “You're partway through Week 1 of Push Pull Legs. Switching plans now will reset this week's progress.”, and “Switch plan” and “Cancel” buttons.
Click “Cancel”. The dialog should close and “Push Pull Legs” should still show “Current plan”.
Click “Select” on “Full Body Strength” again and press the Escape key. The dialog should close and the plan should not change.
Click “Select” on “Full Body Strength” again and click the dark area outside the dialog. The dialog should close and the plan should not change.
Click “Edit” on “Your setup”, change the equipment to “Bodyweight only” only (keep Strength and Intermediate), and open “Plans” again. “Full Body Strength” should have a red dot.
Click “Select” on “Full Body Strength”. The dialog should say “This plan needs equipment you haven't added: Barbell and Cable machine.” and its confirm button should read “Switch anyway”.
Click “Switch anyway”. The Dashboard should open with a message ending “You'll still need: Barbell and Cable machine.” and the “Getting started” checklist should say “You're following Full Body Strength”.
Refresh the page. The checklist should still say “You're following Full Body Strength”.

Task Test 7: Unit tests and build
Setup for this test:
Open a terminal in the repo root on the 111-Recommend_Plan branch.
Steps:
Run npm test. The output should end with “pass 44” (or more) and “fail 0”, and should list passing tests named “recommendations match goal, level and equipment”, “the closest level to the user comes first”, “plans needing equipment the user lacks are not recommended”, “the library lists recommended plans first, then the rest once, in API order”, “changed settings change the library order”, “without a saved setup the library keeps its normal order” and “no matching plans (or no matching equipment) leaves every plan in the normal order”.
Run npm run build. It should finish with “built in” and no error lines.
Run git diff dev --stat. Only files under src/, tests/, stories/ and task-tests/ should be listed; no api/ or database/ files.
