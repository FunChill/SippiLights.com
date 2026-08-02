import {
  STAGE_COLORS,
  STAGE_LABELS,
  STAGE_ORDER,
  type PipelineEntry,
  type Stage,
  countByStage,
} from '../../lib/pipeline'

interface PipelineStripProps {
  entries: PipelineEntry[]
  selected: Stage | 'all' | 'info_needed' | 'waitlist'
  onSelect: (s: Stage | 'all' | 'info_needed' | 'waitlist') => void
}

/**
 * The funnel at a glance. Counts are clickable filters, so "who owes me a
 * reply" and "who is missing details before their event" are one click, not a
 * scan through the calendar.
 */
export function PipelineStrip({ entries, selected, onSelect }: PipelineStripProps) {
  const counts = countByStage(entries)
  const needingInfo = entries.filter((e) => e.gaps.length > 0 && e.stage !== 'closed' && e.stage !== 'delivered')
  const waitlisted = entries.filter((e) => e.waitlisted && e.stage !== 'closed')

  const chip = (
    key: Stage | 'all' | 'info_needed' | 'waitlist',
    label: string,
    count: number,
    className: string,
  ) => (
    <button
      key={key}
      type="button"
      onClick={() => onSelect(selected === key ? 'all' : key)}
      className={`rounded-button border px-3 py-1.5 text-left transition-opacity ${className} ${
        selected === key ? 'ring-1 ring-warm-white/40' : 'hover:opacity-80'
      } ${count === 0 ? 'opacity-40' : ''}`}
    >
      <span className="block font-headline text-lg leading-none">{count}</span>
      <span className="text-[10px] tracking-wide uppercase">{label}</span>
    </button>
  )

  return (
    <div className="rounded-card border border-gold/10 bg-charcoal-2 p-4">
      <h2 className="text-xs tracking-[0.15em] text-text-muted uppercase">Pipeline</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {STAGE_ORDER.map((stage) =>
          chip(stage, STAGE_LABELS[stage], counts[stage], STAGE_COLORS[stage]),
        )}
      </div>

      {/* Flags cut across stages — a customer can be quoted AND waitlisted. */}
      <div className="mt-3 flex flex-wrap gap-2 border-t border-gold/10 pt-3">
        {chip(
          'info_needed',
          'Info needed',
          needingInfo.length,
          'border-amber-500/40 bg-amber-500/10 text-amber-300',
        )}
        {chip(
          'waitlist',
          'Waitlisted',
          waitlisted.length,
          'border-gold/40 bg-gold/10 text-gold',
        )}
      </div>

      {selected !== 'all' && (
        <button
          type="button"
          onClick={() => onSelect('all')}
          className="mt-3 text-[11px] text-text-muted underline hover:text-warm-white"
        >
          Clear filter
        </button>
      )}
    </div>
  )
}

export function StageBadge({ stage, gaps, waitlisted }: { stage: Stage; gaps: string[]; waitlisted: boolean }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <span
        className={`rounded border px-1.5 py-0.5 text-[9px] tracking-wide uppercase ${STAGE_COLORS[stage]}`}
      >
        {STAGE_LABELS[stage]}
      </span>
      {waitlisted && (
        <span className="rounded border border-gold/40 bg-gold/10 px-1.5 py-0.5 text-[9px] tracking-wide text-gold uppercase">
          Waitlist
        </span>
      )}
      {gaps.length > 0 && stage !== 'closed' && stage !== 'delivered' && (
        <span
          title={`Still needed: ${gaps.join(', ')}`}
          className="rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[9px] tracking-wide text-amber-300 uppercase"
        >
          Needs {gaps.length}
        </span>
      )}
    </span>
  )
}
