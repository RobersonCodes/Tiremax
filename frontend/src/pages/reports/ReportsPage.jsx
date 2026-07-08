import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import api from '../../services/api'
import { PageHeader, Card, Skeleton } from '../../components/ui/index'
import { formatCurrency } from '../../utils/format'

const COLORS = ['#f0b400', '#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444']

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
      <div className="bg-[#191b1f] border border-white/10 rounded-xl p-3 text-xs shadow-card">
        <p className="text-white/40 mb-1">{label}</p>
        {payload.map(p => <p key={p.name} style={{ color: p.color }} className="font-semibold">{p.name}: {formatCurrency(p.value)}</p>)}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Relatórios"
        subtitle="Análise de desempenho e dados"
        actions={
          <div className="flex gap-1 bg-[#191b1f] border border-white/[0.06] p-1 rounded-lg">
            {['7d', '30d', '90d'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all duration-200 ease-out-expo uppercase ${
                  period === p ? 'bg-brand-500 text-[#08090a]' : 'text-white/35 hover:text-white/70'
                }`}>
                {p === '7d' ? '7 dias' : p === '30d' ? '30d' : '90d'}
              </button>
            ))}
          </div>
        }
      />

      {/* Revenue chart */}
      <Card>
        <h2 className="font-display font-semibold text-white mb-5">Faturamento por Dia</h2>
        {loading ? <Skeleton className="h-64 rounded-xl" /> : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="vendas" name="Vendas" fill="#f0b400" radius={[4, 4, 0, 0]} />
              <Bar dataKey="servicos" name="Serviços" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Stock report */}
      <Card>
        <h2 className="font-display font-semibold text-white mb-4">Top Produtos — Valor em Estoque</h2>
        {loading ? <Skeleton className="h-48 rounded-xl" /> : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stockData} layout="vertical" margin={{ left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} width={140} axisLine={false} tickLine={false}
                  tickFormatter={v => v.length > 18 ? v.slice(0, 18) + '…' : v} />
                <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ background: '#191b1f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="totalValue" name="Valor" fill="#f0b400" radius={[0, 4, 4, 0]}>
                  {stockData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {stockData.slice(0, 6).map((p, i) => (
                <div key={p.id} className="flex items-center justify-between p-2.5 bg-surface-700/40 rounded-xl">
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
      </Card>
    </div>
  )
}
