<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'

const router = useRouter()
const adminStore = useAdminStore()

const email = ref('')
const kataSandi = ref('')
const pesanError = ref('')
const memuat = ref(false)

// UC-20: Login Admin
async function masuk() {
  pesanError.value = ''
  if (!email.value || !kataSandi.value) {
    pesanError.value = 'Harap isi kolom ini'
    return
  }
  memuat.value = true
  try {
    await adminStore.login(email.value, kataSandi.value)
    router.push('/admin/statistik')
  } catch (err) {
    pesanError.value = err.pesan || 'Terjadi kesalahan, silakan coba lagi'
  } finally {
    memuat.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-bg px-6">
    <form class="w-full max-w-sm rounded-xl border border-border bg-white p-8" @submit.prevent="masuk">
      <p class="text-xl font-bold text-primary">SAGARA</p>
      <h1 class="mt-2 text-2xl font-bold">Login Admin</h1>
      <p class="mt-1 text-sm text-text-muted">Khusus pengelola aplikasi</p>

      <label class="mt-6 block text-sm font-semibold">Email</label>
      <input v-model="email" type="email" placeholder="admin@email.com"
        class="mt-2 w-full rounded-lg border border-border bg-white px-4 py-3 outline-none focus:border-primary" />

      <label class="mt-5 block text-sm font-semibold">Kata sandi</label>
      <input v-model="kataSandi" type="password" placeholder="Kata sandi admin"
        class="mt-2 w-full rounded-lg border border-border bg-white px-4 py-3 outline-none focus:border-primary" />

      <p v-if="pesanError" class="mt-4 rounded-lg bg-error/10 px-4 py-2 text-sm text-error">{{ pesanError }}</p>

      <button type="submit" :disabled="memuat"
        class="mt-6 w-full rounded-lg bg-primary py-3 font-semibold text-white disabled:opacity-60">
        {{ memuat ? 'Memproses...' : 'Login' }}
      </button>
    </form>
  </div>
</template>
