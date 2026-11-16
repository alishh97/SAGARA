import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LoginView from '@/views/LoginView.vue'
import RegistrasiView from '@/views/RegistrasiView.vue'
import DashboardView from '@/views/DashboardView.vue'
import TambahWadahView from '@/views/TambahWadahView.vue'
import DetailWadahView from '@/views/DetailWadahView.vue'
import ChatbotView from '@/views/ChatbotView.vue'
import AnalisisFotoView from '@/views/AnalisisFotoView.vue'
import RiwayatView from '@/views/RiwayatView.vue'
import RiwayatDetailView from '@/views/RiwayatDetailView.vue'
import AdminLoginView from '@/views/admin/AdminLoginView.vue'
import AdminStatistikView from '@/views/admin/AdminStatistikView.vue'
import AdminPenggunaView from '@/views/admin/AdminPenggunaView.vue'
import { useAdminStore } from '@/stores/admin'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: LoginView, meta: { tamu: true } },
    { path: '/registrasi', component: RegistrasiView, meta: { tamu: true } },
    // Sementara: halaman utama diarahkan ke login sampai dashboard dibuat
    { path: '/', component: DashboardView },
    { path: '/wadah/tambah', component: TambahWadahView },
    { path: '/wadah/:id', component: DetailWadahView },
    { path: '/wadah/:id/edit', component: TambahWadahView },
    { path: '/chatbot', component: ChatbotView },
    { path: '/analisis-foto', component: AnalisisFotoView },
    { path: '/riwayat', component: RiwayatView },
    { path: '/riwayat/:idWadah', component: RiwayatDetailView },
    // Panel admin (view-only)
    { path: '/admin/login', component: AdminLoginView, meta: { tamu: true, admin: true } },
    { path: '/admin', redirect: '/admin/statistik' },
    { path: '/admin/statistik', component: AdminStatistikView, meta: { admin: true } },
    { path: '/admin/pengguna', component: AdminPenggunaView, meta: { admin: true } },
    // URL yang tidak dikenal diarahkan ke halaman utama (lalu ke login jika belum login)
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

// Penjaga halaman: yang belum login hanya boleh membuka halaman tamu
router.beforeEach((to) => {
  // Halaman admin dijaga dengan sesi admin, terpisah dari sesi pengguna
  if (to.meta.admin) {
    const admin = useAdminStore()
    if (!to.meta.tamu && !admin.sudahLogin) return '/admin/login'
    if (to.meta.tamu && admin.sudahLogin) return '/admin/statistik'
    return
  }
  const auth = useAuthStore()
  if (!to.meta.tamu && !auth.sudahLogin) return '/login'
})

export default router