import { Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Capacitor } from '@capacitor/core'
import {
  ArrowRight, Users, ShoppingCart, Wrench, Package, DollarSign,
  BarChart3, Check, Shield, Smartphone,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const FEATURES = [
  {
    icon: Users,
    title: 'Clientes e Veículos',
    description: 'Cadastro completo com histórico de atendimentos e veículos vinculados a cada cliente.',
  },
  {
    icon: ShoppingCart,
    title: 'PDV — Ponto de Venda',
    description: 'Registre vendas em segundos, com desconto e múltiplas formas de pagamento.',
  },
  {
    icon: Wrench,
    title: 'Ordens de Serviço',
    description: 'Troca de pneus, balanceamento, alinhamento — status em tempo real do início ao fim.',
  },
  {
    icon: Package,
    title: 'Controle de Estoque',
    description: 'Pneus, peças e materiais com alertas automáticos de estoque baixo.',
  },
  {
    icon: DollarSign,
    title: 'Financeiro Completo',
    description: 'Contas a pagar e a receber, fluxo de caixa mensal, tudo organizado.',
  },
  {
    icon: BarChart3,
    title: 'Dashboard em Tempo Real',
    description: 'Faturamento do dia, serviços em aberto e estoque crítico, de relance.',
  },
]

const TRUST_POINTS = [
  { icon: Check, text: '30 dias grátis, sem cartão de crédito' },
  { icon: Shield, text: 'Dados no seu próprio servidor' },
  { icon: Smartphone, text: 'Funciona em celular, tablet e computador' },
]

export default function LandingPage() {
  const { user, loading } = useAuth()

  // The installed mobile app has no use for marketing copy — send it
  // straight to the login/app flow. Only the public web domain (where
  // Google Ads traffic lands) should ever see this page.
  if (Capacitor.isNativePlatform()) {
    return <Navigate to="/login" replace />
  }

  // Logged-in visitors go straight to the app instead of seeing marketing copy.
  if (loading) return null
  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white overflow-x-hidden">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0c0c0c]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="font-display text-xl font-extrabold uppercase tracking-wide">
            TireMax <span className="text-yellow-400">ERP</span>
          </span>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost text-sm">Entrar</Link>
            <Link to="/register" className="btn-yellow text-sm">
              Começar grátis <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(245,200,0,0.08) 0%, transparent 60%)',
          }}
        />
        <div className="relative mx-auto max-w-4xl px-6 py-24 text-center sm:py-32">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="badge-warning mb-6 inline-flex"
          >
            Feito para borracharias e centros automotivos
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-4xl font-extrabold uppercase leading-[1.05] tracking-tight sm:text-6xl"
          >
            Sua borracharia organizada,
            <br />
            do <span className="text-yellow-400">estoque</span> ao <span className="text-yellow-400">caixa</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-white/60"
          >
            Clientes, veículos, PDV, ordens de serviço, estoque e financeiro em
            um só sistema. Substitua as planilhas e o caderno por um ERP feito
            para o seu dia a dia.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link to="/register" className="btn-yellow px-7 py-3.5 text-base">
              Criar conta grátis <ArrowRight size={17} />
            </Link>
            <Link to="/login" className="btn-dark px-7 py-3.5 text-base">
              Já tenho conta
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/45"
          >
            {TRUST_POINTS.map((point) => (
              <span key={point.text} className="flex items-center gap-2">
                <point.icon size={15} className="text-yellow-400/80" />
                {point.text}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-white/[0.06] py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">
              Tudo que sua operação precisa
            </h2>
            <p className="mt-3 text-white/55">
              Seis módulos que já vêm prontos, sem configuração complicada.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
                className="card p-6"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-yellow-400/10">
                  <feature.icon size={20} className="text-yellow-400" />
                </div>
                <h3 className="font-display text-lg font-bold uppercase tracking-wide">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="border-t border-white/[0.06] py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">
            Comece hoje, sem compromisso
          </h2>
          <p className="mt-3 text-white/55">
            30 dias grátis para testar tudo. Sem cartão de crédito, sem letra
            miúda.
          </p>
          <Link
            to="/register"
            className="btn-yellow mx-auto mt-8 inline-flex px-8 py-4 text-base"
          >
            Criar conta grátis <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-white/35 sm:flex-row">
          <span>© {new Date().getFullYear()} TireMax ERP</span>
          <div className="flex items-center gap-6">
            <Link to="/privacidade" className="hover:text-white/70">
              Política de Privacidade
            </Link>
            <Link to="/termos" className="hover:text-white/70">
              Termos de Uso
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
