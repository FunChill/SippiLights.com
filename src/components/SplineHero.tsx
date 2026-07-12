import { ImagePlaceholder } from './ImagePlaceholder'

// Set to the Spline scene URL when the scene is designed (post-Phase 6).
// The Spline runtime dependency is NOT installed yet — approval comes with
// the scene. Until then (and for reduced-motion users) the static hero
// image slot renders.
const SPLINE_SCENE_URL: string | null = null

export function SplineHero({ className = '' }: { className?: string }) {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (!SPLINE_SCENE_URL || prefersReducedMotion) {
    return (
      <ImagePlaceholder
        label="Sippi Lights marquee photo"
        className={`relative ${className}`}
      />
    )
  }

  // Placeholder mount point: when the scene URL lands, this iframe embed can
  // be swapped for @splinetool/react-spline after dependency approval.
  return (
    <iframe
      src={SPLINE_SCENE_URL}
      title="Sippi Lights 3D marquee scene"
      className={`w-full border-0 ${className}`}
      loading="lazy"
    />
  )
}
