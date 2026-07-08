import { motion } from 'framer-motion'
import { TrendingUp, Package, Wrench } from 'lucide-react'

/**
 * An illustrative, abstract representation of the product — NOT a
 * screenshot. Deliberately stylized (floating glass cards, generic
 * bars) so it never claims to be real UI or real data, avoiding the
 * "fake screenshot" trap the old marketing site fell into.
 */
export function ProductVisual() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      {/* Glow behind the whole panel */}
      <div className="absolute inset-0 -z-10 blur-3xl" style={{
        background: 'radial-gradient(circle, rgba(245,200,0,0.25) 0%, transparent 70%)',
      }} />

      {/* Main glass panel */}
      <motion.div
        initial={{ opacity: 0, y: 30, rotateX: 8 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        style={{ transformPerspective: 1000 }}
        className="card relative overflow-hidden p-6"
      >
        <div className="mb-5 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-white/35">
            Faturamento — hoje
          </span>
          <TrendingUp size={16} className="text-yellow-400" />
        </div>

        <div className="mb-6 flex items-end gap-1.5">
          {[38, 55, 42, 68, 50, 74, 90].map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ duration: 0.7, delay: 0.5 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="w-full rounded-t-sm bg-gradient-to-t from-yellow-500/40 to-yellow-400"
              style={{ height: `${h}px` }}
            />
          ))}
        </div>

        <div className="flex items-center gap-3 border-t border-white/[0.06] pt-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-400/10">
            <Package size={16} className="text-yellow-400" />
          </div>
          <div className="flex-1">
            <div className="h-2 w-3/4 rounded-full bg-white/10" />
            <div className="mt-1.5 h-2 w-1/2 rounded-full bg-white/[0.06]" />
          </div>
          <span className="badge-warning">+12</span>
        </div>
      </motion.div>

      {/* Floating secondary card */}
      <motion.div
        initial={{ opacity: 0, x: 30, y: 20 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.8 }}
        className="card absolute -right-6 -bottom-8 w-48 p-4 shadow-2xl sm:-right-10"
      >
        <div className="mb-2 flex items-center gap-2">
          <Wrench size={13} className="text-yellow-400" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
            OS #1042
          </span>
        </div>
        <p className="text-xs text-white/55">Troca de pneus — em andamento</p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '70%' }}
            transition={{ duration: 1, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="h-full rounded-full bg-yellow-400"
          />
        </div>
      </motion.div>
    </div>
  )
}
