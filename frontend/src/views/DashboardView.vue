<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import { useWadahStore } from '@/stores/wadah'
import { api } from '@/services/api'

const router = useRouter()
const wadahStore = useWadahStore()

const memuat = ref(true)
const pesanError = ref('')
const kuota = ref(null)
const pesanKuota = ref('')

// UC-06: Melihat Daftar Wadah
onMounted(async () => {
  try {
    await wadahStore.muatDaftar()
    await muatKuota()
  } catch (err) {
    pesanError.value = err.pesan || 'Gagal memuat daftar wadah, silakan coba lagi nanti'
  } finally {
    memuat.value = false
  }
})

async function muatKuota() {
  try {
    kuota.value = await api.get('/wadah/kuota')
  } catch (err) {
    // Status 403 berarti kuota penuh, datanya tetap dikirim
    if (err.status === 403) kuota.value = err
  }
}

// UC-05 langkah 1: periksa kuota sebelum membuka form
function tambahWadah() {
  pesanKuota.value = ''
  if (kuota.value && !kuota.value.boleh) {
    pesanKuota.value = kuota.value.pesan
    return
  }
  router.push('/wadah/tambah')
}

// UC-10: pilih wadah aktif lalu buka chatbot
function bukaChat(idWadah) {
  wadahStore.pilihWadahAktif(idWadah)
  router.push('/chatbot')
}
</script>

<template>
  <AppLayout>
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">Wadah Saya</h1>
        <p v-if="kuota" class="mt-1 text-text-muted">
          Paket {{ kuota.statusAkun === 'GRATIS' ? 'Gratis' : 'Premium' }} ·
          {{ kuota.terpakai }} dari {{ kuota.batas }} wadah terpakai
        </p>
      </div>
      <button class="rounded-lg bg-primary px-5 py-2.5 font-semibold text-white" @click="tambahWadah">
        Tambah Wadah
      </button>
    </div>

    <p v-if="pesanKuota" class="mt-4 rounded-lg bg-accent-soft px-4 py-3 text-sm">{{ pesanKuota }}</p>
    <p v-if="pesanError" class="mt-6 rounded-lg bg-error/10 px-4 py-3 text-error">{{ pesanError }}</p>
    <p v-else-if="memuat" class="mt-6 text-text-muted">Memuat wadah...</p>

    <!-- Tampilan kosong (UC-06 alternative flow) -->
    <div v-else-if="wadahStore.daftar.length === 0"
      class="mt-6 rounded-xl border border-dashed border-border bg-white p-10 text-center">
      <p class="font-semibold">Belum ada wadah</p>
      <p class="mt-1 text-text-muted">Tambahkan wadah pertamamu agar AI bisa membantu.</p>
    </div>

    <div v-else class="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      <div v-for="w in wadahStore.daftar" :key="w.id_wadah"
        class="rounded-xl border border-border bg-white p-6">
        <h2 class="text-xl font-semibold">{{ w.nama_wadah }}</h2>
        <span class="mt-2 inline-block rounded-full bg-primary-light px-3 py-0.5 text-sm font-semibold">
          {{ w.jenis_wadah === 'KOLAM' ? 'Kolam' : 'Akuarium' }}
        </span>
        <p class="mt-3 text-text-muted">Volume {{ Number(w.volume).toLocaleString('id-ID') }} liter</p>
        <p class="text-text-muted">{{ w.total_hewan }} ekor hewan</p>
        <div class="mt-5 flex gap-3">
          <button class="rounded-lg bg-primary px-5 py-2 font-semibold text-white"
            @click="router.push(`/wadah/${w.id_wadah}`)">Buka</button>
          <button class="rounded-lg border border-primary px-5 py-2 font-semibold text-primary"
            @click="bukaChat(w.id_wadah)">Chat</button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>