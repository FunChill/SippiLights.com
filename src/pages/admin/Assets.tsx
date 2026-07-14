import { useEffect, useMemo, useState } from 'react'
import { formatCurrency } from '../../config/pricing'
import { toCsv, downloadFile } from '../../lib/csv'
import {
  USEFUL_LIFE_YEARS,
  currentEstValue,
  fetchAssets,
  fetchDemandSignals,
  updateAsset,
  type AssetItem,
  type DemandSignal,
} from '../../lib/phase7'

const CONDITIONS = ['new', 'excellent', 'good', 'fair', 'needs_repair', 'retired'] as const

/**
 * Asset register: every inventory item with purchase data, condition, and a
 * straight-line depreciated estimate (USEFUL_LIFE_YEARS in lib/phase7.ts —
 * one constant, change it there). Plus the demand-signals widget: what
 * customers wanted that the fleet couldn't serve.
 */
export default function Assets() {
  const [assets, setAssets] = useState<AssetItem[]>([])
  const [signals, setSignals] = useState<DemandSignal[]>([])
  const [loaded, setLoaded] = useState(false)
  const [editing, setEditing] = useState<AssetItem | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reload = () => {
    Promise.all([fetchAssets(), fetchDemandSignals(90)])
      .then(([a, s]) => {
        setAssets(a)
        setSignals(s)
        setLoaded(true)
      })
      .catch(() => setError('Could not load the asset register.'))
  }
  useEffect(reload, [])

  const totalValue = useMemo(
    () =>
      assets.reduce((sum, a) => {
        const v = currentEstValue(a)
        return sum + (v != null ? v * a.qty_owned : 0)
      }, 0),
    [assets],
  )

  const attention = useMemo(
    () => assets.filter((a) => a.condition === 'fair' || a.condition === 'needs_repair'),
    [assets],
  )

  const demandRanking = useMemo(() => {
    const byItem = new Map<string, { label: string; days: number }>()
    for (const s of signals) {
      const key = `${s.char_value}-${s.finish}`
      const row = byItem.get(key) ?? { label: `"${s.char_value}" (${s.finish})`, days: 0 }
      row.days++
      byItem.set(key, row)
    }
    return [...byItem.values()].sort((a, b) => b.days - a.days).slice(0, 10)
  }, [signals])

  const exportCsv = () => {
    downloadFile(
      'sippilights-assets.csv',
      toCsv(
        ['Item', 'Category', 'Finish', 'Qty', 'Condition', 'Purchase Date', 'Purchase Cost', 'Est. Value/Unit', 'Replacement Cost', 'Usage Count', 'Last Maintenance', 'Notes'],
        assets.map((a) => [
          a.name,
          a.category,
          a.finish,
          a.qty_owned,
          a.condition,
          a.purchase_date,
          a.purchase_cost,
          currentEstValue(a),
          a.replacement_cost,
          a.usage_count,
          a.last_maintenance_date,
          a.maintenance_notes,
        ]),
      ),
    )
  }

  if (error) return <p className="text-sm text-red-300">{error}</p>
  if (!loaded) return <p className="text-sm text-text-muted">Loading assets…</p>

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-card border border-gold/10 bg-charcoal-2 p-4">
          <p className="text-xs tracking-[0.15em] text-text-muted uppercase">Total Est. Asset Value</p>
          <p className="mt-2 font-headline text-2xl text-warm-white">{formatCurrency(totalValue)}</p>
          <p className="mt-1 text-[10px] text-text-muted">
            Straight-line over {USEFUL_LIFE_YEARS} years · items missing purchase data excluded
          </p>
        </div>
        <div
          className={`rounded-card border p-4 ${attention.length ? 'border-amber-500/40 bg-amber-500/5' : 'border-gold/10 bg-charcoal-2'}`}
        >
          <p className="text-xs tracking-[0.15em] text-text-muted uppercase">Needs Attention</p>
          {attention.length === 0 ? (
            <p className="mt-2 text-sm text-emerald-300">All items good or better.</p>
          ) : (
            <ul className="mt-2 text-sm text-amber-300">
              {attention.map((a) => (
                <li key={a.id}>
                  {a.name} {a.finish ? `(${a.finish})` : ''} — {a.condition.replace('_', ' ')}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-card border border-gold/10 bg-charcoal-2 p-4">
          <p className="text-xs tracking-[0.15em] text-text-muted uppercase">
            Most-Requested Unavailable · 90 days
          </p>
          {demandRanking.length === 0 ? (
            <p className="mt-2 text-sm text-text-muted">No missed demand recorded yet.</p>
          ) : (
            <ul className="mt-2 text-sm text-warm-white">
              {demandRanking.map((d) => (
                <li key={d.label} className="flex justify-between">
                  <span>{d.label}</span>
                  <span className="text-text-muted">{d.days} day{d.days > 1 ? 's' : ''}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-card border border-gold/10 bg-charcoal-2 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs tracking-[0.15em] text-text-muted uppercase">Asset Register</h2>
          <button
            type="button"
            onClick={exportCsv}
            className="rounded-button border border-gold/40 px-3 py-1.5 text-xs text-gold hover:bg-gold hover:text-charcoal"
          >
            Export CSV
          </button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs text-text-muted uppercase">
              <tr>
                <th className="py-1 pr-3">Item</th>
                <th className="py-1 pr-3">Qty</th>
                <th className="py-1 pr-3">Condition</th>
                <th className="py-1 pr-3">Purchase</th>
                <th className="py-1 pr-3">Est. Value/Unit</th>
                <th className="py-1 pr-3">Used</th>
                <th className="py-1 pr-3">Last Maint.</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {assets.map((a) => {
                const value = currentEstValue(a)
                return (
                  <tr key={a.id} className="border-t border-gold/5">
                    <td className="py-1.5 pr-3">
                      {a.name}
                      {a.finish ? <span className="text-text-muted"> · {a.finish}</span> : null}
                      {!a.active && <span className="ml-1 text-[10px] text-red-300">inactive</span>}
                    </td>
                    <td className="py-1.5 pr-3">{a.qty_owned}</td>
                    <td className="py-1.5 pr-3">
                      <ConditionBadge condition={a.condition} />
                    </td>
                    <td className="py-1.5 pr-3 text-text-muted">
                      {a.purchase_cost != null ? formatCurrency(a.purchase_cost) : '—'}
                      {a.purchase_date ? ` · ${a.purchase_date}` : ''}
                    </td>
                    <td className="py-1.5 pr-3">{value != null ? formatCurrency(value) : '—'}</td>
                    <td className="py-1.5 pr-3">{a.usage_count}</td>
                    <td className="py-1.5 pr-3 text-text-muted">{a.last_maintenance_date ?? '—'}</td>
                    <td className="py-1.5 text-right">
                      <button
                        type="button"
                        onClick={() => setEditing(a)}
                        className="text-xs text-gold hover:underline"
                      >
                        edit
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <AssetEditor
          asset={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            reload()
          }}
        />
      )}
    </div>
  )
}

function ConditionBadge({ condition }: { condition: string }) {
  const colors: Record<string, string> = {
    new: 'text-emerald-300',
    excellent: 'text-emerald-300',
    good: 'text-warm-white',
    fair: 'text-amber-300',
    needs_repair: 'text-red-300',
    retired: 'text-text-muted',
  }
  return <span className={colors[condition] ?? 'text-warm-white'}>{condition.replace('_', ' ')}</span>
}

function AssetEditor({
  asset,
  onClose,
  onSaved,
}: {
  asset: AssetItem
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    condition: asset.condition,
    purchase_date: asset.purchase_date ?? '',
    purchase_cost: asset.purchase_cost != null ? String(asset.purchase_cost) : '',
    replacement_cost: asset.replacement_cost != null ? String(asset.replacement_cost) : '',
    last_maintenance_date: asset.last_maintenance_date ?? '',
    maintenance_notes: asset.maintenance_notes ?? '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await updateAsset(asset.id, {
        condition: form.condition,
        purchase_date: form.purchase_date || null,
        purchase_cost: form.purchase_cost ? Number(form.purchase_cost) : null,
        replacement_cost: form.replacement_cost ? Number(form.replacement_cost) : null,
        last_maintenance_date: form.last_maintenance_date || null,
        maintenance_notes: form.maintenance_notes.trim() || null,
      })
      onSaved()
    } catch {
      setError('Could not save.')
      setBusy(false)
    }
  }

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-card border border-gold/15 bg-charcoal-2 p-6">
        <div className="flex items-start justify-between">
          <p className="font-headline text-xl text-gold">
            {asset.name}
            {asset.finish ? ` · ${asset.finish}` : ''}
          </p>
          <button type="button" onClick={onClose} className="text-2xl text-text-muted hover:text-warm-white">
            ×
          </button>
        </div>
        <form onSubmit={save} className="mt-4 flex flex-col gap-3 text-sm">
          <label className="flex flex-col gap-1 text-xs text-text-muted">
            Condition
            <select
              value={form.condition}
              onChange={set('condition')}
              className="rounded-button border border-gold/20 bg-charcoal px-3 py-2 text-sm text-warm-white"
            >
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c.replace('_', ' ')}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs text-text-muted">
              Purchase date
              <input
                type="date"
                value={form.purchase_date}
                onChange={set('purchase_date')}
                className="rounded-button border border-gold/20 bg-charcoal px-3 py-2 text-sm text-warm-white"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-text-muted">
              Purchase cost ($/unit)
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.purchase_cost}
                onChange={set('purchase_cost')}
                className="rounded-button border border-gold/20 bg-charcoal px-3 py-2 text-sm text-warm-white"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-text-muted">
              Replacement cost ($/unit)
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.replacement_cost}
                onChange={set('replacement_cost')}
                className="rounded-button border border-gold/20 bg-charcoal px-3 py-2 text-sm text-warm-white"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-text-muted">
              Last maintenance
              <input
                type="date"
                value={form.last_maintenance_date}
                onChange={set('last_maintenance_date')}
                className="rounded-button border border-gold/20 bg-charcoal px-3 py-2 text-sm text-warm-white"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-xs text-text-muted">
            Maintenance notes
            <textarea
              value={form.maintenance_notes}
              onChange={set('maintenance_notes')}
              rows={2}
              className="rounded-button border border-gold/20 bg-charcoal px-3 py-2 text-sm text-warm-white"
            />
          </label>
          {error && <p className="text-xs text-red-300">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="self-start rounded-button bg-gold px-4 py-2 text-xs font-medium text-charcoal hover:bg-gold-light disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Save'}
          </button>
        </form>
      </div>
    </>
  )
}
