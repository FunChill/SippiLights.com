import { useEffect, useMemo, useState } from 'react'
import type { Booking } from '../../lib/bookings'
import { formatCurrency } from '../../config/pricing'
import { toCsv, downloadFile } from '../../lib/csv'
import { BarChart, LineChart } from '../../components/admin/Charts'
import {
  EXPENSE_CATEGORIES,
  fetchExpenses,
  addExpense,
  deleteExpense,
  fetchRevenueBookings,
  lastMonthKeys,
  monthKey,
  type Expense,
} from '../../lib/phase7'

/**
 * Financial dashboard. Two revenue definitions, kept deliberately separate:
 * - REALIZED (completed bookings) — drives SDE; money actually earned.
 * - PIPELINE (confirmed bookings) — booked but the event hasn't happened yet.
 * A buyer's accountant will audit the realized number, so SDE never counts
 * pipeline.
 */
export default function Financials() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = () => {
    Promise.all([fetchRevenueBookings(), fetchExpenses()])
      .then(([b, e]) => {
        setBookings(b)
        setExpenses(e)
        setLoaded(true)
      })
      .catch(() => setError('Could not load financial data.'))
  }
  useEffect(reload, [])

  const completed = useMemo(() => bookings.filter((b) => b.status === 'completed'), [bookings])
  const confirmed = useMemo(() => bookings.filter((b) => b.status === 'confirmed'), [bookings])

  const months24 = useMemo(() => lastMonthKeys(24), [])
  const trailing12 = useMemo(() => new Set(lastMonthKeys(12)), [])

  const stats = useMemo(() => {
    const thisMonth = monthKey(new Date().toISOString())
    const lastMonthDate = new Date()
    lastMonthDate.setDate(1)
    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1)
    const lastMonth = monthKey(lastMonthDate.toISOString())
    const thisYear = String(new Date().getFullYear())

    const sum = (rows: Booking[]) => rows.reduce((s, b) => s + (b.subtotal ?? 0), 0)
    const inMonth = (m: string) => completed.filter((b) => monthKey(b.event_date) === m)

    const t12Revenue = sum(completed.filter((b) => trailing12.has(monthKey(b.event_date))))
    const t12Expenses = expenses
      .filter((e) => trailing12.has(monthKey(e.date)))
      .reduce((s, e) => s + e.amount, 0)

    // Repeat customers: email or phone seen on an EARLIER completed booking.
    const seen = new Set<string>()
    let repeats = 0
    for (const b of completed) {
      const keys = [b.customer_email.toLowerCase(), b.customer_phone.replace(/\D/g, '')]
      if (keys.some((k) => k && seen.has(k))) repeats++
      keys.forEach((k) => k && seen.add(k))
    }

    // Concentration: any single customer >15% of trailing-12-month revenue.
    const byCustomer = new Map<string, number>()
    for (const b of completed) {
      if (!trailing12.has(monthKey(b.event_date))) continue
      const k = b.customer_email.toLowerCase()
      byCustomer.set(k, (byCustomer.get(k) ?? 0) + (b.subtotal ?? 0))
    }
    const concentrated = [...byCustomer.entries()]
      .filter(([, rev]) => t12Revenue > 0 && rev / t12Revenue > 0.15)
      .map(([email, rev]) => ({ email, share: Math.round((rev / t12Revenue) * 100) }))

    const depositCollected = completed.reduce((s, b) => s + (b.deposit_paid ? (b.deposit_due ?? 0) : 0), 0)
    const balanceCollected = completed.reduce(
      (s, b) => s + (b.balance_collected_at ? (b.subtotal ?? 0) - (b.deposit_due ?? 0) : 0),
      0,
    )
    const balanceOutstanding = completed.reduce(
      (s, b) => s + (!b.balance_collected_at ? (b.subtotal ?? 0) - (b.deposit_due ?? 0) : 0),
      0,
    )

    return {
      thisMonth: sum(inMonth(thisMonth)),
      lastMonth: sum(inMonth(lastMonth)),
      ytd: sum(completed.filter((b) => b.event_date.startsWith(thisYear))),
      t12Revenue,
      t12Expenses,
      t12Sde: t12Revenue - t12Expenses,
      pipeline: sum(confirmed),
      repeatRate: completed.length > 0 ? Math.round((repeats / completed.length) * 100) : 0,
      concentrated,
      depositCollected,
      balanceCollected,
      balanceOutstanding,
    }
  }, [completed, confirmed, expenses, trailing12])

  const revenueTrend = useMemo(
    () =>
      months24.map((m) => ({
        label: m,
        value: completed.filter((b) => monthKey(b.event_date) === m).reduce((s, b) => s + (b.subtotal ?? 0), 0),
      })),
    [months24, completed],
  )

  const volumeTrend = useMemo(
    () =>
      months24.map((m) => ({
        label: m,
        value: completed.filter((b) => monthKey(b.event_date) === m).length,
      })),
    [months24, completed],
  )

  const aovTrend = useMemo(
    () =>
      months24.map((m) => {
        const rows = completed.filter((b) => monthKey(b.event_date) === m)
        return {
          label: m,
          value: rows.length ? Math.round(rows.reduce((s, b) => s + (b.subtotal ?? 0), 0) / rows.length) : 0,
        }
      }),
    [months24, completed],
  )

  const monthlySde = useMemo(
    () =>
      lastMonthKeys(12).map((m) => {
        const rev = completed
          .filter((b) => monthKey(b.event_date) === m)
          .reduce((s, b) => s + (b.subtotal ?? 0), 0)
        const exp = expenses.filter((e) => monthKey(e.date) === m).reduce((s, e) => s + e.amount, 0)
        return { label: m, value: rev - exp }
      }),
    [completed, expenses],
  )

  const exportRevenue = () => {
    downloadFile(
      'sippilights-revenue.csv',
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
  }

  const exportExpenses = () => {
    downloadFile(
      'sippilights-expenses.csv',
      toCsv(
        ['Date', 'Category', 'Amount', 'Note'],
        expenses.map((e) => [e.date, e.category, e.amount, e.note]),
      ),
    )
  }

  if (error) return <p className="text-sm text-red-300">{error}</p>
  if (!loaded) return <p className="text-sm text-text-muted">Loading financials…</p>

  return (
    <div className="flex flex-col gap-6">
      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="This Month" value={formatCurrency(stats.thisMonth)} />
        <StatCard label="Last Month" value={formatCurrency(stats.lastMonth)} />
        <StatCard label="YTD" value={formatCurrency(stats.ytd)} />
        <StatCard label="Trailing 12 Months" value={formatCurrency(stats.t12Revenue)} />
      </div>

      {/* SDE */}
      <div className="rounded-card border border-gold/25 bg-charcoal-2 p-5">
        <h2 className="text-xs tracking-[0.15em] text-text-muted uppercase">
          SDE (Seller's Discretionary Earnings) — trailing 12 months
        </h2>
        <p className="mt-2 font-headline text-4xl text-gold">{formatCurrency(stats.t12Sde)}</p>
        <p className="mt-1 text-xs text-text-muted">
          {formatCurrency(stats.t12Revenue)} realized revenue (completed events) −{' '}
          {formatCurrency(stats.t12Expenses)} expenses. Confirmed-but-not-yet-delivered pipeline (
          {formatCurrency(stats.pipeline)}) is excluded until the event completes.
        </p>
        <div className="mt-4">
          <LineChart data={monthlySde} formatValue={(v) => formatCurrency(v)} />
        </div>
      </div>

      {/* Collections */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Deposits Collected" value={formatCurrency(stats.depositCollected)} />
        <StatCard label="Balances Collected" value={formatCurrency(stats.balanceCollected)} />
        <StatCard
          label="Balances Uncollected"
          value={formatCurrency(stats.balanceOutstanding)}
          warn={stats.balanceOutstanding > 0}
        />
      </div>

      {/* Health signals */}
      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard label="Repeat Customer Rate" value={`${stats.repeatRate}%`} />
        <div
          className={`rounded-card border p-4 ${stats.concentrated.length ? 'border-amber-500/40 bg-amber-500/5' : 'border-gold/10 bg-charcoal-2'}`}
        >
          <p className="text-xs tracking-[0.15em] text-text-muted uppercase">Customer Concentration</p>
          {stats.concentrated.length === 0 ? (
            <p className="mt-2 text-sm text-emerald-300">
              Healthy — no customer over 15% of trailing-12-month revenue.
            </p>
          ) : (
            <ul className="mt-2 text-sm text-amber-300">
              {stats.concentrated.map((c) => (
                <li key={c.email}>
                  {c.email} — {c.share}% of trailing-12-month revenue
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Trends */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Monthly revenue — last 24 months">
          <BarChart data={revenueTrend} formatValue={(v) => formatCurrency(v)} />
        </ChartCard>
        <ChartCard title="Booking volume — last 24 months">
          <BarChart data={volumeTrend} />
        </ChartCard>
        <ChartCard title="Average order value — last 24 months">
          <LineChart data={aovTrend} formatValue={(v) => formatCurrency(v)} />
        </ChartCard>
      </div>

      {/* Expenses */}
      <ExpensesPanel expenses={expenses} onChanged={reload} />

      {/* Exports */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={exportRevenue}
          className="rounded-button bg-gold px-4 py-2 text-xs font-medium text-charcoal hover:bg-gold-light"
        >
          Export revenue CSV
        </button>
        <button
          type="button"
          onClick={exportExpenses}
          className="rounded-button border border-gold/40 px-4 py-2 text-xs text-gold hover:bg-gold hover:text-charcoal"
        >
          Export expenses CSV
        </button>
      </div>
    </div>
  )
}

function StatCard({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div
      className={`rounded-card border p-4 ${warn ? 'border-amber-500/40 bg-amber-500/5' : 'border-gold/10 bg-charcoal-2'}`}
    >
      <p className="text-xs tracking-[0.15em] text-text-muted uppercase">{label}</p>
      <p className={`mt-2 font-headline text-2xl ${warn ? 'text-amber-300' : 'text-warm-white'}`}>{value}</p>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-card border border-gold/10 bg-charcoal-2 p-5">
      <h2 className="mb-4 text-xs tracking-[0.15em] text-text-muted uppercase">{title}</h2>
      {children}
    </div>
  )
}

function ExpensesPanel({ expenses, onChanged }: { expenses: Expense[]; onChanged: () => void }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [category, setCategory] = useState<string>('fuel')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = Number(amount)
    if (!amt || amt <= 0) {
      setError('Enter an amount.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await addExpense({ date, category, amount: amt, note: note.trim() || null })
      setAmount('')
      setNote('')
      onChanged()
    } catch {
      setError('Could not save the expense.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (id: string) => {
    try {
      await deleteExpense(id)
      onChanged()
    } catch {
      setError('Could not delete.')
    }
  }

  // Monthly totals by category, current month.
  const thisMonth = monthKey(new Date().toISOString())
  const monthTotals = new Map<string, number>()
  for (const e of expenses) {
    if (monthKey(e.date) !== thisMonth) continue
    monthTotals.set(e.category, (monthTotals.get(e.category) ?? 0) + e.amount)
  }

  return (
    <div className="rounded-card border border-gold/10 bg-charcoal-2 p-5">
      <h2 className="text-xs tracking-[0.15em] text-text-muted uppercase">Expenses</h2>

      <form onSubmit={submit} className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-text-muted">
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-button border border-gold/20 bg-charcoal px-3 py-2 text-sm text-warm-white"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-text-muted">
          Category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-button border border-gold/20 bg-charcoal px-3 py-2 text-sm text-warm-white"
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.replace('_', ' ')}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-text-muted">
          Amount ($)
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-28 rounded-button border border-gold/20 bg-charcoal px-3 py-2 text-sm text-warm-white"
          />
        </label>
        <label className="flex min-w-40 flex-1 flex-col gap-1 text-xs text-text-muted">
          Note
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="optional"
            className="rounded-button border border-gold/20 bg-charcoal px-3 py-2 text-sm text-warm-white"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="rounded-button bg-gold px-4 py-2 text-xs font-medium text-charcoal hover:bg-gold-light disabled:opacity-50"
        >
          {busy ? 'Adding…' : 'Add expense'}
        </button>
      </form>

      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}

      {monthTotals.size > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-text-muted">
          <span className="uppercase tracking-wide">This month:</span>
          {[...monthTotals.entries()].map(([cat, total]) => (
            <span key={cat} className="rounded bg-charcoal px-2 py-0.5">
              {cat.replace('_', ' ')} {formatCurrency(total)}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 max-h-72 overflow-y-auto">
        {expenses.length === 0 ? (
          <p className="text-sm text-text-muted">No expenses recorded yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-text-muted uppercase">
              <tr>
                <th className="py-1 pr-3">Date</th>
                <th className="py-1 pr-3">Category</th>
                <th className="py-1 pr-3">Amount</th>
                <th className="py-1 pr-3">Note</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-t border-gold/5">
                  <td className="py-1.5 pr-3">{e.date}</td>
                  <td className="py-1.5 pr-3">{e.category.replace('_', ' ')}</td>
                  <td className="py-1.5 pr-3">{formatCurrency(e.amount)}</td>
                  <td className="py-1.5 pr-3 text-text-muted">{e.note ?? ''}</td>
                  <td className="py-1.5 text-right">
                    <button
                      type="button"
                      onClick={() => remove(e.id)}
                      className="text-xs text-red-300/70 hover:text-red-300"
                    >
                      delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
