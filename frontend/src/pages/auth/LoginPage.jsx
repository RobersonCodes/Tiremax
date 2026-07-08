import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, ArrowRight, Lock, Mail } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Bem-vindo ao TireMax ERP!')
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao fazer login')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center p-4 relative overflow-hidden">
      {/* BG */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-1 bg-yellow-400" />
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(245,200,0,0.06) 0%, transparent 60%)' }} />
        <div className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'4\' height=\'4\' viewBox=\'0 0 4 4\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect x=\'0\' y=\'0\' width=\'1\' height=\'1\' fill=\'white\'/%3E%3C/svg%3E")', backgroundSize: '4px 4px' }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mb-4 text-3xl"
            style={{ boxShadow: '0 0 40px rgba(245,200,0,0.3)' }}>
            🛞
          </motion.div>
          <h1 className="font-display font-black text-3xl text-white uppercase">
            Tire<span className="text-yellow-400">Max</span>
          </h1>
          <p className="text-sm text-white/35 mt-1 uppercase tracking-widest font-semibold">Borracharia ERP</p>
        </div>

        {/* Card */}
        <div className="bg-[#131313] border border-white/[0.07] border-t-2 border-t-yellow-400 rounded-2xl p-6">
          <h2 className="font-display font-black text-white text-xl uppercase mb-0.5">Entrar no sistema</h2>
          <p className="text-xs text-white/35 mb-6">Use suas credenciais para acessar o painel</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">E-mail</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="input-field pl-9" placeholder="seu@email.com" required />
              </div>
            </div>
            <div>
              <label className="label">Senha</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  className="input-field pl-9 pr-10" placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
                ⚠ {error}
              </motion.div>
            )}

            <button type="submit" disabled={loading}
              className="btn-yellow w-full justify-center py-3 mt-2 text-base disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>Entrar <ArrowRight size={16} /></>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-white/40 mt-4">Não tem conta? <a href="/register" className="text-yellow-400 hover:underline">Criar conta grátis</a></p>
        <p className="text-center text-xs text-white/15 mt-2">TireMax ERP · {new Date().getFullYear()}</p>
      </motion.div>
    </div>
  )
}
