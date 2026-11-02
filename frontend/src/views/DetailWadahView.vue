<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import { useWadahStore } from '@/stores/wadah'
import { api } from '@/services/api'

const route = useRoute()
const router = useRouter()
const wadahStore = useWadahStore()

const data = ref(null)
const pesanError = ref('')
const konfirmasiHapus = ref(false)
const menghapus = ref(false)
const pesanErrorHapus = ref('')

// UC-07: Melihat Detail Wadah
onMounted(async () => {
  try {
    data.value = await api.get(`/wadah/${route.params.id}`)
  } catch (err) {
    pesanError.value = err.pesan || 'Gagal memuat detail wadah, silakan coba lagi nanti'
  }
})

// UC-10: tetapkan wadah ini sebagai konteks aktif, lalu buka fitur AI
function bukaDenganWadahAktif(tujuan) {
  wadahStore.pilihWadahAktif(data.value.wadah.id_wadah)
  router.push(tujuan)
}

// UC-09: Menghapus Wadah (setelah pengguna mengonfirmasi)
async function hapusWadah() {
  menghapus.value = true
  pesanErrorHapus.value = ''
  try {
    const id = data.value.wadah.id_wadah
    await api.delete(`/wadah/${id}`)
    // Jika wadah yang dihapus adalah wadah aktif, kosongkan pilihan wadah aktif
    if (wadahStore.idWadahAktif === id) {
      wadahStore.idWadahAktif = null
      localStorage.removeItem('idWadahAktif')
    }
    router.push('/')
  } catch (err) {
    pesanErrorHapus.value = err.pesan || 'Wadah gagal dihapus, silakan coba lagi nanti'
  } finally {
    menghapus.value = false
  }
}

const formatTujuan = (t) => (t === 'BREEDING' ? 'Breeding' : 'Pemeliharaan')
const formatAngka = (n) => (n == null ? '-' : Number(n).toLocaleString('id-ID', { maximumFractionDigits: 1 }))
</script>

<template>
  <AppLayout>
    <RouterLink to="/" class="text-sm text-primary">← Kembali ke Wadah Saya</RouterLink>

    <p v-if="pesanError" class="mt-6 rounded-lg bg-error/10 px-4 py-3 text-error">{{ pesanError }}</p>
    <p v-else-if="!data" class="mt-6 text-text-muted">Memuat detail wadah...</p>

    <template v-else>
      <div class="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-3xl font-bold">{{ data.wadah.nama_wadah }}</h1>
            <span class="rounded-full bg-primary-light px-3 py-0.5 text-sm font-semibold">
              {{ data.wadah.jenis_wadah === 'KOLAM' ? 'Kolam' : 'Akuarium' }}
            </span>
          </div>
          <p v-if="data.hewan[0]" class="mt-1 text-text-muted">Tujuan: {{ formatTujuan(data.hewan[0].tujuan) }}</p>
        </div>
        <div class="flex gap-2">
          <RouterLink :to="`/wadah/${data.wadah.id_wadah}/edit`"
            class="rounded-lg border border-primary px-5 py-2.5 font-semibold text-primary">Edit</RouterLink>
          <button class="rounded-lg border border-error px-5 py-2.5 font-semibold text-error"
            @click="konfirmasiHapus = true">Hapus</button>
          <button class="rounded-lg bg-primary px-5 py-2.5 font-semibold text-white"
            @click="bukaDenganWadahAktif('/chatbot')">Chat</button>
        </div>
      </div>

      <div class="mt-6 grid gap-5 lg:grid-cols-2">
        <div class="rounded-xl border border-border bg-white p-6">
          <h2 class="text-lg font-semibold">Data wadah</h2>
          <dl class="mt-4 grid grid-cols-[8rem_1fr] gap-y-3">
            <dt class="text-text-muted">Jenis</dt>
            <dd>{{ data.wadah.jenis_wadah === 'KOLAM' ? 'Kolam' : 'Akuarium' }}</dd>
            <dt class="text-text-muted">Volume</dt>
            <dd>{{ Number(data.wadah.volume).toLocaleString('id-ID') }} liter</dd>
            <template v-for="h in data.hewan" :key="h.id_hewan">
              <dt class="text-text-muted">Hewan</dt>
              <dd>{{ h.jenis_hewan }}</dd>
              <dt class="text-text-muted">Jumlah</dt>
              <dd>{{ h.jumlah }} ekor</dd>
              <dt class="text-text-muted">Tujuan</dt>
              <dd>{{ formatTujuan(h.tujuan) }}</dd>
            </template>
          </dl>
        </div>

        <div class="rounded-xl border border-border bg-white p-6">
          <h2 class="text-lg font-semibold">Parameter air</h2>
          <div v-if="data.parameterAir" class="mt-4 grid grid-cols-2">
            <div>
              <p class="text-text-muted">Suhu</p>
              <p class="text-4xl font-bold">{{ formatAngka(data.parameterAir.suhu) }}°C</p>
            </div>
            <div>
              <p class="text-text-muted">pH</p>
              <p class="text-4xl font-bold">{{ formatAngka(data.parameterAir.ph) }}</p>
            </div>
            <p class="col-span-2 mt-4 text-sm text-text-muted">
              Dicatat {{ new Date(data.parameterAir.tanggal_catat).toLocaleDateString('id-ID', { dateStyle: 'long' }) }}
            </p>
          </div>
          <p v-else class="mt-4 text-text-muted">Parameter air belum dicatat.</p>
        </div>
      </div>

      <div class="mt-5 grid gap-5 lg:grid-cols-2">
        <div class="flex items-center justify-between gap-4 rounded-xl border border-border bg-white p-6">
          <div>
            <p class="font-semibold">Tanya AI tentang {{ data.wadah.nama_wadah }}</p>
            <p class="text-text-muted">AI sudah tahu data wadah ini, tinggal bertanya</p>
          </div>
          <button class="shrink-0 rounded-lg border border-primary px-5 py-2 font-semibold text-primary"
            @click="bukaDenganWadahAktif('/chatbot')">Buka chat</button>
        </div>
        <div class="flex items-center justify-between gap-4 rounded-xl border border-border bg-white p-6">
          <div>
            <p class="font-semibold">Analisis foto {{ data.wadah.nama_wadah }}</p>
            <p class="text-text-muted">Unggah foto hewan atau wadah untuk dianalisis</p>
          </div>
          <button class="shrink-0 rounded-lg border border-primary px-5 py-2 font-semibold text-primary"
            @click="bukaDenganWadahAktif('/analisis-foto')">Unggah foto</button>
        </div>
      </div>
    </template>

    <!-- Dialog konfirmasi hapus wadah (UC-09) -->
    <div v-if="konfirmasiHapus" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div class="w-full max-w-md rounded-xl bg-white p-6">
        <h2 class="text-lg font-semibold">Hapus wadah "{{ data.wadah.nama_wadah }}"?</h2>
        <p class="mt-2 text-text-muted">
          Data hewan, parameter air, riwayat chat, dan analisis foto wadah ini juga akan terhapus dan tidak bisa dikembalikan.
        </p>
        <p v-if="pesanErrorHapus" class="mt-4 rounded-lg bg-error/10 px-4 py-2 text-sm text-error">{{ pesanErrorHapus }}</p>
        <div class="mt-6 flex justify-end gap-3">
          <button class="rounded-lg border border-border px-5 py-2.5 font-semibold" :disabled="menghapus"
            @click="konfirmasiHapus = false">Batal</button>
          <button class="rounded-lg bg-error px-5 py-2.5 font-semibold text-white disabled:opacity-60" :disabled="menghapus"
            @click="hapusWadah">{{ menghapus ? 'Menghapus...' : 'Ya, hapus' }}</button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>