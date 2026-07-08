import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { NAV_LINKS } from '../lib/site'
import { Button } from './Button'

export function Nav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="border-b border-gold/15 bg-charcoal/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <Link
            to="/"
            className="font-headline text-2xl text-gold"
            onClick={() => setOpen(false)}
          >
            Sippi Lights
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `text-sm tracking-wide transition-colors duration-200 ${
                    isActive ? 'text-gold' : 'text-warm-white/80 hover:text-gold'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden lg:block">
            <Button to="/book">Check Availability</Button>
          </div>

          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 lg:hidden"
          >
            <span
              className={`h-px w-6 bg-gold transition-transform duration-200 ${open ? 'translate-y-[7px] rotate-45' : ''}`}
            />
            <span
              className={`h-px w-6 bg-gold transition-opacity duration-200 ${open ? 'opacity-0' : 'opacity-100'}`}
            />
            <span
              className={`h-px w-6 bg-gold transition-transform duration-200 ${open ? '-translate-y-[7px] -rotate-45' : ''}`}
            />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-[65px] bottom-0 flex flex-col items-center gap-8 overflow-y-auto bg-charcoal px-6 py-12 lg:hidden"
          >
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `font-headline text-2xl ${isActive ? 'text-gold' : 'text-warm-white'}`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <Button to="/book" className="mt-4" onClick={() => setOpen(false)}>
              Check Availability
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
