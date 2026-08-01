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
    </aside>

    <div class="main-column">
      <header class="header">
        <router-link to="/dashboard" class="back-link">← Back to projects</router-link>
      </header>

      <main class="content">
        <div v-if="loading" class="state-message">Loading project…</div>

        <div v-else-if="loadError" class="state-message error">{{ loadError }}</div>

        <template v-else-if="project">
          <div class="project-header">
            <div>
              <div class="card-top">
                <span class="status-dot" :class="`status-${project.status}`"></span>
                <span class="status-label">{{ statusLabel(project.status) }}</span>
              </div>
              <h1>{{ project.project_name || project.filename || 'Untitled project' }}</h1>
              <p class="filename">{{ project.filename }}</p>
            </div>

            <div class="header-actions">
              <button
                v-if="project.status === 'pending'"
                type="button"
                class="btn-primary"
                :disabled="processing"
                @click="handleProcess"
              >
                {{ processing ? 'Starting…' : 'Process project' }}
              </button>
              <button
                v-if="project.status === 'failed'"
                type="button"
                class="btn-primary"
                :disabled="processing"
                @click="handleProcess"
              >
                {{ processing ? 'Retrying…' : 'Retry processing' }}
              </button>
              <button type="button" class="btn-danger" :disabled="deleting" @click="handleDelete">
                {{ deleting ? 'Deleting…' : 'Delete project' }}
              </button>
            </div>
          </div>

          <p v-if="actionError" class="state-message error inline">{{ actionError }}</p>

          <div v-if="project.status === 'processing'" class="progress-section">
            <div class="progress-track">
              <div class="progress-fill" :style="{ width: project.progress + '%' }"></div>
            </div>
            <p class="progress-label">{{ project.progress }}% complete</p>
          </div>

          <p v-if="project.status === 'failed' && project.error_message" class="state-message error">
            {{ project.error_message }}
          </p>

          <dl class="meta-grid">
            <div>
              <dt>IFC version</dt>
              <dd>{{ project.ifc_version || '—' }}</dd>
            </div>
            <div>
              <dt>Total floors</dt>
              <dd>{{ project.total_floors }}</dd>
            </div>
            <div>
              <dt>Total elements</dt>
              <dd>{{ project.total_elements }}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{{ formatDate(project.created_at) }}</dd>
            </div>
            <div>
              <dt>Processed</dt>
              <dd>{{ project.processed_at ? formatDate(project.processed_at) : '—' }}</dd>
            </div>
          </dl>

          <section v-if="project.floors && project.floors.length" class="floors-section">
            <h2>Floors</h2>
            <div class="floors-list">
              <div v-for="floor in project.floors" :key="floor.id" class="floor-row">
                <div class="floor-info">
                  <span class="status-dot" :class="`status-${floor.status}`"></span>
                  <div>
                    <p class="floor-name">
                      {{ floor.floor_name || `Floor ${floor.floor_number}` }}
                    </p>
                    <p class="floor-sub">
                      {{ floor.element_count }} elements
                      <span v-if="floor.elevation != null"> · {{ floor.elevation }}m elevation</span>
                    </p>
                  </div>
                </div>

                <div class="floor-downloads">
                  <a v-if="floor.csv_url" :href="floor.csv_url" target="_blank" rel="noopener">CSV</a>
                  <a v-if="floor.png_url" :href="floor.png_url" target="_blank" rel="noopener">PNG</a>
                  <a v-if="floor.svg_url" :href="floor.svg_url" target="_blank" rel="noopener">SVG</a>
                  <a v-if="floor.dxf_url" :href="floor.dxf_url" target="_blank" rel="noopener">DXF</a>
                  <a v-if="floor.json_url" :href="floor.json_url" target="_blank" rel="noopener">JSON</a>
                  <span
                    v-if="!floor.csv_url && !floor.png_url && !floor.svg_url && !floor.dxf_url && !floor.json_url"
                    class="no-downloads"
                  >
                    Not ready
                  </span>
                </div>
              </div>
            </div>
          </section>
        </template>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ifcApi } from '../api/ifc'

const route = useRoute()
const router = useRouter()

const project = ref(null)
const loading = ref(true)
const loadError = ref('')
const processing = ref(false)
const deleting = ref(false)
const actionError = ref('')

let pollHandle = null

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
  if (!isoString) return '—'
  return new Date(isoString).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

async function loadProject() {
  try {
    project.value = await ifcApi.getProject(route.params.id)
    loadError.value = ''

    if (project.value.status === 'processing') {
      startPolling()
    } else {
      stopPolling()
    }
  } catch (err) {
    loadError.value = 'Could not load this project. It may not exist, or you may not have access.'
  } finally {
    loading.value = false
  }
}

function startPolling() {
  if (pollHandle) return
  pollHandle = setInterval(loadProject, 4000)
}

function stopPolling() {
  if (pollHandle) {
    clearInterval(pollHandle)
    pollHandle = null
  }
}

async function handleProcess() {
  processing.value = true
  actionError.value = ''
  try {
    const result = await ifcApi.processProject(route.params.id)
    project.value = { ...project.value, status: result.status }
    if (result.status === 'processing') startPolling()
  } catch (err) {
    actionError.value =
      err.response?.data?.detail || 'Could not start processing. Please try again.'
  } finally {
    processing.value = false
  }
}

async function handleDelete() {
  if (!confirm('Delete this project? This cannot be undone.')) return

  deleting.value = true
  actionError.value = ''
  try {
    await ifcApi.deleteProject(route.params.id)
    router.push('/dashboard')
  } catch (err) {
    actionError.value =
      err.response?.data?.detail || 'Could not delete this project. Please try again.'
    deleting.value = false
  }
}

onMounted(loadProject)
onUnmounted(stopPolling)
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
  padding: 32px 40px 0;
}

.back-link {
  font-size: 13.5px;
  color: #2f6fa8;
  text-decoration: none;
  font-weight: 500;
}

.back-link:hover {
  text-decoration: underline;
}

.content {
  padding: 24px 40px 48px;
  flex: 1;
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

.state-message.inline {
  margin: 0 0 20px;
  padding: 10px 12px;
  font-size: 13px;
}

.project-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.card-top {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
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

h1 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 26px;
  font-weight: 600;
  margin: 0 0 4px;
  color: #17202b;
}

.filename {
  margin: 0;
  font-size: 13px;
  color: #9aa3ac;
  font-family: 'JetBrains Mono', monospace;
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.btn-primary,
.btn-danger {
  padding: 10px 18px;
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 600;
  font-size: 14px;
  border-radius: 3px;
  cursor: pointer;
  transition: background 0.15s ease, opacity 0.15s ease;
  border: none;
}

.btn-primary {
  color: #f6f4ee;
  background: #0e2238;
}

.btn-primary:hover:not(:disabled) {
  background: #17324f;
}

.btn-danger {
  color: #a3431a;
  background: transparent;
  border: 1.5px solid #c2531a;
}

.btn-danger:hover:not(:disabled) {
  background: rgba(194, 83, 26, 0.08);
}

.btn-primary:disabled,
.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.progress-section {
  margin-bottom: 24px;
}

.progress-track {
  height: 6px;
  border-radius: 3px;
  background: #e8e4d8;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #2f6fa8;
  transition: width 0.4s ease;
}

.progress-label {
  margin: 6px 0 0;
  font-size: 12.5px;
  color: #7a8390;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 20px;
  margin: 0 0 32px;
  padding: 20px;
  border: 1.5px solid #e4dfd2;
  border-radius: 6px;
  background: #fffdf9;
}

.meta-grid dt {
  font-size: 11px;
  color: #9aa3ac;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 4px;
}

.meta-grid dd {
  margin: 0;
  font-size: 15px;
  font-weight: 500;
  color: #384049;
}

.floors-section h2 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 14px;
  color: #17202b;
}

.floors-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.floor-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  border: 1.5px solid #e4dfd2;
  border-radius: 6px;
  background: #fffdf9;
  flex-wrap: wrap;
}

.floor-info {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.floor-name {
  margin: 0;
  font-size: 14.5px;
  font-weight: 500;
  color: #17202b;
}

.floor-sub {
  margin: 2px 0 0;
  font-size: 12.5px;
  color: #9aa3ac;
}

.floor-downloads {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.floor-downloads a {
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
  color: #2f6fa8;
  border: 1px solid #2f6fa8;
  border-radius: 3px;
  text-decoration: none;
  transition: background 0.15s ease;
}

.floor-downloads a:hover {
  background: rgba(47, 111, 168, 0.08);
}

.no-downloads {
  font-size: 12px;
  color: #9aa3ac;
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
    padding: 24px 20px 0;
  }
  .content {
    padding: 20px 20px 40px;
  }
}
</style>