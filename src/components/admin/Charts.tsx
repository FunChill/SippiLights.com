/**
 * Hand-rolled SVG charts — deliberately no charting dependency. Dark-theme
 * styled to match tokens.css (gold on charcoal).
 */

interface SeriesPoint {
  label: string
  value: number
}

const GOLD = '#c9a84c'
const MUTED = 'rgba(201, 168, 76, 0.25)'
const TEXT = '#8a8578'

export function BarChart({
  data,
  height = 160,
  formatValue = (v: number) => String(v),
}: {
  data: SeriesPoint[]
  height?: number
  formatValue?: (v: number) => string
}) {
  if (data.length === 0) return null
  const max = Math.max(...data.map((d) => d.value), 1)
  const barW = 100 / data.length

  return (
    <div>
      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        className="h-40 w-full"
        role="img"
        aria-label="Bar chart"
      >
        {data.map((d, i) => {
          const h = (d.value / max) * (height - 8)
          return (
            <rect
              key={d.label}
              x={i * barW + barW * 0.15}
              y={height - h}
              width={barW * 0.7}
              height={h}
              fill={d.value === 0 ? MUTED : GOLD}
              rx={1}
            >
              <title>{`${d.label}: ${formatValue(d.value)}`}</title>
            </rect>
          )
        })}
      </svg>
      <AxisLabels data={data} />
    </div>
  )
}

export function LineChart({
  data,
  height = 160,
  formatValue = (v: number) => String(v),
}: {
  data: SeriesPoint[]
  height?: number
  formatValue?: (v: number) => string
}) {
  if (data.length === 0) return null
  const max = Math.max(...data.map((d) => d.value), 1)
  const stepX = data.length > 1 ? 100 / (data.length - 1) : 0
  const points = data.map((d, i) => ({
    x: data.length > 1 ? i * stepX : 50,
    y: height - 6 - (d.value / max) * (height - 14),
  }))
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')

  return (
    <div>
      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        className="h-40 w-full"
        role="img"
        aria-label="Line chart"
      >
        <path d={path} fill="none" stroke={GOLD} strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
        {points.map((p, i) => (
          <circle key={data[i].label} cx={p.x} cy={p.y} r={1.6} fill={GOLD}>
            <title>{`${data[i].label}: ${formatValue(data[i].value)}`}</title>
          </circle>
        ))}
      </svg>
      <AxisLabels data={data} />
    </div>
  )
}

/** First / middle / last label only — 24 month labels don't fit. */
function AxisLabels({ data }: { data: SeriesPoint[] }) {
  if (data.length < 2) return null
  const mid = data[Math.floor(data.length / 2)]
  return (
    <div className="flex justify-between text-[10px]" style={{ color: TEXT }}>
      <span>{data[0].label}</span>
      <span>{mid.label}</span>
      <span>{data[data.length - 1].label}</span>
    </div>
  )
}
