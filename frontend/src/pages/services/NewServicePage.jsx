import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus, Trash2, Search, CheckCircle } from 'lucide-react'
import api from '../../services/api'
import { formatCurrency } from '../../utils/format'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

const SERVICE_TYPES = [
  'Troca de Pneus', 'Balanceamento', 'Alinhamento', 'Revisão Geral',
  'Troca de Óleo', 'Freios', 'Suspensão', 'Elétrica', 'Funilaria', 'Outros'
]

export default function NewServicePage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [clientSearch, setClientSearch] = useState('')
  const [clientResults, setClientResults] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [vehicles, setVehicles] = useState([])
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({
    vehicleId: '', assignedToId: '', type: 'Troca de Pneus',
    description: '', laborCost: '', notes: '',
  })
  const [items, setItems] = useState([])
  const [productSearch, setProductSearch] = useState('')
  const [productResults, setProductResults] = useState([])

  useEffect(() => {
    api.get('/users').then(r => setUsers(r.data)).catch(() => {})
    const preClientId = params.get('clientId')
    if (preClientId) {
      api.get(`/clients/${preClientId}`).then(r => {
        setSelectedClient(r.data)
        setVehicles(r.data.vehicles || [])
      }).catch(() => {})
    }
  }, [])

  // Client search
  useEffect(() => {
    if (!clientSearch.trim()) { setClientResults([]); return }
    const t = setTimeout(async () => {
      const { data } = await api.get(`/clients/search?q=${encodeURIComponent(clientSearch)}`)
      setClientResults(data)
    }, 300)
    return () => clearTimeout(t)
  }, [clientSearch])

  // Product search for items
  useEffect(() => {
    if (!productSearch.trim()) { setProductResults([]); return }
    const t = setTimeout(async () => {
      const { data } = await api.get(`/products/search?q=${encodeURIComponent(productSearch)}`)
      setProductResults(data)
    }, 300)
    return () => clearTimeout(t)
  }, [productSearch])

  const selectClient = async (c) => {
    setSelectedClient(c)
    setClientSearch('')
    setClientResults([])
    const { data } = await api.get(`/vehicles?clientId=${c.id}`)
    setVehicles(data)
  }

  const addProduct = (p) => {
    setItems(i => [...i, {
      productId: p.id, description: p.name,
      quantity: 1, unitPrice: Number(p.salePrice),
    }])
    setProductSearch('')
    setProductResults([])
  }

  const addManualItem = () => setItems(i => [...i, { productId: null, description: '', quantity: 1, unitPrice: 0 }])
  const updateItem = (idx, field, val) => setItems(i => i.map((item, j) => j === idx ? { ...item, [field]: val } : item))
  const removeItem = (idx) => setItems(i => i.filter((_, j) => j !== idx))

  const laborCost = Number(form.laborCost || 0)
  const partsCost = items.reduce((acc, i) => acc + Number(i.unitPrice || 0) * Number(i.quantity || 1), 0)
  const total = laborCost + partsCost

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedClient) { toast.error('Selecione um cliente'); return }
    setLoading(true)
    try {
      const { data } = await api.post('/services', {
        clientId: selectedClient.id,
        vehicleId: form.vehicleId || null,
        assignedToId: form.assignedToId || null,
        type: form.type,
        description: form.description,
        laborCost,
        items: items.map(i => ({ ...i, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) })),
        notes: form.notes,
      })
      toast.success('Ordem de serviço criada!')
      navigate(`/services/${data.id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao criar OS')
    } finally { setLoading(false) }
  }

  const set = (f) => (e) => setForm(x => ({ ...x, [f]: e.target.value }))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2"><ArrowLeft size={18} /></button>
        <div>
          <h1 className="text-xl font-display font-bold text-white">Nova Ordem de Serviço</h1>
          <p className="text-xs text-white/35">Preencha os dados da OS</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {/* Client */}
            <div className="glass-card p-5">
              <h2 className="font-display font-semibold text-white mb-4">Cliente *</h2>
              {selectedClient ? (
                <div className="flex items-center justify-between p-3 bg-brand-600/10 border border-brand-500/20 rounded-xl">
                  <div>
                    <p className="font-medium text-white">{selectedClient.name}</p>
                    <p className="text-xs text-white/40">{selectedClient.phone}</p>
                  </div>
                  <button type="button" onClick={() => { setSelectedClient(null); setVehicles([]) }} className="text-white/30 hover:text-white/60">✕</button>
                </div>
              ) : (
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input value={clientSearch} onChange={e => setClientSearch(e.target.value)}
                    className="input-field pl-9" placeholder="Buscar cliente..." />
                  {clientResults.length > 0 && (
                    <div className="absolute top-full mt-1 w-full bg-surface-600 border border-white/10 rounded-xl overflow-hidden z-20">
                      {clientResults.map(c => (
                        <button key={c.id} type="button" onClick={() => selectClient(c)}
                          className="w-full text-left px-3 py-2.5 hover:bg-white/5 border-b border-white/[0.05] last:border-0 transition-colors">
                          <p className="text-sm text-white">{c.name}</p>
                          <p className="text-xs text-white/35">{c.phone}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {vehicles.length > 0 && (
                <div className="mt-3">
                  <label className="label">Veículo</label>
                  <select value={form.vehicleId} onChange={set('vehicleId')} className="input-field">
                    <option value="">Selecionar veículo...</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.brand} {v.model} {v.year} · {v.plate}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Service info */}
            <div className="glass-card p-5">
              <h2 className="font-display font-semibold text-white mb-4">Serviço</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Tipo *</label>
                  <select value={form.type} onChange={set('type')} className="input-field">
                    {SERVICE_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Responsável</label>
                  <select value={form.assignedToId} onChange={set('assignedToId')} className="input-field">
                    <option value="">Não atribuído</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="label">Descrição / Sintoma</label>
                  <textarea value={form.description} onChange={set('description')} className="input-field h-20 resize-none" placeholder="Descreva o problema relatado pelo cliente..." />
                </div>
                <div>
                  <label className="label">Custo de Mão de Obra (R$)</label>
                  <input type="number" step="0.01" min={0} value={form.laborCost} onChange={set('laborCost')} className="input-field" placeholder="0,00" />
                </div>
                <div>
                  <label className="label">Observações</label>
                  <input value={form.notes} onChange={set('notes')} className="input-field" placeholder="Notas internas..." />
                </div>
              </div>
            </div>

            {/* Parts / Items */}
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold text-white">Peças e Materiais</h2>
                <button type="button" onClick={addManualItem} className="btn-secondary text-sm flex items-center gap-1.5">
                  <Plus size={14} /> Item Manual
                </button>
              </div>
              {/* Product search for items */}
              <div className="relative mb-4">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input value={productSearch} onChange={e => setProductSearch(e.target.value)}
                  className="input-field pl-9 text-sm" placeholder="Adicionar produto do estoque..." />
                {productResults.length > 0 && (
                  <div className="absolute top-full mt-1 w-full bg-surface-600 border border-white/10 rounded-xl overflow-hidden z-20">
                    {productResults.map(p => (
                      <button key={p.id} type="button" onClick={() => addProduct(p)}
                        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/5 border-b border-white/[0.05] last:border-0 text-left transition-colors">
                        <p className="text-sm text-white">{p.name}</p>
                        <p className="text-sm font-semibold text-accent-green">{formatCurrency(p.salePrice)}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <input value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)}
                        className="input-field text-sm" placeholder="Descrição..." />
                    </div>
                    <div className="col-span-2">
                      <input type="number" min={1} value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)}
                        className="input-field text-sm text-center" />
                    </div>
                    <div className="col-span-3">
                      <input type="number" step="0.01" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', e.target.value)}
                        className="input-field text-sm" placeholder="Valor" />
                    </div>
                    <div className="col-span-1 text-right text-sm font-medium text-white/60">
                      {formatCurrency(Number(item.unitPrice || 0) * Number(item.quantity || 1))}
                    </div>
                    <div className="col-span-1 text-right">
                      <button type="button" onClick={() => removeItem(idx)} className="text-white/20 hover:text-accent-red transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <p className="text-sm text-white/25 text-center py-4">Nenhum item adicionado</p>
                )}
              </div>
            </div>
          </div>

          {/* Summary sidebar */}
          <div className="space-y-4">
            <div className="glass-card p-5">
              <h2 className="font-display font-semibold text-white mb-4">Resumo da OS</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-white/60">
                  <span>Mão de obra</span><span>{formatCurrency(laborCost)}</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Peças</span><span>{formatCurrency(partsCost)}</span>
                </div>
                <div className="border-t border-white/[0.05] pt-2 flex justify-between font-bold text-lg text-white">
                  <span>Total</span>
                  <span className="text-accent-green">{formatCurrency(total)}</span>
                </div>
              </div>
              <button type="submit" disabled={loading || !selectedClient}
                className="btn-primary w-full mt-4 py-3 flex items-center justify-center gap-2 disabled:opacity-40">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><CheckCircle size={18} /> Criar OS</>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
