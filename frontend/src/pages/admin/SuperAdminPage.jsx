import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users, Building2, ShieldCheck, ShieldX, CreditCard, RefreshCw, Plus, Search,
  Mail, Phone, Wrench, Calendar,
} from 'lucide-react'
import api from '../../services/api'
import { PageHeader, Card, Button, Input, FormGroup } from '../../components/ui/index'
import toast from 'react-hot-toast'

const PLAN_LABELS = { TRIAL: 'Trial', STARTER: 'Starter', PRO: 'Pro', ENTERPRISE: 'Enterprise' }

const CREATE_FIELDS = [
  { key: 'name', label: 'Nome da Borracharia', required: true, placeholder: 'Borracharia do João' },
  { key: 'adminName', label: 'Nome do Admin', placeholder: 'João Silva' },
  { key: 'adminEmail', label: 'Email do Admin', required: true, placeholder: 'joao@email.com' },
  { key: 'adminPassword', label: 'Senha', required: true, placeholder: 'Mínimo 6 chars', type: 'password' },
  { key: 'phone', label: 'Telefone', placeholder: '(51) 99999-9999' },
  { key: 'cnpj', label: 'CNPJ', placeholder: '00.000.000/0001-00' },
]

export default function SuperAdminPage() {
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', adminName: '', adminEmail: '', adminPassword: '', phone: '', cnpj: '', plan: 'TRIAL' })
  const [createdLogin, setCreatedLogin] = useState(null)

  const fetchTenants = async () => {
    try {
      const { data } = await api.get('/tenants')
      setTenants(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTenants() }, [])

  const filtered = tenants.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.email?.toLowerCase().includes(search.toLowerCase())
  )

  const toggleStatus = async (t) => {
    const newStatus = t.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
    await api.put(`/tenants/${t.id}/status`, { status: newStatus })
    fetchTenants()
  }

  const changePlan = async (t, plan) => {
    await api.put(`/tenants/${t.id}/plan`, { plan })
    fetchTenants()
  }

  const handleCreate = async () => {
    setCreatedLogin(null)
    if (!form.name || !form.adminEmail || !form.adminPassword) {
      toast.error('Preencha nome, email e senha')
      return
    }
    try {
      setCreating(true)
      const { data } = await api.post('/tenants', form)
      setCreatedLogin({ tenantName: data.tenant.name, ...data.login })
      toast.success('Borracharia criada com sucesso!')
      fetchTenants()
      setForm({ name: '', adminName: '', adminEmail: '', adminPassword: '', phone: '', cnpj: '', plan: 'TRIAL' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao criar borracharia')
    } finally {
      setCreating(false)
    }
  }

  const trialDaysLeft = (t) => {
    if (!t.trialEndsAt) return null
    const days = Math.ceil((new Date(t.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24))
    return days
  }

  const stats = {
    total: tenants.length,
    active: tenants.filter(t => t.status === 'ACTIVE').length,
    trial: tenants.filter(t => t.plan === 'TRIAL').length,
    paid: tenants.filter(t => t.plan !== 'TRIAL').length,
  }

  const statCards = [
    { label: 'Total', value: stats.total, icon: Building2, cls: 'bg-blue-500/10 border-blue-500/15 text-blue-400' },
    { label: 'Ativas', value: stats.active, icon: ShieldCheck, cls: 'bg-green-500/10 border-green-500/15 text-green-400' },
    { label: 'Em Trial', value: stats.trial, icon: RefreshCw, cls: 'bg-brand-500/10 border-brand-500/15 text-brand-500' },
    { label: 'Pagantes', value: stats.paid, icon: CreditCard, cls: 'bg-purple-500/10 border-purple-500/15 text-purple-400' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Painel Super Admin"
        subtitle="Gerencie todas as borracharias"
        actions={
          <Button icon={Plus} onClick={() => setShowCreate(v => !v)}>
            Nova Borracharia
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="card p-5">
            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center mb-3 ${s.cls}`}>
              <s.icon size={15} />
            </div>
            <p className="font-display font-bold text-2xl text-white tracking-tight">{s.value}</p>
            <p className="text-xs text-white/35 mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Criar nova borracharia */}
      {showCreate && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-t-2 border-t-brand-500">
            <h3 className="font-display font-semibold text-sm uppercase tracking-wide text-white/70 mb-4">Nova Borracharia</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {CREATE_FIELDS.map(f => (
                <FormGroup key={f.key} label={f.label} required={f.required}>
                  <Input
                    value={form[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    type={f.type || 'text'}
                  />
                </FormGroup>
              ))}
              <FormGroup label="Plano">
                <select value={form.plan} onChange={e => setForm(p => ({ ...p, plan: e.target.value }))} className="input-field">
                  <option value="TRIAL">Trial (30 dias)</option>
                  <option value="STARTER">Starter</option>
                  <option value="PRO">Pro</option>
                  <option value="ENTERPRISE">Enterprise</option>
                </select>
              </FormGroup>
            </div>
            {createdLogin && (
              <div className="mt-4 bg-brand-500/10 border border-brand-500/20 rounded-lg p-3 text-sm text-white/80">
                <strong className="text-white">{createdLogin.tenantName}</strong> criada! Login: <span className="font-mono">{createdLogin.email}</span> / <span className="font-mono">{createdLogin.password}</span>
              </div>
            )}
            <Button className="mt-4" loading={creating} onClick={handleCreate}>
              {creating ? 'Criando...' : 'Criar Borracharia'}
            </Button>
          </Card>
        </motion.div>
      )}

      {/* Busca */}
      <Card>
        <Input icon={Search} value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar borracharia..." />
      </Card>

      {/* Lista de tenants */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center text-white/30 py-10">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-white/30 py-10">Nenhuma borracharia encontrada</div>
        ) : filtered.map((t, i) => {
          const days = trialDaysLeft(t)
          return (
            <motion.div key={t.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="card-hover p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-semibold text-white">{t.name}</h3>
                    <span className={t.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}>
                      {t.status === 'ACTIVE' ? 'Ativo' : 'Suspenso'}
                    </span>
                    <span className="badge-neutral">{PLAN_LABELS[t.plan] || t.plan}</span>
                    {t.plan === 'TRIAL' && days !== null && (
                      <span className={days <= 5 ? 'badge-danger' : 'badge-warning'}>
                        {days > 0 ? `${days} dias restantes` : 'Trial expirado'}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4 mt-2.5 text-xs text-white/40 flex-wrap">
                    {t.email && <span className="flex items-center gap-1"><Mail size={12} /> {t.email}</span>}
                    {t.phone && <span className="flex items-center gap-1"><Phone size={12} /> {t.phone}</span>}
                    <span className="flex items-center gap-1"><Users size={12} /> {t._count?.users || 0} usuários</span>
                    <span className="flex items-center gap-1"><Users size={12} /> {t._count?.clients || 0} clientes</span>
                    <span className="flex items-center gap-1"><Wrench size={12} /> {t._count?.services || 0} serviços</span>
                    <span className="flex items-center gap-1 text-white/25"><Calendar size={12} /> {new Date(t.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <select onChange={e => changePlan(t, e.target.value)} value={t.plan}
                    className="bg-surface-700 border border-white/[0.07] rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/35 focus:border-brand-500/40">
                    <option value="TRIAL">Trial</option>
                    <option value="STARTER">Starter</option>
                    <option value="PRO">Pro</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>
                  <button onClick={() => toggleStatus(t)}
                    className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-semibold border transition-all duration-200 ease-out-expo ${
                      t.status === 'ACTIVE'
                        ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/[0.16]'
                        : 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/[0.16]'
                    }`}>
                    {t.status === 'ACTIVE' ? <><ShieldX size={12} /> Suspender</> : <><ShieldCheck size={12} /> Ativar</>}
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
