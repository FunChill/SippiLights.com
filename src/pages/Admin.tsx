import { useCallback, useEffect, useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { useSEO } from '../lib/seo'
import { supabase } from '../lib/supabaseClient'
import type { Booking } from '../lib/bookings'
import {
  STATUS_COLORS,
  STATUS_LABELS,
  fetchBookingsInRange,
  fetchInquiries,
} from '../lib/bookings'
import { BookingDrawer } from '../components/admin/BookingDrawer'
import { QuickActions } from '../components/admin/QuickActions'
import { ReviewsWidget } from '../components/admin/ReviewsWidget'
import Financials from './admin/Financials'
import Assets from './admin/Assets'
import Playbook from './admin/Playbook'
import Transfer from './admin/Transfer'
import Export from './admin/Export'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function Admin() {
  useSEO({ title: 'Dashboard | Sippi Lights', description: 'Owner dashboard.' })

  const [session, setSession] = useState<Session | null>(null)
  const [sessionChecked, setSessionChecked] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setSessionChecked(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  if (!sessionChecked) {
    return <div className="px-6 py-24 text-center text-text-muted">Loading…</div>
  }

  return session ? <AdminShell /> : <LoginForm />
}

const ADMIN_TABS = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/financials', label: 'Financials' },
  { to: '/admin/inventory', label: 'Inventory & Assets' },
  { to: '/admin/playbook', label: 'Playbook' },
  { to: '/admin/transfer', label: 'Transfer' },
  { to: '/admin/export', label: 'Data Room' },
]

function AdminShell() {
  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-headline text-3xl font-light">Owner Dashboard</h1>
          <button
            type="button"
            onClick={() => supabase.auth.signOut()}
            className="text-sm text-text-muted hover:text-warm-white"
          >
            Sign out
          </button>
        </div>

        <nav className="mt-6 flex flex-wrap gap-2 border-b border-gold/10 pb-3">
          {ADMIN_TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `rounded-button px-3 py-1.5 text-xs ${
                  isActive
                    ? 'bg-gold font-medium text-charcoal'
                    : 'border border-gold/20 text-text-muted hover:border-gold/50 hover:text-warm-white'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-6">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="financials" element={<Financials />} />
            <Route path="inventory" element={<Assets />} />
            <Route path="playbook" element={<Playbook />} />
            <Route path="transfer" element={<Transfer />} />
            <Route path="export" element={<Export />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) setError('Sign-in failed — check your email and password.')
    setBusy(false)
  }

  return (
    <div className="px-6 py-24">
      <form
        onSubmit={signIn}
        className="mx-auto flex max-w-sm flex-col gap-4 rounded-card border border-gold/10 bg-charcoal-2 p-8"
      >
        <h1 className="font-headline text-2xl text-gold">Owner Sign-In</h1>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="rounded-button border border-gold/20 bg-charcoal px-4 py-3 text-sm text-warm-white focus:border-gold focus:outline-none"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          className="rounded-button border border-gold/20 bg-charcoal px-4 py-3 text-sm text-warm-white focus:border-gold focus:outline-none"
        />
        {error && <p className="text-xs text-red-300">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="rounded-button bg-gold px-4 py-3 text-sm font-medium text-charcoal hover:bg-gold-light disabled:opacity-50"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}

function Dashboard() {
  const now = new Date()
  const [viewDate, setViewDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1))
  const [bookings, setBookings] = useState<Booking[]>([])
  const [inquiries, setInquiries] = useState<Booking[]>([])
  const [upcoming, setUpcoming] = useState<Booking[]>([])
  const [selected, setSelected] = useState<Booking | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  useEffect(() => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    fetchBookingsInRange(toISO(new Date(year, month, 1)), toISO(new Date(year, month + 1, 0)))
      .then(setBookings)
      .catch(() => setBookings([]))

    const today = new Date()
    const in14 = new Date()
    in14.setDate(in14.getDate() + 14)
    fetchBookingsInRange(toISO(today), toISO(in14))
      .then((rows) => setUpcoming(rows.filter((b) => b.status === 'confirmed' || b.status === 'pending_deposit')))
      .catch(() => setUpcoming([]))

    fetchInquiries().then(setInquiries).catch(() => setInquiries([]))
  }, [viewDate, refreshKey])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leadingBlanks = new Date(year, month, 1).getDay()

  const byDate = new Map<string, Booking[]>()
  for (const b of bookings) {
    const list = byDate.get(b.event_date) ?? []
    list.push(b)
    byDate.set(b.event_date, list)
  }

  return (
    <div>
      <div>
        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div>
            {/* Calendar */}
            <div className="rounded-card border border-gold/10 bg-charcoal-2 p-4">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setViewDate(new Date(year, month - 1, 1))}
                  className="rounded-button border border-gold/20 px-3 py-1 text-sm hover:border-gold/50"
                >
                  ←
                </button>
                <p className="font-headline text-lg">
                  {MONTH_NAMES[month]} {year}
                </p>
                <button
                  type="button"
                  onClick={() => setViewDate(new Date(year, month + 1, 1))}
                  className="rounded-button border border-gold/20 px-3 py-1 text-sm hover:border-gold/50"
                >
                  →
                </button>
              </div>
              <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] text-text-muted">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <div key={i}>{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: leadingBlanks }).map((_, i) => (
                  <div key={`b${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const iso = toISO(new Date(year, month, i + 1))
                  const dayBookings = byDate.get(iso) ?? []
                  return (
                    <div
                      key={iso}
                      className="min-h-14 rounded-lg border border-gold/5 p-1 text-xs"
                    >
                      <span className="text-text-muted">{i + 1}</span>
                      <div className="mt-0.5 flex flex-col gap-0.5">
                        {dayBookings.map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => setSelected(b)}
                            className="truncate rounded px-1 py-0.5 text-left text-[10px] text-charcoal"
                            style={{ backgroundColor: STATUS_COLORS[b.status] }}
                            title={`${b.customer_name} — ${STATUS_LABELS[b.status]}`}
                          >
                            {b.word_built || b.customer_name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-text-muted">
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <span key={key} className="flex items-center gap-1">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[key as keyof typeof STATUS_COLORS] }}
                    />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Upcoming */}
            <div className="mt-6 rounded-card border border-gold/10 bg-charcoal-2 p-4">
              <h2 className="text-xs tracking-[0.15em] text-text-muted uppercase">
                Next 14 days
              </h2>
              {upcoming.length === 0 ? (
                <p className="mt-3 text-sm text-text-muted">Nothing scheduled.</p>
              ) : (
                <div className="mt-3 flex flex-col gap-2">
                  {upcoming.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelected(b)}
                      className="flex items-center justify-between rounded-button border border-gold/10 px-3 py-2 text-left text-sm hover:border-gold/40"
                    >
                      <span>
                        <span className="text-gold">{b.event_date}</span> ·{' '}
                        {b.word_built ? `"${b.word_built}"` : b.customer_name}
                      </span>
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] text-charcoal"
                        style={{ backgroundColor: STATUS_COLORS[b.status] }}
                      >
                        {STATUS_LABELS[b.status]}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Inquiries */}
            <div className="mt-6 rounded-card border border-gold/10 bg-charcoal-2 p-4">
              <h2 className="text-xs tracking-[0.15em] text-text-muted uppercase">
                Inquiries inbox ({inquiries.length})
              </h2>
              {inquiries.length === 0 ? (
                <p className="mt-3 text-sm text-text-muted">Inbox zero. Nice.</p>
              ) : (
                <div className="mt-3 flex flex-col gap-2">
                  {inquiries.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelected(b)}
                      className="rounded-button border border-gold/10 px-3 py-2 text-left text-sm hover:border-gold/40"
                    >
                      <span className="text-warm-white">{b.customer_name}</span>{' '}
                      <span className="text-text-muted">
                        · {b.event_date} · {b.event_type ?? 'event'}
                        {b.word_built ? ` · "${b.word_built}"` : ''}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <QuickActions onChanged={refresh} />
            <ReviewsWidget />
          </div>
        </div>
      </div>

      {selected && (
        <BookingDrawer
          booking={selected}
          onClose={() => setSelected(null)}
          onChanged={refresh}
        />
      )}
    </div>
  )
}
