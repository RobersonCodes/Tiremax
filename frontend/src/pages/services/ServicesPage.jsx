import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Wrench, Car } from 'lucide-react'
import api from '../../services/api'
import { PageHeader, StatusBadge, Pagination, Skeleton, EmptyState, Button } from '../../components/ui/index'
import { formatCurrency, formatDate } from '../../utils/format'

const STATUS_FILTERS = [
  { value: '', label: 'Todas' },
  { value: 'OPEN', label: 'Abertas' },
  { value: 'IN_PROGRESS', label: 'Em Andamento' },
  { value: 'WAITING_PARTS', label: 'Aguardando' },
  { value: 'COMPLETED', label: 'Concluídas' },
  { value: 'CANCELLED', label: 'Canceladas' },
]

export default function ServicesPage() {
  const navigate = useNavigate()
  const [services, setServices] = useState([])
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
      const { data } = await api.get(`/services?${params}`)
      setServices(data.data)
      setTotal(data.total)
    } finally { setLoading(false) }
  }, [page, statusFilter])

  useEffect(() => { load() }, [load])

  const statusColor = (s) => ({
    OPEN: 'border-l-accent-blue',
    IN_PROGRESS: 'border-l-brand-500',
    WAITING_PARTS: 'border-l-accent-orange',
    COMPLETED: 'border-l-accent-green',
    CANCELLED: 'border-l-accent-red',
  }[s] || 'border-l-white/10')

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Ordens de Serviço"
        subtitle={`${total} ordens registradas`}
        actions={
          <Link to="/services/new">
            <Button icon={Plus}>Nova OS</Button>
          </Link>
        }
      />

      {/* Status filters */}
      <div className="card p-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => { setStatusFilter(f.value); setPage(1) }}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ease-out-expo ${
              statusFilter === f.value ? 'bg-brand-500 text-[#08090a] font-semibold' : 'bg-surface-700 text-white/40 hover:text-white/70'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Services grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
        </div>
      ) : services.length === 0 ? (
        <div className="card py-16">
          <EmptyState icon={Wrench} title="Nenhuma ordem encontrada" description="Crie ordens de serviço para seus clientes"
            action={<Link to="/services/new"><Button size="sm" icon={Plus}>Nova OS</Button></Link>} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {services.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className={`card-hover p-4 border-l-2 ${statusColor(s.status)}`}
              onClick={() => navigate(`/services/${s.id}`)}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-brand-400 font-mono font-medium">OS #{s.number}</p>
                  <h3 className="text-sm font-semibold text-white mt-0.5">{s.type}</h3>
                </div>
                <StatusBadge status={s.status} />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <span className="truncate">{s.client?.name}</span>
                </div>
                {s.vehicle && (
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <Car size={12} />
                    <span>{s.vehicle.brand} {s.vehicle.model} · {s.vehicle.plate}</span>
                  </div>
                )}
                {s.assignedTo && (
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <Wrench size={12} />
                    <span>{s.assignedTo.name}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.05]">
                <span className="text-xs text-white/30">{formatDate(s.createdAt)}</span>
                <span className="text-sm font-semibold text-accent-green">{formatCurrency(s.total)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      {!loading && total > limit && (
        <div className="card p-4">
          <Pagination page={page} total={total} limit={limit} onPage={setPage} />
        </div>
      )}
    </div>
  )
}
