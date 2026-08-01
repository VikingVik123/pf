// Centralized read/write for auth tokens.
// Kept separate from the axios client and the Pinia store so
// neither has to import the other directly (avoids circular imports).

const ACCESS_TOKEN_KEY = 'pulline_access_token'
const REFRESH_TOKEN_KEY = 'pulline_refresh_token'

export const tokenStorage = {
  getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  },
  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },
  setTokens({ access_token, refresh_token }) {
    if (access_token) localStorage.setItem(ACCESS_TOKEN_KEY, access_token)
    if (refresh_token) localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token)
  },
  setAccessToken(access_token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, access_token)
  },
  clear() {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}