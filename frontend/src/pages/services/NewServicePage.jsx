import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Plus, Trash2, Search, CheckCircle, X } from 'lucide-react'
import api from '../../services/api'
import { Button, Input, FormGroup, Card } from '../../components/ui/index'
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
  const [showNewVehicleForm, setShowNewVehicleForm] = useState(false)
  const [newVehicle, setNewVehicle] = useState({ plate: '', brand: '', model: '', year: '', color: '' })
  const [savingVehicle, setSavingVehicle] = useState(false)

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

  const handleCreateVehicle = async (e) => {
    e.preventDefault()
    setSavingVehicle(true)
    try {
      const { data } = await api.post('/vehicles', {
        ...newVehicle,
        clientId: selectedClient.id,
        plate: newVehicle.plate.toUpperCase().trim(),
        year: Number(newVehicle.year),
      })
      setVehicles(v => [...v, data])
      setForm(f => ({ ...f, vehicleId: data.id }))
      setShowNewVehicleForm(false)
      setNewVehicle({ plate: '', brand: '', model: '', year: '', color: '' })
      toast.success('Veículo cadastrado!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao cadastrar veículo')
    } finally {
      setSavingVehicle(false)
    }
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
        <Button variant="ghost" size="md" onClick={() => navigate(-1)} className="!px-2"><ArrowLeft size={18} /></Button>
        <div>
          <h1 className="text-xl font-display font-bold text-white">Nova Ordem de Serviço</h1>
          <p className="text-xs text-white/35">Preencha os dados da OS</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {/* Client */}
            <Card>
              <h2 className="font-display font-semibold text-white mb-4">Cliente *</h2>
              {selectedClient ? (
                <div className="flex items-center justify-between p-3 bg-brand-500/10 border border-brand-500/15 rounded-xl">
                  <div>
                    <p className="font-medium text-white">{selectedClient.name}</p>
                    <p className="text-xs text-white/40">{selectedClient.phone}</p>
                  </div>
                  <button type="button" onClick={() => { setSelectedClient(null); setVehicles([]) }} className="text-white/30 hover:text-white/60">
                    <X size={16} />
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
                          <button key={c.id} type="button" onClick={() => selectClient(c)}
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
              {selectedClient && !showNewVehicleForm && (
                <div className="mt-3 space-y-2">
                  {vehicles.length > 0 && (
                    <FormGroup label="Veículo">
                      <select value={form.vehicleId} onChange={set('vehicleId')} className="input-field">
                        <option value="">Selecionar veículo...</option>
                        {vehicles.map(v => (
                          <option key={v.id} value={v.id}>{v.brand} {v.model} {v.year} · {v.plate}</option>
                        ))}
                      </select>
                    </FormGroup>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowNewVehicleForm(true)}
                    className="flex items-center gap-1.5 text-xs text-brand-500 hover:text-brand-400 transition-colors"
                  >
                    <Plus size={13} /> {vehicles.length > 0 ? 'Cadastrar outro veículo' : 'Cliente sem veículo cadastrado — adicionar agora'}
                  </button>
                </div>
              )}

              {selectedClient && showNewVehicleForm && (
                <div className="mt-3 p-3 bg-surface-600/40 rounded-xl border border-white/[0.05] space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-white/60">Novo veículo</p>
                    <button type="button" onClick={() => setShowNewVehicleForm(false)} className="text-white/30 hover:text-white/60">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input value={newVehicle.plate} onChange={e => setNewVehicle(v => ({ ...v, plate: e.target.value }))} placeholder="Placa" className="uppercase" />
                    <Input type="number" value={newVehicle.year} onChange={e => setNewVehicle(v => ({ ...v, year: e.target.value }))} placeholder="Ano" />
                    <Input value={newVehicle.brand} onChange={e => setNewVehicle(v => ({ ...v, brand: e.target.value }))} placeholder="Marca" />
                    <Input value={newVehicle.model} onChange={e => setNewVehicle(v => ({ ...v, model: e.target.value }))} placeholder="Modelo" />
                    <Input value={newVehicle.color} onChange={e => setNewVehicle(v => ({ ...v, color: e.target.value }))} placeholder="Cor" className="col-span-2" />
                  </div>
                  <Button type="button" size="sm" className="w-full" loading={savingVehicle}
                    disabled={!newVehicle.plate || !newVehicle.brand || !newVehicle.model || !newVehicle.year}
                    onClick={handleCreateVehicle}>
                    {savingVehicle ? 'Salvando...' : 'Salvar veículo'}
                  </Button>
                </div>
              )}
            </Card>

            {/* Service info */}
            <Card>
              <h2 className="font-display font-semibold text-white mb-4">Serviço</h2>
              <div className="grid grid-cols-2 gap-4">
                <FormGroup label="Tipo" required>
                  <select value={form.type} onChange={set('type')} className="input-field">
                    {SERVICE_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </FormGroup>
                <FormGroup label="Responsável">
                  <select value={form.assignedToId} onChange={set('assignedToId')} className="input-field">
                    <option value="">Não atribuído</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </FormGroup>
                <div className="col-span-2">
                  <FormGroup label="Descrição / Sintoma">
                    <textarea value={form.description} onChange={set('description')} className="input-field h-20 resize-none" placeholder="Descreva o problema relatado pelo cliente..." />
                  </FormGroup>
                </div>
                <FormGroup label="Custo de Mão de Obra (R$)">
                  <Input type="number" step="0.01" min={0} value={form.laborCost} onChange={set('laborCost')} placeholder="0,00" />
                </FormGroup>
                <FormGroup label="Observações">
                  <Input value={form.notes} onChange={set('notes')} placeholder="Notas internas..." />
                </FormGroup>
              </div>
            </Card>

            {/* Parts / Items */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold text-white">Peças e Materiais</h2>
                <Button type="button" variant="secondary" size="sm" icon={Plus} onClick={addManualItem}>Item Manual</Button>
              </div>
              {/* Product search for items */}
              <div className="relative mb-4">
                <Input icon={Search} value={productSearch} onChange={e => setProductSearch(e.target.value)}
                  className="text-sm" placeholder="Adicionar produto do estoque..." />
                <AnimatePresence>
                  {productResults.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute top-full mt-1 w-full bg-surface-700 border border-white/10 rounded-xl overflow-hidden z-20">
                      {productResults.map(p => (
                        <button key={p.id} type="button" onClick={() => addProduct(p)}
                          className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/5 border-b border-white/[0.05] last:border-0 text-left transition-colors">
                          <p className="text-sm text-white">{p.name}</p>
                          <p className="text-sm font-semibold text-accent-green">{formatCurrency(p.salePrice)}</p>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
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
            </Card>
          </div>

          {/* Summary sidebar */}
          <div className="space-y-4">
            <Card>
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
              <Button type="submit" disabled={!selectedClient} loading={loading} size="lg" icon={CheckCircle} className="w-full mt-4">
                Criar OS
              </Button>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
