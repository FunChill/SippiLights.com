import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

interface ButtonProps {
  to: string
  children: ReactNode
  variant?: 'solid' | 'ghost'
  className?: string
  onClick?: () => void
}

export function Button({
  to,
  children,
  variant = 'solid',
  className = '',
  onClick,
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-button px-7 py-3 text-sm font-medium tracking-wide transition-colors duration-200'

  const styles =
    variant === 'solid'
      ? 'bg-gold text-charcoal hover:bg-gold-light'
      : 'border border-gold text-gold hover:bg-gold hover:text-charcoal'

  return (
    <Link to={to} onClick={onClick} className={`${base} ${styles} ${className}`}>
      {children}
    </Link>
  )
}
