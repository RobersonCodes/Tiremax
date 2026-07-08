import { forwardRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, AlertCircle, X } from 'lucide-react'

const EASE = [0.16, 1, 0.3, 1]

// ── Button ──────────────────────────────────────────────────────────
// New: existing pages still use the raw .btn-yellow/.btn-dark/etc CSS
// classes (13 files, untouched). This component exists for pages that
// get rebuilt in later phases — same visual language, less repetition,
// built-in loading state so nobody hand-rolls a spinner-in-a-button again.
const BUTTON_VARIANTS = {
  primary: 'btn-yellow',
  secondary: 'btn-dark',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
}
const BUTTON_SIZES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading = false, icon: Icon, children, className = '', disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 size={size === 'sm' ? 13 : 15} className="animate-spin" />
      ) : (
        Icon && <Icon size={size === 'sm' ? 13 : 15} />
      )}
      {children}
    </button>
  )
})

// ── Input ───────────────────────────────────────────────────────────
export const Input = forwardRef(function Input(
  { icon: Icon, error, className = '', ...props },
  ref,
) {
  return (
    <div className="relative">
      {Icon && (
        <Icon size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
      )}
      <input
        ref={ref}
        className={`input-field ${Icon ? 'pl-10' : ''} ${error ? 'border-red-500/40 focus:ring-red-500/30' : ''} ${className}`}
        {...props}
      />
    </div>
  )
})

// ── Tooltip ─────────────────────────────────────────────────────────
// New: didn't exist before. Simple hover-triggered, no external deps.
export function Tooltip({ label, children, side = 'top' }) {
  const [open, setOpen] = useState(false)
  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      <AnimatePresence>
        {open && (
          <motion.span
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.15 }}
            className={`pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-[#191b1f] border border-white/10 px-2.5 py-1.5 text-xs text-white/80 shadow-card ${positions[side]}`}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}

// ── Spinner / Skeleton ─────────────────────────────────────────────
export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 16, md: 24, lg: 32 }
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 size={sizes[size]} className="animate-spin text-brand-500" />
    </div>
  )
}

export function Skeleton({ className = '' }) {
  return <div className={`skeleton h-4 ${className}`} />
}

// ── Card ────────────────────────────────────────────────────────────
export function Card({ children, className = '' }) {
  return <div className={`card p-5 ${className}`}>{children}</div>
}

// ── PageHeader ──────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, actions }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
    >
      <div>
        <h1 className="text-2xl font-display font-bold text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-white/40 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </motion.div>
  )
}

// ── EmptyState ──────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/15 flex items-center justify-center mb-4">
        {Icon && <Icon size={26} className="text-brand-500/50" strokeWidth={1.5} />}
      </div>
      <h3 className="text-base font-semibold font-display text-white/55 mb-1">{title}</h3>
      <p className="text-sm text-white/25 max-w-xs mb-4">{description}</p>
      {action}
    </motion.div>
  )
}

// ── StatusBadge ─────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const config = {
    COMPLETED: { label: 'Concluído', cls: 'bg-green-500/10 text-green-400 border-green-500/20' },
    PENDING:   { label: 'Pendente', cls: 'bg-brand-500/10 text-brand-400 border-brand-500/20' },
    CANCELLED: { label: 'Cancelado', cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
    REFUNDED:  { label: 'Reembolsado', cls: 'bg-white/5 text-white/40 border-white/10' },
    OPEN:         { label: 'Aberto', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    IN_PROGRESS:  { label: 'Em Andamento', cls: 'bg-brand-500/10 text-brand-400 border-brand-500/20' },
    WAITING_PARTS:{ label: 'Aguardando', cls: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
    PAID:    { label: 'Pago', cls: 'bg-green-500/10 text-green-400 border-green-500/20' },
    OVERDUE: { label: 'Vencido', cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
    DRAFT:   { label: 'Rascunho', cls: 'bg-white/5 text-white/40 border-white/10' },
    ISSUED:  { label: 'Emitida', cls: 'bg-green-500/10 text-green-400 border-green-500/20' },
    ERROR:   { label: 'Erro', cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
    IN:         { label: 'Entrada', cls: 'bg-green-500/10 text-green-400 border-green-500/20' },
    OUT:        { label: 'Saída', cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
    ADJUSTMENT: { label: 'Ajuste', cls: 'bg-accent-amber/10 text-accent-amber border-accent-amber/20' },
  }
  const c = config[status] || { label: status, cls: 'bg-white/5 text-white/40 border-white/10' }
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${c.cls}`}>{c.label}</span>
}

// ── MetricCard ──────────────────────────────────────────────────────
export function MetricCard({ title, value, subtitle, icon: Icon, loading }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
      whileHover={{ y: -2 }}
      className="card-hover p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-[11px] font-semibold text-white/35 uppercase tracking-wide">{title}</p>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/15 flex items-center justify-center">
            <Icon size={15} className="text-brand-500" />
          </div>
        )}
      </div>
      {loading ? <Skeleton className="h-8 w-28 mb-1" /> : (
        <p className="font-display font-bold text-2xl text-white mb-0.5 tracking-tight">{value}</p>
      )}
      {subtitle && <p className="text-xs text-white/30">{subtitle}</p>}
    </motion.div>
  )
}

// ── ErrorAlert ──────────────────────────────────────────────────────
export function ErrorAlert({ message }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2.5 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400"
    >
      <AlertCircle size={16} className="shrink-0" />
      {message}
    </motion.div>
  )
}

// ── Table ───────────────────────────────────────────────────────────
export function Table({ children, className = '' }) {
  return <div className={`overflow-x-auto ${className}`}><table className="w-full">{children}</table></div>
}

// ── Modal ───────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }) {
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.25, ease: EASE }}
            className={`relative w-full ${sizes[size]} bg-[#131417] border border-white/10 border-t-2 border-t-brand-500 rounded-2xl z-10 overflow-hidden shadow-card`}
          >
            {title && (
              <div className="flex items-center justify-between p-5 border-b border-white/[0.05]">
                <h2 className="font-display font-semibold text-white tracking-tight">{title}</h2>
                <button onClick={onClose} className="text-white/40 hover:text-white/70 transition-colors">
                  <X size={18} />
                </button>
              </div>
            )}
            <div className="p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// ── FormGroup ───────────────────────────────────────────────────────
export function FormGroup({ label, error, children, required }) {
  return (
    <div>
      {label && <label className="label">{label} {required && <span className="text-red-400">*</span>}</label>}
      {children}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}

// ── Pagination ──────────────────────────────────────────────────────
export function Pagination({ page, total, limit, onPage }) {
  const totalPages = Math.ceil(total / limit)
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between pt-4 border-t border-white/[0.05]">
      <p className="text-xs text-white/25">{(page-1)*limit+1}–{Math.min(page*limit,total)} de {total}</p>
      <div className="flex gap-1">
        <button onClick={() => onPage(page-1)} disabled={page<=1}
          className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-30">←</button>
        <span className="px-3 py-1.5 text-sm text-white/40">{page}/{totalPages}</span>
        <button onClick={() => onPage(page+1)} disabled={page>=totalPages}
          className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-30">→</button>
      </div>
    </div>
  )
}
