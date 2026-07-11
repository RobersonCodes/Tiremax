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
      } catch { /* sem sessão ainda — mantém defaults */ }
    }
    load()
  }, [])

  const reload = async () => {
    try {
      const { data } = await api.get('/settings')
      setSettings(data)
    } catch { /* mantém settings atuais em caso de erro */ }
  }

  const update = async (form) => {
    const { data } = await api.put('/settings', form)
    setSettings(data)
    return data
  }

  const uploadLogo = async (file) => {
    const formData = new FormData()
    formData.append('logo', file)
    const { data } = await api.post('/settings/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    setSettings(s => ({ ...s, logo: data.logo }))
    return data.logo
  }

  return (
    <SettingsContext.Provider value={{ settings, setSettings, reload, update, uploadLogo }}>
      {children}
    </SettingsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- provider + hook no mesmo arquivo é o padrão deste projeto
export const useSettings = () => {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
