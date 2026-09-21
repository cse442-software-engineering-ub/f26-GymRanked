# Git and Scrum-Board Workflow

This documentation shows how the scrum board and Git workflow works in our GymRanked repository,
following the CSE 442 guidelines found here: https://webdev.cse.buffalo.edu/cse404/guidelines/.
Follow this document exactly as the steps it contains are not a choice, they are necessary!

## 1: Move the card into In Progress on our Scrum Board

1. Open your assigned task card on the scrum board.
2. Ensure that there are correct tags on the card, if there are not add them immediately.
3. Verify there are task tests written in the description, if they are not written write them NOW as cards should NEVER be in "In Progress" without task tests.
4. Once you have verified tests are written and are ready to begin drag the card from the Planned pipeline to the In Progress pipeline.
      - Only do this once you are ready to start working as cards can NEVER be moved from In Progress backwards.
      - If this card does not require creation, deletion or updating any files skip to step 5 (Rare).
  
## 2: Create a branch from dev

NEVER under any circumstances create a branch from main and NEVER commit directly to main or dev. All creation, deletion or updating work will happen on a specific branch for the task.

With this in mind there are 2 methods you can follow to create a new branch:

### 1. (Recommended) Using bash as seen below with the card number being that of your assigned task card and a short description is of the work:   

```bash
# Make sure your local dev is up to date first
git checkout dev
git pull origin dev
 
# Create your branch off dev
git checkout -b <card-number>-<short-description>
```

For example for this branch used to create this documentation would be created with the following command:

```bash
git checkout -b <"#58">-<Git_and_Scrumboard_Documentation>
```

Next push the branch immediately so it's visible to the rest of the team with the following command:

```bash
git push -u origin <card-number>-<short-description>
```
Finally go back to your card and add the branch link to the card's GitHub field. 

### 2: (Not Recommended) Creating a branch directly on the web interface

When creating, updating or deleting any files especially those involving code for our application use the first option. However creating documentation like this it is acceptable to use this method for ease of use. The steps are:
1. Locate the branches button on our repo and click it.
2. On the top right click the New Branch button.
3. Use the same naming conventions as the first method.
4. Switch the source to dev.
5. Finally go back to your card and add the branch link to the card's GitHub field. 

Again in every other situation other than documentation use the first method.

## 3: Commit Habits

Do not wait long stretches in between commits, possible broken code on your branch will not affect other branches so commit at regular intervals while coding to ensure changes are saved and visible. Use the following commands:

```bash
git add <files>
git commit -m "<subject line, 50 chars or fewer>"
git push
```

Note the first line of a commit must be 50 characters or less. However you can add additional lines below the subject if you need to further explain changes shown here:
```bash
git commit -m "First Line under 50 Chars" \
  -m "Additional Information\
Keep this short and useful when it is needed."
```

Again NEVER commit to dev or main, this will be repeated again and again!

## 4: Keeping your branch up to date and handling conflicts

At normal intervals merge the latest dev into your branch to catch conflicts early with the following commands:

```bash
git checkout <your-branch>
git fetch origin
git merge origin/dev
```
If Git reports a conflict:
1. Run git status command to see which files are in conflict (listed under "Unmerged paths")
2. Open each conflicted file and look for the following conflict markers:
```
   <<<<<<< HEAD
   (your branch's version)
   =======
   (incoming dev version)
   >>>>>>> origin/dev
```
3. Edit the file to keep the correct combination of changes and delete the marker lines.
4. Stage and commit resolved files as shown below:
```bash
   git add <resolved-file>
   git commit -m "Resolve merge conflict with dev in <file>"
```
5. Push the branch with the following command
```bash
   git push
```
6. If you're unsure which version is correct, check with whoever wrote the
   conflicting dev change before resolving — don't guess on logic you
   don't understand.

## 5: Moving the card to testing
Once you are confident that you will pass the task tests written for it do the following:
1. Push your final commit(s).
2. Drag the card from In Progress to Testing on our scrumboard.
3. Run every task test in order as they were written.
4. Record the result of the tests as a comment on the card (pass/fail).

If a test fails do the following:
1. Move the card back to In Progress.
2. Fix the bug(s) on the same branch DO NOT CREATE A NEW BRANCH
3. Add a comment documenting the issue.
4. Re-push and move back to testing once fixed.

## 6: Move the card into complete and open a pull request
Once you've confirmed that all of the task tests on your assigned card pass drag the card from the Testing pipeline to the Completed pipeline. Do NOT under any circumstances move a card into the Closed pipeline as only our PM, Divyansh, should be moving cards to the Closed pipeline.

Now you should push your work one final time, as a sanity check that your branch is up to date with your local machine with the following command:
```bash
   git push
```

Next navigate to your branch on the teams repository on the GitHub web interface and follow these steps
1. You should see a bar above the files in the repo with a button labeled contribute, click it.
2. It will open a drop down menu, click on open pull request.
3. IMPORTANT: ENSURE THAT THE BASE BRANCH IS DEV NOT MAIN DO NOT OPEN A PULL REQUEST TO MAIN.
4. Ensure that the compare branch is the branch you wish to contribute to dev.
5. Fill out the fields with the following conventions:
   - Title: Branch Name
   - Description: Short description of changes implemented
6. Link the Pull request you've created to your task card under the GitHub section.

## 7: Bugs found after moving a card to completed
If a bug is found after a card has been moved to Completed or Closed follow the following steps:
1. Move the card back to In Progress.
2. Add at least one new task test that will only pass once the bug is fixed.
3. Use the existing branch to fix any bugs, do not create a new branch. UNDER NO CIRCUMSTANCES CAN WE USE HOTFIXES TO FIX BUGS.
4. Open a second pull request into dev once finished.

### Important: If a task card carries over to a new sprint do not remove the original sprint label, add the new sprint tag alongside it.


## Quick reference
 
| Board state | What must be true / what to do |
|---|---|
| In Progress | Branch created off dev (if task touches files); branch link added to card |
| Testing | All code pushed; running task tests now |
| Testing → fails | Move back to In Progress, fix on same branch |
| Complete | All task tests passed; PR opened into dev |
| Bug found after Complete/Closed | Move back to In Progress, add a new failing test, reuse existing branch |


