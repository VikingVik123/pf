import axios from 'axios'
import { useAuthStore } from '../stores/auth.js'

const resolvedBaseUrl = '/api'

const api = axios.create({
  baseURL: resolvedBaseUrl,
  headers: { 'Content-Type': 'application/json' }
})

function shouldSkipAuthHeader(url = '') {
  return ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout', '/auth/forgot-password', '/auth/reset-password', '/auth/verify-email', '/auth/resend-verification', '/auth/health'].some((path) => url.includes(path))
}

function shouldSkipRefresh(url = '') {
  return ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout', '/auth/forgot-password', '/auth/reset-password', '/auth/verify-email', '/auth/resend-verification', '/auth/health'].some((path) => url.includes(path))
}

function getAuthToken() {
  const auth = useAuthStore()
  const envToken = import.meta.env.VITE_API_BEARER_TOKEN || import.meta.env.VITE_API_TOKEN || ''
  const storedToken = localStorage.getItem('pulline_dev_bearer_token') || localStorage.getItem('pulline_access_token') || ''
  return auth.accessToken || storedToken || envToken
}

api.interceptors.request.use((config) => {
  if (!shouldSkipAuthHeader(config.url || '')) {
    const token = getAuthToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry && !shouldSkipRefresh(original.url || '')) {
      original._retry = true
      const auth = useAuthStore()
      try {
        await auth.refresh()
        original.headers.Authorization = `Bearer ${auth.accessToken}`
        return api(original)
      } catch (refreshErr) {
        auth.logout()
        window.location.href = '/login'
        return Promise.reject(refreshErr)
      }
    }
    return Promise.reject(err)
  }
)

export default api