import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { DEFAULT_COLOR, MARQUEE_COLORS } from '../lib/marqueeColors'
import type { MarqueeColor } from '../lib/marqueeColors'
import type { Finish } from '../data/inventory'

const MAX_LENGTH = 20

interface BuilderContextValue {
  word: string
  setWord: (word: string) => void
  color: MarqueeColor
  setColorId: (id: string) => void
  numberFinish: Finish
  setNumberFinish: (finish: Finish) => void
  eventDate: string
  setEventDate: (date: string) => void
  maxLength: number
}

const BuilderContext = createContext<BuilderContextValue | null>(null)

export function BuilderProvider({ children }: { children: ReactNode }) {
  const [word, setWordState] = useState('')
  const [color, setColor] = useState<MarqueeColor>(DEFAULT_COLOR)
  const [numberFinish, setNumberFinish] = useState<Finish>('white')
  const [eventDate, setEventDate] = useState('')

  const setWord = (value: string) => setWordState(value.slice(0, MAX_LENGTH))

  const setColorId = (id: string) => {
    const next = MARQUEE_COLORS.find((c) => c.id === id)
    if (next) setColor(next)
  }

  return (
    <BuilderContext.Provider
      value={{
        word,
        setWord,
        color,
        setColorId,
        numberFinish,
        setNumberFinish,
        eventDate,
        setEventDate,
        maxLength: MAX_LENGTH,
      }}
    >
      {children}
    </BuilderContext.Provider>
  )
}

export function useBuilder() {
  const ctx = useContext(BuilderContext)
  if (!ctx) throw new Error('useBuilder must be used within a BuilderProvider')
  return ctx
}
