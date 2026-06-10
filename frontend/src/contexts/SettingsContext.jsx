import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'

const SettingsContext = createContext(null)

const DEFAULT = {
  name: 'TireMax Borracharia',
  tagline: 'Gestão Automotiva Inteligente',
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  city: '',
  state: '',
  openHours: 'Seg - Sáb: 08:00 às 18:00',
  logo: null,
  primaryColor: '#f5c800',
  cnpj: '',
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/settings')
      setSettings({ ...DEFAULT, ...data })
    } catch {
      setSettings(DEFAULT)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const update = async (newSettings) => {
    const { data } = await api.put('/settings', newSettings)
    setSettings({ ...DEFAULT, ...data })
    return data
  }

  const uploadLogo = async (file) => {
    const form = new FormData()
    form.append('logo', file)
    const { data } = await api.post('/settings/logo', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    setSettings(s => ({ ...s, logo: data.logo }))
    return data.logo
  }

  return (
    <SettingsContext.Provider value={{ settings, loading, update, uploadLogo, reload: load }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
