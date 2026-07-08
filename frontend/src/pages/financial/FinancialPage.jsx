import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, TrendingUp, TrendingDown, Plus, CheckCircle, AlertTriangle } from 'lucide-react'
import api from '../../services/api'
import { MetricCard, StatusBadge, Skeleton, PageHeader, EmptyState, Button, Input, FormGroup, Modal } from '../../components/ui/index'
import { formatCurrency, formatDate } from '../../utils/format'
import toast from 'react-hot-toast'

const TABS = [
  { value: 'receivable', label: 'A Receber' },
  { value: 'payable', label: 'A Pagar' },
  { value: 'cashflow', label: 'Fluxo de Caixa' },
]

export default function FinancialPage() {
  const [tab, setTab] = useState('receivable')
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

  const balance = (cashflow?.income || 0) - (cashflow?.expenses || 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Financeiro"
        subtitle="Contas a pagar, receber e fluxo de caixa"
        actions={
          <>
            <Button variant="secondary" icon={Plus} onClick={() => setShowModal('receivable')}>A Receber</Button>
            <Button icon={Plus} onClick={() => setShowModal('payable')}>A Pagar</Button>
          </>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard title="A Receber" value={formatCurrency(summary?.totalReceivable || 0)}
          icon={TrendingUp} loading={loading} subtitle={`${summary?.overdueReceivable || 0} vencidos`} />
        <MetricCard title="A Pagar" value={formatCurrency(summary?.totalPayable || 0)}
          icon={TrendingDown} loading={loading} subtitle={`${summary?.overduePayable || 0} vencidos`} />
        <MetricCard title="Receita do Mês" value={formatCurrency(cashflow?.income || 0)}
          icon={DollarSign} loading={loading} />
        <MetricCard title="Saldo Líquido" value={formatCurrency(balance)}
          icon={DollarSign} loading={loading} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-700/50 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-out-expo ${
              tab === t.value ? 'bg-brand-500 text-[#08090a] font-semibold' : 'text-white/40 hover:text-white/70'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'receivable' && (
        <AccountTable data={receivable} loading={loading} onPay={(id) => handlePay('receivable', id)} type="receivable" />
      )}

      {tab === 'payable' && (
        <AccountTable data={payable} loading={loading} onPay={(id) => handlePay('payable', id)} type="payable" />
      )}

      {tab === 'cashflow' && (
        <div className="card p-5">
          <h2 className="font-display font-semibold text-white mb-4">
            Fluxo de Caixa — {new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Receita de Vendas', value: cashflow?.salesRevenue, color: 'text-accent-green' },
              { label: 'Receita de Serviços', value: cashflow?.servicesRevenue, color: 'text-accent-blue' },
              { label: 'Despesas Pagas', value: cashflow?.expenses, color: 'text-accent-red' },
            ].map(m => (
              <div key={m.label} className="p-4 bg-surface-700/40 rounded-xl text-center">
                <p className="text-xs text-white/35 mb-1">{m.label}</p>
                <p className={`text-xl font-bold font-display ${m.color}`}>{formatCurrency(m.value || 0)}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/[0.05] flex items-center justify-between">
            <span className="font-display font-semibold text-white">Saldo do Mês</span>
            <span className={`text-xl font-bold font-display ${cashflow?.balance >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
              {formatCurrency(cashflow?.balance || 0)}
            </span>
          </div>
        </div>
      )}

      <Modal open={!!showModal} onClose={() => setShowModal(null)} title={`Nova Conta a ${showModal === 'receivable' ? 'Receber' : 'Pagar'}`}>
        {showModal && (
          <AccountForm type={showModal} onClose={() => setShowModal(null)} onSuccess={() => { setShowModal(null); load() }} />
        )}
      </Modal>
    </div>
  )
}

function AccountTable({ data, loading, onPay, type }) {
  const now = new Date()
  return (
    <div className="card overflow-hidden">
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
            <tr><td colSpan={6} className="py-4">
              <EmptyState icon={DollarSign} title="Nenhum registro" description="Nenhuma conta cadastrada" />
            </td></tr>
          ) : data.map((item, i) => {
            const overdue = item.status === 'PENDING' && new Date(item.dueDate) < now
            return (
              <motion.tr key={item.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                className="table-row">
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
                    <button onClick={() => onPay(item.id)}
                      className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1 mx-auto text-accent-green hover:bg-accent-green/10">
                      <CheckCircle size={13} /> Pagar
                    </button>
                  )}
                </td>
              </motion.tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function AccountForm({ type, onClose, onSuccess }) {
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormGroup label="Descrição" required>
        <Input value={form.description} onChange={set('description')} required />
      </FormGroup>
      {!isReceivable && (
        <div className="grid grid-cols-2 gap-3">
          <FormGroup label="Fornecedor">
            <Input value={form.supplier} onChange={set('supplier')} />
          </FormGroup>
          <FormGroup label="Categoria">
            <Input value={form.category} onChange={set('category')} placeholder="Aluguel, Estoque..." />
          </FormGroup>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <FormGroup label="Valor (R$)" required>
          <Input type="number" step="0.01" value={form.amount} onChange={set('amount')} required />
        </FormGroup>
        <FormGroup label="Vencimento" required>
          <Input type="date" value={form.dueDate} onChange={set('dueDate')} required />
        </FormGroup>
      </div>
      <FormGroup label="Observações">
        <textarea value={form.notes} onChange={set('notes')} className="input-field h-16 resize-none" />
      </FormGroup>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancelar</Button>
        <Button type="submit" className="flex-1" loading={loading}>{loading ? 'Salvando...' : 'Criar'}</Button>
      </div>
    </form>
  )
}
