import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './styles/globals.css'
import { setupStatusBar, hideSplashScreen, isNative } from './services/capacitor.service'

// Inicializa recursos nativos quando o app carrega
async function initNative() {
  if (!isNative()) return
  await setupStatusBar()
  // SplashScreen some automaticamente (config no capacitor.config.ts)
  // mas podemos forçar após React renderizar:
  setTimeout(hideSplashScreen, 500)
}

initNative()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#1a1f35',
          color: '#ffffff',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px',
          fontSize: '14px',
          fontFamily: 'DM Sans, sans-serif',
          padding: '12px 16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        },
        success: {
          iconTheme: { primary: '#10b981', secondary: '#fff' },
        },
        error: {
          iconTheme: { primary: '#ef4444', secondary: '#fff' },
        },
      }}
    />
  </React.StrictMode>,
)
