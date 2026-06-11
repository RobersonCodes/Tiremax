import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Building2, ShieldCheck, ShieldX, CreditCard, RefreshCw, Plus, Search } from 'lucide-react'
import api from '../../services/api'

const PLAN_LABELS = { TRIAL: '🎁 Trial', STARTER: '⭐ Starter', PRO: '🚀 Pro', ENTERPRISE: '💎 Enterprise' }
const STATUS_LABELS = { ACTIVE: '✅ Ativo', SUSPENDED: '🔴 Suspenso' }

export default function SuperAdminPage() {
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', adminName: '', adminEmail: '', adminPassword: '', phone: '', cnpj: '', plan: 'TRIAL' })
  const [createMsg, setCreateMsg] = useState('')

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
    setCreateMsg('')
    if (!form.name || !form.adminEmail || !form.adminPassword) {
      setCreateMsg('Preencha nome, email e senha')
      return
    }
    try {
      setCreating(true)
      const { data } = await api.post('/tenants', form)
      setCreateMsg(`✅ ${data.tenant.name} criada! Login: ${data.login.email} / ${data.login.password}`)
      fetchTenants()
      setForm({ name: '', adminName: '', adminEmail: '', adminPassword: '', phone: '', cnpj: '', plan: 'TRIAL' })
    } catch (err) {
      setCreateMsg('❌ ' + (err.response?.data?.message || 'Erro'))
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="text-yellow-400" size={28} />
            Painel Super Admin
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Gerencie todas as borracharias</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 bg-yellow-400 text-black font-bold px-4 py-2 rounded-lg hover:bg-yellow-300 transition">
          <Plus size={18} /> Nova Borracharia
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total', value: stats.total, icon: Building2, color: 'text-blue-400' },
          { label: 'Ativas', value: stats.active, icon: ShieldCheck, color: 'text-green-400' },
          { label: 'Em Trial', value: stats.trial, icon: RefreshCw, color: 'text-yellow-400' },
          { label: 'Pagantes', value: stats.paid, icon: CreditCard, color: 'text-purple-400' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
            <s.icon size={20} className={s.color} />
            <p className="text-2xl font-bold text-white mt-2">{s.value}</p>
            <p className="text-zinc-400 text-sm">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Criar nova borracharia */}
      {showCreate && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 rounded-xl p-6 border border-yellow-400/30 mb-6">
          <h3 className="text-yellow-400 font-bold mb-4">Nova Borracharia</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { key: 'name', label: 'Nome da Borracharia *', placeholder: 'Borracharia do João' },
              { key: 'adminName', label: 'Nome do Admin', placeholder: 'João Silva' },
              { key: 'adminEmail', label: 'Email do Admin *', placeholder: 'joao@email.com' },
              { key: 'adminPassword', label: 'Senha *', placeholder: 'Mínimo 6 chars' },
              { key: 'phone', label: 'Telefone', placeholder: '(51) 99999-9999' },
              { key: 'cnpj', label: 'CNPJ', placeholder: '00.000.000/0001-00' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-zinc-400 text-xs mb-1">{f.label}</label>
                <input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder} type={f.key === 'adminPassword' ? 'password' : 'text'}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-yellow-400" />
              </div>
            ))}
            <div>
              <label className="block text-zinc-400 text-xs mb-1">Plano</label>
              <select value={form.plan} onChange={e => setForm(p => ({ ...p, plan: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-400">
                <option value="TRIAL">Trial (30 dias)</option>
                <option value="STARTER">Starter</option>
                <option value="PRO">Pro</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>
          </div>
          {createMsg && <p className="mt-3 text-sm text-zinc-300 bg-zinc-800 rounded p-2">{createMsg}</p>}
          <button onClick={handleCreate} disabled={creating}
            className="mt-4 bg-yellow-400 text-black font-bold px-6 py-2 rounded-lg hover:bg-yellow-300 transition disabled:opacity-50">
            {creating ? 'Criando...' : 'Criar Borracharia'}
          </button>
        </motion.div>
      )}

      {/* Busca */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar borracharia..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400" />
      </div>

      {/* Lista de tenants */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center text-zinc-500 py-10">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-zinc-500 py-10">Nenhuma borracharia encontrada</div>
        ) : filtered.map((t, i) => {
          const days = trialDaysLeft(t)
          return (
            <motion.div key={t.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="bg-zinc-900 rounded-xl p-5 border border-zinc-800 hover:border-zinc-700 transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-bold text-white">{t.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {STATUS_LABELS[t.status]}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                      {PLAN_LABELS[t.plan] || t.plan}
                    </span>
                    {t.plan === 'TRIAL' && days !== null && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${days <= 5 ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {days > 0 ? `${days} dias restantes` : 'Trial expirado'}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4 mt-2 text-sm text-zinc-400 flex-wrap">
                    {t.email && <span>📧 {t.email}</span>}
                    {t.phone && <span>📞 {t.phone}</span>}
                    <span>👥 {t._count?.users || 0} usuários</span>
                    <span>🧑 {t._count?.clients || 0} clientes</span>
                    <span>🔧 {t._count?.services || 0} serviços</span>
                    <span className="text-zinc-600">Criado: {new Date(t.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4 flex-wrap">
                  {/* Mudar plano */}
                  <select onChange={e => changePlan(t, e.target.value)} value={t.plan}
                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-yellow-400">
                    <option value="TRIAL">Trial</option>
                    <option value="STARTER">Starter</option>
                    <option value="PRO">Pro</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>
                  {/* Suspender/Ativar */}
                  <button onClick={() => toggleStatus(t)}
                    className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                      t.status === 'ACTIVE'
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
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
