import { useSEO } from '../lib/seo'
import { WordBuilder } from '../components/WordBuilder'

export default function Builder() {
  useSEO({
    title: 'Build Your Marquee Word | Sippi Lights Jackson MS',
    description:
      'Type your word or number and watch it light up as a custom marquee. Pick your bulb color, choose a finish, and see your price instantly.',
  })

  return (
    <div className="px-6 py-20 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs tracking-[0.2em] text-gold uppercase">
          Word Builder
        </p>
        <h1 className="mt-4 font-headline text-4xl font-light lg:text-5xl">
          Light Up Your Word
        </h1>
        <p className="mt-6 max-w-xl text-text-muted">
          Type a name, a number, or a message up to 20 characters and watch
          it come to life as a glowing marquee. Pick your bulb color and see
          your price update in real time.
        </p>

        <div className="mt-14 rounded-card border border-gold/10 bg-charcoal-2 p-6 lg:p-10">
          <WordBuilder />
        </div>
      </div>
    </div>
  )
}
