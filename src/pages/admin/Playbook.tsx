import { useMemo, useState } from 'react'
import { PLAYBOOK, PLAYBOOK_CATEGORIES, type PlaybookEntry } from '../../content/playbook'
import { downloadFile } from '../../lib/csv'

/**
 * Operations playbook browser. Content lives in src/content/playbook.ts —
 * edit the SOPs there. PDF export lazy-loads @react-pdf/renderer on click.
 */
export default function Playbook() {
  const [category, setCategory] = useState<string>('all')
  const [open, setOpen] = useState<string | null>(PLAYBOOK[0]?.slug ?? null)
  const [exporting, setExporting] = useState<string | null>(null)

  const entries = useMemo(
    () => (category === 'all' ? PLAYBOOK : PLAYBOOK.filter((e) => e.category === category)),
    [category],
  )

  const exportPdf = async (entry: PlaybookEntry) => {
    setExporting(entry.slug)
    try {
      const { playbookEntryPdf } = await import('../../lib/playbookPdf')
      const blob = await playbookEntryPdf(entry)
      downloadFile(`SippiLights-SOP-${entry.slug}.pdf`, blob, 'application/pdf')
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <FilterButton label="All" active={category === 'all'} onClick={() => setCategory('all')} />
        {PLAYBOOK_CATEGORIES.filter((c) => PLAYBOOK.some((e) => e.category === c)).map((c) => (
          <FilterButton key={c} label={c} active={category === c} onClick={() => setCategory(c)} />
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {entries.map((entry) => {
          const isOpen = open === entry.slug
          return (
            <div key={entry.slug} className="rounded-card border border-gold/10 bg-charcoal-2">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : entry.slug)}
                className="flex w-full items-center justify-between gap-3 p-4 text-left"
              >
                <span>
                  <span className="block text-[10px] tracking-[0.15em] text-gold uppercase">
                    {entry.category}
                  </span>
                  <span className="font-headline text-lg text-warm-white">{entry.title}</span>
                </span>
                <span className="text-text-muted">{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && (
                <div className="border-t border-gold/10 p-4">
                  <ol className="flex flex-col gap-2 text-sm">
                    {entry.steps.map((step, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="font-headline text-gold">{i + 1}</span>
                        <span className="text-warm-white/90">{step}</span>
                      </li>
                    ))}
                  </ol>
                  {entry.notes && (
                    <p className="mt-4 rounded-button border border-gold/15 bg-charcoal p-3 text-xs text-text-muted">
                      <span className="text-gold">Note: </span>
                      {entry.notes}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => exportPdf(entry)}
                    disabled={exporting !== null}
                    className="mt-4 rounded-button border border-gold/40 px-4 py-2 text-xs text-gold hover:bg-gold hover:text-charcoal disabled:opacity-50"
                  >
                    {exporting === entry.slug ? 'Generating…' : 'Download PDF'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FilterButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-button px-3 py-1.5 text-xs ${
        active
          ? 'bg-gold font-medium text-charcoal'
          : 'border border-gold/20 text-text-muted hover:border-gold/50 hover:text-warm-white'
      }`}
    >
      {label}
    </button>
  )
}
