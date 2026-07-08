import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Search, Package, AlertTriangle, TrendingUp, ChevronRight } from 'lucide-react'
import api from '../../services/api'
import { PageHeader, EmptyState, Pagination, Skeleton, Button, Input, Modal, FormGroup } from '../../components/ui/index'
import { formatCurrency } from '../../utils/format'
import toast from 'react-hot-toast'

const TABS = [
  { id: 'all', label: 'Todos' },
  { id: 'low', label: 'Baixo' },
  { id: 'out', label: 'Zerado' },
]

export default function InventoryPage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const limit = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (search.trim()) {
        const { data } = await api.get(`/products/search?q=${encodeURIComponent(search)}`)
        setProducts(data)
        setTotal(data.length)
      } else {
        const { data } = await api.get(`/products?page=${page}&limit=${limit}&active=true`)
        setProducts(data.data)
        setTotal(data.total)
      }
    } finally {
      setLoading(false) }
  }, [page, search])

  useEffect(() => { load() }, [load])

  const stockStatus = (p) => {
    if (p.stock === 0) return { label: 'Sem Estoque', color: 'text-accent-red', bg: 'bg-accent-red/10' }
    if (p.stock <= p.minStock) return { label: 'Estoque Baixo', color: 'text-accent-amber', bg: 'bg-accent-amber/10' }
    return { label: 'Normal', color: 'text-accent-green', bg: 'bg-accent-green/10' }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Estoque"
        subtitle={`${total} produtos cadastrados`}
        actions={
          <>
            <Button variant="secondary" icon={TrendingUp} onClick={() => navigate('/inventory/movements')}>
              Movimentações
            </Button>
            <Button icon={Plus} onClick={() => setShowModal(true)}>
              Novo Produto
            </Button>
          </>
        }
      />

      {/* Search + Filter */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input icon={Search} value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, código, marca..." />
        </div>
        <div className="flex gap-1 bg-surface-700/50 p-1 rounded-xl w-fit">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ease-out-expo ${
                activeTab === t.id ? 'bg-brand-500 text-[#08090a] font-semibold' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Products table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.05]">
              <th className="table-header text-left">Produto</th>
              <th className="table-header text-left hidden md:table-cell">Código</th>
              <th className="table-header text-left hidden lg:table-cell">Marca</th>
              <th className="table-header text-center">Estoque</th>
              <th className="table-header text-right hidden sm:table-cell">Preço Venda</th>
              <th className="table-header text-center">Status</th>
              <th className="table-header"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(8).fill(0).map((_, i) => (
                <tr key={i} className="border-b border-white/[0.05]">
                  {Array(7).fill(0).map((_, j) => (
                    <td key={j} className="table-cell"><Skeleton className="h-4" /></td>
                  ))}
                </tr>
              ))
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-4">
                  <EmptyState
                    icon={Package}
                    title="Nenhum produto encontrado"
                    description="Cadastre produtos para gerenciar o estoque"
                    action={
                      <Button size="sm" icon={Plus} onClick={() => setShowModal(true)}>
                        Cadastrar Produto
                      </Button>
                    }
                  />
                </td>
              </tr>
            ) : (
              products
                .filter(p => {
                  if (activeTab === 'low') return p.stock <= p.minStock && p.stock > 0
                  if (activeTab === 'out') return p.stock === 0
                  return true
                })
                .map((p, i) => {
                  const status = stockStatus(p)
                  return (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="table-row"
                      onClick={() => navigate(`/inventory/${p.id}`)}
                    >
                      <td className="table-cell">
                        <div>
                          <p className="text-sm font-medium text-white">{p.name}</p>
                          {p.category && <p className="text-xs text-white/30">{p.category.name}</p>}
                        </div>
                      </td>
                      <td className="table-cell hidden md:table-cell">
                        <span className="font-mono text-xs text-white/50">{p.code}</span>
                      </td>
                      <td className="table-cell hidden lg:table-cell text-white/50 text-sm">{p.brand || '—'}</td>
                      <td className="table-cell text-center">
                        <span className={`font-bold text-sm ${p.stock === 0 ? 'text-accent-red' : p.stock <= p.minStock ? 'text-accent-amber' : 'text-white'}`}>
                          {p.stock} <span className="text-white/30 font-normal text-xs">{p.unit}</span>
                        </span>
                      </td>
                      <td className="table-cell hidden sm:table-cell text-right font-semibold text-white">
                        {formatCurrency(p.salePrice)}
                      </td>
                      <td className="table-cell text-center">
                        <span className={`badge text-xs ${status.bg} ${status.color}`}>
                          {p.stock === 0 && <AlertTriangle size={11} />}
                          {status.label}
                        </span>
                      </td>
                      <td className="table-cell">
                        <ChevronRight size={15} className="text-white/20 ml-auto" />
                      </td>
                    </motion.tr>
                  )
                })
            )}
          </tbody>
        </table>
        {!loading && !search && (
          <div className="p-4">
            <Pagination page={page} total={total} limit={limit} onPage={setPage} />
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Novo Produto">
        <NewProductForm onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); load() }} />
      </Modal>
    </div>
  )
}

function NewProductForm({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    code: '', name: '', brand: '', unit: 'UN',
    costPrice: '', salePrice: '', stock: 0, minStock: 5,
  })
  const [loading, setLoading] = useState(false)
  const set = (f) => (e) => setForm(x => ({ ...x, [f]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/products', {
        ...form,
        costPrice: Number(form.costPrice),
        salePrice: Number(form.salePrice),
        stock: Number(form.stock),
        minStock: Number(form.minStock),
      })
      toast.success('Produto cadastrado!')
      onSuccess()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao cadastrar produto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormGroup label="Código" required>
          <Input value={form.code} onChange={set('code')} placeholder="PNE001" required />
        </FormGroup>
        <FormGroup label="Unidade">
          <select value={form.unit} onChange={set('unit')} className="input-field">
            {['UN', 'JG', 'LT', 'KG', 'MT', 'PC'].map(u => <option key={u}>{u}</option>)}
          </select>
        </FormGroup>
        <div className="col-span-2">
          <FormGroup label="Nome" required>
            <Input value={form.name} onChange={set('name')} placeholder="Nome do produto" required />
          </FormGroup>
        </div>
        <FormGroup label="Marca">
          <Input value={form.brand} onChange={set('brand')} placeholder="Michelin" />
        </FormGroup>
        <FormGroup label="Estoque inicial">
          <Input type="number" value={form.stock} onChange={set('stock')} min={0} />
        </FormGroup>
        <FormGroup label="Custo (R$)" required>
          <Input type="number" step="0.01" value={form.costPrice} onChange={set('costPrice')} placeholder="0,00" required />
        </FormGroup>
        <FormGroup label="Venda (R$)" required>
          <Input type="number" step="0.01" value={form.salePrice} onChange={set('salePrice')} placeholder="0,00" required />
        </FormGroup>
        <FormGroup label="Estoque mínimo">
          <Input type="number" value={form.minStock} onChange={set('minStock')} min={0} />
        </FormGroup>
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancelar</Button>
        <Button type="submit" className="flex-1" loading={loading}>
          {loading ? 'Salvando...' : 'Cadastrar'}
        </Button>
      </div>
    </form>
  )
}
