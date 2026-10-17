import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LoginView from '@/views/LoginView.vue'
import RegistrasiView from '@/views/RegistrasiView.vue'
import DashboardView from '@/views/DashboardView.vue'
import TambahWadahView from '@/views/TambahWadahView.vue'
import DetailWadahView from '@/views/DetailWadahView.vue'
import ChatbotView from '@/views/ChatbotView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: LoginView, meta: { tamu: true } },
    { path: '/registrasi', component: RegistrasiView, meta: { tamu: true } },
    // Sementara: halaman utama diarahkan ke login sampai dashboard dibuat
    { path: '/', component: DashboardView },
    { path: '/wadah/tambah', component: TambahWadahView },
    { path: '/wadah/:id', component: DetailWadahView },
    { path: '/chatbot', component: ChatbotView },
  ],
})

// Penjaga halaman: yang belum login hanya boleh membuka halaman tamu
router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!to.meta.tamu && !auth.sudahLogin) return '/login'
})

export default router