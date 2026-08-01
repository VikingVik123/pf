<template>
  <div id="pulline-app">
    <Toast />
    <router-view />
  </div>
</template>

<script setup>

</script>

<style>
:root {
  --bg-dark: #0D1117;
  --bg-card: #161B22;
  --bg-hover: #1F262E;
  --border: #30363D;
  --border-light: #484F58;
  --cyan: #38BDF8;
  --cyan-dim: rgba(56,189,248,0.12);
  --white: #E6EDF3;
  --gray: #8B949E;
  --gray-dim: #484F58;
  --amber: #F59E0B;
  --amber-dim: rgba(245,158,11,0.12);
  --green: #22C55E;
  --green-dim: rgba(34,197,94,0.12);
  --purple: #A371F7;
  --red: #F85149;
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', monospace;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

html, body, #app, #pulline-app {
  height: 100%;
  font-family: var(--font-sans);
  background: var(--bg-dark);
  color: var(--white);
  -webkit-font-smoothing: antialiased;
}

.mono { font-family: var(--font-mono); font-size: 12px; }

.btn {
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  font-family: var(--font-sans);
}
.btn:hover { opacity: 0.85; transform: translateY(-1px); }
.btn:active { transform: translateY(0); }

.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.input {
  background: var(--bg-dark);
  border: 1px solid var(--border);
  color: var(--white);
  padding: 10px 14px;
  border-radius: 8px;
  width: 100%;
  font-size: 14px;
  font-family: var(--font-sans);
  outline: none;
  transition: border-color 0.2s;
}
.input:focus { border-color: var(--cyan); }
.input::placeholder { color: var(--gray-dim); }

.grid-bg {
  background-image: radial-gradient(var(--border) 1px, transparent 1px);
  background-size: 24px 24px;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.fade-in { animation: fadeIn 0.4s ease-out; }

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.spin { animation: spin 1s linear infinite; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.pulse { animation: pulse 2s infinite; }

::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: var(--bg-dark); }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: var(--border-light); }
</style>