import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Search, Users, Phone, MessageCircle, ChevronRight } from 'lucide-react'
import api from '../../services/api'
import { PageHeader, EmptyState, Pagination, Skeleton, Card, Button, Input, Modal, FormGroup } from '../../components/ui/index'
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
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Clientes"
        subtitle={`${total} clientes cadastrados`}
        actions={
          <Button icon={Plus} onClick={() => setShowModal(true)}>
            Novo Cliente
          </Button>
        }
      />

      {/* Search */}
      <Card>
        <Input
          icon={Search}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome, CPF/CNPJ, telefone ou e-mail..."
        />
      </Card>

      {/* Table */}
      <div className="card overflow-hidden">
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
                <td colSpan={6} className="py-4">
                  <EmptyState
                    icon={Users}
                    title={search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                    description={search ? 'Tente outros termos de busca' : 'Cadastre o primeiro cliente para começar'}
                    action={
                      !search && (
                        <Button size="sm" icon={Plus} onClick={() => setShowModal(true)}>
                          Cadastrar Cliente
                        </Button>
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
                  className="table-row"
                  onClick={() => navigate(`/clients/${c.id}`)}
                >
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/15 flex items-center justify-center shrink-0">
                        <span className="text-brand-500 text-xs font-bold">{c.name.charAt(0).toUpperCase()}</span>
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
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Novo Cliente">
        <NewClientForm onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); load() }} />
      </Modal>
    </div>
  )
}

function NewClientForm({ onClose, onSuccess }) {
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <FormGroup label="Nome completo" required>
            <Input value={form.name} onChange={set('name')} placeholder="João da Silva" required />
          </FormGroup>
        </div>
        <FormGroup label="Tipo documento">
          <select value={form.documentType} onChange={set('documentType')} className="input-field">
            <option value="CPF">CPF</option>
            <option value="CNPJ">CNPJ</option>
          </select>
        </FormGroup>
        <FormGroup label="Documento">
          <Input value={form.document} onChange={set('document')} placeholder="000.000.000-00" />
        </FormGroup>
        <FormGroup label="Telefone">
          <Input value={form.phone} onChange={set('phone')} placeholder="(11) 99999-0000" />
        </FormGroup>
        <FormGroup label="WhatsApp">
          <Input value={form.whatsapp} onChange={set('whatsapp')} placeholder="11999990000" />
        </FormGroup>
        <div className="col-span-2">
          <FormGroup label="E-mail">
            <Input type="email" value={form.email} onChange={set('email')} placeholder="cliente@email.com" />
          </FormGroup>
        </div>
        <FormGroup label="Cidade">
          <Input value={form.city} onChange={set('city')} placeholder="São Paulo" />
        </FormGroup>
        <FormGroup label="Estado">
          <Input value={form.state} onChange={set('state')} placeholder="SP" maxLength={2} />
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
