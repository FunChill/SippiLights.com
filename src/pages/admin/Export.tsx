import { useState } from 'react'
import { toCsv, downloadFile } from '../../lib/csv'
import { PLAYBOOK } from '../../content/playbook'
import {
  currentEstValue,
  fetchExpenses,
  fetchReviews,
  fetchAssets,
  fetchRevenueBookings,
  lastMonthKeys,
  monthKey,
} from '../../lib/phase7'

/**
 * Data room export: one click, one zip — everything a serious buyer asks for
 * in diligence. All numbers computed from live data at click time.
 */
export default function Export() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [doneAt, setDoneAt] = useState<string | null>(null)

  const generate = async () => {
    setBusy(true)
    setError(null)
    try {
      const [{ default: JSZip }, { playbookEntryPdf }] = await Promise.all([
        import('jszip'),
        import('../../lib/playbookPdf'),
      ])
      const [bookings, expenses, assets, reviews] = await Promise.all([
        fetchRevenueBookings(),
        fetchExpenses(),
        fetchAssets(),
        fetchReviews(),
      ])

      const zip = new JSZip()

      // --- CSVs ---
      zip.file(
        'financials/revenue.csv',
        toCsv(
          ['Date', 'Customer', 'Items', 'Subtotal', 'Deposit', 'Balance', 'Status', 'Balance Collected', 'Payment Method'],
          bookings.map((b) => [
            b.event_date,
            b.customer_name,
            b.word_built ?? (b.items ?? []).map((i) => i.character ?? i.itemId).join(' '),
            b.subtotal,
            b.deposit_due,
            (b.subtotal ?? 0) - (b.deposit_due ?? 0),
            b.status,
            b.balance_collected_at ? b.balance_collected_at.slice(0, 10) : '',
            b.balance_payment_method ?? '',
          ]),
        ),
      )
      zip.file(
        'financials/expenses.csv',
        toCsv(['Date', 'Category', 'Amount', 'Note'], expenses.map((e) => [e.date, e.category, e.amount, e.note])),
      )
      zip.file(
        'assets/asset-register.csv',
        toCsv(
          ['Item', 'Category', 'Finish', 'Qty', 'Condition', 'Purchase Date', 'Purchase Cost', 'Est. Value/Unit', 'Replacement Cost', 'Usage Count'],
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
          ]),
        ),
      )
      zip.file(
        'reviews/review-summary.csv',
        toCsv(
          ['Submitted', 'Rating', 'Share Permission', 'Feedback'],
          reviews.map((r) => [r.submitted_at.slice(0, 10), r.rating, r.permission_to_share ? 'yes' : 'no', r.feedback_text]),
        ),
      )

      // --- Playbook PDFs ---
      for (const entry of PLAYBOOK) {
        const blob = await playbookEntryPdf(entry)
        zip.file(`playbook/SOP-${entry.slug}.pdf`, blob)
      }

      // --- overview.md from live data ---
      const completed = bookings.filter((b) => b.status === 'completed')
      const trailing12 = new Set(lastMonthKeys(12))
      const t12Revenue = completed
        .filter((b) => trailing12.has(monthKey(b.event_date)))
        .reduce((s, b) => s + (b.subtotal ?? 0), 0)
      const t12Expenses = expenses
        .filter((e) => trailing12.has(monthKey(e.date)))
        .reduce((s, e) => s + e.amount, 0)
      const avgRating = reviews.length
        ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(2)
        : 'n/a'
      const assetValue = assets.reduce((s, a) => {
        const v = currentEstValue(a)
        return s + (v != null ? v * a.qty_owned : 0)
      }, 0)
      const seen = new Set<string>()
      let repeats = 0
      for (const b of completed) {
        const k = b.customer_email.toLowerCase()
        if (seen.has(k)) repeats++
        seen.add(k)
      }

      zip.file(
        'overview.md',
        [
          '# Sippi Lights — Business Overview',
          '',
          `Generated: ${new Date().toISOString().slice(0, 10)}`,
          '',
          '| Metric | Value |',
          '| --- | --- |',
          `| Total bookings (all-time, confirmed + completed) | ${bookings.length} |`,
          `| Completed events | ${completed.length} |`,
          `| Revenue — trailing 12 months (realized) | $${t12Revenue} |`,
          `| Expenses — trailing 12 months | $${t12Expenses} |`,
          `| SDE — trailing 12 months | $${t12Revenue - t12Expenses} |`,
          `| Asset count (line items) | ${assets.length} |`,
          `| Est. asset value (straight-line depreciated) | $${Math.round(assetValue)} |`,
          `| Average customer rating | ${avgRating} (${reviews.length} reviews) |`,
          `| Repeat customer rate | ${completed.length ? Math.round((repeats / completed.length) * 100) : 0}% |`,
          '',
          'Contents: financials/ (revenue + expenses CSV), assets/ (register CSV),',
          'playbook/ (operations SOPs as PDFs), reviews/ (summary CSV).',
          '',
          'All figures computed live from the operating database at generation time.',
        ].join('\n'),
      )

      const blob = await zip.generateAsync({ type: 'blob' })
      downloadFile(`SippiLights-DataRoom-${new Date().toISOString().slice(0, 10)}.zip`, blob, 'application/zip')
      setDoneAt(new Date().toLocaleTimeString())
    } catch {
      setError('Export failed — try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-xl">
      <div className="rounded-card border border-gold/10 bg-charcoal-2 p-6">
        <h2 className="font-headline text-xl text-warm-white">Data Room Export</h2>
        <p className="mt-2 text-sm text-text-muted">
          One zip with everything a buyer's diligence asks for: revenue and expense CSVs, the asset
          register, every operations SOP as a PDF, the review summary, and an overview.md with
          headline numbers — all computed from live data the moment you click.
        </p>
        <ul className="mt-4 flex flex-col gap-1 text-xs text-text-muted">
          <li>• financials/revenue.csv + expenses.csv</li>
          <li>• assets/asset-register.csv</li>
          <li>• playbook/ — {PLAYBOOK.length} SOP PDFs</li>
          <li>• reviews/review-summary.csv</li>
          <li>• overview.md — headline metrics</li>
        </ul>
        <button
          type="button"
          onClick={generate}
          disabled={busy}
          className="mt-6 rounded-button bg-gold px-6 py-3 text-sm font-medium text-charcoal hover:bg-gold-light disabled:opacity-50"
        >
          {busy ? 'Building zip…' : 'Generate Data Room Zip'}
        </button>
        {doneAt && <p className="mt-3 text-xs text-emerald-300">Downloaded at {doneAt}.</p>}
        {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
      </div>
    </div>
  )
}
