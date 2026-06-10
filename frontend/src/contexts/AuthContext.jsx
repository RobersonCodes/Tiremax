import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api, { saveToken, clearToken } from '../services/api'
import { getPreference } from '../services/capacitor.service'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      try {
        // Tenta pegar token do storage nativo (Capacitor) ou localStorage
        const token = await getPreference('token') || localStorage.getItem('token')
        if (!token) return

        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        const { data } = await api.get('/auth/me')
        setUser(data)
      } catch {
        await clearToken()
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    await saveToken(data.token) // salva no Capacitor Preferences + localStorage
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    await clearToken()
    setUser(null)
    toast.success('Logout realizado com sucesso')
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
