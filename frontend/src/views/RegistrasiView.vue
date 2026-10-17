<script setup>
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const nama = ref('')
const email = ref('')
const kataSandi = ref('')
const pesanError = ref('')
const memuat = ref(false)

// UC-01: Registrasi Akun
async function daftar() {
  pesanError.value = ''
  if (!nama.value || !email.value || !kataSandi.value) {
    pesanError.value = 'Harap isi kolom ini'
    return
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    pesanError.value = 'Format email tidak valid'
    return
  }
  memuat.value = true
  try {
    await auth.registrasi(nama.value, email.value, kataSandi.value)
    router.push({ path: '/login', query: { terdaftar: '1' } })
  } catch (err) {
    pesanError.value = err.pesan || 'Terjadi kesalahan, silakan coba lagi'
  } finally {
    memuat.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen flex-col md:flex-row">
    <div class="bg-primary px-6 py-10 text-white md:flex md:w-1/2 md:flex-col md:px-14 md:py-12">
      <p class="text-xl font-bold">SAGARA</p>
      <div class="mt-4 md:my-auto">
        <h1 class="text-2xl font-bold md:text-5xl md:leading-tight">
          Asisten AI untuk perawatan akuarium dan kolam Anda
        </h1>
        <p class="mt-4 hidden text-primary-light md:block">
          Pantau kondisi, tanya AI, dan analisis foto dalam satu tempat
        </p>
      </div>
    </div>

    <div class="flex flex-1 items-center justify-center px-6 py-10">
      <form class="w-full max-w-sm" @submit.prevent="daftar">
        <h2 class="text-3xl font-bold">Daftar ke SAGARA</h2>
        <p class="mt-1 text-text-muted">Buat akun untuk mulai mengelola wadahmu</p>

        <label class="mt-8 block text-sm font-semibold">Nama</label>
        <input v-model="nama" type="text" placeholder="Nama lengkap"
          class="mt-2 w-full rounded-lg border border-border bg-white px-4 py-3 outline-none focus:border-primary" />

        <label class="mt-5 block text-sm font-semibold">Email</label>
        <input v-model="email" type="email" placeholder="nama@email.com"
          class="mt-2 w-full rounded-lg border border-border bg-white px-4 py-3 outline-none focus:border-primary" />

        <label class="mt-5 block text-sm font-semibold">Kata sandi</label>
        <input v-model="kataSandi" type="password" placeholder="Buat kata sandi"
          class="mt-2 w-full rounded-lg border border-border bg-white px-4 py-3 outline-none focus:border-primary" />

        <p v-if="pesanError" class="mt-4 rounded-lg bg-error/10 px-4 py-2 text-sm text-error">{{ pesanError }}</p>

        <button type="submit" :disabled="memuat"
          class="mt-6 w-full rounded-lg bg-primary py-3 font-semibold text-white disabled:opacity-60">
          {{ memuat ? 'Memproses...' : 'Daftar' }}
        </button>

        <p class="mt-4 text-sm text-text-muted">
          Sudah punya akun?
          <RouterLink to="/login" class="font-semibold text-primary">Masuk</RouterLink>
        </p>
      </form>
    </div>
  </div>
</template>