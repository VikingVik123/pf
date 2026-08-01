import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const routes = [
  { path: '/login', name: 'Login', component: () => import('../views/LoginView.vue'), meta: { public: true } },
  { path: '/register', name: 'Register', component: () => import('../views/RegisterView.vue'), meta: { public: true } },
  { path: '/verify', name: 'Verify', component: () => import('../views/VerifyView.vue'), meta: { public: true } },
  { path: '/verify-email', name: 'VerifyEmail', component: () => import('../views/VerifyEmailView.vue'), meta: { public: true } },
  { path: '/', name: 'Dashboard', component: () => import('../views/DashboardView.vue') },
  { path: '/upload', name: 'Upload', component: () => import('../views/UploadView.vue') },
  { path: '/project/:id', name: 'Project', component: () => import('../views/ProjectView.vue') },
  { path: '/project/:id/csv/:floorId', name: 'CSVPreview', component: () => import('../views/CSVPreviewView.vue') },
  { path: '/settings', name: 'Settings', component: () => import('../views/SettingsView.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.isAuthenticated) {
    next('/login')
  } else if (to.meta.public && auth.isAuthenticated && (to.path === '/login' || to.path === '/register')) {
    next('/')
  } else {
    next()
  }
})

export default router