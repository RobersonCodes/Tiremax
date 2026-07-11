import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Lock, UserX, UserCheck, Edit2 } from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { PageHeader, Card, Button, Input, FormGroup, Modal, Skeleton, EmptyState } from '../../components/ui/index'
import toast from 'react-hot-toast'

const ROLES = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'FINANCIAL', label: 'Financeiro' },
  { value: 'EMPLOYEE', label: 'Funcionário' },
]

const roleLabel = (r) => ROLES.find(x => x.value === r)?.label || r

export default function TeamPage() {
  const navigate = useNavigate()
  const { user: me } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)

  const isAdmin = me?.role === 'ADMIN'

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/users')
      setUsers(data)
    } catch {
      toast.error('Erro ao carregar equipe')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (isAdmin) load() }, [])

  const toggleActive = async (u) => {
    try {
      if (u.active) {
        await api.delete(`/users/${u.id}`)
        toast.success('Usuário desativado')
      } else {
        await api.put(`/users/${u.id}`, { active: true })
        toast.success('Usuário reativado')
      }
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao atualizar usuário')
    }
  }

  if (!isAdmin) {
    return (
      <div className="max-w-3xl">
        <PageHeader title="Equipe" subtitle="Gerencie os usuários do sistema" />
        <Card>
          <p className="text-center text-sm text-white/30 py-8 flex items-center justify-center gap-1.5">
            <Lock size={14} /> Apenas administradores podem gerenciar a equipe
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="md" onClick={() => navigate('/settings')} className="!px-2"><ArrowLeft size={18} /></Button>
        <PageHeader
          title="Equipe"
          subtitle="Gerencie os usuários que têm acesso ao sistema"
          actions={<Button icon={Plus} onClick={() => { setEditingUser(null); setShowModal(true) }}>Novo Usuário</Button>}
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : users.length === 0 ? (
        <EmptyState title="Nenhum usuário" description="Cadastre a sua equipe para dar acesso ao sistema." />
      ) : (
        <div className="space-y-2">
          {users.map(u => (
            <Card key={u.id} className={`flex items-center justify-between !p-4 ${!u.active ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-brand-500/10 border border-brand-500/15 flex items-center justify-center shrink-0">
                  <span className="font-display font-bold text-sm text-brand-500">{u.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{u.name} {u.id === me.id && <span className="text-white/30 text-xs">(você)</span>}</p>
                  <p className="text-xs text-white/40 truncate">{u.email} · {roleLabel(u.role)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="sm" icon={Edit2} onClick={() => { setEditingUser(u); setShowModal(true) }} />
                {u.id !== me.id && (
                  <Button
                    variant="ghost" size="sm"
                    icon={u.active ? UserX : UserCheck}
                    onClick={() => toggleActive(u)}
                  />
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingUser ? 'Editar Usuário' : 'Novo Usuário'}>
        <UserForm
          user={editingUser}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); load() }}
        />
      </Modal>
    </div>
  )
}

function UserForm({ user, onClose, onSuccess }) {
  const isEdit = !!user
  const [form, setForm] = useState({
    name: user?.name || '', email: user?.email || '', phone: user?.phone || '',
    role: user?.role || 'EMPLOYEE', password: '',
  })
  const [loading, setLoading] = useState(false)
  const set = (f) => (e) => setForm(x => ({ ...x, [f]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isEdit) {
        const payload = { name: form.name, phone: form.phone, role: form.role }
        if (form.password) payload.password = form.password
        await api.put(`/users/${user.id}`, payload)
        toast.success('Usuário atualizado!')
      } else {
        await api.post('/users', form)
        toast.success('Usuário cadastrado!')
      }
      onSuccess()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao salvar usuário')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormGroup label="Nome completo" required>
        <Input value={form.name} onChange={set('name')} placeholder="Maria Silva" required />
      </FormGroup>
      <FormGroup label="E-mail" required>
        <Input type="email" value={form.email} onChange={set('email')} placeholder="maria@borracharia.com"
          disabled={isEdit} required />
      </FormGroup>
      <FormGroup label="Telefone">
        <Input value={form.phone} onChange={set('phone')} placeholder="(11) 99999-0000" />
      </FormGroup>
      <FormGroup label="Cargo" required>
        <select value={form.role} onChange={set('role')} className="input-field">
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </FormGroup>
      <FormGroup label={isEdit ? 'Nova senha (deixe em branco para manter)' : 'Senha'} required={!isEdit}>
        <Input type="password" value={form.password} onChange={set('password')} placeholder="••••••••"
          minLength={6} required={!isEdit} />
      </FormGroup>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancelar</Button>
        <Button type="submit" className="flex-1" loading={loading}>
          {loading ? 'Salvando...' : isEdit ? 'Salvar' : 'Cadastrar'}
        </Button>
      </div>
    </form>
  )
}
