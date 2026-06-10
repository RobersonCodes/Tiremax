import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Search, Package, AlertTriangle, TrendingDown, TrendingUp, ChevronRight } from 'lucide-react'
import api from '../../services/api'
import { PageHeader, EmptyState, Pagination, Skeleton } from '../../components/ui/index'
import { formatCurrency } from '../../utils/format'
import toast from 'react-hot-toast'

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
          <div className="flex gap-2">
            <button onClick={() => navigate('/inventory/movements')} className="btn-secondary text-sm flex items-center gap-1.5">
              <TrendingUp size={15} /> Movimentações
            </button>
            <button onClick={() => setShowModal(true)} className="btn-primary text-sm flex items-center gap-1.5">
              <Plus size={15} /> Novo Produto
            </button>
          </div>
        }
      />

      {/* Search + Filter */}
      <div className="glass-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9"
            placeholder="Buscar por nome, código, marca..."
          />
        </div>
        <div className="flex gap-1 bg-surface-600/50 p-1 rounded-xl">
          {['all', 'low', 'out'].map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === t ? 'bg-brand-600 text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {t === 'all' ? 'Todos' : t === 'low' ? '⚠ Baixo' : '✕ Zerado'}
            </button>
          ))}
        </div>
      </div>

      {/* Products table */}
      <div className="glass-card overflow-hidden">
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
                <td colSpan={7} className="py-16">
                  <EmptyState
                    icon={Package}
                    title="Nenhum produto encontrado"
                    description="Cadastre produtos para gerenciar o estoque"
                    action={
                      <button onClick={() => setShowModal(true)} className="btn-primary text-sm flex items-center gap-2 mx-auto">
                        <Plus size={15} /> Cadastrar Produto
                      </button>
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
                      className="table-row cursor-pointer"
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

      {showModal && <NewProductModal onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); load() }} />}
    </div>
  )
}

function NewProductModal({ onClose, onSuccess }) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-lg glass-card z-10"
      >
        <div className="flex items-center justify-between p-5 border-b border-white/[0.05]">
          <h2 className="font-display font-semibold text-white">Novo Produto</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg text-white/40">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Código *</label>
              <input value={form.code} onChange={set('code')} className="input-field" placeholder="PNE001" required />
            </div>
            <div>
              <label className="label">Unidade</label>
              <select value={form.unit} onChange={set('unit')} className="input-field">
                {['UN', 'JG', 'LT', 'KG', 'MT', 'PC'].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Nome *</label>
              <input value={form.name} onChange={set('name')} className="input-field" placeholder="Nome do produto" required />
            </div>
            <div>
              <label className="label">Marca</label>
              <input value={form.brand} onChange={set('brand')} className="input-field" placeholder="Michelin" />
            </div>
            <div>
              <label className="label">Estoque inicial</label>
              <input type="number" value={form.stock} onChange={set('stock')} className="input-field" min={0} />
            </div>
            <div>
              <label className="label">Custo (R$) *</label>
              <input type="number" step="0.01" value={form.costPrice} onChange={set('costPrice')} className="input-field" placeholder="0,00" required />
            </div>
            <div>
              <label className="label">Venda (R$) *</label>
              <input type="number" step="0.01" value={form.salePrice} onChange={set('salePrice')} className="input-field" placeholder="0,00" required />
            </div>
            <div>
              <label className="label">Estoque mínimo</label>
              <input type="number" value={form.minStock} onChange={set('minStock')} className="input-field" min={0} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Salvando...' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
