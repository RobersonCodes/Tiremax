import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import Header from '../components/layout/Header'
import OfflineBanner from '../components/layout/OfflineBanner'
import { useBackButton } from '../hooks/useBackButton'
import { getPlatform } from '../services/capacitor.service'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Trata o botão voltar do Android
  useBackButton()

  const isAndroid = getPlatform() === 'android'
  const isIos = getPlatform() === 'ios'

  return (
    <div className="flex h-screen overflow-hidden bg-surface-900">
      {/* Offline indicator */}
      <OfflineBanner />

      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main
          className="flex-1 overflow-y-auto p-4 lg:p-6"
          style={{
            // Safe area para iPhone (notch, home indicator)
            paddingBottom: isIos ? 'calc(1.5rem + env(safe-area-inset-bottom))' : undefined,
            paddingTop: isAndroid ? undefined : undefined,
          }}
        >
          <div className="max-w-screen-2xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
