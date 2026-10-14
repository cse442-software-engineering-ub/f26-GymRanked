import { test } from '@playwright/test'

// In `npm run test:e2e:watch`, a banner in the top-left corner of the page shows which story, acceptance test
// and step is running. It ignores the mouse, so it never blocks a click. The quick headless run skips it entirely.
const WATCHING = Boolean(process.env.E2E_WATCH)

let banner = null // { heading, title, step } for the running test
const followed = new Set()

// Runs inside the page: draws or updates the banner.
function drawBanner() {
  const draw = (state) => {
    let box = document.getElementById('e2e-banner')
    if (!state) return box?.remove()
    if (!box) {
      box = document.createElement('div')
      box.id = 'e2e-banner'
      Object.assign(box.style, {
        position: 'fixed',
        left: '16px',
        top: '16px',
        zIndex: '2147483647',
        maxWidth: 'min(440px, calc(100vw - 32px))',
        padding: '10px 14px',
        borderLeft: '4px solid #f26b21',
        borderRadius: '10px',
        background: 'rgba(12, 12, 16, 0.94)',
        boxShadow: '0 6px 24px rgba(0, 0, 0, 0.45)',
        color: '#fff',
        font: '13px/1.4 system-ui, -apple-system, sans-serif',
        pointerEvents: 'none',
      })
      document.body.appendChild(box)
    }
    const line = (text, style) => {
      const row = document.createElement('div')
      row.textContent = text
      Object.assign(row.style, style)
      return row
    }
    box.replaceChildren(
      line(state.heading, { color: '#f26b21', fontSize: '11px', fontWeight: '700', letterSpacing: '0.04em' }),
      line(state.title, { fontWeight: '600' }),
      ...(state.step ? [line(state.step, { marginTop: '4px', color: '#c9c9d1' })] : []),
    )
  }
  window.__e2eDrawBanner = draw
  const start = () => window.__e2eBannerState().then(draw)
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start)
  else start()
}

async function redraw() {
  for (const context of followed) {
    for (const page of context.pages()) {
      await page.evaluate((state) => window.__e2eDrawBanner?.(state), banner).catch(() => {})
    }
  }
}

// Shows the banner on every page of `context`, including after reloads. Call it for any extra browser
// context a test opens (acceptanceTests() already does it for the test's own `page`).
export async function followContext(context) {
  if (!WATCHING || followed.has(context)) return
  followed.add(context)
  context.on('close', () => followed.delete(context))
  await context.exposeBinding('__e2eBannerState', () => banner)
  await context.addInitScript(drawBanner)
}

export async function startBanner(context, heading, title) {
  if (!WATCHING) return
  banner = { heading, title, step: null }
  await followContext(context)
  await redraw()
}

// One step of a written acceptance test. It's listed under the test in the HTML report, and in watch mode
// the banner shows it while it runs.
export function step(title, body) {
  return test.step(title, async () => {
    if (WATCHING) {
      banner = { ...banner, step: title }
      await redraw()
    }
    return body()
  })
}
