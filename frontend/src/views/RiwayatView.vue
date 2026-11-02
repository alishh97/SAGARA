<script setup>
import { ref, watch, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import { useWadahStore } from '@/stores/wadah'
import { api } from '@/services/api'

const wadahStore = useWadahStore()

const tab = ref('chat') // 'chat' atau 'foto'
const riwayatChat = ref([])
const riwayatFoto = ref([])
const memuat = ref(false)
const pesanError = ref('')
// Dialog konfirmasi hapus: { jenis: 'chat' } atau { jenis: 'foto', item }
const konfirmasi = ref(null)
const menghapus = ref(false)

onMounted(async () => {
  try {
    if (wadahStore.daftar.length === 0) await wadahStore.muatDaftar()
    await muatRiwayat()
  } catch (err) {
    pesanError.value = err.pesan || 'Gagal memuat data, silakan coba lagi nanti'
  }
})

// Riwayat dimuat ulang setiap wadah yang dipilih berganti
watch(() => wadahStore.idWadahAktif, muatRiwayat)

// UC-15: Melihat Riwayat Wadah (chat dan analisis foto)
async function muatRiwayat() {
  const id = wadahStore.idWadahAktif
  if (!id) return
  memuat.value = true
  pesanError.value = ''
  try {
    const [chat, foto] = await Promise.all([api.get(`/chat/${id}`), api.get(`/analisis-foto/${id}`)])
    riwayatChat.value = chat.pesan
    riwayatFoto.value = foto.analisis
  } catch (err) {
    pesanError.value = err.pesan || 'Gagal memuat riwayat, silakan coba lagi nanti'
  } finally {
    memuat.value = false
  }
}

// UC-16: Menghapus Riwayat (setelah dikonfirmasi)
async function hapus() {
  menghapus.value = true
  try {
    if (konfirmasi.value.jenis === 'chat') {
      await api.delete(`/chat/${wadahStore.idWadahAktif}`)
      riwayatChat.value = []
    } else {
      const id = konfirmasi.value.item.id_analisis
      await api.delete(`/analisis-foto/item/${id}`)
      riwayatFoto.value = riwayatFoto.value.filter((a) => a.id_analisis !== id)
    }
    konfirmasi.value = null
  } catch (err) {
    pesanError.value = err.pesan || 'Riwayat gagal dihapus, silakan coba lagi nanti'
    konfirmasi.value = null
  } finally {
    menghapus.value = false
  }
}

const bersihkan = (teks) => teks.replace(/\*\*/g, '').replace(/^\s*\* /gm, '• ').replace(/\*/g, '')
const formatWaktu = (w) => new Date(w).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
const kelasTab = (aktif) =>
  `flex-1 rounded-md py-2.5 font-semibold ${aktif ? 'bg-primary text-white' : 'text-text'}`
</script>

<template>
  <AppLayout>
    <h1 class="text-3xl font-bold">Riwayat</h1>
    <p class="mt-1 text-text-muted">Riwayat chat dan analisis foto per wadah</p>

    <div v-if="wadahStore.daftar.length === 0 && !pesanError" class="mt-6 rounded-xl border border-border bg-white p-6">
      <p class="text-text-muted">Belum ada wadah, jadi belum ada riwayat.</p>
      <RouterLink to="/wadah/tambah" class="mt-3 inline-block font-semibold text-primary">+ Tambah wadah</RouterLink>
    </div>

    <template v-else>
      <div class="mt-6 flex flex-wrap items-end gap-4">
        <div>
          <label class="block text-sm font-semibold">Wadah</label>
          <select :value="wadahStore.idWadahAktif" @change="wadahStore.pilihWadahAktif(Number($event.target.value))"
            class="mt-2 rounded-lg border border-border bg-white px-4 py-2.5 outline-none focus:border-primary">
            <option v-for="w in wadahStore.daftar" :key="w.id_wadah" :value="w.id_wadah">{{ w.nama_wadah }}</option>
          </select>
        </div>
        <div class="flex w-full max-w-sm rounded-lg border border-border bg-white p-1">
          <button :class="kelasTab(tab === 'chat')" @click="tab = 'chat'">Chat ({{ riwayatChat.length }})</button>
          <button :class="kelasTab(tab === 'foto')" @click="tab = 'foto'">Analisis Foto ({{ riwayatFoto.length }})</button>
        </div>
      </div>

      <p v-if="pesanError" class="mt-6 rounded-lg bg-error/10 px-4 py-3 text-error">{{ pesanError }}</p>
      <p v-else-if="memuat" class="mt-6 text-text-muted">Memuat riwayat...</p>

      <!-- Riwayat chat -->
      <div v-else-if="tab === 'chat'" class="mt-6 rounded-xl border border-border bg-white p-6">
        <div class="flex items-center justify-between gap-4">
          <h2 class="text-lg font-semibold">Riwayat chat</h2>
          <button v-if="riwayatChat.length" class="rounded-lg border border-error px-4 py-2 text-sm font-semibold text-error"
            @click="konfirmasi = { jenis: 'chat' }">Hapus riwayat chat</button>
        </div>
        <p v-if="riwayatChat.length === 0" class="mt-4 text-text-muted">Belum ada riwayat chat untuk wadah ini.</p>
        <div v-else class="mt-4 flex flex-col gap-3">
          <div v-for="p in riwayatChat" :key="p.id_pesan"
            :class="['max-w-[85%] rounded-xl px-4 py-3', p.pengirim === 'PENGGUNA' ? 'self-end bg-primary text-white' : 'self-start bg-bg']">
            <p class="whitespace-pre-line">{{ bersihkan(p.isi_pesan) }}</p>
            <p :class="['mt-1 text-xs', p.pengirim === 'PENGGUNA' ? 'text-white/70' : 'text-text-muted']">{{ formatWaktu(p.waktu_kirim) }}</p>
          </div>
        </div>
      </div>

      <!-- Riwayat analisis foto -->
      <div v-else class="mt-6 flex flex-col gap-4">
        <p v-if="riwayatFoto.length === 0" class="rounded-xl border border-border bg-white p-6 text-text-muted">
          Belum ada riwayat analisis foto untuk wadah ini.
        </p>
        <div v-for="a in riwayatFoto" :key="a.id_analisis"
          class="flex flex-col gap-4 rounded-xl border border-border bg-white p-6 md:flex-row">
          <img :src="a.path_foto" alt="Foto yang dianalisis" class="h-40 w-full rounded-lg bg-bg object-contain md:w-48" />
          <div class="flex-1">
            <div class="flex items-start justify-between gap-4">
              <p class="text-sm text-text-muted">{{ formatWaktu(a.waktu_analisis) }}</p>
              <button class="text-sm font-semibold text-error" @click="konfirmasi = { jenis: 'foto', item: a }">Hapus</button>
            </div>
            <p class="mt-2 whitespace-pre-line">{{ bersihkan(a.hasil_analisis) }}</p>
          </div>
        </div>
      </div>
    </template>

    <!-- Dialog konfirmasi hapus riwayat (UC-16) -->
    <div v-if="konfirmasi" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div class="w-full max-w-md rounded-xl bg-white p-6">
        <h2 class="text-lg font-semibold">
          {{ konfirmasi.jenis === 'chat' ? 'Hapus semua riwayat chat wadah ini?' : 'Hapus riwayat analisis foto ini?' }}
        </h2>
        <p class="mt-2 text-text-muted">Riwayat yang dihapus tidak bisa dikembalikan.</p>
        <div class="mt-6 flex justify-end gap-3">
          <button class="rounded-lg border border-border px-5 py-2.5 font-semibold" :disabled="menghapus"
            @click="konfirmasi = null">Batal</button>
          <button class="rounded-lg bg-error px-5 py-2.5 font-semibold text-white disabled:opacity-60" :disabled="menghapus"
            @click="hapus">{{ menghapus ? 'Menghapus...' : 'Ya, hapus' }}</button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
