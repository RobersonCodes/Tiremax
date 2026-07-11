import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Package, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import api from '../../services/api'
import { Skeleton, Card, Button, Input, FormGroup, Modal } from '../../components/ui/index'
import { formatCurrency, formatDateTime } from '../../utils/format'
import toast from 'react-hot-toast'

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showMovModal, setShowMovModal] = useState(false)

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/products/${id}`)
      setProduct(data)
    } catch { toast.error('Produto não encontrado') }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { load() }, [load])

  if (loading) return <div className="space-y-4"><Skeleton className="h-48 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" /></div>
  if (!product) return <div className="text-white/40 text-center py-20">Produto não encontrado</div>

  const margin = product.salePrice > 0 ? ((product.salePrice - product.costPrice) / product.salePrice * 100).toFixed(1) : 0

  return (
    <div className="space-y-6 animate-fade-in">
      <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate(-1)}>
        Voltar ao Estoque
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Product info */}
        <div className="lg:col-span-2 space-y-4">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/15 flex items-center justify-center shrink-0">
                  <Package size={22} className="text-brand-500" />
                </div>
                <div>
                  <h1 className="text-xl font-display font-bold text-white">{product.name}</h1>
                  <p className="text-sm text-white/40 font-mono">{product.code}</p>
                  {product.brand && <p className="text-sm text-white/50 mt-1">{product.brand}</p>}
                </div>
              </div>
              <Button variant="secondary" icon={RefreshCw} onClick={() => setShowMovModal(true)}>
                Movimentar
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              {[
                { label: 'Custo', value: formatCurrency(product.costPrice), color: 'text-white/70' },
                { label: 'Venda', value: formatCurrency(product.salePrice), color: 'text-accent-green font-semibold' },
                { label: 'Margem', value: `${margin}%`, color: 'text-brand-500' },
                { label: 'Unidade', value: product.unit, color: 'text-white/70' },
              ].map(m => (
                <div key={m.label} className="bg-surface-700 rounded-xl p-3 text-center">
                  <p className="text-xs text-white/35 mb-1">{m.label}</p>
                  <p className={`text-sm ${m.color}`}>{m.value}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Stock movements */}
          <Card>
            <h2 className="font-display font-semibold text-white mb-4">Últimas Movimentações</h2>
            <div className="space-y-2">
              {product.stockMovements?.length === 0 ? (
                <p className="text-white/30 text-sm text-center py-6">Nenhuma movimentação registrada</p>
              ) : (
                product.stockMovements?.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-3 bg-surface-700 rounded-xl">
                    <div className="flex items-center gap-3">
                      {m.type === 'IN' ? (
                        <TrendingUp size={16} className="text-accent-green" />
                      ) : m.type === 'OUT' ? (
                        <TrendingDown size={16} className="text-accent-red" />
                      ) : (
                        <RefreshCw size={16} className="text-accent-amber" />
                      )}
                      <div>
                        <p className="text-sm text-white/80">{m.reason}</p>
                        {m.reference && <p className="text-xs text-white/30">{m.reference}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${m.type === 'IN' ? 'text-accent-green' : m.type === 'OUT' ? 'text-accent-red' : 'text-accent-amber'}`}>
                        {m.type === 'IN' ? '+' : m.type === 'OUT' ? '-' : ''}{m.quantity}
                      </p>
                      <p className="text-xs text-white/25">{formatDateTime(m.createdAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Stock sidebar */}
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="card p-5 text-center">
            <p className="text-xs text-white/35 uppercase tracking-wider mb-2">Estoque Atual</p>
            <p className={`text-5xl font-display font-bold mb-1 ${
              product.stock === 0 ? 'text-accent-red' :
              product.stock <= product.minStock ? 'text-accent-amber' : 'text-white'
            }`}>
              {product.stock}
            </p>
            <p className="text-sm text-white/30">{product.unit}</p>
            <div className="mt-3 pt-3 border-t border-white/[0.05]">
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Mínimo</span>
                <span className="text-white/60">{product.minStock}</span>
              </div>
              {product.maxStock && (
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-white/40">Máximo</span>
                  <span className="text-white/60">{product.maxStock}</span>
                </div>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-white/[0.05]">
              <p className="text-xs text-white/35 mb-1">Valor em estoque</p>
              <p className="text-lg font-semibold text-accent-green">
                {formatCurrency(product.stock * product.costPrice)}
              </p>
            </div>
          </motion.div>

          {product.location && (
            <div className="card p-4">
              <p className="text-xs text-white/35 mb-1">Localização</p>
              <p className="text-sm text-white">{product.location}</p>
            </div>
          )}
        </div>
      </div>

      <Modal open={showMovModal} onClose={() => setShowMovModal(false)} title="Movimentar Estoque">
        <StockMovForm product={product} onClose={() => setShowMovModal(false)} onSuccess={() => { setShowMovModal(false); load() }} />
      </Modal>
    </div>
  )
}

function StockMovForm({ product, onClose, onSuccess }) {
  const [form, setForm] = useState({ type: 'IN', quantity: 1, reason: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const set = (f) => (e) => setForm(x => ({ ...x, [f]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/stock/movements', { productId: product.id, ...form, quantity: Number(form.quantity) })
      toast.success('Movimentação registrada!')
      onSuccess()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro')
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-white/60">{product.name} · Estoque atual: <strong className="text-white">{product.stock}</strong></p>
      <FormGroup label="Tipo">
        <select value={form.type} onChange={set('type')} className="input-field">
          <option value="IN">Entrada</option>
          <option value="OUT">Saída</option>
          <option value="ADJUSTMENT">Ajuste (definir total)</option>
        </select>
      </FormGroup>
      <FormGroup label="Quantidade" required>
        <Input type="number" min={1} value={form.quantity} onChange={set('quantity')} required />
      </FormGroup>
      <FormGroup label="Motivo" required>
        <Input value={form.reason} onChange={set('reason')} placeholder="Compra, Devolução, Inventário..." required />
      </FormGroup>
      <FormGroup label="Observações">
        <textarea value={form.notes} onChange={set('notes')} className="input-field h-20 resize-none" />
      </FormGroup>
      <div className="flex gap-3">
        <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancelar</Button>
        <Button type="submit" className="flex-1" loading={loading}>
          {loading ? 'Salvando...' : 'Confirmar'}
        </Button>
      </div>
    </form>
  )
}
