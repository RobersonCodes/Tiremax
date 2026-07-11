import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail, Send, CheckCircle2 } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch {
      toast.error('Erro ao solicitar redefinição. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-1 bg-yellow-400" />
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(245,200,0,0.06) 0%, transparent 60%)' }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="w-full max-w-sm relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mb-4 text-3xl"
            style={{ boxShadow: '0 0 40px rgba(245,200,0,0.3)' }}>
            🛞
          </div>
          <h1 className="font-display font-black text-3xl text-white uppercase">
            Tire<span className="text-yellow-400">Max</span>
          </h1>
        </div>

        <div className="bg-[#131313] border border-white/[0.07] border-t-2 border-t-yellow-400 rounded-2xl p-6">
          {sent ? (
            <div className="text-center py-2">
              <CheckCircle2 size={36} className="text-yellow-400 mx-auto mb-3" />
              <h2 className="font-display font-black text-white text-lg uppercase mb-1.5">Verifique seu e-mail</h2>
              <p className="text-sm text-white/40">
                Se <span className="text-white/70">{email}</span> estiver cadastrado, você vai receber um link para redefinir sua senha. O link expira em 1 hora.
              </p>
            </div>
          ) : (
            <>
              <h2 className="font-display font-black text-white text-xl uppercase mb-0.5">Esqueci minha senha</h2>
              <p className="text-xs text-white/35 mb-6">Enviaremos um link de redefinição para seu e-mail</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">E-mail</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      className="input-field pl-9" placeholder="seu@email.com" required />
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="btn-yellow w-full justify-center py-3 mt-2 text-base disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>Enviar link <Send size={16} /></>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-white/40 mt-4">
          <a href="/login" className="text-yellow-400 hover:underline flex items-center justify-center gap-1.5">
            <ArrowLeft size={13} /> Voltar para o login
          </a>
        </p>
      </motion.div>
    </div>
  )
}
