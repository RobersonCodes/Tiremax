import { Link, Navigate } from 'react-router-dom'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { Capacitor } from '@capacitor/core'
import { useRef, useState } from 'react'
import {
  ArrowRight, Users, ShoppingCart, Wrench, Package, DollarSign,
  BarChart3, Check, Shield, Smartphone, Star, ChevronDown,
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

// ⚠️ PLACEHOLDER — troque pelos depoimentos reais dos seus primeiros clientes
// assim que tiver. Nunca publique depoimento que não seja de um cliente real.
const TESTIMONIALS = [
  {
    name: '[Nome do dono]',
    business: '[Nome da borracharia] · [Cidade/UF]',
    quote: '[Espaço para o depoimento real de um cliente — o que mudou no dia a dia dele depois do TireMax.]',
  },
  {
    name: '[Nome do dono]',
    business: '[Nome da borracharia] · [Cidade/UF]',
    quote: '[Depoimento real. Peça pro cliente falar em número: tempo economizado, vendas a mais, estoque que não faltou mais.]',
  },
  {
    name: '[Nome do dono]',
    business: '[Nome da borracharia] · [Cidade/UF]',
    quote: '[Depoimento real de outro cliente, de preferência de uma cidade diferente do primeiro.]',
  },
]

// ⚠️ PLACEHOLDER — os valores e limites abaixo são exemplo. Defina os reais
// antes de publicar (também usados em SuperAdminPage.jsx: TRIAL/STARTER/PRO/ENTERPRISE).
const PRICING = [
  {
    plan: 'STARTER',
    label: 'Starter',
    price: 'R$ 00',
    period: '/mês',
    description: 'Pra quem está começando a organizar a borracharia.',
    features: ['Até 1 usuário', 'Clientes e veículos ilimitados', 'PDV e ordens de serviço', 'Estoque com alerta de baixo estoque'],
    cta: 'Começar grátis',
    highlight: false,
  },
  {
    plan: 'PRO',
    label: 'Pro',
    price: 'R$ 00',
    period: '/mês',
    description: 'Pra quem já tem equipe e quer controle financeiro completo.',
    features: ['Até 5 usuários', 'Tudo do Starter', 'Financeiro completo (contas a pagar/receber)', 'Relatórios e dashboard em tempo real', 'Suporte prioritário'],
    cta: 'Começar grátis',
    highlight: true,
  },
  {
    plan: 'ENTERPRISE',
    label: 'Enterprise',
    price: 'Sob consulta',
    period: '',
    description: 'Pra redes com mais de uma unidade.',
    features: ['Usuários ilimitados', 'Tudo do Pro', 'Múltiplas unidades', 'Onboarding assistido', 'Suporte dedicado'],
    cta: 'Falar com vendas',
    highlight: false,
  },
]

const FAQS = [
  {
    q: 'Preciso saber mexer bem em computador?',
    a: 'Não. O TireMax foi feito para o dia a dia de uma borracharia — os cadastros de cliente, veículo e produto levam menos de 1 minuto cada, sem curva de aprendizado.',
  },
  {
    q: 'Meus dados ficam seguros? E se eu quiser sair?',
    a: 'Sim. Seus dados ficam no seu próprio servidor, isolados de outras empresas. Se decidir cancelar, você pode exportar tudo antes de sair — sem multa e sem letra miúda.',
  },
  {
    q: 'E se eu não gostar depois dos 30 dias grátis?',
    a: 'Você cancela quando quiser, direto no sistema, sem precisar ligar ou negociar com ninguém. Não pedimos cartão de crédito para começar o trial.',
  },
  {
    q: 'Meu funcionário pode estragar alguma coisa no sistema?',
    a: 'Não. Você controla o que cada funcionário pode ver e fazer — existem perfis de Administrador, Financeiro e Funcionário, cada um com permissões diferentes.',
  },
  {
    q: 'Funciona sem internet boa na oficina?',
    a: 'O sistema roda pelo navegador ou app e precisa de conexão para sincronizar. Recomendamos ao menos uma conexão básica de internet no local.',
  },
  {
    q: 'Dá pra emitir nota fiscal pelo sistema?',
    a: 'O módulo de nota fiscal está em desenvolvimento. Hoje o TireMax organiza clientes, estoque, ordens de serviço, vendas e financeiro — fale com o suporte para saber o status da emissão de NF-e.',
  },
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

function Testimonials() {
  return (
    <section className="border-t border-white/[0.06] py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">
            Quem usa, não volta pro caderno
          </h2>
          <p className="mt-3 text-white/55">
            Donos de borracharia real, usando o TireMax no dia a dia.
          </p>
        </motion.div>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.09, ease: EASE }}
              className="card p-6"
            >
              <div className="flex gap-0.5 text-yellow-400 mb-3">
                {[...Array(5)].map((_, s) => <Star key={s} size={14} fill="currentColor" />)}
              </div>
              <p className="text-sm leading-relaxed text-white/70">"{t.quote}"</p>
              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-400/10 font-display font-bold text-yellow-400">
                  {t.name.charAt(1)?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-white/40">{t.business}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Pricing() {
  return (
    <section className="border-t border-white/[0.06] py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">
            Menos que o custo de um pneu por mês
          </h2>
          <p className="mt-3 text-white/55">
            Sem letra miúda. Cancele quando quiser, direto no sistema.
          </p>
        </motion.div>

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {PRICING.map((p, i) => (
            <motion.div
              key={p.plan}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.09, ease: EASE }}
              className={`card relative flex flex-col p-6 ${p.highlight ? 'border-yellow-400/50 shadow-[0_0_0_1px_rgba(245,200,0,0.2)]' : ''}`}
            >
              {p.highlight && (
                <span className="badge-warning absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  Mais escolhido
                </span>
              )}
              <h3 className="font-display text-lg font-bold uppercase tracking-wide">{p.label}</h3>
              <p className="mt-1 text-sm text-white/50">{p.description}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="font-display text-3xl font-extrabold text-white">{p.price}</span>
                {p.period && <span className="text-sm text-white/40">{p.period}</span>}
              </div>
              <ul className="mt-6 flex-1 space-y-2.5">
                {p.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-white/65">
                    <Check size={15} className="mt-0.5 shrink-0 text-yellow-400" /> {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                data-cursor-hover
                className={`mt-7 justify-center py-3 text-sm ${p.highlight ? 'btn-yellow' : 'btn-dark'}`}
              >
                {p.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FAQItem({ faq, isOpen, onToggle }) {
  return (
    <div className="border-b border-white/[0.06] py-2">
      <button
        onClick={onToggle}
        data-cursor-hover
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
      >
        <span className="font-display text-sm font-semibold uppercase tracking-wide text-white sm:text-base">
          {faq.q}
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-yellow-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-sm leading-relaxed text-white/55">{faq.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function FAQ() {
  const [openIndex, setOpenIndex] = useState(0)
  return (
    <section className="border-t border-white/[0.06] py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">
            Perguntas frequentes
          </h2>
          <p className="mt-3 text-white/55">
            Se a sua dúvida não estiver aqui, fala com a gente antes de assinar.
          </p>
        </motion.div>

        <div className="mt-10">
          {FAQS.map((faq, i) => (
            <FAQItem
              key={faq.q}
              faq={faq}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
            />
          ))}
        </div>
      </div>
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
                      className="absolute inset-0 bg-cover bg-center opacity-[0.48] transition-all duration-500 ease-out-expo group-hover:opacity-[0.68] group-hover:scale-105"
                      style={{ backgroundImage: `url(${feature.image})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#131417]/95 via-[#131417]/40 to-[#131417]/10" />
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

      <Testimonials />
      <Pricing />
      <FAQ />

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
