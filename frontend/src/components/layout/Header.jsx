import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Bell, Search, LogOut, Settings, ChevronDown, MessageCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import { useSettings } from '../../contexts/SettingsContext'

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth()
  const { settings } = useSettings()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const handleLogout = () => { logout(); navigate('/login') }
  const whatsappNum = settings.whatsapp || '5511999999999'
  const brandColor = settings.primaryColor || '#f0b400'

  return (
    <header className="h-[60px] shrink-0 bg-[#131417]/90 backdrop-blur-xl border-b border-white/[0.06] flex items-center px-4 gap-3 sticky top-0 z-10">
      <button onClick={onMenuClick} className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors lg:hidden">
        <Menu size={20} />
      </button>

      <div className="flex-1 max-w-md hidden md:flex items-center gap-2 bg-[#191b1f] border border-white/[0.06] rounded-lg px-3 py-2 group focus-within:border-brand-500/40 focus-within:ring-2 focus-within:ring-brand-500/15 transition-all duration-200 ease-out-expo">
        <Search size={15} className="text-white/25 group-focus-within:text-brand-500 transition-colors shrink-0" />
        <input
          type="text"
          placeholder="Buscar cliente, serviço ou produto..."
          className="bg-transparent text-sm text-white placeholder-white/20 outline-none flex-1"
        />
      </div>
      <div className="flex-1" />

      <a
        href={`https://wa.me/${whatsappNum}`}
        target="_blank"
        rel="noreferrer"
        className="hidden md:flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
      >
        <div className="w-8 h-8 bg-[#25d366] rounded-full flex items-center justify-center">
          <MessageCircle size={15} className="text-black" />
        </div>
        <div className="hidden lg:block">
          <p className="text-xs font-semibold text-white">WhatsApp</p>
          <p className="text-[10px] text-white/40">Atendimento</p>
        </div>
      </a>

      <button className="relative p-2 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors">
        <Bell size={18} />
        <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold flex items-center justify-center">5</span>
      </button>

      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: brandColor }}>
            <span className="text-[#08090a] text-xs font-bold font-display">{user?.name?.charAt(0).toUpperCase()}</span>
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-medium text-white">{user?.name?.split(' ')[0]}</p>
            <p className="text-[10px] text-white/40">{settings.name || 'TireMax Borracharia'}</p>
          </div>
          <ChevronDown size={13} className="text-white/30 hidden md:block" />
        </button>
        <AnimatePresence>
          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="absolute right-0 top-full mt-2 w-52 bg-[#191b1f] border border-white/10 rounded-xl shadow-card overflow-hidden z-20"
              >
                <div className="px-3 py-2.5 border-b border-white/[0.05]">
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <p className="text-xs text-white/40">{user?.email}</p>
                </div>
                <div className="p-1">
                  <button
                    onClick={() => { navigate('/settings'); setDropdownOpen(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <Settings size={14} /> Configurações
                  </button>
                  <div className="border-t border-white/[0.05] my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400/80 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-colors"
                  >
                    <LogOut size={14} /> Sair
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
