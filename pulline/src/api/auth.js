import { apiClient } from './client'

export const authApi = {
  register(payload) {
    // payload: { email, username, password, full_name? }
    return apiClient.post('/auth/register', payload).then((res) => res.data)
  },

  login(payload) {
    // payload: { email, password }
    return apiClient.post('/auth/login', payload).then((res) => res.data)
  },

  refresh(refresh_token) {
    return apiClient.post('/auth/refresh', { refresh_token }).then((res) => res.data)
  },

  logout(refresh_token) {
    return apiClient.post('/auth/logout', { refresh_token }).then((res) => res.data)
  },

  logoutAll() {
    return apiClient.post('/auth/logout-all').then((res) => res.data)
  },

  logoutAccessToken(access_token) {
    return apiClient
      .post('/auth/logout-access', null, { params: { access_token } })
      .then((res) => res.data)
  },

  getCurrentUser() {
    return apiClient.get('/auth/me').then((res) => res.data)
  },

  updateCurrentUser(payload) {
    // payload: { email?, username?, full_name? }
    return apiClient.put('/auth/me', payload).then((res) => res.data)
  },

  deleteAccount() {
    return apiClient.delete('/auth/me').then((res) => res.data)
  },

  changePassword(new_password) {
    return apiClient.post('/auth/change-password', { new_password }).then((res) => res.data)
  },

  forgotPassword(email) {
    return apiClient.post('/auth/forgot-password', { email }).then((res) => res.data)
  },

  resetPassword(token, new_password) {
    return apiClient.post('/auth/reset-password', { token, new_password }).then((res) => res.data)
  },

  healthCheck() {
    return apiClient.get('/auth/health').then((res) => res.data)
  },

  verifyEmail(token) {
    return apiClient.post('/auth/verify-email', { token }).then((res) => res.data)
  },

  resendVerification(email) {
    return apiClient.post('/auth/resend-verification', { email }).then((res) => res.data)
  },

  getVerificationStatus() {
    return apiClient.get('/auth/verification-status').then((res) => res.data)
  },
}