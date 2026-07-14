import { useEffect, useState } from 'react'
import { fetchChecklist, setChecklistItem } from '../../lib/phase7'

/**
 * Business transfer checklist — everything a new owner needs handed over.
 * Task list ONLY: never store actual credentials, account numbers, or access
 * details in the app. Check state persists to the transfer_checklist table.
 */
const ITEMS: Array<{ key: string; label: string; detail: string }> = [
  { key: 'domain', label: 'Domain registrar', detail: 'sippilights.com — transfer or delegate registrar access' },
  { key: 'vercel', label: 'Vercel account', detail: 'Hosting + serverless functions + env vars + cron' },
  { key: 'supabase', label: 'Supabase project', detail: 'Database, auth, storage, pg_cron jobs' },
  { key: 'stripe', label: 'Stripe account', detail: 'Payments — note: currently shared with other LuxAurum products; may need a standalone account before transfer' },
  { key: 'resend', label: 'Resend account', detail: 'Transactional email + sippilights.com domain verification' },
  { key: 'google_business', label: 'Google Business Profile', detail: 'Reviews, maps listing, local SEO' },
  { key: 'social', label: 'Social media accounts', detail: 'Facebook page + Instagram @sippi.lights' },
  { key: 'inventory_location', label: 'Physical inventory location', detail: 'Storage access, layout map, keys' },
  { key: 'vendors', label: 'Vendor / supplier contacts', detail: 'Marquee suppliers, bulb spares, repair parts' },
  { key: 'insurance', label: 'Insurance policy', detail: 'Liability policy — transfer or new owner obtains equivalent' },
  { key: 'llc', label: 'Business entity (LLC) transfer/assignment', detail: 'Entity sale vs. asset sale — attorney handles the paperwork' },
  { key: 'bank', label: 'Business bank account', detail: 'New owner opens their own; close or retitle existing' },
  { key: 'quickbooks', label: 'QuickBooks access', detail: 'Books history — export or transfer the subscription' },
  { key: 'phone', label: 'Portable business phone number', detail: '(601) 813-2464 — must be a transferable business line, not a personal cell' },
]

export default function Transfer() {
  const [state, setState] = useState<Map<string, boolean>>(new Map())
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchChecklist()
      .then((map) => {
        setState(new Map([...map.entries()].map(([k, v]) => [k, v.checked])))
        setLoaded(true)
      })
      .catch(() => setError('Could not load the checklist.'))
  }, [])

  const toggle = async (key: string) => {
    const next = !(state.get(key) ?? false)
    setState((s) => new Map(s).set(key, next)) // optimistic
    try {
      await setChecklistItem(key, next)
    } catch {
      setState((s) => new Map(s).set(key, !next)) // roll back
      setError('Could not save — try again.')
    }
  }

  const done = ITEMS.filter((i) => state.get(i.key)).length

  if (error && !loaded) return <p className="text-sm text-red-300">{error}</p>
  if (!loaded) return <p className="text-sm text-text-muted">Loading checklist…</p>

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-card border border-gold/10 bg-charcoal-2 p-4">
        <p className="text-xs tracking-[0.15em] text-text-muted uppercase">Transfer readiness</p>
        <p className="mt-1 font-headline text-2xl text-warm-white">
          {done} / {ITEMS.length} items ready
        </p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded bg-charcoal">
          <div
            className="h-full rounded bg-gold transition-all"
            style={{ width: `${(done / ITEMS.length) * 100}%` }}
          />
        </div>
        <p className="mt-3 text-xs text-text-muted">
          Checked = documented and transferable today. Credentials themselves NEVER go in this app —
          use a password manager handoff at closing.
        </p>
      </div>

      {error && <p className="text-xs text-red-300">{error}</p>}

      <div className="flex flex-col gap-2">
        {ITEMS.map((item) => {
          const checked = state.get(item.key) ?? false
          return (
            <label
              key={item.key}
              className={`flex cursor-pointer items-start gap-3 rounded-card border p-4 transition-colors ${
                checked ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-gold/10 bg-charcoal-2'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(item.key)}
                className="mt-1 accent-[#c9a84c]"
              />
              <span>
                <span className={`block text-sm ${checked ? 'text-emerald-300' : 'text-warm-white'}`}>
                  {item.label}
                </span>
                <span className="text-xs text-text-muted">{item.detail}</span>
              </span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
