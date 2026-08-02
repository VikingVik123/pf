<template>
  <div class="layout">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="wordmark">
        <span class="wordmark-mark">P</span>
        <span class="wordmark-text">Pulline</span>
      </div>

      <nav class="nav">
        <router-link to="/dashboard" class="nav-item">
          <span class="nav-icon" aria-hidden="true">▦</span>
          Projects
        </router-link>
        <router-link to="/account" class="nav-item active">
          <span class="nav-icon" aria-hidden="true">◐</span>
          Account
        </router-link>
      </nav>
    </aside>

    <div class="main-column">
      <header class="header">
        <div>
          <p class="eyebrow">Account</p>
          <h1>Your details</h1>
        </div>
      </header>

      <main class="content">
        <div v-if="loading" class="state-message">Loading your account…</div>

        <div v-else-if="loadError" class="state-message error">{{ loadError }}</div>

        <template v-else-if="user">
          <!-- Verification banner -->
          <div v-if="!user.is_verified" class="verify-banner">
            <div>
              <p class="verify-title">Email not verified</p>
              <p class="verify-sub">
                Verify <strong>{{ user.email }}</strong> to unlock uploads and project processing.
              </p>
            </div>
            <button type="button" class="btn-primary" :disabled="resending" @click="handleResend">
              {{ resending ? 'Sending…' : 'Resend verification email' }}
            </button>
          </div>
          <p v-if="resendMessage" class="resend-message">{{ resendMessage }}</p>

          <!-- Details card -->
          <section class="details-card">
            <div class="details-top">
              <span class="avatar">{{ userInitial }}</span>
              <div>
                <h2>{{ user.full_name || user.username }}</h2>
                <span class="status-pill" :class="user.is_verified ? 'verified' : 'unverified'">
                  {{ user.is_verified ? 'Verified' : 'Unverified' }}
                </span>
              </div>
            </div>

            <dl class="details-grid">
              <div>
                <dt>Email</dt>
                <dd>{{ user.email }}</dd>
              </div>
              <div>
                <dt>Username</dt>
                <dd>{{ user.username }}</dd>
              </div>
              <div>
                <dt>Full name</dt>
                <dd>{{ user.full_name || '—' }}</dd>
              </div>
              <div>
                <dt>Account status</dt>
                <dd>{{ user.is_active ? 'Active' : 'Inactive' }}</dd>
              </div>
              <div>
                <dt>Member since</dt>
                <dd>{{ formatDate(user.created_at) }}</dd>
              </div>
              <div>
                <dt>Last login</dt>
                <dd>{{ user.last_login ? formatDate(user.last_login) : '—' }}</dd>
              </div>
            </dl>
          </section>
        </template>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { authApi } from '../api/auth'

const user = ref(null)
const loading = ref(true)
const loadError = ref('')
const resending = ref(false)
const resendMessage = ref('')

const userInitial = computed(() => {
  const name = user.value?.full_name || user.value?.username || ''
  return name ? name[0].toUpperCase() : '?'
})

function formatDate(isoString) {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

async function loadUser() {
  loading.value = true
  loadError.value = ''
  try {
    user.value = await authApi.getCurrentUser()
  } catch (err) {
    loadError.value = 'Could not load your account details. Please try refreshing.'
  } finally {
    loading.value = false
  }
}

async function handleResend() {
  if (!user.value) return
  resending.value = true
  resendMessage.value = ''
  try {
    await authApi.resendVerification(user.value.email)
    resendMessage.value = 'Verification email sent — check your inbox.'
  } catch (err) {
    resendMessage.value =
      err.response?.data?.detail || 'Could not resend the verification email. Please try again.'
  } finally {
    resending.value = false
  }
}

onMounted(loadUser)
</script>

<style scoped>
.layout {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 240px 1fr;
  font-family: 'Inter', sans-serif;
  color: #2a2e33;
  background: #f6f4ee;
}

.sidebar {
  background: #0e2238;
  color: #cfe1f2;
  display: flex;
  flex-direction: column;
  padding: 28px 20px;
}

.wordmark {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 40px;
}

.wordmark-mark {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border: 1.5px solid #5a8fc0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
}

.wordmark-text {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 600;
  font-size: 18px;
  letter-spacing: 0.02em;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 4px;
  color: #b7cbde;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.15s ease, color 0.15s ease;
}

.nav-item:hover {
  background: rgba(207, 225, 242, 0.08);
  color: #f2f6fa;
}

.nav-item.active {
  background: rgba(90, 143, 192, 0.18);
  color: #f2f6fa;
}

.nav-icon {
  font-size: 14px;
  width: 16px;
  text-align: center;
}

.main-column {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.header {
  padding: 32px 40px 24px;
  border-bottom: 1px solid #e4dfd2;
}

.eyebrow {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #2f6fa8;
  margin: 0 0 6px;
}

h1 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 26px;
  font-weight: 600;
  margin: 0;
  color: #17202b;
}

.content {
  padding: 32px 40px;
  flex: 1;
  max-width: 640px;
}

.state-message {
  padding: 16px;
  color: #5b6470;
  font-size: 14px;
}

.state-message.error {
  border: 1px solid #c2531a;
  background: rgba(194, 83, 26, 0.08);
  color: #a3431a;
  border-radius: 3px;
}

.verify-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 16px 20px;
  margin-bottom: 12px;
  border: 1.5px solid #c2531a;
  background: rgba(194, 83, 26, 0.06);
  border-radius: 6px;
  flex-wrap: wrap;
}

.verify-title {
  margin: 0 0 2px;
  font-weight: 600;
  font-size: 14.5px;
  color: #a3431a;
}

.verify-sub {
  margin: 0;
  font-size: 13px;
  color: #7a4326;
}

.verify-sub strong {
  color: #5c3018;
}

.resend-message {
  margin: 0 0 20px;
  font-size: 13px;
  color: #5b6470;
}

.btn-primary {
  padding: 10px 18px;
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 600;
  font-size: 13.5px;
  color: #f6f4ee;
  background: #0e2238;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  transition: background 0.15s ease, opacity 0.15s ease;
  flex-shrink: 0;
}

.btn-primary:hover:not(:disabled) {
  background: #17324f;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.details-card {
  padding: 24px;
  border: 1.5px solid #e4dfd2;
  border-radius: 6px;
  background: #fffdf9;
}

.details-top {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 24px;
}

.avatar {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #0e2238;
  color: #f2f6fa;
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 600;
  font-size: 18px;
  flex-shrink: 0;
}

.details-top h2 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 4px;
  color: #17202b;
}

.status-pill {
  display: inline-block;
  padding: 2px 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-radius: 3px;
}

.status-pill.verified {
  color: #3f8f5f;
  background: rgba(63, 143, 95, 0.12);
}

.status-pill.unverified {
  color: #c2531a;
  background: rgba(194, 83, 26, 0.1);
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 20px;
  margin: 0;
  padding-top: 20px;
  border-top: 1px solid #e4dfd2;
}

.details-grid dt {
  font-size: 11px;
  color: #9aa3ac;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 4px;
}

.details-grid dd {
  margin: 0;
  font-size: 14.5px;
  font-weight: 500;
  color: #384049;
  overflow-wrap: break-word;
}

@media (max-width: 860px) {
  .layout {
    grid-template-columns: 1fr;
  }
  .sidebar {
    flex-direction: row;
    align-items: center;
    padding: 16px 20px;
  }
  .wordmark {
    margin-bottom: 0;
  }
  .header {
    padding: 24px 20px;
  }
  .content {
    padding: 24px 20px;
  }
}

@media (max-width: 640px) {
  .sidebar {
    flex-wrap: wrap;
    gap: 14px;
    align-items: flex-start;
  }

  .wordmark {
    margin-right: auto;
  }

  .nav {
    width: 100%;
    gap: 8px;
  }

  .nav-item {
    justify-content: center;
  }

  .header {
    padding: 20px;
  }

  .content {
    padding: 20px;
  }

  .verify-banner {
    align-items: flex-start;
  }

  .btn-primary {
    width: 100%;
  }

  .details-card {
    padding: 20px;
  }

  .details-top {
    align-items: flex-start;
  }

  .details-grid {
    grid-template-columns: 1fr;
  }
}
</style>