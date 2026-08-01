import axios from 'axios'
import { tokenStorage } from './tokenStorage'

const baseURL = import.meta.env.VITE_API_BASE_URL

export const apiClient = axios.create({
  baseURL,
})

// Attach the access token to every outgoing request, if we have one.
apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// --- 401 handling with a refresh queue ---
// If several requests fail with 401 at the same time, we only want to
// call /auth/refresh once. Everyone else waits on the same promise.
let isRefreshing = false
let refreshQueue = []

function subscribeToRefresh(callback) {
  refreshQueue.push(callback)
}

function onRefreshed(newAccessToken) {
  refreshQueue.forEach((callback) => callback(newAccessToken))
  refreshQueue = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status

    // Don't try to refresh on the refresh/login/register endpoints themselves.
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/refresh')
      || originalRequest?.url?.includes('/auth/login')
      || originalRequest?.url?.includes('/auth/register')

    if (status !== 401 || isAuthEndpoint || originalRequest._retry) {
      return Promise.reject(error)
    }

    const refreshToken = tokenStorage.getRefreshToken()
    if (!refreshToken) {
      tokenStorage.clear()
      return Promise.reject(error)
    }

    originalRequest._retry = true

    if (isRefreshing) {
      // Wait for the in-flight refresh to finish, then retry with the new token.
      return new Promise((resolve, reject) => {
        subscribeToRefresh((newAccessToken) => {
          if (!newAccessToken) {
            reject(error)
            return
          }
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
          resolve(apiClient(originalRequest))
        })
      })
    }

    isRefreshing = true
    try {
      const { data } = await axios.post(`${baseURL}/auth/refresh`, {
        refresh_token: refreshToken,
      })
      tokenStorage.setAccessToken(data.access_token)
      onRefreshed(data.access_token)
      originalRequest.headers.Authorization = `Bearer ${data.access_token}`
      return apiClient(originalRequest)
    } catch (refreshError) {
      onRefreshed(null)
      tokenStorage.clear()
      window.location.href = '/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)