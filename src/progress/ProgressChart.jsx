import { chartLabel, chartPoints, formatDate } from './progressFormat.js'

const WIDTH = 600
const HEIGHT = 160
const PAD = 12

// The chosen exercise's trend, oldest workout on the left: estimated 1RM, or most reps for a bodyweight exercise.
// Points are spaced evenly by workout. The values are in the table below it and in the label read to screen readers,
// so nothing depends on hovering.
function ProgressChart({ exercise }) {
  const points = chartPoints(exercise)
  const values = points.map((point) => point.value)
  const low = Math.min(...values)
  const high = Math.max(...values)
  const x = (index) => (points.length === 1 ? WIDTH / 2 : PAD + (index * (WIDTH - 2 * PAD)) / (points.length - 1))
  const y = (value) => (high === low ? HEIGHT / 2 : HEIGHT - PAD - ((value - low) * (HEIGHT - 2 * PAD)) / (high - low))
  const line = points.map((point, index) => `${x(index)},${y(point.value)}`).join(' ')

  return (
    <figure className="progress-chart-wrap">
      <svg className="progress-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={chartLabel(exercise)}>
        <line className="progress-chart__axis" x1="0" y1={HEIGHT - 1} x2={WIDTH} y2={HEIGHT - 1} />
        {points.length > 1 && <polyline className="progress-chart__line" points={line} />}
        {points.map((point, index) => (
          <circle key={`${point.date}-${index}`} className="progress-chart__point" cx={x(index)} cy={y(point.value)} r="6" />
        ))}
      </svg>
      {points.length > 0 && (
        <figcaption className="progress-chart__dates" aria-hidden="true">
          <span>{formatDate(points[0].date)}</span>
          {points.length > 1 && <span>{formatDate(points[points.length - 1].date)}</span>}
        </figcaption>
      )}
    </figure>
  )
}

export default ProgressChart
