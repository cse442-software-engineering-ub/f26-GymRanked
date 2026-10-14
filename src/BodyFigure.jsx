// A small front and back view of a person with the worked muscles lit up (DESIGN.md "Icons":
// decorative, colour from the theme). The muscles are also written out next to it as text,
// so this is aria-hidden. muscles: keys from src/exerciseMuscles.js.

// Each shape is [muscle, element props]. The same shapes are always drawn (grey); the ones for a
// worked muscle are drawn in the highlight colour.
const FRONT = [
  ['shoulders', { cx: 13, cy: 25, r: 5 }],
  ['shoulders', { cx: 37, cy: 25, r: 5 }],
  ['chest', { cx: 20, cy: 30, rx: 6, ry: 5 }],
  ['chest', { cx: 30, cy: 30, rx: 6, ry: 5 }],
  ['biceps', { x: 8, y: 31, width: 6, height: 14, rx: 3 }],
  ['biceps', { x: 36, y: 31, width: 6, height: 14, rx: 3 }],
  ['abs', { x: 20, y: 37, width: 10, height: 20, rx: 3 }],
  ['quads', { x: 15, y: 62, width: 9, height: 26, rx: 4 }],
  ['quads', { x: 26, y: 62, width: 9, height: 26, rx: 4 }],
  ['calves', { x: 16, y: 91, width: 7, height: 24, rx: 3 }],
  ['calves', { x: 27, y: 91, width: 7, height: 24, rx: 3 }],
]

const BACK = [
  ['shoulders', { cx: 13, cy: 25, r: 5 }],
  ['shoulders', { cx: 37, cy: 25, r: 5 }],
  ['back', { x: 17, y: 24, width: 16, height: 19, rx: 5 }],
  ['triceps', { x: 8, y: 31, width: 6, height: 14, rx: 3 }],
  ['triceps', { x: 36, y: 31, width: 6, height: 14, rx: 3 }],
  ['lower_back', { x: 20, y: 44, width: 10, height: 12, rx: 3 }],
  ['glutes', { cx: 20, cy: 61, rx: 6, ry: 5 }],
  ['glutes', { cx: 30, cy: 61, rx: 6, ry: 5 }],
  ['hamstrings', { x: 15, y: 67, width: 9, height: 22, rx: 4 }],
  ['hamstrings', { x: 26, y: 67, width: 9, height: 22, rx: 4 }],
  ['calves', { x: 16, y: 91, width: 7, height: 24, rx: 3 }],
  ['calves', { x: 27, y: 91, width: 7, height: 24, rx: 3 }],
]

function Shape({ props, lit }) {
  const className = lit ? 'body-figure__muscle is-lit' : 'body-figure__muscle'
  if ('r' in props) return <circle className={className} {...props} />
  if ('ry' in props) return <ellipse className={className} {...props} />
  return <rect className={className} {...props} />
}

function View({ shapes, muscles }) {
  return (
    <svg viewBox="0 0 50 120" className="body-figure__view" focusable="false">
      <circle className="body-figure__base" cx="25" cy="8" r="6" />
      <rect className="body-figure__base" x="22" y="13" width="6" height="6" rx="2" />
      <rect className="body-figure__base" x="15" y="20" width="20" height="40" rx="7" />
      <rect className="body-figure__base" x="7" y="46" width="6" height="14" rx="3" />
      <rect className="body-figure__base" x="37" y="46" width="6" height="14" rx="3" />
      {shapes.map(([muscle, props], index) => (
        <Shape key={index} props={props} lit={muscles.includes(muscle)} />
      ))}
    </svg>
  )
}

function BodyFigure({ muscles }) {
  return (
    <span className="body-figure" aria-hidden="true">
      <View shapes={FRONT} muscles={muscles} />
      <View shapes={BACK} muscles={muscles} />
    </span>
  )
}

export default BodyFigure
