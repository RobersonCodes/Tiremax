import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../../services/api'
import { trackTrialSignupConversion } from '../../utils/analytics'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', cnpj: '', phone: '',
    adminName: '', adminEmail: '', adminPassword: '', confirmPassword: '',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setError('')
    if (!form.name || !form.adminEmail || !form.adminPassword) {
      setError('Preencha todos os campos obrigatórios')
      return
    }
    if (form.adminPassword !== form.confirmPassword) {
      setError('As senhas não coincidem')
      return
    }
    if (form.adminPassword.length < 6) {
      setError('Senha deve ter no mínimo 6 caracteres')
      return
    }

    try {
      setLoading(true)
      await api.post('/register', {
        name: form.name,
        cnpj: form.cnpj,
        phone: form.phone,
        adminName: form.adminName,
        adminEmail: form.adminEmail,
        adminPassword: form.adminPassword,
        plan: 'TRIAL',
      })
      trackTrialSignupConversion({ tenantName: form.name })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-zinc-900 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-yellow-400 mb-2">Conta criada com sucesso!</h2>
          <p className="text-zinc-400 mb-2">Você tem <strong className="text-white">30 dias gratuitos</strong> para testar o TireMax ERP.</p>
          <p className="text-zinc-400 mb-6">Verifique seu email para as instruções de acesso.</p>
          <button onClick={() => navigate('/login')}
            className="w-full bg-yellow-400 text-black font-bold py-3 rounded-lg hover:bg-yellow-300 transition">
            Ir para o Login →
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-400 rounded-full mb-4">
            <span className="text-2xl">⚙️</span>
          </div>
          <h1 className="text-3xl font-bold text-white">TIREMAX <span className="text-yellow-400">ERP</span></h1>
          <p className="text-zinc-400 mt-1">30 dias grátis, sem cartão de crédito</p>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Criar conta grátis</h2>
            <p className="text-zinc-400 text-sm">Preencha os dados da sua borracharia</p>
          </div>

          {/* Dados da borracharia */}
          <div className="space-y-4">
            <p className="text-yellow-400 text-xs font-bold uppercase tracking-wider">🏪 Dados da Borracharia</p>
            <div>
              <label className="block text-zinc-400 text-sm mb-1">Nome da Borracharia *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="Ex: Borracharia do João"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-400 text-sm mb-1">CNPJ</label>
                <input value={form.cnpj} onChange={e => set('cnpj', e.target.value)}
                  placeholder="00.000.000/0001-00"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400" />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-1">Telefone</label>
                <input value={form.phone} onChange={e => set('phone', e.target.value)}
                  placeholder="(51) 99999-9999"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400" />
              </div>
            </div>
          </div>

          {/* Dados do admin */}
          <div className="space-y-4">
            <p className="text-yellow-400 text-xs font-bold uppercase tracking-wider">👤 Dados de Acesso</p>
            <div>
              <label className="block text-zinc-400 text-sm mb-1">Seu Nome *</label>
              <input value={form.adminName} onChange={e => set('adminName', e.target.value)}
                placeholder="João Silva"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400" />
            </div>
            <div>
              <label className="block text-zinc-400 text-sm mb-1">Email *</label>
              <input type="email" value={form.adminEmail} onChange={e => set('adminEmail', e.target.value)}
                placeholder="joao@suaborracharia.com"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-400 text-sm mb-1">Senha *</label>
                <input type="password" value={form.adminPassword} onChange={e => set('adminPassword', e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400" />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-1">Confirmar Senha *</label>
                <input type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)}
                  placeholder="Repita a senha"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400" />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
              ⚠️ {error}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading}
            className="w-full bg-yellow-400 text-black font-bold py-4 rounded-lg hover:bg-yellow-300 transition disabled:opacity-50 disabled:cursor-not-allowed text-lg">
            {loading ? 'Criando conta...' : 'Criar conta grátis →'}
          </button>

          <p className="text-center text-zinc-500 text-sm">
            Já tem conta?{' '}
            <Link to="/login" className="text-yellow-400 hover:underline">Fazer login</Link>
          </p>
        </div>

        <p className="text-center text-zinc-600 text-xs mt-4">
          Ao criar uma conta, você concorda com nossos{' '}
          <Link to="/termos" className="text-yellow-400/70 hover:underline">termos de uso</Link>
          {' '}e{' '}
          <Link to="/privacidade" className="text-yellow-400/70 hover:underline">política de privacidade</Link>.
        </p>
      </motion.div>
    </div>
  )
}
