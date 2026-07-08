import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, Minus, Trash2, ShoppingCart, User, ArrowLeft, CheckCircle, Tag, CreditCard, X } from 'lucide-react'
import api from '../../services/api'
import { Button, Input } from '../../components/ui/index'
import { formatCurrency } from '../../utils/format'
import toast from 'react-hot-toast'

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Dinheiro' },
  { value: 'CREDIT_CARD', label: 'Cartão Crédito' },
  { value: 'DEBIT_CARD', label: 'Cartão Débito' },
  { value: 'PIX', label: 'PIX' },
  { value: 'BANK_TRANSFER', label: 'Transferência' },
]

export default function POSPage() {
  const navigate = useNavigate()
  const searchRef = useRef()
  const [cart, setCart] = useState([])
  const [productSearch, setProductSearch] = useState('')
  const [productResults, setProductResults] = useState([])
  const [clientSearch, setClientSearch] = useState('')
  const [clientResults, setClientResults] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState(null)

  // Product search
  useEffect(() => {
    if (!productSearch.trim()) { setProductResults([]); return }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get(`/products/search?q=${encodeURIComponent(productSearch)}`)
        setProductResults(data)
      } catch {}
    }, 300)
    return () => clearTimeout(t)
  }, [productSearch])

  // Client search
  useEffect(() => {
    if (!clientSearch.trim()) { setClientResults([]); return }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get(`/clients/search?q=${encodeURIComponent(clientSearch)}`)
        setClientResults(data)
      } catch {}
    }, 300)
    return () => clearTimeout(t)
  }, [clientSearch])

  const addToCart = (product) => {
    setCart(c => {
      const existing = c.find(i => i.productId === product.id)
      if (existing) return c.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...c, { productId: product.id, name: product.name, unitPrice: Number(product.salePrice), quantity: 1, discount: 0, stock: product.stock, unit: product.unit }]
    })
    setProductSearch('')
    setProductResults([])
  }

  const updateQty = (productId, delta) => {
    setCart(c => c.map(i => i.productId === productId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i).filter(i => i.quantity > 0))
  }

  const removeItem = (productId) => setCart(c => c.filter(i => i.productId !== productId))

  const subtotal = cart.reduce((acc, i) => acc + i.unitPrice * i.quantity - (i.discount || 0), 0)
  const total = Math.max(0, subtotal - Number(discount || 0))

  const handleSubmit = async () => {
    if (cart.length === 0) { toast.error('Adicione itens ao carrinho'); return }
    setLoading(true)
    try {
      const { data } = await api.post('/sales', {
        clientId: selectedClient?.id || null,
        items: cart.map(i => ({ productId: i.productId, quantity: i.quantity, discount: i.discount || 0 })),
        discount: Number(discount || 0),
        paymentMethod,
        notes,
      })
      setCompleted(data)
      toast.success('Venda finalizada com sucesso!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao finalizar venda')
    } finally {
      setLoading(false)
    }
  }

  if (completed) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-4">
          <div className="w-20 h-20 bg-accent-green/10 border border-accent-green/20 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle size={40} className="text-accent-green" />
          </div>
          <h2 className="text-2xl font-display font-bold text-white">Venda Concluída!</h2>
          <p className="text-white/50">Venda #{completed.number} · {formatCurrency(completed.total)}</p>
          <div className="flex gap-3 justify-center mt-6">
            <Button variant="secondary" onClick={() => navigate('/sales')}>Ver Vendas</Button>
            <Button onClick={() => { setCart([]); setCompleted(null); setSelectedClient(null); setDiscount(0) }}>Nova Venda</Button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="md" onClick={() => navigate(-1)} className="!px-2"><ArrowLeft size={18} /></Button>
        <div>
          <h1 className="text-xl font-display font-bold text-white">PDV — Ponto de Venda</h1>
          <p className="text-xs text-white/35">Registre vendas rapidamente</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left — Product search + cart */}
        <div className="lg:col-span-3 space-y-4">
          {/* Product search */}
          <div className="card p-4">
            <label className="label">Buscar Produto</label>
            <Input ref={searchRef} icon={Search} value={productSearch} onChange={e => setProductSearch(e.target.value)}
              placeholder="Código, nome, marca..." autoFocus />
            <AnimatePresence>
              {productResults.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mt-2 bg-surface-700 border border-white/10 rounded-xl overflow-hidden">
                  {productResults.map(p => (
                    <button key={p.id} onClick={() => addToCart(p)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/[0.05] last:border-0 text-left">
                      <div>
                        <p className="text-sm font-medium text-white">{p.name}</p>
                        <p className="text-xs text-white/35 font-mono">{p.code} · {p.brand}</p>
                      </div>
                      <div className="text-right ml-3">
                        <p className="text-sm font-semibold text-accent-green">{formatCurrency(p.salePrice)}</p>
                        <p className="text-xs text-white/30">Estoque: {p.stock}</p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Cart */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-white/[0.05] flex items-center justify-between">
              <h3 className="font-display font-semibold text-white flex items-center gap-2">
                <ShoppingCart size={18} className="text-brand-500" />
                Carrinho <span className="text-brand-500 text-sm">({cart.length})</span>
              </h3>
              {cart.length > 0 && (
                <button onClick={() => setCart([])} className="text-xs text-accent-red/60 hover:text-accent-red transition-colors">
                  Limpar
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-white/20">
                <ShoppingCart size={36} className="mb-3" />
                <p className="text-sm">Carrinho vazio</p>
                <p className="text-xs mt-1">Busque um produto acima</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {cart.map(item => (
                  <motion.div key={item.productId} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{item.name}</p>
                      <p className="text-xs text-white/35">{formatCurrency(item.unitPrice)} / {item.unit}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(item.productId, -1)} className="w-6 h-6 rounded-lg bg-surface-500 hover:bg-surface-400 flex items-center justify-center transition-colors">
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center text-sm font-medium text-white">{item.quantity}</span>
                      <button onClick={() => updateQty(item.productId, 1)} className="w-6 h-6 rounded-lg bg-surface-500 hover:bg-surface-400 flex items-center justify-center transition-colors">
                        <Plus size={12} />
                      </button>
                    </div>
                    <p className="text-sm font-semibold text-white w-20 text-right">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </p>
                    <button onClick={() => removeItem(item.productId)} className="text-white/20 hover:text-accent-red transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right — Order summary */}
        <div className="lg:col-span-2 space-y-4">
          {/* Client */}
          <div className="card p-4">
            <label className="label flex items-center gap-1.5"><User size={13} /> Cliente (Opcional)</label>
            {selectedClient ? (
              <div className="flex items-center justify-between p-3 bg-brand-500/10 border border-brand-500/15 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-white">{selectedClient.name}</p>
                  <p className="text-xs text-white/40">{selectedClient.phone}</p>
                </div>
                <button onClick={() => { setSelectedClient(null); setClientSearch('') }} className="text-white/30 hover:text-white/60">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Input icon={Search} value={clientSearch} onChange={e => setClientSearch(e.target.value)} placeholder="Buscar cliente..." />
                <AnimatePresence>
                  {clientResults.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute top-full mt-1 w-full bg-surface-700 border border-white/10 rounded-xl overflow-hidden z-20">
                      {clientResults.map(c => (
                        <button key={c.id} onClick={() => { setSelectedClient(c); setClientSearch(''); setClientResults([]) }}
                          className="w-full text-left px-3 py-2.5 hover:bg-white/5 border-b border-white/[0.05] last:border-0 transition-colors">
                          <p className="text-sm text-white">{c.name}</p>
                          <p className="text-xs text-white/35">{c.phone}</p>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Payment + discount */}
          <div className="card p-4 space-y-3">
            <div>
              <label className="label flex items-center gap-1.5"><CreditCard size={13} /> Forma de Pagamento</label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map(m => (
                  <button key={m.value} onClick={() => setPaymentMethod(m.value)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ease-out-expo ${
                      paymentMethod === m.value ? 'bg-brand-500 text-[#08090a] font-semibold' : 'bg-surface-700 text-white/50 hover:text-white/80'
                    }`}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label flex items-center gap-1.5"><Tag size={13} /> Desconto (R$)</label>
              <Input type="number" step="0.01" min={0} value={discount}
                onChange={e => setDiscount(e.target.value)} placeholder="0,00" />
            </div>
            <div>
              <label className="label">Observações</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                className="input-field h-16 resize-none text-sm" placeholder="Notas da venda..." />
            </div>
          </div>

          {/* Totals */}
          <div className="card p-4">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm text-white/60">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-accent-amber">
                  <span>Desconto</span>
                  <span>- {formatCurrency(discount)}</span>
                </div>
              )}
              <div className="border-t border-white/[0.05] pt-2 flex justify-between font-display font-bold text-lg text-white">
                <span>Total</span>
                <span className="text-accent-green">{formatCurrency(total)}</span>
              </div>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={cart.length === 0}
              loading={loading}
              size="lg"
              icon={CheckCircle}
              className="w-full"
            >
              Finalizar Venda
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
