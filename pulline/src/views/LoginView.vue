<template>
  <div class="page">
    <!-- Left: blueprint panel -->
    <aside class="blueprint" aria-hidden="true">
      <div class="grid-lines"></div>

      <div class="blueprint-content">
        <div class="wordmark">
          <span class="wordmark-mark">P</span>
          <span class="wordmark-text">Pulline</span>
        </div>
        <p class="tagline">Upload a model. Get every floor plan back.</p>

        <svg class="floorplan" viewBox="0 0 320 260" fill="none">
          <rect x="20" y="20" width="280" height="220" stroke="currentColor" stroke-width="1.5" />
          <line x1="20" y1="110" x2="180" y2="110" stroke="currentColor" stroke-width="1.5" />
          <line x1="180" y1="20" x2="180" y2="240" stroke="currentColor" stroke-width="1.5" />
          <line x1="180" y1="170" x2="300" y2="170" stroke="currentColor" stroke-width="1.5" />
          <path d="M100 110 A20 20 0 0 1 100 150" stroke="currentColor" stroke-width="1.2" />
          <path d="M180 90 A20 20 0 0 0 220 90" stroke="currentColor" stroke-width="1.2" />
          <!-- dimension line -->
          <line x1="20" y1="252" x2="300" y2="252" stroke="currentColor" stroke-width="1" />
          <line x1="20" y1="247" x2="20" y2="257" stroke="currentColor" stroke-width="1" />
          <line x1="300" y1="247" x2="300" y2="257" stroke="currentColor" stroke-width="1" />
          <text x="145" y="255" fill="currentColor" font-size="9" font-family="JetBrains Mono, monospace">14.2 m</text>
        </svg>

        <dl class="specs">
          <div><dt>Formats</dt><dd>IFC2X3, IFC4</dd></div>
          <div><dt>Output</dt><dd>CSV · PNG · SVG · DXF</dd></div>
          <div><dt>Processing</dt><dd>Queued, per floor</dd></div>
        </dl>
      </div>
    </aside>

    <!-- Right: form -->
    <main class="form-side">
      <div class="card">
        <span class="crop crop-tl"></span>
        <span class="crop crop-tr"></span>
        <span class="crop crop-bl"></span>
        <span class="crop crop-br"></span>

        <p class="eyebrow">Welcome back</p>
        <h1>Log in</h1>
        <p class="subhead">Access your projects and processed floor plans.</p>

        <form novalidate @submit.prevent="handleSubmit">
          <div class="field">
            <label for="email">Email</label>
            <input
              id="email"
              v-model.trim="form.email"
              type="email"
              autocomplete="email"
              :class="{ invalid: errors.email }"
              @blur="touched.email = true"
            />
            <p v-if="errors.email" class="field-error">{{ errors.email }}</p>
          </div>

          <div class="field">
            <div class="label-row">
              <label for="password">Password</label>
              <router-link to="/forgot-password" class="forgot-link">Forgot password?</router-link>
            </div>
            <input
              id="password"
              v-model="form.password"
              type="password"
              autocomplete="current-password"
              :class="{ invalid: errors.password }"
              @blur="touched.password = true"
            />
            <p v-if="errors.password" class="field-error">{{ errors.password }}</p>
          </div>

          <p v-if="serverError" class="server-error" role="alert">{{ serverError }}</p>

          <button type="submit" :disabled="submitting">
            {{ submitting ? 'Logging in…' : 'Log in' }}
          </button>
        </form>

        <p class="switch">
          Don't have an account?
          <router-link to="/register">Create one</router-link>
        </p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { reactive, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '../api/auth'
import { tokenStorage } from '../api/tokenStorage'

const router = useRouter()

const form = reactive({
  email: '',
  password: '',
})

const touched = reactive({
  email: false,
  password: false,
})

const submitting = ref(false)
const serverError = ref('')

const errors = computed(() => {
  const e = {}

  if (touched.email) {
    if (!form.email) e.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address.'
  }

  if (touched.password) {
    if (!form.password) e.password = 'Password is required.'
  }

  return e
})

const isValid = computed(() => {
  return (
    form.email &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
    form.password
  )
})

async function handleSubmit() {
  touched.email = true
  touched.password = true
  serverError.value = ''

  if (!isValid.value) return

  submitting.value = true
  try {
    const { tokens } = await authApi.login({
      email: form.email,
      password: form.password,
    })
    tokenStorage.setTokens(tokens)
    router.push('/')
  } catch (err) {
    const status = err.response?.status
    if (status === 401) {
      serverError.value = 'Incorrect email or password.'
    } else if (status === 422) {
      serverError.value = 'Please check the form and try again.'
    } else {
      serverError.value =
        err.response?.data?.detail || 'Something went wrong logging you in. Please try again.'
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  font-family: 'Inter', sans-serif;
  color: #2a2e33;
}

/* ---------- Left: blueprint panel ---------- */
.blueprint {
  position: relative;
  background: #0e2238;
  color: #cfe1f2;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  overflow: hidden;
}

.grid-lines {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(207, 225, 242, 0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(207, 225, 242, 0.07) 1px, transparent 1px);
  background-size: 32px 32px;
}

.blueprint-content {
  position: relative;
  max-width: 380px;
  width: 100%;
}

.wordmark {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 28px;
}

.wordmark-mark {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 1.5px solid #5a8fc0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
}

.wordmark-text {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 600;
  font-size: 20px;
  letter-spacing: 0.02em;
}

.tagline {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 500;
  font-size: 26px;
  line-height: 1.3;
  margin: 0 0 36px;
  color: #f2f6fa;
  max-width: 320px;
}

.floorplan {
  width: 100%;
  height: auto;
  color: #5a8fc0;
  margin-bottom: 36px;
}

.specs {
  display: grid;
  gap: 14px;
  margin: 0;
  border-top: 1px solid rgba(207, 225, 242, 0.2);
  padding-top: 20px;
}

.specs > div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
}

.specs dt {
  color: #7fa3c6;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.specs dd {
  margin: 0;
  color: #e3edf6;
  text-align: right;
}

/* ---------- Right: form ---------- */
.form-side {
  display: grid;
  place-items: center;
  padding: 48px 24px;
  background: #f6f4ee;
}

.card {
  position: relative;
  width: 100%;
  max-width: 400px;
  padding: 40px 8px;
}

.crop {
  position: absolute;
  width: 14px;
  height: 14px;
  border-color: #2f6fa8;
  border-style: solid;
  opacity: 0.55;
}
.crop-tl { top: 0; left: -8px; border-width: 1.5px 0 0 1.5px; }
.crop-tr { top: 0; right: -8px; border-width: 1.5px 1.5px 0 0; }
.crop-bl { bottom: 0; left: -8px; border-width: 0 0 1.5px 1.5px; }
.crop-br { bottom: 0; right: -8px; border-width: 0 1.5px 1.5px 0; }

.eyebrow {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #2f6fa8;
  margin: 0 0 12px;
}

h1 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 8px;
  color: #17202b;
}

.subhead {
  margin: 0 0 32px;
  color: #5b6470;
  font-size: 14.5px;
  line-height: 1.5;
}

form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.label-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.forgot-link {
  font-size: 12.5px;
  color: #2f6fa8;
  text-decoration: none;
}

.forgot-link:hover {
  text-decoration: underline;
}

label {
  font-size: 13px;
  font-weight: 500;
  color: #384049;
}

input {
  font-family: 'Inter', sans-serif;
  font-size: 14.5px;
  padding: 10px 12px;
  border: 1.5px solid #d8d3c6;
  border-radius: 3px;
  background: #fffdf9;
  color: #17202b;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  min-width: 0;
}

input::placeholder {
  color: #b0b6bc;
}

input:focus {
  outline: none;
  border-color: #2f6fa8;
  box-shadow: 0 0 0 3px rgba(47, 111, 168, 0.15);
}

input.invalid {
  border-color: #c2531a;
}

input.invalid:focus {
  box-shadow: 0 0 0 3px rgba(194, 83, 26, 0.15);
}

.field-error {
  margin: 0;
  font-size: 12.5px;
  color: #c2531a;
}

.server-error {
  margin: 0;
  padding: 10px 12px;
  border: 1px solid #c2531a;
  background: rgba(194, 83, 26, 0.08);
  color: #a3431a;
  font-size: 13px;
  border-radius: 3px;
}

button {
  margin-top: 8px;
  padding: 12px 20px;
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 600;
  font-size: 15px;
  color: #f6f4ee;
  background: #0e2238;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  transition: background 0.15s ease;
}

button:hover:not(:disabled) {
  background: #17324f;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.switch {
  margin: 24px 0 0;
  font-size: 13.5px;
  color: #5b6470;
  text-align: center;
}

.switch a {
  color: #2f6fa8;
  font-weight: 500;
  text-decoration: none;
}

.switch a:hover {
  text-decoration: underline;
}

@media (max-width: 860px) {
  .page {
    grid-template-columns: 1fr;
  }
  .blueprint {
    padding: 32px 24px;
  }
  .tagline {
    font-size: 20px;
  }
  .floorplan {
    max-width: 240px;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
  }
}
</style>