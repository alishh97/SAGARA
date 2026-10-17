import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/services/api'

export const useWadahStore = defineStore('wadah', () => {
  const daftar = ref([])
  const idWadahAktif = ref(Number(localStorage.getItem('idWadahAktif')) || null)

  const wadahAktif = computed(() => daftar.value.find((w) => w.id_wadah === idWadahAktif.value) || null)

  // UC-06: ambil daftar wadah milik pengguna
  async function muatDaftar() {
    const data = await api.get('/wadah')
    daftar.value = data.wadah
    // Jika belum ada wadah aktif, pakai wadah pertama
    if (!wadahAktif.value && daftar.value.length > 0) {
      pilihWadahAktif(daftar.value[0].id_wadah)
    }
  }

  // UC-10: pilihWadahAktif(), menetapkan konteks aktif di sisi klien
  function pilihWadahAktif(idWadah) {
    idWadahAktif.value = idWadah
    localStorage.setItem('idWadahAktif', idWadah)
  }

  return { daftar, idWadahAktif, wadahAktif, muatDaftar, pilihWadahAktif }
})