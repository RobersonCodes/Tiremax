import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, ShoppingCart, ChevronRight, Search } from 'lucide-react'
import api from '../../services/api'
import { PageHeader, StatusBadge, Pagination, Skeleton, EmptyState } from '../../components/ui/index'
import { formatCurrency, formatDateTime } from '../../utils/format'

export default function SalesPage() {
  const navigate = useNavigate()
  const [sales, setSales] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const limit = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit })
      if (statusFilter) params.set('status', statusFilter)
      const { data } = await api.get(`/sales?${params}`)
      setSales(data.data)
      setTotal(data.total)
    } finally { setLoading(false) }
  }, [page, statusFilter])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Vendas"
        subtitle={`${total} vendas registradas`}
        actions={
          <Link to="/sales/new" className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} /> Nova Venda (PDV)
          </Link>
        }
      />

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap gap-2">
        {['', 'COMPLETED', 'PENDING', 'CANCELLED'].map(s => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1) }}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
              statusFilter === s ? 'bg-brand-600 text-white' : 'bg-surface-600/50 text-white/40 hover:text-white/70'
            }`}
          >
            {s === '' ? 'Todas' : s === 'COMPLETED' ? 'Concluídas' : s === 'PENDING' ? 'Pendentes' : 'Canceladas'}
          </button>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.05]">
              <th className="table-header text-left">#</th>
              <th className="table-header text-left">Cliente</th>
              <th className="table-header text-left hidden md:table-cell">Vendedor</th>
              <th className="table-header text-left hidden lg:table-cell">Pagamento</th>
              <th className="table-header text-left hidden sm:table-cell">Data</th>
              <th className="table-header text-right">Total</th>
              <th className="table-header text-center">Status</th>
              <th className="table-header"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? Array(8).fill(0).map((_, i) => (
              <tr key={i} className="border-b border-white/[0.05]">
                {Array(8).fill(0).map((_, j) => (
                  <td key={j} className="table-cell"><Skeleton className="h-4" /></td>
                ))}
              </tr>
            )) : sales.length === 0 ? (
              <tr><td colSpan={8} className="py-16">
                <EmptyState icon={ShoppingCart} title="Nenhuma venda encontrada" description="As vendas aparecerão aqui após serem registradas no PDV"
                  action={<Link to="/sales/new" className="btn-primary text-sm flex items-center gap-2 mx-auto"><Plus size={14} /> Nova Venda</Link>} />
              </td></tr>
            ) : sales.map((sale, i) => (
              <motion.tr key={sale.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                className="table-row cursor-pointer" onClick={() => navigate(`/sales/${sale.id}`)}>
                <td className="table-cell"><span className="font-mono text-brand-400 text-sm">#{sale.number}</span></td>
                <td className="table-cell text-white/80 text-sm">{sale.client?.name || '— Avulso'}</td>
                <td className="table-cell hidden md:table-cell text-white/50 text-sm">{sale.user?.name}</td>
                <td className="table-cell hidden lg:table-cell">
                  <span className="text-xs text-white/40">{
                    { CASH: 'Dinheiro', CREDIT_CARD: 'Crédito', DEBIT_CARD: 'Débito', PIX: 'PIX', BANK_TRANSFER: 'Transferência' }[sale.paymentMethod] || sale.paymentMethod
                  }</span>
                </td>
                <td className="table-cell hidden sm:table-cell text-white/40 text-xs">{formatDateTime(sale.createdAt)}</td>
                <td className="table-cell text-right font-semibold text-white">{formatCurrency(sale.total)}</td>
                <td className="table-cell text-center"><StatusBadge status={sale.status} /></td>
                <td className="table-cell"><ChevronRight size={15} className="text-white/20 ml-auto" /></td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {!loading && (
          <div className="p-4"><Pagination page={page} total={total} limit={limit} onPage={setPage} /></div>
        )}
      </div>
    </div>
  )
}
