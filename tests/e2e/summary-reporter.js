import { spawn } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'

// A plain-language results page: one verdict at the top, then each story's acceptance tests with their
// desktop/mobile results and steps, and for a failure the step, the error and a screenshot.
// Written to e2e-report/index.html after every run; `open: true` (watch mode) opens it in the browser.
// Playwright's own detailed report (traces, logs) is still in playwright-report/.

const OUT_DIR = 'e2e-report'

const escape = (text) =>
  String(text ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

const stripAnsi = (text) => String(text ?? '').replace(/\u001b\[[0-9;]*m/g, '')

function seconds(ms) {
  return ms >= 60_000 ? `${(ms / 60_000).toFixed(1)} min` : `${(ms / 1000).toFixed(1)} s`
}

// The technical part of a Playwright error worth keeping: the check, what was expected and what the page had.
function technicalError(error) {
  if (!error) return ''
  const text = stripAnsi(error.message || error.value || '')
  return text.split('\nCall log:')[0].trim().split('\n').slice(0, 12).join('\n')
}

// Names the last element in a locator chain the way a person would: getByRole('button', { name: 'Select' })
// becomes the "Select" button.
function describeLocator(locator) {
  const last = locator.split(/\)\.(?=getBy|locator|first|nth|filter)/).filter((part) => !/^(first|nth|filter)/.test(part)).pop() ?? ''
  const quoted = (pattern) => last.match(pattern)?.[1]
  const role = quoted(/getByRole\('([^']+)'/)
  const name = quoted(/name: '([^']*)'/) ?? quoted(/name: "([^"]*)"/)
  const inDialog = /getByRole\('dialog'\)\.getBy/.test(locator) ? ' in the dialog' : ''
  if (role === 'heading') return name ? `the heading "${name}"` : 'the page heading'
  if (role === 'dialog') return 'the dialog'
  if (role) return name ? `the "${name}" ${role === 'menuitem' ? 'menu item' : role}${inDialog}` : `the ${role}${inDialog}`
  const text = quoted(/getByText\('([^']*)'/) ?? quoted(/getByText\("([^"]*)"/)
  if (text) return `the text "${text}"`
  const label = quoted(/getByLabel\('([^']*)'/)
  if (label) return `the "${label}" field`
  const css = quoted(/locator\('([^']*)'/)
  return css ? `the part of the page matching ${css}` : 'the element'
}

// One sentence saying what the test expected and what the page showed, for the common checks.
function plainError(error) {
  const text = technicalError(error)
  if (!text) return ''
  const field = (label) => text.match(new RegExp(`^${label}(?: string| pattern)?: (.*)$`, 'm'))?.[1]?.trim()
  const matcher = text.match(/expect\((?:locator|page|received)\)\.(not\.)?(\w+)\(/)
  const timeout = text.match(/Test timeout of (\d+)ms exceeded/)
  if (timeout) return `The test ran out of time: it didn't finish within ${Number(timeout[1]) / 1000} seconds.`
  if (!matcher) return text.split('\n')[0].replace(/^Error: /, '')

  const [, not, check] = matcher
  const thing = describeLocator(field('Locator') ?? '')
  const expected = field('Expected')
  const received = field('Received')
  const missing = /element\(s\) not found/.test(text)
  const but = missing ? "but it wasn't on the page" : received !== undefined ? `but it said ${received}` : ''
  switch (check) {
    case 'toBeVisible':
      return not ? `Expected ${thing} to be gone, but it was still showing.` : `Expected to see ${thing}, ${missing ? "but it wasn't on the page" : 'but it was hidden'}.`
    case 'toHaveText':
    case 'toContainText':
      return `Expected ${thing} to ${check === 'toHaveText' ? 'say' : 'include'} ${expected}, ${but || 'but it said something else'}.`
    case 'toHaveURL':
      return `Expected the browser to be on a page matching ${expected}, but it was on ${received}.`
    case 'toHaveCount':
      return expected === '0'
        ? `Expected ${thing} to be gone, but it was still on the page.`
        : `Expected ${expected} of ${thing}, but found ${received ?? 'a different number'}.`
    case 'toBeEnabled':
      return `Expected ${thing} to be clickable, ${missing ? "but it wasn't on the page" : 'but it was greyed out'}.`
    case 'toBeDisabled':
      return `Expected ${thing} to be greyed out, ${missing ? "but it wasn't on the page" : 'but it could be clicked'}.`
    default:
      return `Expected ${thing} to match ${expected ?? 'the check'}, ${but || 'but it did not'}.`
  }
}

// Counts the numbered steps under each "## Acceptance Test N" heading's **Steps:** list in a story file.
function stepCounts(storyText) {
  const counts = {}
  let current = null
  let inSteps = false
  for (const line of storyText.split('\n')) {
    const heading = line.match(/^## Acceptance Test (\d+):/)
    if (heading) {
      current = Number(heading[1])
      counts[current] = 0
      inSteps = false
    } else if (line.startsWith('## ')) current = null
    else if (current && /^\*\*Steps:\*\*/.test(line)) inSteps = true
    else if (current && /^\*\*/.test(line)) inSteps = false
    else if (current && inSteps && /^\d+\. /.test(line)) counts[current] += 1
  }
  return counts
}

const SIZE_ORDER = ['desktop', 'mobile']

const testNumber = (title) => Number(title.match(/^Acceptance Test (\d+)/)?.[1] ?? 0)

const OUTCOME = {
  passed: { label: 'Passed', icon: '✓', kind: 'pass' },
  failed: { label: 'Failed', icon: '✗', kind: 'fail' },
  timedOut: { label: 'Ran out of time', icon: '✗', kind: 'fail' },
  interrupted: { label: 'Stopped', icon: '■', kind: 'skip' },
  skipped: { label: 'Skipped', icon: '–', kind: 'skip' },
}

export default class SummaryReporter {
  constructor({ open = false } = {}) {
    this.open = open
    this.results = []
  }

  onBegin(config) {
    this.rootDir = config.rootDir
    this.baseURL = config.projects[0]?.use?.baseURL ?? ''
    this.startedAt = new Date()
  }

  onTestEnd(test, result) {
    this.results.push({ test, result })
  }

  async onEnd(run) {
    const outDir = path.resolve(OUT_DIR)
    rmSync(outDir, { recursive: true, force: true })
    mkdirSync(path.join(outDir, 'screenshots'), { recursive: true })

    const stories = new Map()
    let screenshotCount = 0
    for (const { test, result } of this.results) {
      const storyFile = test.parent.title.replace(/^stories\//, '')
      if (!stories.has(storyFile)) stories.set(storyFile, { file: storyFile, tests: new Map() })
      const story = stories.get(storyFile)
      const notAutomated = / \(not automated yet\)$/.test(test.title)
      const title = test.title.replace(/ \(not automated yet\)$/, '')
      if (!story.tests.has(title)) story.tests.set(title, { title, notAutomated, runs: [] })

      const screenshot = result.attachments.find((a) => a.name === 'screenshot' && a.path && existsSync(a.path))
      let screenshotFile = null
      if (screenshot && result.status !== 'passed') {
        screenshotFile = `screenshots/${++screenshotCount}.png`
        copyFileSync(screenshot.path, path.join(outDir, screenshotFile))
      }
      const steps = result.steps
        .filter((step) => step.category === 'test.step')
        .map((step) => ({ title: step.title, duration: step.duration, failed: Boolean(step.error) }))
      story.tests.get(title).runs.push({
        project: test.parent.project()?.name ?? '',
        status: result.status,
        duration: result.duration,
        steps,
        failedStep: steps.find((step) => step.failed)?.title,
        plainError: plainError(result.error),
        technicalError: technicalError(result.error),
        screenshotFile,
      })
    }

    writeFileSync(path.join(outDir, 'index.html'), this.page([...stories.values()], run))
    this.file = path.join(outDir, 'index.html')
  }

  // Printed at exit, after Playwright's own reporters, so it's the last line in the terminal.
  onExit() {
    if (!this.file) return
    console.log(`\n  Results page: ${path.relative(process.cwd(), this.file)}${this.open ? ' (opening in your browser)' : ''}\n`)
    if (this.open) openInBrowser(this.file)
  }

  // The story's title (its first line) and how many steps each of its acceptance tests has.
  readStory(file) {
    try {
      const text = readFileSync(path.join(this.rootDir, '..', '..', 'stories', file), 'utf8')
      return { title: text.split('\n')[0].replace(/^#\s*/, ''), steps: stepCounts(text) }
    } catch {
      return { title: file, steps: {} }
    }
  }

  page(stories, run) {
    const runs = stories.flatMap((s) => [...s.tests.values()].flatMap((t) => t.runs.map((r) => ({ ...r, t }))))
    const notAutomated = runs.filter((r) => r.t.notAutomated).length
    const checks = runs.filter((r) => !r.t.notAutomated)
    const failed = checks.filter((r) => OUTCOME[r.status]?.kind === 'fail').length
    const passed = checks.filter((r) => r.status === 'passed').length

    let verdict
    let verdictKind
    if (checks.length === 0) {
      verdict = 'No tests ran'
      verdictKind = 'skip'
    } else if (failed === 0 && passed === checks.length) {
      verdict = `All ${passed} checks passed`
      verdictKind = 'pass'
    } else if (failed > 0) {
      verdict = `${failed} of ${checks.length} checks failed`
      verdictKind = 'fail'
    } else {
      verdict = `${passed} of ${checks.length} checks passed`
      verdictKind = 'skip'
    }
    const when = this.startedAt.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    const target = this.baseURL.includes('localhost') ? 'your local site' : this.baseURL

    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>GymRank test results</title>
<style>
  :root {
    --bg: #0f1014; --card: #17181d; --line: #262830; --text: #ececef; --muted: #9b9ca8;
    --orange: #f26b21; --pass: #3ecf8e; --pass-bg: #10291f; --fail: #ff6464; --fail-bg: #331417;
    --skip: #a3a3b0; --skip-bg: #22232a;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text); font: 16px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; }
  main { max-width: 920px; margin: 0 auto; padding: 32px 16px 64px; }
  .eyebrow { color: var(--orange); font-size: 13px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; margin: 0; }
  h1 { font-size: 28px; margin: 4px 0 4px; }
  .meta { color: var(--muted); margin: 0 0 24px; }
  .verdict { display: flex; gap: 16px; align-items: center; padding: 20px 24px; border-radius: 14px; margin-bottom: 12px; }
  .verdict .icon { font-size: 32px; font-weight: 700; line-height: 1; }
  .verdict h2 { margin: 0; font-size: 24px; }
  .verdict p { margin: 2px 0 0; color: var(--text); opacity: .85; }
  .pass.verdict { background: var(--pass-bg); color: var(--pass); }
  .fail.verdict { background: var(--fail-bg); color: var(--fail); }
  .skip.verdict { background: var(--skip-bg); color: var(--skip); }
  .counts { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 32px; padding: 0; list-style: none; }
  .counts li { background: var(--card); border: 1px solid var(--line); border-radius: 999px; padding: 4px 14px; color: var(--muted); }
  .counts b { color: var(--text); }
  .story { margin-top: 28px; }
  .story h2 { font-size: 20px; margin: 0 0 4px; }
  .story .file { color: var(--muted); font-size: 14px; margin: 0 0 12px; }
  .test { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 16px 18px; margin-bottom: 12px; }
  .test.has-fail { border-color: var(--fail); }
  .test h3 { font-size: 17px; margin: 0 0 10px; }
  .test h3 small { display: block; color: var(--muted); font-size: 13px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; }
  .run { border-top: 1px solid var(--line); padding-top: 10px; margin-top: 10px; }
  .run-head { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; }
  .size { font-weight: 600; min-width: 72px; }
  .badge { display: inline-flex; gap: 6px; align-items: center; border-radius: 999px; padding: 2px 12px; font-weight: 600; font-size: 14px; }
  .badge.pass { background: var(--pass-bg); color: var(--pass); }
  .badge.fail { background: var(--fail-bg); color: var(--fail); }
  .badge.skip { background: var(--skip-bg); color: var(--skip); }
  .time { color: var(--muted); font-size: 14px; }
  details { margin-top: 8px; }
  summary { cursor: pointer; color: var(--muted); font-size: 14px; }
  ol.steps { list-style: none; margin: 8px 0 0; padding: 0; }
  ol.steps li { display: flex; gap: 10px; padding: 4px 0; font-size: 15px; }
  ol.steps .mark { width: 18px; flex: none; font-weight: 700; text-align: center; }
  ol.steps .ok .mark { color: var(--pass); }
  ol.steps .bad { color: var(--fail); font-weight: 600; }
  ol.steps .todo { color: var(--muted); }
  ol.steps .dur { margin-left: auto; color: var(--muted); font-size: 13px; white-space: nowrap; }
  .problem { background: var(--fail-bg); border-radius: 10px; padding: 12px 14px; margin-top: 10px; }
  .problem p { margin: 0 0 6px; }
  .problem .where { font-weight: 700; color: var(--fail); }
  .problem .what { font-size: 17px; color: var(--text); }
  .problem .tech summary { color: #ffb3b3; }
  .problem .tech pre { margin-top: 8px; }
  .problem pre { margin: 0; white-space: pre-wrap; word-break: break-word; font: 13px/1.5 ui-monospace, Menlo, monospace; color: #ffd1d1; }
  .problem img { display: block; max-width: 100%; max-height: 480px; width: auto; margin-top: 12px; border-radius: 8px; border: 1px solid var(--line); }
  .note { color: var(--muted); font-size: 15px; margin: 0; }
  footer { margin-top: 40px; color: var(--muted); font-size: 14px; border-top: 1px solid var(--line); padding-top: 16px; }
  code { font: 13px ui-monospace, Menlo, monospace; background: var(--card); border: 1px solid var(--line); border-radius: 6px; padding: 1px 6px; }
</style>
</head>
<body>
<main>
  <p class="eyebrow">GymRank acceptance tests</p>
  <h1>Test results</h1>
  <p class="meta">${escape(when)} · took ${seconds(run.duration)} · tested ${escape(target)}</p>

  <section class="verdict ${verdictKind}">
    <span class="icon" aria-hidden="true">${verdictKind === 'pass' ? '✓' : verdictKind === 'fail' ? '✗' : '–'}</span>
    <div>
      <h2>${escape(verdict)}</h2>
      <p>${
        verdictKind === 'pass'
          ? 'Every automated acceptance test did what its story says.'
          : verdictKind === 'fail'
            ? 'Look for the red boxes below: each one names the step that failed and what the page showed instead.'
            : 'Some tests did not run.'
      }</p>
    </div>
  </section>
  <ul class="counts">
    <li><b>${passed}</b> passed</li>
    <li><b>${failed}</b> failed</li>
    ${notAutomated ? `<li><b>${notAutomated}</b> not automated yet</li>` : ''}
    <li><b>${stories.length}</b> ${stories.length === 1 ? 'story' : 'stories'}</li>
  </ul>

  ${stories.map((story) => this.storySection(story)).join('\n')}

  <footer>
    Each check is one acceptance test from a story file in <code>stories/</code>, run on a desktop screen and, for
    layout-sensitive tests, a phone screen. For the full technical report with traces, run
    <code>npx playwright show-report</code>.
  </footer>
</main>
</body>
</html>
`
  }

  storySection(story) {
    const { title: heading, steps } = this.readStory(story.file)
    const [label, ...rest] = heading.split(': ')
    return `<section class="story">
    <p class="eyebrow">${escape(label)}</p>
    <h2>${escape(rest.join(': ') || heading)}</h2>
    <p class="file">stories/${escape(story.file)}</p>
    ${[...story.tests.values()]
      .sort((a, b) => testNumber(a.title) - testNumber(b.title))
      .map((test) => this.testCard(test, steps))
      .join('\n')}
  </section>`
  }

  testCard(test, stepsPerTest) {
    const match = test.title.match(/^(Acceptance Test (\d+)): (.*)$/)
    const [number, name] = match ? [match[1], match[3]] : ['', test.title]
    const totalSteps = match ? stepsPerTest[Number(match[2])] : undefined
    if (test.notAutomated) {
      return `<article class="test">
      <h3><small>${escape(number)}</small>${escape(name)}</h3>
      <p class="note">Not automated yet: the story file has this test, but no code runs it.</p>
    </article>`
    }
    const hasFail = test.runs.some((run) => OUTCOME[run.status]?.kind === 'fail')
    return `<article class="test${hasFail ? ' has-fail' : ''}">
      <h3><small>${escape(number)}</small>${escape(name)}</h3>
      ${[...test.runs]
        .sort((a, b) => SIZE_ORDER.indexOf(a.project) - SIZE_ORDER.indexOf(b.project))
        .map((run) => this.runBlock(run, totalSteps))
        .join('\n')}
    </article>`
  }

  runBlock(run, totalSteps) {
    const outcome = OUTCOME[run.status] ?? OUTCOME.skipped
    const size = run.project === 'mobile' ? 'Phone' : run.project === 'desktop' ? 'Desktop' : run.project
    const failed = outcome.kind === 'fail'
    const steps = run.steps
      .map((step) => {
        const state = step.failed ? 'bad' : 'ok'
        return `<li class="${state}"><span class="mark">${step.failed ? '✗' : '✓'}</span><span>${escape(step.title)}</span><span class="dur">${seconds(step.duration)}</span></li>`
      })
      .join('')

    // The story file says how many steps the test has; say which ones never ran because of the failure.
    let notRun = ''
    if (failed && totalSteps) {
      const failedNumber = Number(run.failedStep?.match(/^Step (\d+)/)?.[1] ?? 0)
      const first = failedNumber + 1
      if (!run.failedStep || /^Setup/.test(run.failedStep)) notRun = `None of the ${totalSteps} steps ran, because the setup failed.`
      else if (first === totalSteps) notRun = `Step ${totalSteps} didn't run, because step ${failedNumber} failed.`
      else if (first < totalSteps) notRun = `Steps ${first}–${totalSteps} didn't run, because step ${failedNumber} failed.`
    }
    const notRunItem = notRun ? `<li class="todo"><span class="mark">·</span><span>${escape(notRun)}</span></li>` : ''

    const problem = failed
      ? `<div class="problem">
        <p class="where">${run.failedStep ? `Failed at “${escape(run.failedStep)}”` : escape(outcome.label)}</p>
        ${run.plainError ? `<p class="what">${escape(run.plainError)}</p>` : ''}
        ${run.screenshotFile ? `<img src="${run.screenshotFile}" alt="The page when the test failed">` : ''}
        ${run.technicalError ? `<details class="tech"><summary>Technical details</summary><pre>${escape(run.technicalError)}</pre></details>` : ''}
      </div>`
      : ''
    const stepCount = totalSteps ? `${totalSteps} steps` : `${run.steps.length} steps`
    return `<div class="run">
      <div class="run-head">
        <span class="size">${escape(size)}</span>
        <span class="badge ${outcome.kind}">${outcome.icon} ${outcome.label}</span>
        <span class="time">${seconds(run.duration)}</span>
      </div>
      ${problem}
      ${steps || notRunItem ? `<details${failed ? ' open' : ''}><summary>${failed ? 'What ran' : `Show the ${stepCount}`}</summary><ol class="steps">${steps}${notRunItem}</ol></details>` : ''}
    </div>`
  }
}

function openInBrowser(file) {
  const [command, args] =
    process.platform === 'darwin'
      ? ['open', [file]]
      : process.platform === 'win32'
        ? ['cmd', ['/c', 'start', '', file]]
        : ['xdg-open', [file]]
  spawn(command, args, { detached: true, stdio: 'ignore' }).on('error', () => {}).unref()
}
