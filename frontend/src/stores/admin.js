import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/services/api'

export const useAdminStore = defineStore('admin', () => {
  const token = ref(localStorage.getItem('tokenAdmin'))
  const admin = ref(JSON.parse(localStorage.getItem('admin') || 'null'))
  const sudahLogin = computed(() => !!token.value)

  // UC-20: Login Admin
  async function login(email, kataSandi) {
    const data = await api.post('/admin/login', { email, kataSandi })
    token.value = data.token
    admin.value = data.admin
    localStorage.setItem('tokenAdmin', data.token)
    localStorage.setItem('admin', JSON.stringify(data.admin))
  }

  // UC-21: Logout Admin, token admin dihapus dari sisi klien
  function logout() {
    token.value = null
    admin.value = null
    localStorage.removeItem('tokenAdmin')
    localStorage.removeItem('admin')
  }

  return { token, admin, sudahLogin, login, logout }
})
