import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api, { saveToken, clearToken } from '../services/api'
import { getPreference } from '../services/capacitor.service'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      try {
        const token = await getPreference('token') || localStorage.getItem('token')
        if (!token) return
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        const { data } = await api.get('/auth/me')
        setUser(data)
        // Carrega dados do tenant
        const { data: tenantData } = await api.get('/settings')
        setTenant(tenantData)
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
    await saveToken(data.token)
    setUser(data.user)
    setTenant(data.tenant)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    await clearToken()
    setUser(null)
    setTenant(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, tenant, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
