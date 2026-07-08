import { Link, Navigate } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Capacitor } from '@capacitor/core'
import { useRef } from 'react'
import {
  ArrowRight, Users, ShoppingCart, Wrench, Package, DollarSign,
  BarChart3, Check, Shield, Smartphone,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { CustomCursor } from '../../components/marketing/CustomCursor'
import { ScrollProgress } from '../../components/marketing/ScrollProgress'
import { ProductVisual } from '../../components/marketing/ProductVisual'
import { HeroCarousel } from '../../components/marketing/HeroCarousel'

const FEATURES = [
  {
    icon: Users,
    title: 'Clientes e Veículos',
    description: 'Cadastro completo com histórico de atendimentos e veículos vinculados a cada cliente.',
    image: '/assets/features/feature-clientes.jpg',
  },
  {
    icon: ShoppingCart,
    title: 'PDV — Ponto de Venda',
    description: 'Registre vendas em segundos, com desconto e múltiplas formas de pagamento.',
    image: '/assets/features/feature-pdv.jpg',
  },
  {
    icon: Wrench,
    title: 'Ordens de Serviço',
    description: 'Troca de pneus, balanceamento, alinhamento — status em tempo real do início ao fim.',
    image: '/assets/features/feature-servicos.jpg',
  },
  {
    icon: Package,
    title: 'Controle de Estoque',
    description: 'Pneus, peças e materiais com alertas automáticos de estoque baixo.',
    image: '/assets/features/feature-estoque.jpg',
  },
  {
    icon: DollarSign,
    title: 'Financeiro Completo',
    description: 'Contas a pagar e a receber, fluxo de caixa mensal, tudo organizado.',
    image: '/assets/features/feature-financeiro.jpg',
  },
  {
    icon: BarChart3,
    title: 'Dashboard em Tempo Real',
    description: 'Faturamento do dia, serviços em aberto e estoque crítico, de relance.',
    image: null,
  },
]

const TRUST_POINTS = [
  { icon: Check, text: '30 dias grátis, sem cartão de crédito' },
  { icon: Shield, text: 'Dados no seu próprio servidor' },
  { icon: Smartphone, text: 'Funciona em celular, tablet e computador' },
]

const EASE = [0.16, 1, 0.3, 1]

function Hero() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  return (
    <section ref={ref} className="relative overflow-hidden">
      <HeroCarousel />
      <motion.div style={{ y: bgY }} className="pointer-events-none absolute inset-0">
        <motion.div
          animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.08, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-1/2 top-[-10%] h-[600px] w-[600px] -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(245,200,0,0.14) 0%, transparent 65%)' }}
        />
        <motion.div
          animate={{ opacity: [0.3, 0.55, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute right-[-10%] top-[20%] h-[400px] w-[400px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(245,200,0,0.1) 0%, transparent 65%)' }}
        />
      </motion.div>

      <motion.div style={{ opacity: contentOpacity }} className="relative mx-auto max-w-6xl px-6 pb-24 pt-24 sm:pt-32">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="badge-warning mb-6 inline-flex"
            >
              Feito para borracharias e centros automotivos
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
              className="font-display text-4xl font-extrabold uppercase leading-[1.03] tracking-tight sm:text-6xl"
            >
              Sua borracharia
              <br />
              organizada do{' '}
              <span className="text-yellow-400">estoque</span>
              <br />
              ao <span className="text-yellow-400">caixa</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.22, ease: EASE }}
              className="mt-6 max-w-lg text-lg text-white/60"
            >
              Clientes, veículos, PDV, ordens de serviço, estoque e
              financeiro em um só sistema. Substitua as planilhas e o
              caderno por um ERP feito para o seu dia a dia.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.34, ease: EASE }}
              className="mt-9 flex flex-col gap-4 sm:flex-row"
            >
              <Link to="/register" data-cursor-hover className="btn-yellow px-7 py-3.5 text-base">
                Criar conta grátis <ArrowRight size={17} />
              </Link>
              <Link to="/login" data-cursor-hover className="btn-dark px-7 py-3.5 text-base">
                Já tenho conta
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-white/45"
            >
              {TRUST_POINTS.map((point) => (
                <span key={point.text} className="flex items-center gap-2">
                  <point.icon size={15} className="text-yellow-400/80" />
                  {point.text}
                </span>
              ))}
            </motion.div>
          </div>

          <ProductVisual />
        </div>
      </motion.div>
    </section>
  )
}

export default function LandingPage() {
  const { user, loading } = useAuth()

  if (Capacitor.isNativePlatform()) {
    return <Navigate to="/login" replace />
  }

  if (loading) return null
  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0c0c0c] text-white">
      <ScrollProgress />
      <CustomCursor />

      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0c0c0c]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="font-display text-xl font-extrabold uppercase tracking-wide">
            TireMax <span className="text-yellow-400">ERP</span>
          </span>
          <div className="flex items-center gap-3">
            <Link to="/login" data-cursor-hover className="btn-ghost text-sm">Entrar</Link>
            <Link to="/register" data-cursor-hover className="btn-yellow text-sm">
              Começar grátis <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      <Hero />

      <section className="border-t border-white/[0.06] py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">
              Tudo que sua operação precisa
            </h2>
            <p className="mt-3 text-white/55">
              Seis módulos que já vêm prontos, sem configuração complicada.
            </p>
          </motion.div>

          <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: (i % 3) * 0.09, ease: EASE }}
                whileHover={{ y: -4 }}
                data-cursor-hover
                className="card group relative overflow-hidden p-6 transition-colors duration-300 hover:border-yellow-400/30"
              >
                {feature.image && (
                  <>
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-[0.32] transition-all duration-500 ease-out-expo group-hover:opacity-[0.48] group-hover:scale-105"
                      style={{ backgroundImage: `url(${feature.image})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#131417] via-[#131417]/55 to-[#131417]/25" />
                  </>
                )}
                <div
                  className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: 'radial-gradient(circle, rgba(245,200,0,0.25) 0%, transparent 70%)' }}
                />
                <div className="relative mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-yellow-400/10">
                  <feature.icon size={20} className="text-yellow-400" />
                </div>
                <h3 className="relative font-display text-lg font-bold uppercase tracking-wide">
                  {feature.title}
                </h3>
                <p className="relative mt-2 text-sm leading-relaxed text-white/55">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-white/[0.06] py-20 sm:py-24">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 60% 80% at 50% 50%, rgba(245,200,0,0.07) 0%, transparent 70%)' }}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: EASE }}
          className="relative mx-auto max-w-3xl px-6 text-center"
        >
          <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">
            Comece hoje, sem compromisso
          </h2>
          <p className="mt-3 text-white/55">
            30 dias grátis para testar tudo. Sem cartão de crédito, sem letra
            miúda.
          </p>
          <Link
            to="/register"
            data-cursor-hover
            className="btn-yellow mx-auto mt-8 inline-flex px-8 py-4 text-base"
          >
            Criar conta grátis <ArrowRight size={17} />
          </Link>
        </motion.div>
      </section>

      <footer className="border-t border-white/[0.06] py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-white/35 sm:flex-row">
          <span>© {new Date().getFullYear()} TireMax ERP</span>
          <div className="flex items-center gap-6">
            <Link to="/privacidade" data-cursor-hover className="hover:text-white/70">
              Política de Privacidade
            </Link>
            <Link to="/termos" data-cursor-hover className="hover:text-white/70">
              Termos de Uso
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
