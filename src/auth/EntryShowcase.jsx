// The moving example on the entry screens' brand panel: a week of lifting drawn as bars that rise in turn, a trend
// line that draws across them, and a three-row board. Sample data only (labelled "Preview"); nothing is fetched.
// Colours come from auth.css classes (the --gr- variables), never from this file.
const VOLUME = [38, 44, 41, 52, 49, 58, 55, 63, 60, 68, 66, 74, 71, 80]
const ROWS = [['Derek Kwan', '@dkwanlifts', '51,400 lb'], ['Marcus Malone', '@marcusm', '42,180 lb'], ['Dana Reyes', '@dlift_dana', '39,760 lb']]

const WIDTH = 420
const HEIGHT = 120
const STEP = WIDTH / VOLUME.length
const BAR = STEP * 0.56
const top = (value) => HEIGHT - (value / 90) * HEIGHT
const TREND = VOLUME.map((value, index) => `${index ? 'L' : 'M'}${(index * STEP + STEP / 2).toFixed(1)} ${(top(value) - 10).toFixed(1)}`).join(' ')

export default function EntryShowcase() {
  return (
    <div className="entry-showcase">
      <section className="entry-chart" aria-label="Example week of training">
        <header className="entry-chart__head">
          <span><strong>Bench press</strong> · this week</span>
          <span className="entry-chart__tag">Preview</span>
        </header>
        <p className="entry-chart__value">225 lb <span className="entry-chart__change">+5 lb</span></p>
        <svg className="entry-chart__plot" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
          {[0.25, 0.5, 0.75].map((line) => <line key={line} className="entry-chart__grid" x1="0" x2={WIDTH} y1={HEIGHT * line} y2={HEIGHT * line} />)}
          {VOLUME.map((value, index) => (
            <rect key={index} className="entry-chart__bar" style={{ '--i': index }}
              x={index * STEP + (STEP - BAR) / 2} y={top(value)} width={BAR} height={HEIGHT - top(value)} rx="2" />
          ))}
          <path className="entry-chart__trend" d={TREND} pathLength="1" />
        </svg>
        <p className="entry-chart__foot">Volume per session, last 14 sessions</p>
      </section>

      <section className="entry-board" aria-label="Example leaderboard">
        <header className="entry-board__head"><span>GOLD DIVISION · THIS WEEK</span><span className="entry-chart__tag">Preview</span></header>
        <ol className="entry-board__rows">
          {ROWS.map(([name, handle, weight], index) => (
            <li key={name} className="entry-board__row" style={{ '--i': index }}>
              <strong className="entry-board__rank">{index + 1}</strong>
              <span className="entry-board__avatar" aria-hidden="true">{name.split(' ').map((part) => part[0]).join('')}</span>
              <span className="entry-board__person"><span>{name}</span><small>{handle}</small></span>
              <span className="entry-board__weight">{weight}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
