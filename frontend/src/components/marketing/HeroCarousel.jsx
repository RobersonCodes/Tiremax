import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const SLIDES = [
  { src: '/assets/hero/hero-1-estoque.jpg', alt: 'Estoque de pneus organizado' },
  { src: '/assets/hero/hero-2-mecanico.jpg', alt: 'Mecânico trocando pneu na oficina' },
  { src: '/assets/hero/hero-3-alinhamento.jpg', alt: 'Equipamento de alinhamento e balanceamento' },
]

const SLIDE_DURATION = 6000

/**
 * Full-bleed background carousel for the hero section. Crossfades
 * between slides with a slow Ken Burns zoom for a cinematic feel.
 * Respects prefers-reduced-motion by disabling the zoom and auto-play.
 */
export function HeroCarousel() {
  const [index, setIndex] = useState(0)
  const [reducedMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    if (reducedMotion) return
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length)
    }, SLIDE_DURATION)
    return () => clearInterval(timer)
  }, [reducedMotion])

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#0c0d0f]">
      <AnimatePresence mode="sync">
        <motion.div
          key={SLIDES[index].src}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0"
        >
          <motion.img
            src={SLIDES[index].src}
            alt={SLIDES[index].alt}
            initial={{ scale: 1 }}
            animate={{ scale: reducedMotion ? 1 : 1.08 }}
            transition={{ duration: SLIDE_DURATION / 1000, ease: 'linear' }}
            className="h-full w-full object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Dark grade for text legibility — deliberately heavier than a
          pure decorative overlay since real body copy sits on top */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0c0d0f]/90 via-[#0c0d0f]/80 to-[#0c0d0f]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0c0d0f]/70 via-transparent to-[#0c0d0f]/40" />

      {/* Slide indicators */}
      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.src}
            onClick={() => setIndex(i)}
            aria-label={`Ver slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === index ? 'w-6 bg-brand-500' : 'w-1.5 bg-white/25 hover:bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
