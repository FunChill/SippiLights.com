import { useState } from 'react'
import {
  TRIAGE_COLORS,
  TRIAGE_LABELS,
  draftReply,
  sendReply,
  type DraftResult,
} from '../../lib/inquiryAssistant'

interface DraftReplyPanelProps {
  /** Booking to ground the facts in, when the message came through the site. */
  bookingId?: string
  /** Where Send goes. Omitted for Marketplace, which is copy-out only. */
  customerEmail?: string
  /** Loose facts for messages with no booking behind them. */
  eventDate?: string
  zip?: string
  channel?: string
  /** Prefilled inbound message; the drawer supplies the booking's notes. */
  initialMessage?: string
  /** Show the message box. False when the drawer already knows the ask. */
  showMessageInput?: boolean
}

/**
 * Drafts a reply and shows the facts it was built from. Nothing here sends
 * without Walt pressing Send on text he can edit first — the draft is a
 * starting point, never an outbox.
 */
export function DraftReplyPanel({
  bookingId,
  customerEmail,
  eventDate,
  zip,
  channel = 'web',
  initialMessage = '',
  showMessageInput = true,
}: DraftReplyPanelProps) {
  const [message, setMessage] = useState(initialMessage)
  const [result, setResult] = useState<DraftResult | null>(null)
  const [edited, setEdited] = useState('')
  const [subject, setSubject] = useState('About your Sippi Lights inquiry')
  const [busy, setBusy] = useState<'draft' | 'send' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sentAt, setSentAt] = useState<string | null>(null)
  const [showFacts, setShowFacts] = useState(false)
  const [copied, setCopied] = useState(false)

  const generate = async () => {
    if (!message.trim()) {
      setError('Paste the customer message first.')
      return
    }
    setBusy('draft')
    setError(null)
    setSentAt(null)
    try {
      const r = await draftReply({ message, bookingId, eventDate, zip, channel })
      setResult(r)
      setEdited(r.draft)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not draft a reply.')
    } finally {
      setBusy(null)
    }
  }

  const send = async () => {
    if (!customerEmail) return
    if (!window.confirm(`Send this reply to ${customerEmail}?`)) return
    setBusy('send')
    setError(null)
    try {
      await sendReply({ to: customerEmail, subject, body: edited, bookingId })
      setSentAt(new Date().toLocaleTimeString())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send.')
    } finally {
      setBusy(null)
    }
  }

  const copy = async () => {
    await navigator.clipboard.writeText(edited)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isNoisy = result?.triage === 'spam' || result?.triage === 'scam'

  return (
    <div className="flex flex-col gap-3">
      {showMessageInput && (
        <div>
          <label className="mb-1.5 block text-[10px] tracking-wide text-text-muted uppercase">
            Customer message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Paste what they sent — Marketplace, text, email, anything."
            className="w-full rounded-button border border-gold/20 bg-charcoal px-3 py-2 text-sm text-warm-white placeholder:text-text-muted focus:border-gold focus:outline-none"
          />
        </div>
      )}

      <button
        type="button"
        onClick={generate}
        disabled={busy !== null}
        className="self-start rounded-button bg-gold px-4 py-2 text-xs font-medium text-charcoal hover:bg-gold-light disabled:opacity-50"
      >
        {busy === 'draft' ? 'Drafting…' : result ? 'Draft again' : 'Draft reply'}
      </button>

      {error && (
        <p className="rounded-button border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
          {error}
        </p>
      )}

      {result && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-button border px-2 py-1 text-[10px] tracking-wide uppercase ${TRIAGE_COLORS[result.triage]}`}
            >
              {TRIAGE_LABELS[result.triage]}
            </span>
            <span className="text-xs text-text-muted">{result.triageReason}</span>
          </div>

          {/* Warnings are the security control firing, not a style note. */}
          {result.warnings.length > 0 && (
            <div className="rounded-button border border-red-500/40 bg-red-500/10 p-3">
              <p className="text-[10px] tracking-wide text-red-300 uppercase">
                Do not send as written — {result.warnings.length} problem
                {result.warnings.length > 1 ? 's' : ''} found
              </p>
              <ul className="mt-1.5 flex flex-col gap-1 text-xs text-red-200">
                {result.warnings.map((w, i) => (
                  <li key={i}>• {w}</li>
                ))}
              </ul>
            </div>
          )}

          {result.missingInfo.length > 0 && (
            <div className="rounded-button border border-amber-500/30 bg-amber-500/5 p-3">
              <p className="text-[10px] tracking-wide text-amber-300 uppercase">
                You'll need to fill in
              </p>
              <ul className="mt-1.5 flex flex-col gap-1 text-xs text-amber-200/90">
                {result.missingInfo.map((m, i) => (
                  <li key={i}>• {m}</li>
                ))}
              </ul>
            </div>
          )}

          {isNoisy ? (
            <p className="rounded-button border border-gold/15 bg-charcoal p-3 text-xs text-text-muted">
              No draft written — {result.triage === 'scam'
                ? 'this looks like fraud. Do not reply, do not send codes, do not accept overpayment.'
                : 'this is a marketing pitch, not a customer.'}
            </p>
          ) : (
            <div>
              <label className="mb-1.5 block text-[10px] tracking-wide text-text-muted uppercase">
                Draft — edit before sending
              </label>
              <textarea
                value={edited}
                onChange={(e) => setEdited(e.target.value)}
                rows={10}
                className="w-full rounded-button border border-gold/20 bg-charcoal px-3 py-2 text-sm text-warm-white focus:border-gold focus:outline-none"
              />

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={copy}
                  className="rounded-button border border-gold/40 px-3 py-1.5 text-xs text-gold hover:bg-gold hover:text-charcoal"
                >
                  {copied ? 'Copied ✓' : 'Copy'}
                </button>

                {customerEmail && (
                  <>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      aria-label="Email subject"
                      className="min-w-48 flex-1 rounded-button border border-gold/20 bg-charcoal px-3 py-1.5 text-xs text-warm-white"
                    />
                    <button
                      type="button"
                      onClick={send}
                      disabled={busy !== null || !edited.trim()}
                      className="rounded-button bg-gold px-3 py-1.5 text-xs font-medium text-charcoal hover:bg-gold-light disabled:opacity-50"
                    >
                      {busy === 'send' ? 'Sending…' : `Send to ${customerEmail}`}
                    </button>
                  </>
                )}
              </div>

              {!customerEmail && (
                <p className="mt-2 text-[11px] text-text-muted">
                  Copy this back into Messenger yourself — automating Marketplace replies
                  would put your personal account at risk.
                </p>
              )}

              {sentAt && (
                <p className="mt-2 rounded-button border border-emerald-500/30 bg-emerald-500/10 p-2 text-xs text-emerald-300">
                  Sent at {sentAt}.
                </p>
              )}
            </div>
          )}

          <div>
            <button
              type="button"
              onClick={() => setShowFacts((s) => !s)}
              className="text-[11px] text-text-muted underline hover:text-warm-white"
            >
              {showFacts ? 'Hide' : 'Show'} the facts this was built from
            </button>
            {showFacts && (
              <pre className="mt-2 max-h-72 overflow-auto rounded-button border border-gold/10 bg-charcoal p-3 text-[10px] whitespace-pre-wrap text-text-muted">
                {result.factSheet}
              </pre>
            )}
          </div>
        </>
      )}
    </div>
  )
}
