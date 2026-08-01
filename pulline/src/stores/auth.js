import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api/client.js'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref(localStorage.getItem('pulline_access_token') || '')
  const refreshToken = ref(localStorage.getItem('pulline_refresh_token') || '')
  const user = ref(JSON.parse(localStorage.getItem('pulline_user') || 'null'))

  const isAuthenticated = computed(() => !!accessToken.value)

  function extractTokenValues(payload) {
    const normalized = payload?.tokens || payload || {}
    return {
      accessTokenValue: normalized?.access_token || payload?.access_token || '',
      refreshTokenValue: normalized?.refresh_token || payload?.refresh_token || ''
    }
  }

  function setTokens(tokens) {
    const { accessTokenValue, refreshTokenValue } = extractTokenValues(tokens)

    accessToken.value = accessTokenValue
    refreshToken.value = refreshTokenValue

    if (accessTokenValue) {
      localStorage.setItem('pulline_access_token', accessTokenValue)
      localStorage.setItem('pulline_dev_bearer_token', accessTokenValue)
    } else {
      localStorage.removeItem('pulline_access_token')
      localStorage.removeItem('pulline_dev_bearer_token')
    }

    if (refreshTokenValue) {
      localStorage.setItem('pulline_refresh_token', refreshTokenValue)
    } else {
      localStorage.removeItem('pulline_refresh_token')
    }
  }

  function setUser(u) {
    user.value = u
    localStorage.setItem('pulline_user', JSON.stringify(u))
  }

  async function login(credentials) {
    const res = await api.post('/auth/login', credentials)
    setTokens(res.data)
    setUser(res.data.user)
    return res.data
  }

  async function register(data) {
    const res = await api.post('/auth/register', data)
    setTokens(res.data)
    setUser(res.data.user)
    return res.data
  }

  async function refresh() {
    const res = await api.post('/auth/refresh', { refresh_token: refreshToken.value })
    const { accessTokenValue, refreshTokenValue } = extractTokenValues(res.data)
    accessToken.value = accessTokenValue
    refreshToken.value = refreshTokenValue
    localStorage.setItem('pulline_access_token', accessTokenValue)
    localStorage.setItem('pulline_dev_bearer_token', accessTokenValue)
    if (refreshTokenValue) {
      localStorage.setItem('pulline_refresh_token', refreshTokenValue)
    }
    return res.data
  }

  async function logout() {
    try {
      await api.post('/auth/logout', { refresh_token: refreshToken.value })
    } catch (e) {}
    accessToken.value = ''
    refreshToken.value = ''
    user.value = null
    localStorage.removeItem('pulline_access_token')
    localStorage.removeItem('pulline_refresh_token')
    localStorage.removeItem('pulline_user')
  }

  async function fetchUser() {
    const res = await api.get('/auth/me')
    setUser(res.data)
    return res.data
  }

  async function updateUser(data) {
    const res = await api.put('/auth/me', data)
    setUser(res.data)
    return res.data
  }

  async function changePassword(data) {
    return api.post('/auth/change-password', data)
  }

  async function deleteAccount() {
    return api.delete('/auth/me')
  }

  async function resendVerification(email) {
    return api.post('/auth/resend-verification', { email })
  }

  async function checkVerification() {
    return api.get('/auth/verification-status')
  }

  return {
    accessToken, refreshToken, user, isAuthenticated,
    login, register, refresh, logout, fetchUser,
    updateUser, changePassword, deleteAccount,
    resendVerification, checkVerification
  }
})