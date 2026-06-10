import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Search, Users, Phone, MessageCircle, ChevronRight, Filter } from 'lucide-react'
import api from '../../services/api'
import { PageHeader, EmptyState, Pagination, Skeleton } from '../../components/ui/index'
import { formatDocument, formatPhone } from '../../utils/format'
import toast from 'react-hot-toast'

export default function ClientsPage() {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const limit = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (search.trim()) {
        const { data } = await api.get(`/clients/search?q=${encodeURIComponent(search)}`)
        setClients(data)
        setTotal(data.length)
      } else {
        const { data } = await api.get(`/clients?page=${page}&limit=${limit}`)
        setClients(data.data)
        setTotal(data.total)
      }
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { load() }, [load])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [search])

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Clientes"
        subtitle={`${total} clientes cadastrados`}
        actions={
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} /> Novo Cliente
          </button>
        }
      />

      {/* Search */}
      <div className="glass-card p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9"
            placeholder="Buscar por nome, CPF/CNPJ, telefone ou e-mail..."
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.05]">
              <th className="table-header text-left">Cliente</th>
              <th className="table-header text-left hidden md:table-cell">Documento</th>
              <th className="table-header text-left hidden lg:table-cell">Contato</th>
              <th className="table-header text-center hidden sm:table-cell">Vendas</th>
              <th className="table-header text-center hidden sm:table-cell">Serviços</th>
              <th className="table-header text-right"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(8).fill(0).map((_, i) => (
                <tr key={i} className="border-b border-white/[0.05]">
                  <td className="table-cell"><Skeleton className="h-9 w-48" /></td>
                  <td className="table-cell hidden md:table-cell"><Skeleton className="h-4 w-32" /></td>
                  <td className="table-cell hidden lg:table-cell"><Skeleton className="h-4 w-32" /></td>
                  <td className="table-cell hidden sm:table-cell"><Skeleton className="h-4 w-8 mx-auto" /></td>
                  <td className="table-cell hidden sm:table-cell"><Skeleton className="h-4 w-8 mx-auto" /></td>
                  <td className="table-cell"><Skeleton className="h-4 w-4 ml-auto" /></td>
                </tr>
              ))
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16">
                  <EmptyState
                    icon={Users}
                    title={search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                    description={search ? 'Tente outros termos de busca' : 'Cadastre o primeiro cliente para começar'}
                    action={
                      !search && (
                        <button onClick={() => setShowModal(true)} className="btn-primary text-sm flex items-center gap-2 mx-auto">
                          <Plus size={15} /> Cadastrar Cliente
                        </button>
                      )
                    }
                  />
                </td>
              </tr>
            ) : (
              clients.map((c, i) => (
                <motion.tr
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="table-row cursor-pointer"
                  onClick={() => navigate(`/clients/${c.id}`)}
                >
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-brand-600/20 flex items-center justify-center shrink-0">
                        <span className="text-brand-300 text-xs font-bold">{c.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{c.name}</p>
                        {c.email && <p className="text-xs text-white/35 hidden sm:block">{c.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell hidden md:table-cell text-white/50 font-mono text-xs">
                    {formatDocument(c.document) || '—'}
                  </td>
                  <td className="table-cell hidden lg:table-cell">
                    <div className="flex items-center gap-3">
                      {c.phone && (
                        <span className="flex items-center gap-1 text-xs text-white/40">
                          <Phone size={12} /> {formatPhone(c.phone)}
                        </span>
                      )}
                      {c.whatsapp && (
                        <span className="flex items-center gap-1 text-xs text-accent-green">
                          <MessageCircle size={12} /> WA
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="table-cell hidden sm:table-cell text-center">
                    <span className="text-sm font-medium text-white/60">{c._count?.sales || 0}</span>
                  </td>
                  <td className="table-cell hidden sm:table-cell text-center">
                    <span className="text-sm font-medium text-white/60">{c._count?.services || 0}</span>
                  </td>
                  <td className="table-cell text-right">
                    <ChevronRight size={16} className="text-white/20 ml-auto" />
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
        {!loading && !search && (
          <div className="p-4">
            <Pagination page={page} total={total} limit={limit} onPage={setPage} />
          </div>
        )}
      </div>

      {/* New Client Modal */}
      {showModal && <NewClientModal onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); load() }} />}
    </div>
  )
}

function NewClientModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ name: '', document: '', documentType: 'CPF', phone: '', whatsapp: '', email: '', city: '', state: '' })
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/clients', form)
      toast.success('Cliente cadastrado com sucesso!')
      onSuccess()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao cadastrar cliente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-lg glass-card z-10"
      >
        <div className="flex items-center justify-between p-5 border-b border-white/[0.05]">
          <h2 className="font-display font-semibold text-white">Novo Cliente</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg text-white/40">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Nome completo *</label>
              <input value={form.name} onChange={set('name')} className="input-field" placeholder="João da Silva" required />
            </div>
            <div>
              <label className="label">Tipo documento</label>
              <select value={form.documentType} onChange={set('documentType')} className="input-field">
                <option value="CPF">CPF</option>
                <option value="CNPJ">CNPJ</option>
              </select>
            </div>
            <div>
              <label className="label">Documento</label>
              <input value={form.document} onChange={set('document')} className="input-field" placeholder="000.000.000-00" />
            </div>
            <div>
              <label className="label">Telefone</label>
              <input value={form.phone} onChange={set('phone')} className="input-field" placeholder="(11) 99999-0000" />
            </div>
            <div>
              <label className="label">WhatsApp</label>
              <input value={form.whatsapp} onChange={set('whatsapp')} className="input-field" placeholder="11999990000" />
            </div>
            <div className="col-span-2">
              <label className="label">E-mail</label>
              <input type="email" value={form.email} onChange={set('email')} className="input-field" placeholder="cliente@email.com" />
            </div>
            <div>
              <label className="label">Cidade</label>
              <input value={form.city} onChange={set('city')} className="input-field" placeholder="São Paulo" />
            </div>
            <div>
              <label className="label">Estado</label>
              <input value={form.state} onChange={set('state')} className="input-field" placeholder="SP" maxLength={2} />
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
