export function ImagePlaceholder({
  label,
  className = '',
}: {
  label?: string
  className?: string
}) {
  return (
    <div
      className={`flex items-center justify-center rounded-card border border-gold/20 bg-charcoal-2 ${className}`}
    >
      <span className="px-4 text-center text-xs tracking-[0.15em] text-text-muted uppercase">
        {label ?? 'Photo coming soon'}
      </span>
    </div>
  )
}
