<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import { api } from '@/services/api'

const riwayat = ref([])
const memuat = ref(true)
const pesanError = ref('')

// UC-15: daftar riwayat, satu kartu per wadah (seperti daftar percakapan)
onMounted(async () => {
  try {
    riwayat.value = (await api.get('/chat')).riwayat
  } catch (err) {
    pesanError.value = err.pesan || 'Gagal memuat riwayat, silakan coba lagi nanti'
  } finally {
    memuat.value = false
  }
})

const formatWaktu = (w) => new Date(w).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
</script>

<template>
  <AppLayout>
    <h1 class="text-3xl font-bold">Riwayat</h1>
    <p class="mt-1 text-text-muted">Riwayat chat dan analisis foto per wadah</p>

    <p v-if="pesanError" class="mt-6 rounded-lg bg-error/10 px-4 py-3 text-error">{{ pesanError }}</p>
    <p v-else-if="memuat" class="mt-6 text-text-muted">Memuat riwayat...</p>

    <div v-else-if="riwayat.length === 0" class="mt-6 rounded-xl border border-border bg-white p-6">
      <p class="text-text-muted">Belum ada wadah, jadi belum ada riwayat.</p>
      <RouterLink to="/wadah/tambah" class="mt-3 inline-block font-semibold text-primary">+ Tambah wadah</RouterLink>
    </div>

    <div v-else class="mt-6 flex max-w-3xl flex-col gap-3">
      <RouterLink v-for="r in riwayat" :key="r.id_wadah" :to="`/riwayat/${r.id_wadah}`"
        class="rounded-xl border border-border bg-white p-5 transition hover:border-primary">
        <div class="flex items-start justify-between gap-4">
          <p class="font-semibold">
            {{ r.nama_wadah }}
            <span class="font-normal text-text-muted">· {{ r.jenis_wadah === 'KOLAM' ? 'Kolam' : 'Akuarium' }}</span>
          </p>
          <p v-if="r.aktivitas_terakhir" class="shrink-0 text-sm text-text-muted">{{ formatWaktu(r.aktivitas_terakhir) }}</p>
        </div>
        <p class="mt-1 truncate text-text-muted">
          {{ r.pertanyaan_terakhir ? `"${r.pertanyaan_terakhir}"` : 'Belum ada percakapan' }}
        </p>
        <p class="mt-2 text-sm text-text-muted">{{ r.jumlah_pesan }} pesan · {{ r.jumlah_foto }} analisis foto</p>
      </RouterLink>
    </div>
  </AppLayout>
</template>
