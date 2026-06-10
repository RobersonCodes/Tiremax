import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Phone, MessageCircle, Mail, MapPin, Car, ShoppingCart, Wrench, Edit2, Trash2, Plus } from 'lucide-react'
import api from '../../services/api'
import { StatusBadge, Skeleton } from '../../components/ui/index'
import { formatCurrency, formatDate, formatDocument, formatPhone } from '../../utils/format'
import toast from 'react-hot-toast'

export default function ClientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [history, setHistory] = useState({ sales: [], services: [] })
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    const load = async () => {
      try {
        const [c, h] = await Promise.all([
          api.get(`/clients/${id}`),
          api.get(`/clients/${id}/history`),
        ])
        setClient(c.data)
        setHistory(h.data)
      } catch { toast.error('Erro ao carregar cliente') }
      finally { setLoading(false) }
    }
    load()
  }, [id])

  if (loading) return (
    <div className="space-y-4 animate-fade-in">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  )

  if (!client) return <div className="text-white/40 text-center py-20">Cliente não encontrado</div>

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="btn-ghost flex items-center gap-2 text-sm">
          <ArrowLeft size={16} /> Voltar
        </button>
        <div className="flex gap-2">
          <button className="btn-secondary flex items-center gap-2 text-sm">
            <Edit2 size={15} /> Editar
          </button>
        </div>
      </div>

      {/* Client header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-600/25 flex items-center justify-center shrink-0">
            <span className="font-display font-bold text-xl text-brand-300">
              {client.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-display font-bold text-white">{client.name}</h1>
            <p className="text-sm text-white/40 font-mono">{formatDocument(client.document) || 'Sem documento'}</p>
            <div className="flex flex-wrap gap-3 mt-3">
              {client.phone && (
                <a href={`tel:${client.phone}`} className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors">
                  <Phone size={14} /> {formatPhone(client.phone)}
                </a>
              )}
              {client.whatsapp && (
                <a href={`https://wa.me/${client.whatsapp}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-sm text-accent-green hover:text-accent-green/80 transition-colors">
                  <MessageCircle size={14} /> WhatsApp
                </a>
              )}
              {client.email && (
                <a href={`mailto:${client.email}`} className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors">
                  <Mail size={14} /> {client.email}
                </a>
              )}
              {(client.city || client.state) && (
                <span className="flex items-center gap-1.5 text-sm text-white/40">
                  <MapPin size={14} /> {[client.city, client.state].filter(Boolean).join(', ')}
                </span>
              )}
            </div>
          </div>
          <div className="hidden sm:flex gap-4">
            <div className="text-center">
              <p className="text-2xl font-display font-bold text-white">{history.sales.length}</p>
              <p className="text-xs text-white/35">Compras</p>
            </div>
            <div className="w-px bg-white/5" />
            <div className="text-center">
              <p className="text-2xl font-display font-bold text-white">{history.services.length}</p>
              <p className="text-xs text-white/35">Serviços</p>
            </div>
            <div className="w-px bg-white/5" />
            <div className="text-center">
              <p className="text-2xl font-display font-bold text-white">{client.vehicles?.length || 0}</p>
              <p className="text-xs text-white/35">Veículos</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-700/50 p-1 rounded-xl w-fit">
        {[
          { id: 'overview', label: 'Veículos', icon: Car },
          { id: 'sales', label: 'Compras', icon: ShoppingCart },
          { id: 'services', label: 'Serviços', icon: Wrench },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? 'bg-brand-600 text-white' : 'text-white/40 hover:text-white/70'
            }`}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-white">Veículos</h3>
            <Link to={`/services/new?clientId=${id}`} className="btn-secondary text-sm flex items-center gap-1.5">
              <Plus size={14} /> Novo Serviço
            </Link>
          </div>
          {client.vehicles?.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-8">Nenhum veículo cadastrado</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {client.vehicles.map(v => (
                <div key={v.id} className="flex items-center gap-3 p-3 bg-surface-600/40 rounded-xl border border-white/[0.05]">
                  <Car size={20} className="text-brand-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">{v.brand} {v.model} {v.year}</p>
                    <p className="text-xs text-white/40 font-mono">{v.plate} · {v.color}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'sales' && (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.05]">
                <th className="table-header text-left">#</th>
                <th className="table-header text-left">Data</th>
                <th className="table-header text-right">Total</th>
                <th className="table-header text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.sales.map(s => (
                <tr key={s.id} className="table-row">
                  <td className="table-cell">
                    <Link to={`/sales/${s.id}`} className="text-brand-400 font-mono hover:underline">#{s.number}</Link>
                  </td>
                  <td className="table-cell text-white/50 text-xs">{formatDate(s.createdAt)}</td>
                  <td className="table-cell text-right font-semibold text-white">{formatCurrency(s.total)}</td>
                  <td className="table-cell text-center"><StatusBadge status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'services' && (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.05]">
                <th className="table-header text-left">#</th>
                <th className="table-header text-left">Tipo</th>
                <th className="table-header text-left hidden md:table-cell">Data</th>
                <th className="table-header text-right">Total</th>
                <th className="table-header text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.services.map(s => (
                <tr key={s.id} className="table-row">
                  <td className="table-cell">
                    <Link to={`/services/${s.id}`} className="text-brand-400 font-mono hover:underline">#{s.number}</Link>
                  </td>
                  <td className="table-cell text-white/70">{s.type}</td>
                  <td className="table-cell hidden md:table-cell text-white/40 text-xs">{formatDate(s.createdAt)}</td>
                  <td className="table-cell text-right font-semibold text-white">{formatCurrency(s.total)}</td>
                  <td className="table-cell text-center"><StatusBadge status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
