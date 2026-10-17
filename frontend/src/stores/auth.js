import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/services/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token'))
  const pengguna = ref(JSON.parse(localStorage.getItem('pengguna') || 'null'))
  const sudahLogin = computed(() => !!token.value)

  // UC-01: Registrasi Akun
  async function registrasi(nama, email, kataSandi) {
    return api.post('/auth/register', { nama, email, kataSandi })
  }

  // UC-02: Login, token disimpan di sisi klien
  async function login(email, kataSandi) {
    const data = await api.post('/auth/login', { email, kataSandi })
    token.value = data.token
    pengguna.value = data.pengguna
    localStorage.setItem('token', data.token)
    localStorage.setItem('pengguna', JSON.stringify(data.pengguna))
  }

  // UC-03: Logout, token dihapus dari sisi klien
  function logout() {
    token.value = null
    pengguna.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('pengguna')
    localStorage.removeItem('idWadahAktif')
  }

  return { token, pengguna, sudahLogin, registrasi, login, logout }
})