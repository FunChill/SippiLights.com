import { Link } from 'react-router-dom'
import { NAV_LINKS, SITE } from '../lib/site'

export function Footer() {
  return (
    <footer className="border-t border-gold/15 bg-charcoal-2">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-12 lg:flex-row lg:items-start lg:justify-between lg:px-10">
        <div className="max-w-sm">
          <p className="font-headline text-2xl text-gold">{SITE.name}</p>
          <p className="mt-2 text-sm text-text-muted">{SITE.tagline}</p>
          <p className="mt-4 text-sm text-text-muted">
            {SITE.city} · {SITE.phone}
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm text-warm-white/80 transition-colors duration-200 hover:text-gold"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex gap-4 text-sm text-warm-white/80">
          <a
            href={SITE.facebook}
            target="_blank"
            rel="noreferrer"
            className="transition-colors duration-200 hover:text-gold"
          >
            Facebook
          </a>
          <a
            href={SITE.instagram}
            target="_blank"
            rel="noreferrer"
            className="transition-colors duration-200 hover:text-gold"
          >
            Instagram
          </a>
        </div>
      </div>

      <div className="border-t border-gold/10 px-6 py-6 text-center text-xs text-text-muted lg:px-10">
        &copy; 2025 {SITE.name} · {SITE.tagline} · {SITE.city}
      </div>
    </footer>
  )
}
