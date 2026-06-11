import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    name: 'TireMax Borracharia',
    primaryColor: '#f5c800',
    plan: 'TRIAL',
  })

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return
        const { data } = await api.get('/settings')
        setSettings(data)
      } catch {}
    }
    load()
  }, [])

  const reload = async () => {
    try {
      const { data } = await api.get('/settings')
      setSettings(data)
    } catch {}
  }

  return (
    <SettingsContext.Provider value={{ settings, setSettings, reload }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
