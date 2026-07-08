import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

/**
 * Ring cursor that trails the pointer and expands over interactive
 * elements. Scoped to the marketing pages only (mounted inside
 * LandingPage), so it never affects the actual ERP app UX.
 */
export function CustomCursor() {
  const [isFinePointer] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches,
  )
  const [hovering, setHovering] = useState(false)
  const [visible, setVisible] = useState(false)

  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const springX = useSpring(x, { stiffness: 500, damping: 40, mass: 0.4 })
  const springY = useSpring(y, { stiffness: 500, damping: 40, mass: 0.4 })

  useEffect(() => {
    if (!isFinePointer) return

    const handleMove = (e) => {
      x.set(e.clientX - 14)
      y.set(e.clientY - 14)
      if (!visible) setVisible(true)
    }
    const handleOver = (e) => {
      setHovering(Boolean(e.target.closest('a, button, [data-cursor-hover]')))
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseover', handleOver)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseover', handleOver)
    }
  }, [isFinePointer, visible, x, y])

  if (!isFinePointer) return null

  return (
    <motion.div
      className="pointer-events-none fixed left-0 top-0 z-[90] hidden h-7 w-7 rounded-full border border-yellow-400 mix-blend-difference md:block"
      style={{ x: springX, y: springY, opacity: visible ? 1 : 0 }}
      animate={{ scale: hovering ? 1.8 : 1 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      aria-hidden="true"
    />
  )
}
