import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { MARQUEE_PRICE, calculateDeposit } from '../../config/pricing'

const inputClass =
  'w-full rounded-button border border-gold/20 bg-charcoal px-3 py-2 text-sm text-warm-white placeholder:text-text-muted focus:border-gold focus:outline-none'

export function QuickActions({ onChanged }: { onChanged: () => void }) {
  const [message, setMessage] = useState<string | null>(null)

  const flash = (msg: string) => {
    setMessage(msg)
    setTimeout(() => setMessage(null), 4000)
    onChanged()
  }

  return (
    <div className="flex flex-col gap-6">
      <BlockDate onDone={flash} />
      <ManualBooking onDone={flash} />
      <ItemToggle onDone={flash} />
      {message && (
        <p className="rounded-button border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
          {message}
        </p>
      )}
    </div>
  )
}

function BlockDate({ onDone }: { onDone: (msg: string) => void }) {
  const [date, setDate] = useState('')
  const [reason, setReason] = useState('')

  const block = async () => {
    if (!date) return
    const { error } = await supabase
      .from('availability_blocks')
      .insert({ date, reason: reason || null })
    if (!error) {
      setDate('')
      setReason('')
      onDone(`Blocked ${date}.`)
    }
  }

  return (
    <div className="rounded-card border border-gold/10 bg-charcoal-2 p-4">
      <h3 className="text-xs tracking-[0.15em] text-text-muted uppercase">Block a date</h3>
      <div className="mt-3 flex flex-col gap-2">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (holiday, maintenance…)"
          className={inputClass}
        />
        <button
          type="button"
          onClick={block}
          disabled={!date}
          className="rounded-button bg-gold px-4 py-2 text-xs font-medium text-charcoal hover:bg-gold-light disabled:opacity-40"
        >
          Block date
        </button>
      </div>
    </div>
  )
}

function ManualBooking({ onDone }: { onDone: (msg: string) => void }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', date: '', word: '' })

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const create = async () => {
    const chars = form.word.toUpperCase().replace(/[^A-Z0-9]/g, '').split('')
    const marqueeCount = chars.length
    const subtotal = marqueeCount * MARQUEE_PRICE
    const { error } = await supabase.from('bookings').insert({
      event_date: form.date,
      status: 'confirmed',
      customer_name: form.name,
      customer_phone: form.phone,
      customer_email: form.email || 'phone-booking@sippilights.com',
      word_built: form.word || null,
      items: chars.map((c) => ({
        itemId: `manual-${c}`,
        character: c,
        finish: /[0-9]/.test(c) ? 'white' : 'white',
        qty: 1,
        price: MARQUEE_PRICE,
      })),
      subtotal: marqueeCount > 0 ? subtotal : null,
      deposit_due: marqueeCount > 0 ? calculateDeposit(marqueeCount, subtotal) : null,
      notes: 'Manual entry (phone booking)',
    })
    if (!error) {
      setForm({ name: '', phone: '', email: '', date: '', word: '' })
      onDone(`Booking created for ${form.name}.`)
    }
  }

  const valid = form.name && form.phone && form.date

  return (
    <div className="rounded-card border border-gold/10 bg-charcoal-2 p-4">
      <h3 className="text-xs tracking-[0.15em] text-text-muted uppercase">
        Manual booking (phone customer)
      </h3>
      <div className="mt-3 flex flex-col gap-2">
        <input type="text" placeholder="Name" value={form.name} onChange={set('name')} className={inputClass} />
        <input type="tel" placeholder="Phone" value={form.phone} onChange={set('phone')} className={inputClass} />
        <input type="email" placeholder="Email (optional)" value={form.email} onChange={set('email')} className={inputClass} />
        <input type="date" value={form.date} onChange={set('date')} className={inputClass} />
        <input type="text" placeholder="Word/numbers (e.g. HAPPY 30)" value={form.word} onChange={set('word')} className={inputClass} />
        <button
          type="button"
          onClick={create}
          disabled={!valid}
          className="rounded-button bg-gold px-4 py-2 text-xs font-medium text-charcoal hover:bg-gold-light disabled:opacity-40"
        >
          Create confirmed booking
        </button>
      </div>
    </div>
  )
}

interface InventoryRow {
  id: string
  name: string
  category: string
  finish: string | null
  active: boolean
}

function ItemToggle({ onDone }: { onDone: (msg: string) => void }) {
  const [items, setItems] = useState<InventoryRow[]>([])
  const [selected, setSelected] = useState('')

  useEffect(() => {
    supabase
      .from('inventory_items')
      .select('id, name, category, finish, active')
      .order('category')
      .order('name')
      .then(({ data }) => setItems((data as InventoryRow[]) ?? []))
  }, [])

  const toggle = async () => {
    const item = items.find((i) => i.id === selected)
    if (!item) return
    const { error } = await supabase
      .from('inventory_items')
      .update({ active: !item.active })
      .eq('id', item.id)
    if (!error) {
      setItems((rows) => rows.map((r) => (r.id === item.id ? { ...r, active: !r.active } : r)))
      onDone(`${item.name}${item.finish ? ` (${item.finish})` : ''} marked ${item.active ? 'INACTIVE (repairs)' : 'active'}.`)
    }
  }

  return (
    <div className="rounded-card border border-gold/10 bg-charcoal-2 p-4">
      <h3 className="text-xs tracking-[0.15em] text-text-muted uppercase">
        Mark item in/out of service
      </h3>
      <div className="mt-3 flex flex-col gap-2">
        <select value={selected} onChange={(e) => setSelected(e.target.value)} className={inputClass}>
          <option value="">Select item…</option>
          {items.map((i) => (
            <option key={i.id} value={i.id}>
              {i.category}: {i.name}
              {i.finish ? ` (${i.finish})` : ''} — {i.active ? 'active' : 'INACTIVE'}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={toggle}
          disabled={!selected}
          className="rounded-button bg-gold px-4 py-2 text-xs font-medium text-charcoal hover:bg-gold-light disabled:opacity-40"
        >
          Toggle active
        </button>
      </div>
    </div>
  )
}
