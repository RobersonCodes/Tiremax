import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { TrendingUp, AlertTriangle, ArrowRight, Plus, Wrench, DollarSign, Users, Ticket } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import api from '../../services/api'
import { StatusBadge, Skeleton } from '../../components/ui/index'
import { formatCurrency, formatDate, formatDateTime } from '../../utils/format'
import { useAuth } from '../../contexts/AuthContext'

export default function DashboardPage() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState(null)
  const [chart, setChart] = useState(null)
  const [recentSales, setRecentSales] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('7d')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [m, c, s, l] = await Promise.all([
          api.get('/dashboard/metrics'),
          api.get(`/dashboard/revenue-chart?period=${period}`),
          api.get('/dashboard/recent-sales'),
          api.get('/dashboard/low-stock'),
        ])
        setMetrics(m.data)
        setChart(c.data)
        setRecentSales(s.data)
        setLowStock(l.data)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [period])

  const chartData = (() => {
    if (!chart) return []
    const map = {}
    ;(chart.sales || []).forEach(d => {
      const key = d.date?.split('T')[0] || d.date
      map[key] = { ...map[key], date: key, vendas: Number(d.revenue || 0) }
    })
    ;(chart.services || []).forEach(d => {
      const key = d.date?.split('T')[0] || d.date
      map[key] = { ...map[key], date: key, servicos: Number(d.revenue || 0) }
    })
    return Object.values(map).sort((a, b) => a.date?.localeCompare(b.date))
  })()

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-3 text-xs shadow-xl">
        <p className="text-white/40 mb-1">{label}</p>
        {payload.map(p => (
          <p key={p.name} style={{ color: p.color }} className="font-semibold">
            {p.name}: {formatCurrency(p.value)}
          </p>
        ))}
      </div>
    )
  }

  const ticketMedio = metrics && metrics.salesToday?.count > 0
    ? metrics.salesToday.revenue / metrics.salesToday.count : 0

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Page title */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-black text-2xl text-white">
            Olá, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-sm text-white/40 mt-0.5">Aqui está o resumo da sua borracharia hoje.</p>
        </div>
        <div className="flex items-center gap-2 bg-[#1a1a1a] border border-white/[0.07] rounded-lg px-3 py-2 text-sm text-white/50 cursor-pointer">
          📅 {formatDate(new Date())}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Faturamento Hoje',
            value: loading ? null : formatCurrency(metrics?.salesToday?.revenue || 0),
            sub: `↑ ${metrics?.salesToday?.count || 0} vendas`,
            icon: '💲', iconBg: 'bg-yellow-400', iconColor: 'text-black', subColor: 'text-green-400',
          },
          {
            label: 'Ordens de Serviço',
            value: loading ? null : metrics?.servicesOpen || 0,
            sub: `${metrics?.servicesMonth || 0} este mês`,
            icon: '🛞', iconBg: 'bg-[#1a1a1a] border border-white/[0.07]', iconColor: 'text-white', subColor: 'text-yellow-400',
          },
          {
            label: 'Clientes Atendidos',
            value: loading ? null : metrics?.totalClients || 0,
            sub: `+${metrics?.newClientsMonth || 0} novos`,
            icon: '👤', iconBg: 'bg-[#1a1a1a] border border-white/[0.07]', iconColor: 'text-white', subColor: 'text-green-400',
          },
          {
            label: 'Ticket Médio',
            value: loading ? null : formatCurrency(ticketMedio),
            sub: `↑ faturamento mês`,
            icon: '🎫', iconBg: 'bg-[#1a1a1a] border border-white/[0.07]', iconColor: 'text-white', subColor: 'text-green-400',
          },
        ].map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-[#131313] border border-white/[0.07] hover:border-yellow-400/20 rounded-xl p-4 flex items-center gap-3 transition-all cursor-pointer">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${m.iconBg}`}
              style={m.iconBg === 'bg-yellow-400' ? { boxShadow: '0 4px 16px rgba(245,200,0,0.25)' } : {}}>
              {m.icon}
            </div>
            <div>
              <p className="text-[11px] font-semibold text-white/35 uppercase tracking-wide mb-0.5">{m.label}</p>
              {loading ? <Skeleton className="h-7 w-24 mb-1" /> : (
                <p className="font-display font-black text-xl text-white leading-none mb-0.5">{m.value}</p>
              )}
              <p className={`text-xs ${m.subColor}`}>{m.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Chart + Agendamentos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart */}
        <div className="lg:col-span-2 bg-[#131313] border border-white/[0.07] rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display font-black text-sm uppercase tracking-wide text-white">
                Faturamento dos Últimos {period === '7d' ? '7' : period === '30d' ? '30' : '90'} Dias
              </h2>
            </div>
            <div className="flex gap-1 bg-[#1a1a1a] border border-white/[0.07] p-1 rounded-lg">
              {['7d', '30d', '90d'].map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all uppercase ${
                    period === p ? 'bg-yellow-400 text-black' : 'text-white/35 hover:text-white/70'
                  }`}>
                  {p === '7d' ? '7 dias' : p === '30d' ? '30d' : '90d'}
                </button>
              ))}
            </div>
          </div>
          {loading ? <Skeleton className="h-52 rounded-xl" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f5c800" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#f5c800" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="vendas" name="Vendas" stroke="#f5c800" strokeWidth={2.5} fill="url(#gV)" dot={{ fill: '#f5c800', strokeWidth: 0, r: 4 }} />
                <Area type="monotone" dataKey="servicos" name="Serviços" stroke="#22c55e" strokeWidth={2} fill="url(#gS)" dot={{ fill: '#22c55e', strokeWidth: 0, r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Low stock / recent */}
        <div className="bg-[#131313] border border-white/[0.07] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-black text-sm uppercase tracking-wide">
              ⚠️ Alertas de Estoque
            </h2>
            <Link to="/inventory" className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1">
              Ver estoque <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {loading ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />) :
            lowStock.length === 0 ? (
              <div className="text-center py-8 text-white/25 text-sm">✅ Estoque em dia!</div>
            ) : lowStock.slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center gap-3 p-3 bg-[#1a1a1a] border border-white/[0.05] rounded-xl">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                  p.stock === 0 ? 'bg-red-500/10 border border-red-500/20' : 'bg-orange-500/10 border border-orange-500/20'
                }`}>⚠️</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80 truncate font-medium">{p.name}</p>
                  <p className="text-xs text-white/30 font-mono">{p.code}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-black font-display ${p.stock === 0 ? 'text-red-400' : 'text-orange-400'}`}>{p.stock}</p>
                  <p className="text-[10px] text-white/25">min {p.minStock}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* OS recentes + Serviços */}
      <div className="bg-[#131313] border border-white/[0.07] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.05]">
          <h2 className="font-display font-black text-sm uppercase tracking-wide">Ordens de Serviço Recentes</h2>
          <Link to="/services" className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1">
            Ver todas <ArrowRight size={12} />
          </Link>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.05]">
              <th className="table-header text-left">OS #</th>
              <th className="table-header text-left hidden md:table-cell">Cliente · Veículo</th>
              <th className="table-header text-left hidden lg:table-cell">Data</th>
              <th className="table-header text-center">Status</th>
              <th className="table-header text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {loading ? Array(5).fill(0).map((_, i) => (
              <tr key={i} className="border-b border-white/[0.05]">
                {Array(5).fill(0).map((_, j) => <td key={j} className="table-cell"><Skeleton className="h-4" /></td>)}
              </tr>
            )) : recentSales.map(sale => (
              <tr key={sale.id} className="table-row">
                <td className="table-cell">
                  <Link to={`/sales/${sale.id}`} className="font-mono text-yellow-400 text-sm font-bold">#{sale.number}</Link>
                </td>
                <td className="table-cell hidden md:table-cell text-white/70">{sale.client?.name || '— Avulso'}</td>
                <td className="table-cell hidden lg:table-cell text-white/35 text-xs">{formatDateTime(sale.createdAt)}</td>
                <td className="table-cell text-center"><StatusBadge status={sale.status} /></td>
                <td className="table-cell text-right font-black font-display text-white">{formatCurrency(sale.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
