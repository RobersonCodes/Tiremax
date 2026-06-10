import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, TrendingUp, TrendingDown, Plus, CheckCircle, AlertTriangle } from 'lucide-react'
import api from '../../services/api'
import { MetricCard, StatusBadge, Skeleton, PageHeader, EmptyState } from '../../components/ui/index'
import { formatCurrency, formatDate } from '../../utils/format'
import toast from 'react-hot-toast'

export default function FinancialPage() {
  const [tab, setTab] = useState('overview')
  const [summary, setSummary] = useState(null)
  const [cashflow, setCashflow] = useState(null)
  const [receivable, setReceivable] = useState([])
  const [payable, setPayable] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(null) // 'receivable' | 'payable'

  const load = async () => {
    setLoading(true)
    try {
      const [s, c, r, p] = await Promise.all([
        api.get('/financial/summary'),
        api.get(`/financial/cashflow?month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`),
        api.get('/financial/receivable'),
        api.get('/financial/payable'),
      ])
      setSummary(s.data)
      setCashflow(c.data)
      setReceivable(r.data)
      setPayable(p.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handlePay = async (type, id) => {
    const amount = prompt('Valor pago (R$):')
    if (!amount) return
    try {
      await api.patch(`/financial/${type}/${id}/pay`, { paidAmount: parseFloat(amount) })
      toast.success('Pagamento registrado!')
      load()
    } catch { toast.error('Erro ao registrar pagamento') }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Financeiro"
        subtitle="Contas a pagar, receber e fluxo de caixa"
        actions={
          <div className="flex gap-2">
            <button onClick={() => setShowModal('receivable')} className="btn-secondary text-sm flex items-center gap-1.5">
              <Plus size={14} /> A Receber
            </button>
            <button onClick={() => setShowModal('payable')} className="btn-primary text-sm flex items-center gap-1.5">
              <Plus size={14} /> A Pagar
            </button>
          </div>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard title="A Receber" value={loading ? '...' : formatCurrency(summary?.totalReceivable || 0)}
          icon={TrendingUp} color="green" loading={loading} subtitle={`${summary?.overdueReceivable || 0} vencidos`} />
        <MetricCard title="A Pagar" value={loading ? '...' : formatCurrency(summary?.totalPayable || 0)}
          icon={TrendingDown} color="red" loading={loading} subtitle={`${summary?.overduePayable || 0} vencidos`} />
        <MetricCard title="Receita do Mês" value={loading ? '...' : formatCurrency(cashflow?.income || 0)}
          icon={DollarSign} color="brand" loading={loading} />
        <MetricCard title="Saldo Líquido" value={loading ? '...' : formatCurrency((cashflow?.income || 0) - (cashflow?.expenses || 0))}
          icon={DollarSign} color={((cashflow?.income || 0) - (cashflow?.expenses || 0)) >= 0 ? 'green' : 'red'} loading={loading} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-700/50 p-1 rounded-xl w-fit">
        {['receivable', 'payable', 'cashflow'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-brand-600 text-white' : 'text-white/40 hover:text-white/70'}`}>
            {t === 'receivable' ? 'A Receber' : t === 'payable' ? 'A Pagar' : 'Fluxo de Caixa'}
          </button>
        ))}
      </div>

      {tab === 'receivable' && (
        <AccountTable
          data={receivable}
          loading={loading}
          onPay={(id) => handlePay('receivable', id)}
          type="receivable"
        />
      )}

      {tab === 'payable' && (
        <AccountTable
          data={payable}
          loading={loading}
          onPay={(id) => handlePay('payable', id)}
          type="payable"
        />
      )}

      {tab === 'cashflow' && (
        <div className="glass-card p-5">
          <h2 className="font-display font-semibold text-white mb-4">Fluxo de Caixa — {new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Receita de Vendas', value: cashflow?.salesRevenue, color: 'text-accent-green' },
              { label: 'Receita de Serviços', value: cashflow?.servicesRevenue, color: 'text-brand-300' },
              { label: 'Despesas Pagas', value: cashflow?.expenses, color: 'text-accent-red' },
            ].map(m => (
              <div key={m.label} className="p-4 bg-surface-600/40 rounded-xl text-center">
                <p className="text-xs text-white/35 mb-1">{m.label}</p>
                <p className={`text-xl font-bold ${m.color}`}>{formatCurrency(m.value || 0)}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/[0.05] flex items-center justify-between">
            <span className="font-display font-semibold text-white">Saldo do Mês</span>
            <span className={`text-xl font-bold ${cashflow?.balance >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
              {formatCurrency(cashflow?.balance || 0)}
            </span>
          </div>
        </div>
      )}

      {showModal && (
        <AccountModal type={showModal} onClose={() => setShowModal(null)} onSuccess={() => { setShowModal(null); load() }} />
      )}
    </div>
  )
}

function AccountTable({ data, loading, onPay, type }) {
  const now = new Date()
  return (
    <div className="glass-card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/[0.05]">
            <th className="table-header text-left">Descrição</th>
            <th className="table-header text-left hidden md:table-cell">{type === 'receivable' ? 'Cliente' : 'Fornecedor'}</th>
            <th className="table-header text-left">Vencimento</th>
            <th className="table-header text-right">Valor</th>
            <th className="table-header text-center">Status</th>
            <th className="table-header text-center hidden sm:table-cell">Ação</th>
          </tr>
        </thead>
        <tbody>
          {loading ? Array(5).fill(0).map((_, i) => (
            <tr key={i} className="border-b border-white/[0.05]">
              {Array(6).fill(0).map((_, j) => <td key={j} className="table-cell"><Skeleton className="h-4" /></td>)}
            </tr>
          )) : data.length === 0 ? (
            <tr><td colSpan={6} className="py-12">
              <EmptyState icon={DollarSign} title="Nenhum registro" description="Nenhuma conta cadastrada" />
            </td></tr>
          ) : data.map(item => {
            const overdue = item.status === 'PENDING' && new Date(item.dueDate) < now
            return (
              <tr key={item.id} className="table-row">
                <td className="table-cell">
                  <p className="text-sm text-white/80">{item.description}</p>
                  {item.category && <p className="text-xs text-white/30">{item.category}</p>}
                </td>
                <td className="table-cell hidden md:table-cell text-white/50 text-sm">
                  {item.clientId || item.supplier || '—'}
                </td>
                <td className="table-cell">
                  <span className={`text-sm ${overdue ? 'text-accent-red font-medium' : 'text-white/60'}`}>
                    {overdue && <AlertTriangle size={12} className="inline mr-1" />}
                    {formatDate(item.dueDate)}
                  </span>
                </td>
                <td className="table-cell text-right font-semibold text-white">{formatCurrency(item.amount)}</td>
                <td className="table-cell text-center"><StatusBadge status={overdue ? 'OVERDUE' : item.status} /></td>
                <td className="table-cell hidden sm:table-cell text-center">
                  {item.status === 'PENDING' && (
                    <button onClick={() => onPay(item.id)} className="btn-ghost text-xs flex items-center gap-1 mx-auto text-accent-green hover:bg-accent-green/10">
                      <CheckCircle size={13} /> Pagar
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function AccountModal({ type, onClose, onSuccess }) {
  const isReceivable = type === 'receivable'
  const [form, setForm] = useState({ description: '', amount: '', dueDate: '', notes: '', ...(isReceivable ? {} : { supplier: '', category: '' }) })
  const [loading, setLoading] = useState(false)
  const set = (f) => (e) => setForm(x => ({ ...x, [f]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post(`/financial/${type}`, { ...form, amount: parseFloat(form.amount), dueDate: new Date(form.dueDate) })
      toast.success('Registro criado!')
      onSuccess()
    } catch { toast.error('Erro ao criar registro') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md glass-card z-10">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.05]">
          <h2 className="font-display font-semibold text-white">Nova Conta a {isReceivable ? 'Receber' : 'Pagar'}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white/60">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">Descrição *</label>
            <input value={form.description} onChange={set('description')} className="input-field" required />
          </div>
          {!isReceivable && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Fornecedor</label>
                <input value={form.supplier} onChange={set('supplier')} className="input-field" />
              </div>
              <div>
                <label className="label">Categoria</label>
                <input value={form.category} onChange={set('category')} className="input-field" placeholder="Aluguel, Estoque..." />
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Valor (R$) *</label>
              <input type="number" step="0.01" value={form.amount} onChange={set('amount')} className="input-field" required />
            </div>
            <div>
              <label className="label">Vencimento *</label>
              <input type="date" value={form.dueDate} onChange={set('dueDate')} className="input-field" required />
            </div>
          </div>
          <div>
            <label className="label">Observações</label>
            <textarea value={form.notes} onChange={set('notes')} className="input-field h-16 resize-none" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Salvando...' : 'Criar'}</button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
