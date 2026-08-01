<template>
  <div class="layout">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="wordmark">
        <span class="wordmark-mark">P</span>
        <span class="wordmark-text">Pulline</span>
      </div>

      <nav class="nav">
        <router-link to="/dashboard" class="nav-item active">
          <span class="nav-icon" aria-hidden="true">▦</span>
          Projects
        </router-link>
        <router-link to="/account" class="nav-item">
          <span class="nav-icon" aria-hidden="true">◐</span>
          Account
        </router-link>
      </nav>

      <button class="logout" @click="handleLogout">
        <span class="nav-icon" aria-hidden="true">⏻</span>
        Log out
      </button>
    </aside>

    <div class="main-column">
      <!-- Header -->
      <header class="header">
        <div>
          <p class="eyebrow">Dashboard</p>
          <h1>Your projects</h1>
        </div>
        <div class="user-chip">
          <span class="avatar">{{ userInitial }}</span>
          <span class="user-name">{{ userDisplayName }}</span>
        </div>
      </header>

      <!-- Content -->
      <main class="content">
        <p v-if="loadError" class="load-error" role="alert">{{ loadError }}</p>

        <div v-if="loadingProjects" class="grid">
          <div v-for="n in 3" :key="n" class="card skeleton"></div>
        </div>

        <div v-else class="grid">
          <router-link
            v-for="project in projects"
            :key="project.id"
            :to="`/projects/${project.id}`"
            class="card project-card"
          >
            <div class="card-top">
              <span class="status-dot" :class="`status-${project.status}`"></span>
              <span class="status-label">{{ statusLabel(project.status) }}</span>
            </div>
            <h3 class="project-name">{{ project.project_name || project.filename || 'Untitled project' }}</h3>
            <dl class="project-meta">
              <div>
                <dt>Floors</dt>
                <dd>{{ project.total_floors }}</dd>
              </div>
              <div>
                <dt>Elements</dt>
                <dd>{{ project.total_elements }}</dd>
              </div>
            </dl>
            <p class="project-date">{{ formatDate(project.created_at) }}</p>
          </router-link>

          <router-link to="/projects/new" class="card add-card">
            <span class="add-icon" aria-hidden="true">+</span>
            <span>New project</span>
          </router-link>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '../api/auth'
import { ifcApi } from '../api/ifc'
import { tokenStorage } from '../api/tokenStorage'

const router = useRouter()

const user = ref(null)
const projects = ref([])
const loadingProjects = ref(true)
const loadError = ref('')

const userDisplayName = computed(() => user.value?.full_name || user.value?.username || '')
const userInitial = computed(() => userDisplayName.value ? userDisplayName.value[0].toUpperCase() : '?')

function statusLabel(status) {
  const labels = {
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed',
  }
  return labels[status] || status
}

function formatDate(isoString) {
  if (!isoString) return ''
  return new Date(isoString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

async function loadDashboard() {
  loadingProjects.value = true
  loadError.value = ''
  try {
    const [userData, projectsData] = await Promise.all([
      authApi.getCurrentUser(),
      ifcApi.listProjects(),
    ])
    user.value = userData
    projects.value = projectsData.projects
  } catch (err) {
    loadError.value = 'Could not load your dashboard. Please try refreshing.'
  } finally {
    loadingProjects.value = false
  }
}

async function handleLogout() {
  const refreshToken = tokenStorage.getRefreshToken()
  try {
    if (refreshToken) await authApi.logout(refreshToken)
  } catch {
    // Even if the server call fails, still clear local tokens and redirect.
  } finally {
    tokenStorage.clear()
    router.push('/login')
  }
}

onMounted(loadDashboard)
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

/* ---------- Sidebar ---------- */
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
  flex: 1;
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

.logout {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: none;
  background: transparent;
  color: #8fa8c0;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s ease, color 0.15s ease;
}

.logout:hover {
  background: rgba(207, 225, 242, 0.08);
  color: #f2f6fa;
}

/* ---------- Main column ---------- */
.main-column {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.user-chip {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #0e2238;
  color: #f2f6fa;
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 600;
  font-size: 13px;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #384049;
}

/* ---------- Content ---------- */
.content {
  padding: 32px 40px;
  flex: 1;
}

.load-error {
  margin: 0 0 20px;
  padding: 10px 12px;
  border: 1px solid #c2531a;
  background: rgba(194, 83, 26, 0.08);
  color: #a3431a;
  font-size: 13px;
  border-radius: 3px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
}

.card {
  position: relative;
  padding: 20px;
  border: 1.5px solid #e4dfd2;
  border-radius: 6px;
  background: #fffdf9;
  min-height: 160px;
}

.skeleton {
  background: linear-gradient(90deg, #f0ede4 25%, #e8e4d8 37%, #f0ede4 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
  border: 1.5px solid #e4dfd2;
}

@keyframes shimmer {
  0% { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
}

.project-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
}

.project-card:hover {
  border-color: #2f6fa8;
  box-shadow: 0 4px 14px rgba(15, 34, 56, 0.08);
  transform: translateY(-2px);
}

.card-top {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
.status-pending { background: #b0b6bc; }
.status-processing { background: #2f6fa8; }
.status-completed { background: #3f8f5f; }
.status-failed { background: #c2531a; }

.status-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #7a8390;
}

.project-name {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #17202b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-meta {
  display: flex;
  gap: 24px;
  margin: 0;
}

.project-meta dt {
  font-size: 11px;
  color: #9aa3ac;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 2px;
}

.project-meta dd {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #384049;
}

.project-date {
  margin: auto 0 0;
  font-size: 12px;
  color: #9aa3ac;
}

.add-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-style: dashed;
  border-color: #c9c2af;
  color: #7a8390;
  text-decoration: none;
  transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
}

.add-card:hover {
  border-color: #2f6fa8;
  color: #2f6fa8;
  background: rgba(47, 111, 168, 0.04);
}

.add-icon {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 28px;
  font-weight: 500;
  line-height: 1;
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
  .nav {
    flex-direction: row;
  }
  .logout {
    display: none;
  }
  .header {
    padding: 24px 20px;
  }
  .content {
    padding: 24px 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
</style>