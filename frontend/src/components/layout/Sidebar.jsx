import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, Wrench, Calendar, Users, Car, Package, DollarSign, BarChart3, Settings, X, ChevronRight, ShoppingCart } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useSettings } from '../../contexts/SettingsContext'

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

function NavItem({ item }) {
  const location = useLocation()
  const isActive = item.exact
    ? location.pathname === item.to
    : location.pathname.startsWith(item.to)
  const Icon = item.icon
  return (
    <NavLink to={item.to}>
      <motion.div whileTap={{ scale: 0.97 }}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
          isActive ? 'bg-yellow-400 text-black font-bold' : 'text-white/50 hover:text-white hover:bg-white/5'
        }`}>
        <Icon size={17} className="shrink-0" />
        <span className="truncate">{item.label}</span>
        {isActive && <ChevronRight size={14} className="ml-auto opacity-60" />}
      </motion.div>
    </NavLink>
  )
}

function Logo({ settings }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl shrink-0 overflow-hidden"
        style={{ background: settings.primaryColor || '#f5c800', boxShadow: `0 0 16px ${settings.primaryColor || '#f5c800'}44` }}>
        {settings.logo
          ? <img src={`http://localhost:3001${settings.logo}`} alt="Logo" className="w-full h-full object-contain" />
          : <span>🛞</span>
        }
      </div>
      <div>
        <p className="font-display font-black text-lg text-white uppercase leading-none" style={{ letterSpacing: '0.02em' }}>
          {settings.name || 'TireMax'}
        </p>
        <p className="text-[10px] text-white/30 uppercase tracking-widest truncate max-w-[120px]">
          {settings.tagline || 'Borracharia'}
        </p>
      </div>
    </div>
  )
}

function SidebarContent({ onClose }) {
  const { user } = useAuth()
  const { settings } = useSettings()
  const whatsappNum = settings.whatsapp || '5511999999999'

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-4 border-b border-white/[0.07]">
        <Logo settings={settings} />
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(item => (
          <div key={item.label} onClick={onClose}>
            <NavItem item={item} />
          </div>
        ))}
      </nav>

      {/* Promo banner */}
      <div className="m-3 rounded-xl overflow-hidden border border-yellow-400/20">
        <div className="h-14 relative overflow-hidden flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #1a1500, #0c0c0c)' }}>
          <span className="text-5xl opacity-15">🛞</span>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <p className="absolute bottom-1 left-2 font-display font-black text-yellow-400 text-xs uppercase">
            {settings.name || 'TireMax'}
          </p>
        </div>
        <div className="bg-[#151500] p-3">
          <p className="text-xs text-white/40 mb-2">
            {settings.address ? `📍 ${settings.city || settings.address}` : 'Tudo para seu carro em um só lugar!'}
          </p>
          <a href={`https://wa.me/${whatsappNum}`} target="_blank" rel="noreferrer"
            className="w-full bg-yellow-400 text-black font-display font-black text-xs uppercase tracking-wide py-2 rounded-lg flex items-center justify-center gap-1.5">
            💬 Agendar Agora
          </a>
        </div>
      </div>

      {/* User */}
      <div className="p-3 border-t border-white/[0.05]">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white/[0.03]">
          <div className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: settings.primaryColor || '#f5c800' }}>
            <span className="text-black text-xs font-black font-display">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-[11px] text-white/30">
              {user?.role === 'ADMIN' ? 'Administrador' : user?.role === 'FINANCIAL' ? 'Financeiro' : 'Funcionário'}
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
      <aside className="hidden lg:flex flex-col w-56 shrink-0 bg-[#131313] border-r border-white/[0.07] h-screen">
        <SidebarContent />
      </aside>
      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed left-0 top-0 h-full w-60 bg-[#131313] border-r border-white/[0.07] z-30 flex flex-col lg:hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/[0.07]">
              <p className="font-display font-black text-lg text-white">Menu</p>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40"><X size={18} /></button>
            </div>
            <SidebarContent onClose={onClose} />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
