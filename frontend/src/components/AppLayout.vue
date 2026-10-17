<script setup>
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const menu = [
  { label: 'Wadah Saya', to: '/' },
  { label: 'Chatbot', to: '/chatbot' },
  { label: 'Analisis Foto', to: '/analisis-foto' },
]
// Fitur di luar cakupan UTS, ditampilkan sebagai rencana pengembangan
const menuSegera = ['Riwayat', 'Langganan']

// UC-03: Logout
function keluar() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen md:flex">
    <!-- Sidebar desktop -->
    <aside class="hidden w-56 shrink-0 flex-col border-r border-border bg-white p-5 md:flex">
      <p class="mb-8 text-2xl font-bold text-primary">SAGARA</p>
      <nav class="flex flex-col gap-1">
        <RouterLink v-for="m in menu" :key="m.to" :to="m.to"
          class="rounded-lg px-4 py-2.5 text-text-muted hover:bg-bg"
          exact-active-class="!bg-primary-light font-semibold !text-text">
          {{ m.label }}
        </RouterLink>
        <span v-for="m in menuSegera" :key="m" class="cursor-not-allowed px-4 py-2.5 text-text-muted/50">
          {{ m }} <span class="text-xs">(segera)</span>
        </span>
      </nav>
      <div class="mt-auto border-t border-border pt-4">
        <p class="px-4 py-2 text-sm text-text-muted">{{ auth.pengguna?.nama }}</p>
        <button class="w-full rounded-lg px-4 py-2.5 text-left text-text-muted hover:bg-bg" @click="keluar">
          Keluar
        </button>
      </div>
    </aside>

    <!-- Header HP -->
    <header class="flex items-center justify-between border-b border-border bg-white px-5 py-4 md:hidden">
      <p class="text-xl font-bold text-primary">SAGARA</p>
      <button class="text-sm text-text-muted" @click="keluar">Keluar</button>
    </header>

    <!-- Isi halaman -->
    <main class="flex-1 px-5 pb-24 pt-6 md:px-10 md:py-8">
      <slot />
    </main>

    <!-- Navigasi bawah HP -->
    <nav class="fixed inset-x-0 bottom-0 flex justify-around border-t border-border bg-white py-3 md:hidden">
      <RouterLink v-for="m in menu" :key="m.to" :to="m.to"
        class="text-sm text-text-muted" exact-active-class="font-semibold !text-primary">
        {{ m.label }}
      </RouterLink>
    </nav>
  </div>
</template>