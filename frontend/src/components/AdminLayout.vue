<script setup>
import { RouterLink, useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'

const adminStore = useAdminStore()
const router = useRouter()

const menu = [
  { label: 'Statistik', to: '/admin/statistik' },
  { label: 'Pengguna', to: '/admin/pengguna' },
]

// UC-21: Logout Admin
function keluar() {
  adminStore.logout()
  router.push('/admin/login')
}
</script>

<template>
  <div class="min-h-screen md:flex">
    <aside class="hidden w-56 shrink-0 flex-col border-r border-border bg-white p-5 md:flex">
      <p class="text-2xl font-bold text-primary">SAGARA</p>
      <p class="mb-8 text-sm text-text-muted">Panel Admin</p>
      <nav class="flex flex-col gap-1">
        <RouterLink v-for="m in menu" :key="m.to" :to="m.to"
          class="rounded-lg px-4 py-2.5 text-text-muted hover:bg-bg"
          exact-active-class="!bg-primary-light font-semibold !text-text">
          {{ m.label }}
        </RouterLink>
      </nav>
      <div class="mt-auto border-t border-border pt-4">
        <p class="px-4 py-2 text-sm text-text-muted">{{ adminStore.admin?.email }}</p>
        <button class="w-full rounded-lg px-4 py-2.5 text-left text-text-muted hover:bg-bg" @click="keluar">
          Logout
        </button>
      </div>
    </aside>

    <header class="flex items-center justify-between border-b border-border bg-white px-5 py-4 md:hidden">
      <p class="text-xl font-bold text-primary">SAGARA Admin</p>
      <button class="text-sm text-text-muted" @click="keluar">Logout</button>
    </header>

    <main class="flex-1 px-5 pb-24 pt-6 md:px-10 md:py-8">
      <p class="mb-4 inline-block rounded-full bg-bg px-3 py-1 text-xs text-text-muted">
        Mode lihat saja: admin tidak dapat mengubah data pengguna
      </p>
      <slot />
    </main>

    <nav class="fixed inset-x-0 bottom-0 flex justify-around border-t border-border bg-white py-3 md:hidden">
      <RouterLink v-for="m in menu" :key="m.to" :to="m.to"
        class="text-sm text-text-muted" exact-active-class="font-semibold !text-primary">
        {{ m.label }}
      </RouterLink>
    </nav>
  </div>
</template>
