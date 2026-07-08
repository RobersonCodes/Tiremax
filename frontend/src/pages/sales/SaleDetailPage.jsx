import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Printer, XCircle, User, CreditCard, Package } from 'lucide-react'
import api from '../../services/api'
import { StatusBadge, Skeleton, Card, Button } from '../../components/ui/index'
import { formatCurrency, formatDateTime } from '../../utils/format'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function SaleDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [sale, setSale] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    api.get(`/sales/${id}`).then(r => setSale(r.data)).catch(() => toast.error('Venda não encontrada')).finally(() => setLoading(false))
  }, [id])

  const handleCancel = async () => {
    if (!confirm('Cancelar esta venda? O estoque será restaurado.')) return
    setCancelling(true)
    try {
      await api.patch(`/sales/${id}/cancel`)
      toast.success('Venda cancelada')
      navigate('/sales')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao cancelar')
    } finally { setCancelling(false) }
  }

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-40" /><Skeleton className="h-64 rounded-2xl" /></div>
  if (!sale) return <div className="text-center py-20 text-white/40">Venda não encontrada</div>

  const pmLabel = { CASH: 'Dinheiro', CREDIT_CARD: 'Cartão Crédito', DEBIT_CARD: 'Cartão Débito', PIX: 'PIX', BANK_TRANSFER: 'Transferência' }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate(-1)}>Voltar</Button>
        <div className="flex gap-2">
          <Button variant="secondary" icon={Printer} onClick={() => window.print()}>Imprimir</Button>
          {['ADMIN', 'FINANCIAL'].includes(user?.role) && sale.status !== 'CANCELLED' && (
            <Button variant="danger" icon={XCircle} loading={cancelling} onClick={handleCancel}>Cancelar</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Header */}
          <Card>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-xl font-display font-bold text-white">Venda #{sale.number}</h1>
                <p className="text-sm text-white/40">{formatDateTime(sale.createdAt)}</p>
              </div>
              <StatusBadge status={sale.status} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <User size={16} className="text-white/30 mt-0.5" />
                <div>
                  <p className="text-xs text-white/35">Cliente</p>
                  {sale.client ? (
                    <Link to={`/clients/${sale.client.id}`} className="text-sm text-brand-500 hover:underline">{sale.client.name}</Link>
                  ) : (
                    <p className="text-sm text-white/50">Venda Avulsa</p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CreditCard size={16} className="text-white/30 mt-0.5" />
                <div>
                  <p className="text-xs text-white/35">Pagamento</p>
                  <p className="text-sm text-white/80">{pmLabel[sale.paymentMethod] || sale.paymentMethod}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Items */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-white/[0.05] flex items-center gap-2">
              <Package size={16} className="text-brand-500" />
              <h2 className="font-display font-semibold text-white">Itens</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  <th className="table-header text-left">Produto</th>
                  <th className="table-header text-center">Qtd</th>
                  <th className="table-header text-right">Unit.</th>
                  <th className="table-header text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map(item => (
                  <tr key={item.id} className="table-row">
                    <td className="table-cell">
                      <p className="text-sm text-white">{item.product?.name}</p>
                      <p className="text-xs text-white/30 font-mono">{item.product?.code}</p>
                    </td>
                    <td className="table-cell text-center text-white/70">{item.quantity} {item.product?.unit}</td>
                    <td className="table-cell text-right text-white/70">{formatCurrency(item.unitPrice)}</td>
                    <td className="table-cell text-right font-semibold text-white">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-4">
          <Card>
            <h2 className="font-display font-semibold text-white mb-4">Resumo</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-white/60">
                <span>Subtotal</span>
                <span>{formatCurrency(sale.subtotal)}</span>
              </div>
              {Number(sale.discount) > 0 && (
                <div className="flex justify-between text-accent-amber">
                  <span>Desconto</span>
                  <span>- {formatCurrency(sale.discount)}</span>
                </div>
              )}
              <div className="border-t border-white/[0.05] pt-2 flex justify-between font-bold text-lg text-white">
                <span>Total</span>
                <span className="text-accent-green">{formatCurrency(sale.total)}</span>
              </div>
            </div>
          </Card>
          {sale.notes && (
            <div className="card p-4">
              <p className="text-xs text-white/35 mb-1">Observações</p>
              <p className="text-sm text-white/70">{sale.notes}</p>
            </div>
          )}
          <div className="card p-4">
            <p className="text-xs text-white/35 mb-1">Operador</p>
            <p className="text-sm text-white">{sale.user?.name}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
