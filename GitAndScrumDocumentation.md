# Git and Scrum-Board Workflow

This documentation shows how the scrum board and Git workflow works in our GymRanked repoisorty,
following the CSE 442 guidlines found here: https://webdev.cse.buffalo.edu/cse404/guidelines/.
Follow this document exactly as the steps it contains are not a choice, they are necessary!

## 1: Move the card into In Progress on our Scrum Board

1. Open your assigned tasked card on the scrum board
2. Verify there are task tesks written in the description, if they are not written write them NOW as cards should NEVER be in "In Progress" without task tests.
3. Once you have verfied tests are written and are ready to begin drag the card from the Planned pipeline to the In Progress pipeline.
      - Only do this once you are ready to start working as cards can NEVER be moved from In Progress backwards.
      - If this card does not require creation, deletion or updating any files skip to step 5 (Rare).
  
## 2: Create a branch from dev

NEVER under any circumstances create a branch from main and NEVER commit directly to main or dev. All creation, deletion or updating work will happen on a specfic branch for the task.

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

Next push the bracnh immediatly so it's visible to the rest of the team with the following command:

```bash
git push -u origin <card-number>-<short-description>
```
Finally go back to your card and add the branch liunk to the card's GitHub field. 

### 2: (Not Recommended) Creating a branch directly on the web interface

When creating, updating or deleting any files espically those involving code for our application use the first option. However creating documentation like this it is acceptable to use this method for ease of use. The steps are:
1. Locate the branches button on our repo and click it.
2. On the top right click the New Bracnh button.
3. Use the same naming conventions as the first method.
4. Switch the source to dev.
5. Finally go back to your card and add the branch liunk to the card's GitHub field. 

Again in every other situation other than documentation use the first method.

## 3: Commit Habits

Do not wait long streches inbetween commits, possible broken code on your branch will not effect other branches so commit at regular intervals whiile coding to esnure changes are saved and visible. Use the following commands:

```bash
git add <files>
git commit -m "<subject line, 50 chars or fewer>"
git push
```

Note the first line of a commit must be 50 characters or less. However you can additional lines below thye subject if you need to further explain changes shown here:
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
2. Open each conflicted file and look forr the following conflict markers:
```
   <<<<<<< HEAD
   (your branch's version)
   =======
   (incoming dev version)
   >>>>>>> origin/dev
```
3. Edit the file to keep the correct combination of changes and delete the maker lines.
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
Once you are confident that your will pass the task tests written for it do the following:
1. Push your final commit(s).
2. Drag the card from In Progress to Testing on our scrumboard.
3. Run every task test in order as they were written.
4. Record the result of the tests as a comment on the card (pass/fail).

If a test fails do the following:
1. Move the card back to In Progress.
2. Fix the bug(s) on the same branch DO NOT CREATE A NEW BRANCH
3. Add a comment documenting the issue.
4. Re-push and move back to testing once fixed.
