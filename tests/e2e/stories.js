import { readFileSync } from 'node:fs'
import { test as base } from '@playwright/test'
import { startBanner } from './banner.js'

// Every story test starts by showing its banner (drawn only in watch mode).
const test = base.extend({
  storyBanner: [
    async ({ context }, use, testInfo) => {
      const story = testInfo.annotations.find((annotation) => annotation.type === 'story')
      if (story) {
        const title = testInfo.title.replace(/^Acceptance Test \d+: /, '')
        await startBanner(context, `${story.description} · ${testInfo.project.name}`.toUpperCase(), title)
      }
      await use()
    },
    { auto: true },
  ],
})

const STORIES_DIR = new URL('../../stories/', import.meta.url)
const HEADING = /^## Acceptance Test (\d+): (.+?)\s*$/

// The "## Acceptance Test N: Title" headings in a story file, in file order. The format is in stories/README.md.
export function readAcceptanceTests(storyFile) {
  const text = readFileSync(new URL(storyFile, STORIES_DIR), 'utf8')
  return text
    .split('\n')
    .map((line) => line.match(HEADING))
    .filter(Boolean)
    .map(([, number, title]) => ({ number: Number(number), title }))
}

// Defines one Playwright test per acceptance test in stories/<storyFile>, titled like its heading.
// `code` maps a test number to its test function. A heading without code is listed as skipped
// ("not automated yet"), and code without a heading stops the run, so the two can't drift apart.
// Numbers listed in `mobile` also run in the mobile project.
export function acceptanceTests(storyFile, code, { mobile = [] } = {}) {
  const headings = readAcceptanceTests(storyFile)
  const numbers = headings.map((heading) => heading.number)
  const repeated = numbers.find((number, index) => numbers.indexOf(number) !== index)
  if (repeated !== undefined) {
    throw new Error(`stories/${storyFile} has more than one "Acceptance Test ${repeated}" heading`)
  }
  for (const number of Object.keys(code).map(Number)) {
    if (!numbers.includes(number)) {
      throw new Error(`Acceptance Test ${number} has code but no matching heading in stories/${storyFile}`)
    }
  }

  const storyNumber = storyFile.split('-')[0]
  test.describe(`stories/${storyFile}`, () => {
    for (const { number, title } of headings) {
      const name = `Acceptance Test ${number}: ${title}`
      if (code[number]) {
        const heading = `Story ${storyNumber} · Acceptance Test ${number} of ${headings.length}`
        test(
          name,
          {
            tag: mobile.includes(number) ? ['@mobile'] : [],
            annotation: { type: 'story', description: heading },
          },
          code[number],
        )
      } else {
        test.fixme(`${name} (not automated yet)`, () => {})
      }
    }
  })
}
