import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Wrench, Car, User, Clock, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import api from '../../services/api'
import { StatusBadge, Skeleton } from '../../components/ui/index'
import { formatCurrency, formatDate, formatDateTime } from '../../utils/format'
import toast from 'react-hot-toast'

const STATUS_TRANSITIONS = {
  OPEN: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['WAITING_PARTS', 'COMPLETED', 'CANCELLED'],
  WAITING_PARTS: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
}

const STATUS_LABELS = {
  IN_PROGRESS: 'Iniciar',
  WAITING_PARTS: 'Aguardando Peças',
  COMPLETED: 'Concluir',
  CANCELLED: 'Cancelar',
}

export default function ServiceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [service, setService] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const load = () => {
    api.get(`/services/${id}`).then(r => setService(r.data)).catch(() => toast.error('OS não encontrada')).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  const updateStatus = async (status) => {
    setUpdating(true)
    try {
      await api.patch(`/services/${id}/status`, { status })
      toast.success('Status atualizado!')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro')
    } finally { setUpdating(false) }
  }

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 rounded-2xl" /></div>
  if (!service) return <div className="text-center py-20 text-white/40">OS não encontrada</div>

  const transitions = STATUS_TRANSITIONS[service.status] || []

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="btn-ghost flex items-center gap-2 text-sm"><ArrowLeft size={16} /> Voltar</button>
        <div className="flex gap-2">
          {transitions.map(s => (
            <button key={s} onClick={() => updateStatus(s)} disabled={updating}
              className={`text-sm flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium transition-all disabled:opacity-40 ${
                s === 'COMPLETED' ? 'bg-accent-green/10 text-accent-green border border-accent-green/20 hover:bg-accent-green/20' :
                s === 'CANCELLED' ? 'bg-accent-red/10 text-accent-red border border-accent-red/20 hover:bg-accent-red/20' :
                'btn-secondary'
              }`}>
              {s === 'COMPLETED' && <CheckCircle size={14} />}
              {STATUS_LABELS[s] || s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-brand-400 font-mono font-medium mb-1">OS #{service.number}</p>
                <h1 className="text-xl font-display font-bold text-white">{service.type}</h1>
                <p className="text-sm text-white/40 mt-0.5">{formatDateTime(service.createdAt)}</p>
              </div>
              <StatusBadge status={service.status} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <User size={15} className="text-white/30 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-white/35">Cliente</p>
                  <Link to={`/clients/${service.client?.id}`} className="text-sm text-brand-300 hover:underline">
                    {service.client?.name}
                  </Link>
                  <p className="text-xs text-white/30">{service.client?.phone}</p>
                </div>
              </div>
              {service.vehicle && (
                <div className="flex items-start gap-2">
                  <Car size={15} className="text-white/30 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-white/35">Veículo</p>
                    <p className="text-sm text-white">{service.vehicle.brand} {service.vehicle.model} {service.vehicle.year}</p>
                    <p className="text-xs text-white/40 font-mono">{service.vehicle.plate} · {service.vehicle.color}</p>
                  </div>
                </div>
              )}
              {service.assignedTo && (
                <div className="flex items-start gap-2">
                  <Wrench size={15} className="text-white/30 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-white/35">Responsável</p>
                    <p className="text-sm text-white">{service.assignedTo.name}</p>
                  </div>
                </div>
              )}
              {service.completedAt && (
                <div className="flex items-start gap-2">
                  <Clock size={15} className="text-white/30 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-white/35">Concluído em</p>
                    <p className="text-sm text-white">{formatDateTime(service.completedAt)}</p>
                  </div>
                </div>
              )}
            </div>

            {service.description && (
              <div className="mt-4 pt-4 border-t border-white/[0.05]">
                <p className="text-xs text-white/35 mb-1">Descrição</p>
                <p className="text-sm text-white/70">{service.description}</p>
              </div>
            )}
          </motion.div>

          {/* Items */}
          {service.items?.length > 0 && (
            <div className="glass-card overflow-hidden">
              <div className="p-4 border-b border-white/[0.05]">
                <h2 className="font-display font-semibold text-white">Peças e Materiais</h2>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.05]">
                    <th className="table-header text-left">Item</th>
                    <th className="table-header text-center">Qtd</th>
                    <th className="table-header text-right">Unit.</th>
                    <th className="table-header text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {service.items.map(item => (
                    <tr key={item.id} className="table-row">
                      <td className="table-cell text-sm text-white/80">{item.description}</td>
                      <td className="table-cell text-center text-white/60">{item.quantity}</td>
                      <td className="table-cell text-right text-white/60">{formatCurrency(item.unitPrice)}</td>
                      <td className="table-cell text-right font-semibold text-white">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="space-y-4">
          <div className="glass-card p-5">
            <h2 className="font-display font-semibold text-white mb-4">Resumo Financeiro</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-white/60">
                <span>Mão de obra</span><span>{formatCurrency(service.laborCost)}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Peças</span><span>{formatCurrency(service.partsCost)}</span>
              </div>
              <div className="border-t border-white/[0.05] pt-2 flex justify-between font-bold text-lg text-white">
                <span>Total</span>
                <span className="text-accent-green">{formatCurrency(service.total)}</span>
              </div>
            </div>
          </div>
          {service.notes && (
            <div className="glass-card p-4">
              <p className="text-xs text-white/35 mb-1">Observações</p>
              <p className="text-sm text-white/70">{service.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
