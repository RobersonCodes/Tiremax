import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, Wrench, Users, Package, DollarSign, BarChart3, Settings, X, ShoppingCart, ShieldCheck, MessageCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useSettings } from '../../contexts/SettingsContext'

const EASE = [0.16, 1, 0.3, 1]

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard', exact: true },
  { label: 'Ordens de Serviço', icon: Wrench, to: '/services' },
  { label: 'Vendas / PDV', icon: ShoppingCart, to: '/sales' },
  { label: 'Clientes', icon: Users, to: '/clients' },
  { label: 'Estoque / Pneus', icon: Package, to: '/inventory' },
  { label: 'Financeiro', icon: DollarSign, to: '/financial', roles: ['ADMIN', 'FINANCIAL'] },
  { label: 'Relatórios', icon: BarChart3, to: '/reports' },
  { label: 'Configurações', icon: Settings, to: '/settings' },
]

function NavItem({ item, onClose }) {
  const location = useLocation()
  const isActive = item.exact
    ? location.pathname === item.to
    : location.pathname.startsWith(item.to)
  const Icon = item.icon

  return (
    <NavLink to={item.to} onClick={onClose}>
      <motion.div
        whileTap={{ scale: 0.98 }}
        className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 ease-out-expo cursor-pointer ${
          isActive ? 'text-white' : 'text-white/45 hover:text-white hover:bg-white/[0.04]'
        }`}
      >
        {isActive && (
          <motion.div
            layoutId="sidebar-active"
            transition={{ duration: 0.3, ease: EASE }}
            className="absolute inset-0 rounded-lg bg-white/[0.06] border-l-2 border-brand-500"
          />
        )}
        <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} className="relative shrink-0" />
        <span className="relative truncate">{item.label}</span>
      </motion.div>
    </NavLink>
  )
}

function SidebarContent({ onClose }) {
  const { user } = useAuth()
  const { settings } = useSettings()
  const whatsappNum = settings?.whatsapp || '5511999999999'
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001'
  const brandColor = settings?.primaryColor || '#f0b400'

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-4 border-b border-white/[0.06]">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 overflow-hidden"
          style={{ background: brandColor, boxShadow: `0 0 20px ${brandColor}33` }}
        >
          {settings?.logo
            ? <img src={`${apiBase}${settings.logo}`} alt="Logo" className="w-full h-full object-contain" />
            : <span>🛞</span>}
        </div>
        <div className="min-w-0">
          <p className="font-display font-semibold text-[15px] text-white leading-tight truncate">
            {settings?.name || 'TireMax'}
          </p>
          <p className="text-[10px] text-white/30 uppercase tracking-widest truncate">Borracharia</p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(item => (
          <NavItem key={item.label} item={item} onClose={onClose} />
        ))}
        {user?.role === 'SUPER_ADMIN' && (
          <NavItem item={{ label: 'Super Admin', icon: ShieldCheck, to: '/admin' }} onClose={onClose} />
        )}
      </nav>

      {settings?.plan === 'TRIAL' && settings?.trialEndsAt && (
        <div className="mx-3 mb-2 rounded-xl bg-brand-500/[0.08] border border-brand-500/15 p-3">
          <p className="text-brand-400 text-xs font-semibold">Período de Teste</p>
          <p className="text-white/35 text-xs mt-0.5">
            Expira em {new Date(settings.trialEndsAt).toLocaleDateString('pt-BR')}
          </p>
        </div>
      )}

      <div className="m-3 rounded-xl overflow-hidden border border-brand-500/15">
        <div className="bg-brand-500/[0.05] p-3">
          <p className="text-xs text-white/35 mb-2 truncate">
            {settings?.address ? `${settings.city || settings.address}` : 'Tudo para seu carro em um só lugar!'}
          </p>
          <a
            href={`https://wa.me/${whatsappNum}`}
            target="_blank"
            rel="noreferrer"
            className="btn-yellow w-full text-xs uppercase tracking-wide py-2"
          >
            <MessageCircle size={13} /> Agendar Agora
          </a>
        </div>
      </div>

      <div className="p-3 border-t border-white/[0.05]">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white/[0.03]">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: brandColor }}
          >
            <span className="text-[#08090a] text-xs font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-[11px] text-white/30">
              {user?.role === 'ADMIN' ? 'Administrador' : user?.role === 'FINANCIAL' ? 'Financeiro' : user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Funcionário'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Sidebar({ open, onClose }) {
  return (
    <>
      <aside className="hidden lg:flex flex-col w-56 shrink-0 bg-[#131417] border-r border-white/[0.06] h-screen">
        <SidebarContent />
      </aside>
      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="fixed left-0 top-0 h-full w-60 bg-[#131417] border-r border-white/[0.06] z-30 flex flex-col lg:hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
              <p className="font-display font-semibold text-white">Menu</p>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40">
                <X size={18} />
              </button>
            </div>
            <SidebarContent onClose={onClose} />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
