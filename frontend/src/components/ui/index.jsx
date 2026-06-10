import { motion } from 'framer-motion'
import { Loader2, AlertCircle, Package } from 'lucide-react'

export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 16, md: 24, lg: 32 }
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 size={sizes[size]} className="animate-spin text-yellow-400" />
    </div>
  )
}

export function Skeleton({ className = '' }) {
  return <div className={`skeleton h-4 ${className}`} />
}

export function Card({ children, className = '' }) {
  return <div className={`bg-[#131313] border border-white/[0.07] rounded-xl p-5 ${className}`}>{children}</div>
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-display font-black text-white uppercase">{title}</h1>
        {subtitle && <p className="text-sm text-white/40 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center mb-4">
        {Icon && <Icon size={28} className="text-yellow-400/40" />}
      </div>
      <h3 className="text-base font-bold font-display uppercase text-white/50 mb-1">{title}</h3>
      <p className="text-sm text-white/25 max-w-xs mb-4">{description}</p>
      {action}
    </div>
  )
}

export function StatusBadge({ status }) {
  const config = {
    COMPLETED: { label: 'Concluído', cls: 'bg-green-500/10 text-green-400 border-green-500/25' },
    PENDING:   { label: 'Pendente', cls: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/25' },
    CANCELLED: { label: 'Cancelado', cls: 'bg-red-500/10 text-red-400 border-red-500/25' },
    REFUNDED:  { label: 'Reembolsado', cls: 'bg-white/5 text-white/40 border-white/10' },
    OPEN:         { label: 'Aberto', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/25' },
    IN_PROGRESS:  { label: 'Em Andamento', cls: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/25' },
    WAITING_PARTS:{ label: 'Aguardando', cls: 'bg-orange-500/10 text-orange-400 border-orange-500/25' },
    PAID:    { label: 'Pago', cls: 'bg-green-500/10 text-green-400 border-green-500/25' },
    OVERDUE: { label: 'Vencido', cls: 'bg-red-500/10 text-red-400 border-red-500/25' },
    DRAFT:   { label: 'Rascunho', cls: 'bg-white/5 text-white/40 border-white/10' },
    ISSUED:  { label: 'Emitida', cls: 'bg-green-500/10 text-green-400 border-green-500/25' },
    ERROR:   { label: 'Erro', cls: 'bg-red-500/10 text-red-400 border-red-500/25' },
  }
  const c = config[status] || { label: status, cls: 'bg-white/5 text-white/40 border-white/10' }
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${c.cls}`}>{c.label}</span>
}

export function MetricCard({ title, value, subtitle, icon: Icon, color = 'yellow', loading }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="bg-[#131313] border border-white/[0.07] hover:border-yellow-400/20 rounded-xl p-5 transition-all cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <p className="text-[11px] font-semibold text-white/35 uppercase tracking-wide">{title}</p>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
            <Icon size={15} className="text-yellow-400" />
          </div>
        )}
      </div>
      {loading ? <Skeleton className="h-8 w-28 mb-1" /> : (
        <p className="font-display font-black text-2xl text-white mb-0.5">{value}</p>
      )}
      {subtitle && <p className="text-xs text-white/30">{subtitle}</p>}
    </motion.div>
  )
}

export function ErrorAlert({ message }) {
  return (
    <div className="flex items-center gap-2.5 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
      <AlertCircle size={16} />
      {message}
    </div>
  )
}

export function Table({ children, className = '' }) {
  return <div className={`overflow-x-auto ${className}`}><table className="w-full">{children}</table></div>
}

export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className={`relative w-full ${sizes[size]} bg-[#131313] border border-white/10 border-t-2 border-t-yellow-400 rounded-2xl z-10 overflow-hidden`}>
        {title && (
          <div className="flex items-center justify-between p-5 border-b border-white/[0.05]">
            <h2 className="font-display font-black text-white uppercase">{title}</h2>
            <button onClick={onClose} className="text-white/40 hover:text-white/70 transition-colors">✕</button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </motion.div>
    </div>
  )
}

export function FormGroup({ label, error, children, required }) {
  return (
    <div>
      {label && <label className="label">{label} {required && <span className="text-red-400">*</span>}</label>}
      {children}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}

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
