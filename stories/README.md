# User stories and acceptance tests

Each user story on the scrum board has a file here holding its acceptance tests. The Playwright checks in
`tests/e2e/` read these files: every acceptance test heading becomes one automated test with the same title.
Keeping the tests in the repo means anyone can run them without opening PMTool, and a story's owner can add
tests at any time without breaking the run.

The PMTool card is still where the course grades acceptance tests. Write them here first, then paste them onto
the card, and keep the two the same.

## Who does what

| Who | What they do |
| --- | --- |
| The story's owner | Writes the story file and its acceptance tests here, in plain English, and pastes them onto the card. No code. |
| The owner of the story's Playwright task card | Creates the story's spec in `tests/e2e/` and writes the code that runs each test. |

Nothing turns the English into code automatically: each test needs code written for it once. Until it has
code, the test is listed as "not automated yet" and doesn't fail the run, so owners can add tests whenever they
like.

## Adding a story

1. Create `stories/<card number>-<short-name>.md`, for example `stories/17-create-account.md`. Use the story's
   card number and a few lowercase words joined by hyphens.
2. Start the file with the story's title exactly as it is on the card, then list its tasks:

   ```markdown
   # Story 17: As a new user, I want to be able to create a new account …

   - **Tasks:** #65, #68, and the Playwright task card
   - **Automated in:** `tests/e2e/17-create-account.spec.js`
   ```

3. Add each acceptance test under a heading in exactly this form, numbered from 1:

   ```markdown
   ## Acceptance Test 1: Create an account with valid details
   ```

   Under the heading, write the test the way it appears on the card: **Setup for this test**, numbered
   **Steps** with every input and the exact text the page should show, and any **Expected outcome**. Include
   at least one happy path and, where it makes sense, an alternate path (wrong input, cancel, logged out).

Anything that isn't an `## Acceptance Test N: …` heading, such as notes, is ignored by the test run.

## How the automated checks use these files

This part is for the owner of the story's Playwright task card. Each story gets a spec file in `tests/e2e/`
with the same name (`17-create-account.spec.js`). It reads the story file and creates one Playwright test per
heading. A story file with no spec yet isn't read at all, so its tests don't appear in runs until the spec
exists.


| In the story file | In the spec file | Result of the run |
| --- | --- | --- |
| `## Acceptance Test 2: …` | code for test 2 | Runs, and passes or fails |
| `## Acceptance Test 3: …` | no code for test 3 yet | Listed as skipped, marked "not automated yet" |
| no heading 4 | code for test 4 | The run stops with an error naming the mismatch |

Once the spec exists, a new acceptance test shows up in every run straight away, and the Playwright task card's
owner writes its code next. How to write it is in `TestingAndDebuggingGuide.md`, "Adding tests for a story".

To watch the tests run in a browser and see a results page afterwards, run `npm run test:e2e:watch`. The full guide
is in `TestingAndDebuggingGuide.md`, section "Automated acceptance tests (Playwright)".
