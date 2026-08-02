<template>
  <div class="page">
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

    <main class="form-side">
      <div class="card">
        <span class="crop crop-tl"></span>
        <span class="crop crop-tr"></span>
        <span class="crop crop-bl"></span>
        <span class="crop crop-br"></span>

        <!-- Auto-verifying via ?token=... in the URL -->
        <template v-if="tokenFromUrl">
          <template v-if="verifying">
            <p class="eyebrow">Verifying</p>
            <h1>Confirming your email…</h1>
            <p class="subhead">This will just take a moment.</p>
          </template>

          <template v-else-if="verifySuccess">
            <p class="eyebrow">All set</p>
            <h1>Email verified</h1>
            <p class="subhead">Your account is ready to go.</p>
            <router-link to="/login" class="btn-primary link-btn">Continue to log in</router-link>
          </template>

          <template v-else>
            <p class="eyebrow">Verification failed</p>
            <h1>That link didn't work</h1>
            <p class="subhead">{{ verifyError }}</p>
          </template>
        </template>

        <!-- No token: resend-verification flow -->
        <template v-else>
          <template v-if="!resent">
            <p class="eyebrow">Verify your email</p>
            <h1>Confirm your email address</h1>
            <p class="subhead">
              We sent a verification link when you signed up. If you can't find it, enter your
              email below and we'll send a new one.
            </p>

            <form novalidate @submit.prevent="handleResend">
              <div class="field">
                <label for="email">Email</label>
                <input
                  id="email"
                  v-model.trim="email"
                  type="email"
                  autocomplete="email"
                  :class="{ invalid: emailError }"
                  @blur="touched = true"
                />
                <p v-if="emailError" class="field-error">{{ emailError }}</p>
              </div>

              <p v-if="serverError" class="server-error" role="alert">{{ serverError }}</p>

              <button type="submit" class="btn-primary" :disabled="sending">
                {{ sending ? 'Sending…' : 'Resend verification email' }}
              </button>
            </form>
          </template>

          <template v-else>
            <p class="eyebrow">Check your inbox</p>
            <h1>Verification email sent</h1>
            <p class="subhead">
              If an account exists for <strong>{{ email }}</strong>, we've sent a new verification link.
            </p>
          </template>
        </template>

        <p class="switch">
          <router-link to="/login">Back to log in</router-link>
        </p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { authApi } from '../api/auth'

const route = useRoute()

const tokenFromUrl = computed(() => route.query.token || '')
const verifying = ref(false)
const verifySuccess = ref(false)
const verifyError = ref('')

const email = ref('')
const touched = ref(false)
const sending = ref(false)
const resent = ref(false)
const serverError = ref('')

const emailError = computed(() => {
  if (!touched.value) return ''
  if (!email.value) return 'Email is required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) return 'Enter a valid email address.'
  return ''
})

async function verifyFromUrl() {
  verifying.value = true
  try {
    await authApi.verifyEmail(tokenFromUrl.value)
    verifySuccess.value = true
  } catch (err) {
    verifyError.value =
      err.response?.data?.detail || 'This verification link is invalid or has expired.'
  } finally {
    verifying.value = false
  }
}

async function handleResend() {
  touched.value = true
  serverError.value = ''
  if (emailError.value || !email.value) return

  sending.value = true
  try {
    await authApi.resendVerification(email.value)
    resent.value = true
  } catch (err) {
    // Avoid leaking whether the email exists; default to the same success state.
    resent.value = true
  } finally {
    sending.value = false
  }
}

onMounted(() => {
  if (tokenFromUrl.value) verifyFromUrl()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  font-family: 'Inter', sans-serif;
  color: #2a2e33;
}

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

.subhead strong {
  color: #384049;
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
}

input:focus {
  outline: none;
  border-color: #2f6fa8;
  box-shadow: 0 0 0 3px rgba(47, 111, 168, 0.15);
}

input.invalid {
  border-color: #c2531a;
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

.btn-primary {
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
  text-align: center;
  text-decoration: none;
  display: inline-block;
}

.btn-primary:hover:not(:disabled) {
  background: #17324f;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.link-btn {
  width: 100%;
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