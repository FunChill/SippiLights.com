import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useBuilder } from './BuilderContext'
import { clearDraft, isReturningFromCancelledCheckout, loadDraft } from '../lib/checkoutDraft'

export interface AddOns {
  ledUplighting: boolean
  stage: boolean
  arch3d: boolean
}

export type IndoorOutdoor = 'indoor' | 'outdoor' | ''

interface CheckoutContextValue {
  step: number
  setStep: (step: number) => void
  eventDate: string
  setEventDate: (date: string) => void
  addOns: AddOns
  toggleAddOn: (key: keyof AddOns) => void
  indoorOutdoor: IndoorOutdoor
  setIndoorOutdoor: (v: IndoorOutdoor) => void
  weatherAck: boolean
  setWeatherAck: (v: boolean) => void
  venueAddress: string
  setVenueAddress: (v: string) => void
  zip: string
  setZip: (v: string) => void
  name: string
  setName: (v: string) => void
  phone: string
  setPhone: (v: string) => void
  email: string
  setEmail: (v: string) => void
  eventType: string
  setEventType: (v: string) => void
}

const CheckoutContext = createContext<CheckoutContextValue | null>(null)

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const builder = useBuilder()
  const returningFromCancel = isReturningFromCancelledCheckout()
  const draft = returningFromCancel ? loadDraft() : null

  const [step, setStep] = useState(draft ? 5 : 1)
  const [eventDate, setEventDateState] = useState(draft?.eventDate ?? builder.eventDate)
  const [addOns, setAddOns] = useState<AddOns>(
    draft?.addOns ?? { ledUplighting: false, stage: false, arch3d: false },
  )
  const [indoorOutdoor, setIndoorOutdoor] = useState<IndoorOutdoor>(draft?.indoorOutdoor ?? '')
  const [weatherAck, setWeatherAck] = useState(draft?.weatherAck ?? false)
  const [venueAddress, setVenueAddress] = useState(draft?.venueAddress ?? '')
  const [zip, setZip] = useState(draft?.zip ?? '')
  const [name, setName] = useState(draft?.name ?? '')
  const [phone, setPhone] = useState(draft?.phone ?? '')
  const [email, setEmail] = useState(draft?.email ?? '')
  const [eventType, setEventType] = useState(draft?.eventType ?? '')

  useEffect(() => {
    if (!returningFromCancel) return
    clearDraft()
    const url = new URL(window.location.href)
    url.searchParams.delete('cancelled')
    window.history.replaceState({}, '', url.toString())
    // Only ever consume the draft once, right after mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setEventDate = (date: string) => {
    setEventDateState(date)
    builder.setEventDate(date)
  }

  const toggleAddOn = (key: keyof AddOns) => {
    setAddOns((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <CheckoutContext.Provider
      value={{
        step,
        setStep,
        eventDate,
        setEventDate,
        addOns,
        toggleAddOn,
        indoorOutdoor,
        setIndoorOutdoor,
        weatherAck,
        setWeatherAck,
        venueAddress,
        setVenueAddress,
        zip,
        setZip,
        name,
        setName,
        phone,
        setPhone,
        email,
        setEmail,
        eventType,
        setEventType,
      }}
    >
      {children}
    </CheckoutContext.Provider>
  )
}

export function useCheckout() {
  const ctx = useContext(CheckoutContext)
  if (!ctx) throw new Error('useCheckout must be used within a CheckoutProvider')
  return ctx
}
