import axios from 'axios'
import { getPreference, setPreference, removePreference, isNative } from './capacitor.service'

/**
 * Resolve a URL base da API.
 * - No browser/web: usa proxy do Vite (/api)
 * - No app nativo: usa a URL configurada no .env ou padrão
 *
 * Para app em produção, defina VITE_API_URL no .env:
 *   VITE_API_URL=https://api.seudominio.com
 *
 * Para testar o app com backend local (mesma rede Wi-Fi):
 *   VITE_API_URL=http://192.168.1.100:3001
 */
function getBaseURL() {
  // URL explícita definida no .env tem prioridade
  if (import.meta.env.VITE_API_URL) {
    return `${import.meta.env.VITE_API_URL}/api`
  }
  // No app nativo sem URL configurada, avisa no console
  if (isNative()) {
    console.warn(
      '[TireMax] VITE_API_URL não definido. ' +
      'Defina o IP do servidor no .env: VITE_API_URL=http://SEU_IP:3001'
    )
    return 'http://localhost:3001/api'
  }
  // Browser dev: usa proxy do Vite
  return '/api'
}

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 20000, // 20s (mobile pode ser mais lento)
  headers: { 'Content-Type': 'application/json' },
})

// ─── Request interceptor ─────────────────────────────────────────────────────
api.interceptors.request.use(async (config) => {
  // Pega token: Capacitor Preferences no app, localStorage no browser
  let token
  try {
    token = await getPreference('token')
  } catch {
    token = localStorage.getItem('token')
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Response interceptor ────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await removePreference('token')
      localStorage.removeItem('token')
      delete api.defaults.headers.common['Authorization']
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    // Erro de rede no mobile — mensagem mais amigável
    if (!error.response && error.code === 'ERR_NETWORK') {
      error.message = 'Sem conexão com o servidor. Verifique sua rede.'
    }

    return Promise.reject(error)
  }
)

// Helper para salvar token (funciona em ambos os ambientes)
export async function saveToken(token) {
  await setPreference('token', token)
  localStorage.setItem('token', token) // fallback
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

// Helper para remover token
export async function clearToken() {
  await removePreference('token')
  localStorage.removeItem('token')
  delete api.defaults.headers.common['Authorization']
}

export default api
