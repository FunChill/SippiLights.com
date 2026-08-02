import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import type { Booking, BookingStatus } from '../../lib/bookings'
import { STATUS_LABELS, getAgreementUrl, updateBooking } from '../../lib/bookings'
import { supabase } from '../../lib/supabaseClient'
import { formatCurrency } from '../../config/pricing'
import { DraftReplyPanel } from './DraftReplyPanel'

const ALL_STATUSES: BookingStatus[] = [
  'inquiry',
  'pending_deposit',
  'confirmed',
  'completed',
  'cancelled',
]

interface BookingDrawerProps {
  booking: Booking
  onClose: () => void
  onChanged: () => void
}

export function BookingDrawer({ booking, onClose, onChanged }: BookingDrawerProps) {
  const [notes, setNotes] = useState(booking.notes ?? '')
  const [status, setStatus] = useState<BookingStatus>(booking.status)
  const [balanceMethod, setBalanceMethod] = useState<'cash' | 'card' | 'other'>('cash')
  const [refundAmount, setRefundAmount] = useState('')
  const [refundNote, setRefundNote] = useState<string | null>(null)
  const [showDrafter, setShowDrafter] = useState(false)
  const [agreementUrl, setAgreementUrl] = useState<string | null>(null)
  const [paymentLink, setPaymentLink] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (booking.agreement_pdf_path) {
      getAgreementUrl(booking.agreement_pdf_path).then(setAgreementUrl)
    }
  }, [booking.agreement_pdf_path])

  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(label)
    setError(null)
    try {
      await fn()
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(null)
    }
  }

  const paid = booking.amount_paid ?? 0
  const alreadyRefunded = booking.refund_amount ?? 0
  const refundable = Math.max(0, paid - alreadyRefunded)

  const issueRefund = () =>
    run('refund', async () => {
      const amount = refundAmount.trim() === '' ? null : Number(refundAmount)
      if (amount !== null && (!Number.isFinite(amount) || amount <= 0)) {
        throw new Error('Enter a refund amount greater than zero.')
      }
      const label = amount === null ? `the full ${formatCurrency(refundable)}` : formatCurrency(amount)
      if (!window.confirm(`Refund ${label} to ${booking.customer_name}? This cannot be undone.`)) {
        return
      }
      const { data: sessionData } = await supabase.auth.getSession()
      const res = await fetch('/api/admin-refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
        body: JSON.stringify({ bookingId: booking.id, amount }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Refund failed.')
      setRefundAmount('')
      setRefundNote(
        `Refunded ${formatCurrency(data.refunded)}${data.remaining > 0 ? ` · ${formatCurrency(data.remaining)} still refundable` : ' · fully refunded'}`,
      )
    })

  const createPaymentLink = () =>
    run('link', async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      const res = await fetch('/api/admin-payment-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bookingId: booking.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not create payment link.')
      setPaymentLink(data.url)
    })

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md overflow-y-auto border-l border-gold/15 bg-charcoal-2 p-6"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="font-headline text-2xl text-gold">
              {booking.word_built ? `"${booking.word_built}"` : booking.customer_name}
            </p>
            <p className="mt-1 text-sm text-text-muted">{booking.event_date}</p>
          </div>
          <button type="button" onClick={onClose} className="text-2xl text-text-muted hover:text-warm-white">
            ×
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-2 text-sm">
          <Row label="Customer" value={booking.customer_name} />
          <Row label="Phone" value={booking.customer_phone} />
          <Row label="Email" value={booking.customer_email} />
          <Row label="Event type" value={booking.event_type ?? '—'} />
          <Row label="Setup" value={booking.indoor_outdoor ?? '—'} />
          <Row label="Venue" value={booking.venue_address ?? '—'} />
          <Row label="LED color" value={booking.led_color ?? '—'} />
          <Row
            label="Items"
            value={
              booking.items?.length
                ? booking.items
                    .map((i) => `${i.character ?? i.itemId}${i.qty > 1 ? ` ×${i.qty}` : ''}`)
                    .join(', ')
                : '—'
            }
          />
          <Row label="Subtotal" value={booking.subtotal != null ? formatCurrency(booking.subtotal) : '—'} />
          <Row
            label="Deposit"
            value={`${booking.deposit_due != null ? formatCurrency(booking.deposit_due) : '—'} · ${booking.deposit_paid ? 'PAID' : 'unpaid'}`}
          />
          <Row
            label="Paid online"
            value={
              booking.amount_paid != null
                ? `${formatCurrency(booking.amount_paid)}${booking.paid_in_full ? ' · PAID IN FULL' : ''}`
                : '—'
            }
          />
          <Row
            label="Balance"
            value={
              booking.paid_in_full
                ? 'Nothing due at delivery ✓'
                : booking.balance_collected_at
                  ? `COLLECTED ${booking.balance_collected_at.slice(0, 10)} (${booking.balance_payment_method ?? '—'})`
                  : booking.subtotal != null
                    ? `${formatCurrency(booking.subtotal - (booking.amount_paid ?? booking.deposit_due ?? 0))} due at delivery`
                    : '—'
            }
          />
        </div>

        <div className="mt-6">
          <label className="mb-2 block text-xs tracking-wide text-text-muted uppercase">Status</label>
          <select
            value={status}
            onChange={(e) => {
              const next = e.target.value as BookingStatus
              setStatus(next)
              run('status', () => updateBooking(booking.id, { status: next }))
            }}
            className="w-full rounded-button border border-gold/20 bg-charcoal px-3 py-2 text-sm text-warm-white"
          >
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {!booking.deposit_paid && (
            <ActionButton
              label={busy === 'link' ? 'Creating…' : 'Get payment link'}
              onClick={createPaymentLink}
              disabled={busy !== null}
            />
          )}
          {booking.deposit_paid &&
            booking.status === 'confirmed' &&
            !booking.balance_collected_at &&
            !booking.paid_in_full && (
            <div className="flex items-center gap-2">
              <select
                value={balanceMethod}
                onChange={(e) => setBalanceMethod(e.target.value as 'cash' | 'card' | 'other')}
                className="rounded-button border border-gold/20 bg-charcoal px-2 py-2 text-xs text-warm-white"
                aria-label="Balance payment method"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="other">Other</option>
              </select>
              <ActionButton
                label={busy === 'balance' ? 'Saving…' : 'Balance collected + completed'}
                onClick={() =>
                  run('balance', () =>
                    updateBooking(booking.id, {
                      status: 'completed',
                      balance_collected_at: new Date().toISOString(),
                      balance_payment_method: balanceMethod,
                    }),
                  )
                }
                disabled={busy !== null}
              />
            </div>
          )}
          {/* Prepaid bookings skip balance collection entirely — but still
              need marking complete so they land in realized revenue. */}
          {booking.paid_in_full && booking.status === 'confirmed' && (
            <ActionButton
              label={busy === 'complete' ? 'Saving…' : 'Mark completed (prepaid)'}
              onClick={() => run('complete', () => updateBooking(booking.id, { status: 'completed' }))}
              disabled={busy !== null}
            />
          )}
          {agreementUrl && (
            <a
              href={agreementUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-button border border-gold/40 px-3 py-2 text-xs text-gold hover:bg-gold hover:text-charcoal"
            >
              Agreement PDF
            </a>
          )}
        </div>

        {/* Refunds without leaving the dashboard. Blank amount = refund the
            whole remaining balance; partial refunds are supported for
            goodwill adjustments on bookings that still go ahead. */}
        {booking.stripe_payment_intent_id && refundable > 0 && (
          <div className="mt-4 rounded-button border border-red-500/20 bg-red-500/5 p-3">
            <p className="text-[10px] tracking-wide text-text-muted uppercase">
              Refund · {formatCurrency(refundable)} refundable
              {alreadyRefunded > 0 ? ` (${formatCurrency(alreadyRefunded)} already refunded)` : ''}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="0.01"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder={`Full (${formatCurrency(refundable)})`}
                className="w-32 rounded border border-red-500/30 bg-charcoal px-2 py-1.5 text-xs text-warm-white"
              />
              <button
                type="button"
                onClick={issueRefund}
                disabled={busy !== null}
                className="rounded-button border border-red-400/50 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/20 disabled:opacity-50"
              >
                {busy === 'refund' ? 'Refunding…' : 'Issue refund'}
              </button>
            </div>
          </div>
        )}

        {refundNote && (
          <p className="mt-2 rounded-button border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
            {refundNote}
          </p>
        )}

        {booking.refunded_at && refundable <= 0 && (
          <p className="mt-2 text-xs text-text-muted">
            Fully refunded {booking.refunded_at.slice(0, 10)}.
          </p>
        )}

        {paymentLink && (
          <div className="mt-4 rounded-button border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
            <p className="mb-1 font-medium">Payment link — copy and text/email it:</p>
            <input
              readOnly
              value={paymentLink}
              onFocus={(e) => e.target.select()}
              className="w-full rounded border border-emerald-500/30 bg-charcoal px-2 py-1.5 text-emerald-200"
            />
          </div>
        )}

        {/* Drafts an answer grounded in this booking's real availability and
            pricing. Walt edits and sends; nothing leaves without him. */}
        <div className="mt-6 rounded-button border border-gold/15 bg-charcoal p-3">
          <p className="mb-2 text-[10px] tracking-wide text-text-muted uppercase">
            Reply assistant
          </p>
          {showDrafter ? (
            <DraftReplyPanel
              bookingId={booking.id}
              customerEmail={booking.customer_email}
              channel="web"
              initialMessage={booking.notes ?? ''}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowDrafter(true)}
              className="rounded-button border border-gold/40 px-3 py-2 text-xs text-gold hover:bg-gold hover:text-charcoal"
            >
              Draft a reply
            </button>
          )}
        </div>

        <div className="mt-6">
          <label className="mb-2 block text-xs tracking-wide text-text-muted uppercase">
            Notes (cancel/refund details, balance, anything)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full rounded-button border border-gold/20 bg-charcoal px-3 py-2 text-sm text-warm-white"
          />
          <button
            type="button"
            onClick={() => run('notes', () => updateBooking(booking.id, { notes }))}
            disabled={busy !== null}
            className="mt-2 rounded-button bg-gold px-4 py-2 text-xs font-medium text-charcoal hover:bg-gold-light disabled:opacity-50"
          >
            {busy === 'notes' ? 'Saving…' : 'Save notes'}
          </button>
        </div>

        {error && (
          <p className="mt-4 rounded-button border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            {error}
          </p>
        )}
      </motion.div>
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gold/5 pb-2">
      <span className="text-text-muted">{label}</span>
      <span className="text-right text-warm-white">{value}</span>
    </div>
  )
}

function ActionButton({
  label,
  onClick,
  disabled,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-button bg-gold px-3 py-2 text-xs font-medium text-charcoal hover:bg-gold-light disabled:opacity-50"
    >
      {label}
    </button>
  )
}
