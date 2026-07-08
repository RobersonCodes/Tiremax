import { motion, useScroll, useSpring } from 'framer-motion'

export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 40, restDelta: 0.001 })

  return (
    <motion.div
      className="fixed left-0 top-0 z-[70] h-[2px] w-full origin-left bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-200"
      style={{ scaleX }}
      aria-hidden="true"
    />
  )
}
