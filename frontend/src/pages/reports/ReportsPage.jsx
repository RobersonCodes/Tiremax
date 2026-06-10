import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts'
import { BarChart3, Download } from 'lucide-react'
import api from '../../services/api'
import { PageHeader, MetricCard, Skeleton } from '../../components/ui/index'
import { formatCurrency } from '../../utils/format'

const COLORS = ['#3b64ff', '#06d6e8', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']

export default function ReportsPage() {
  const [revenueData, setRevenueData] = useState([])
  const [stockData, setStockData] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30d')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [chart, stock] = await Promise.all([
          api.get(`/dashboard/revenue-chart?period=${period}`),
          api.get('/stock/report'),
        ])
        // Merge chart data
        const map = {}
        ;(chart.data.sales || []).forEach(d => {
          const key = d.date?.split('T')[0] || d.date
          map[key] = { ...map[key], date: key, vendas: Number(d.revenue || 0) }
        })
        ;(chart.data.services || []).forEach(d => {
          const key = d.date?.split('T')[0] || d.date
          map[key] = { ...map[key], date: key, servicos: Number(d.revenue || 0) }
        })
        setRevenueData(Object.values(map).sort((a, b) => a.date?.localeCompare(b.date)))
        setStockData(stock.data.products?.slice(0, 8) || [])
      } finally { setLoading(false) }
    }
    load()
  }, [period])

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="glass-card p-3 text-xs">
        <p className="text-white/40 mb-1">{label}</p>
        {payload.map(p => <p key={p.name} style={{ color: p.color }}>{p.name}: {formatCurrency(p.value)}</p>)}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Relatórios"
        subtitle="Análise de desempenho e dados"
        actions={
          <div className="flex gap-1 bg-surface-700/50 p-1 rounded-xl">
            {['7d', '30d', '90d'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${period === p ? 'bg-brand-600 text-white' : 'text-white/40 hover:text-white/70'}`}>
                {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : '90 dias'}
              </button>
            ))}
          </div>
        }
      />

      {/* Revenue chart */}
      <div className="glass-card p-5">
        <h2 className="font-display font-semibold text-white mb-5">Faturamento por Dia</h2>
        {loading ? <Skeleton className="h-64 rounded-xl" /> : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="vendas" name="Vendas" fill="#3b64ff" radius={[4, 4, 0, 0]} />
              <Bar dataKey="servicos" name="Serviços" fill="#06d6e8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Stock report */}
      <div className="glass-card p-5">
        <h2 className="font-display font-semibold text-white mb-4">Top Produtos — Valor em Estoque</h2>
        {loading ? <Skeleton className="h-48 rounded-xl" /> : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stockData} layout="vertical" margin={{ left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} width={140} axisLine={false} tickLine={false}
                  tickFormatter={v => v.length > 18 ? v.slice(0, 18) + '…' : v} />
                <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ background: '#1a1f35', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="totalValue" name="Valor" fill="#3b64ff" radius={[0, 4, 4, 0]}>
                  {stockData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {stockData.slice(0, 6).map((p, i) => (
                <div key={p.id} className="flex items-center justify-between p-2.5 bg-surface-600/40 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-sm text-white/70 truncate max-w-[180px]">{p.name}</span>
                  </div>
                  <div className="text-right ml-2">
                    <p className="text-sm font-semibold text-white">{formatCurrency(p.totalValue)}</p>
                    <p className="text-xs text-white/30">{p.stock} un.</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
