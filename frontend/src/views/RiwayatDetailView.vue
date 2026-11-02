<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import { useWadahStore } from '@/stores/wadah'
import { api } from '@/services/api'

const route = useRoute()
const router = useRouter()
const wadahStore = useWadahStore()
const idWadah = Number(route.params.idWadah)

const wadah = ref(null)
const tab = ref('chat') // 'chat' atau 'foto'
const riwayatChat = ref([])
const riwayatFoto = ref([])
const memuat = ref(true)
const pesanError = ref('')
const terbuka = ref(new Set()) // id pesan/analisis yang sedang dibuka penuh
// Dialog konfirmasi hapus: { jenis: 'chat' } atau { jenis: 'foto', item }
const konfirmasi = ref(null)
const menghapus = ref(false)

// UC-15: Melihat Riwayat Wadah (chat dan analisis foto)
onMounted(async () => {
  try {
    const [detail, chat, foto] = await Promise.all([
      api.get(`/wadah/${idWadah}`),
      api.get(`/chat/${idWadah}`),
      api.get(`/analisis-foto/${idWadah}`),
    ])
    wadah.value = detail.wadah
    riwayatChat.value = chat.pesan
    riwayatFoto.value = foto.analisis
  } catch (err) {
    pesanError.value = err.pesan || 'Gagal memuat riwayat, silakan coba lagi nanti'
  } finally {
    memuat.value = false
  }
})

// UC-16: Menghapus Riwayat (setelah dikonfirmasi)
async function hapus() {
  menghapus.value = true
  try {
    if (konfirmasi.value.jenis === 'chat') {
      await api.delete(`/chat/${idWadah}`)
      riwayatChat.value = []
    } else {
      const id = konfirmasi.value.item.id_analisis
      await api.delete(`/analisis-foto/item/${id}`)
      riwayatFoto.value = riwayatFoto.value.filter((a) => a.id_analisis !== id)
    }
  } catch (err) {
    pesanError.value = err.pesan || 'Riwayat gagal dihapus, silakan coba lagi nanti'
  } finally {
    konfirmasi.value = null
    menghapus.value = false
  }
}

// Lanjutkan percakapan wadah ini di halaman Chatbot
function lanjutChat() {
  wadahStore.pilihWadahAktif(idWadah)
  router.push('/chatbot')
}

function alihkan(kunci) {
  const s = new Set(terbuka.value)
  s.has(kunci) ? s.delete(kunci) : s.add(kunci)
  terbuka.value = s
}

const PANJANG_CUPLIKAN = 220
const bersihkan = (teks) => teks.replace(/\*\*/g, '').replace(/^\s*\* /gm, '• ').replace(/\*/g, '')
const panjang = (teks) => teks.length > PANJANG_CUPLIKAN
const tampilkan = (teks, kunci) =>
  terbuka.value.has(kunci) || !panjang(teks) ? bersihkan(teks) : bersihkan(teks).slice(0, PANJANG_CUPLIKAN).trimEnd() + '…'
const formatWaktu = (w) => new Date(w).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
const kelasTab = (aktif) =>
  `flex-1 rounded-md py-2.5 font-semibold ${aktif ? 'bg-primary text-white' : 'text-text'}`
</script>

<template>
  <AppLayout>
    <RouterLink to="/riwayat" class="text-sm text-primary">← Kembali ke Riwayat</RouterLink>

    <p v-if="pesanError" class="mt-6 rounded-lg bg-error/10 px-4 py-3 text-error">{{ pesanError }}</p>
    <p v-else-if="memuat" class="mt-6 text-text-muted">Memuat riwayat...</p>

    <template v-else>
      <div class="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold">Riwayat {{ wadah.nama_wadah }}</h1>
          <p class="mt-1 text-text-muted">{{ wadah.jenis_wadah === 'KOLAM' ? 'Kolam' : 'Akuarium' }}</p>
        </div>
        <button class="rounded-lg bg-primary px-5 py-2.5 font-semibold text-white" @click="lanjutChat">Lanjutkan chat</button>
      </div>

      <div class="mt-6 flex max-w-sm rounded-lg border border-border bg-white p-1">
        <button :class="kelasTab(tab === 'chat')" @click="tab = 'chat'">Chat ({{ riwayatChat.length }})</button>
        <button :class="kelasTab(tab === 'foto')" @click="tab = 'foto'">Analisis Foto ({{ riwayatFoto.length }})</button>
      </div>

      <!-- Riwayat chat -->
      <div v-if="tab === 'chat'" class="mt-6 rounded-xl border border-border bg-white p-6">
        <div class="flex items-center justify-between gap-4">
          <h2 class="text-lg font-semibold">Riwayat chat</h2>
          <button v-if="riwayatChat.length" class="rounded-lg border border-error px-4 py-2 text-sm font-semibold text-error"
            @click="konfirmasi = { jenis: 'chat' }">Hapus riwayat chat</button>
        </div>
        <p v-if="riwayatChat.length === 0" class="mt-4 text-text-muted">Belum ada riwayat chat untuk wadah ini.</p>
        <div v-else class="mt-4 flex flex-col gap-3">
          <div v-for="p in riwayatChat" :key="p.id_pesan"
            :class="['max-w-[85%] rounded-xl px-4 py-3', p.pengirim === 'PENGGUNA' ? 'self-end bg-primary text-white' : 'self-start bg-bg']">
            <p class="whitespace-pre-line">{{ tampilkan(p.isi_pesan, 'c' + p.id_pesan) }}</p>
            <button v-if="panjang(p.isi_pesan)" class="mt-1 text-sm font-semibold text-primary"
              @click="alihkan('c' + p.id_pesan)">{{ terbuka.has('c' + p.id_pesan) ? 'Tutup' : 'Lihat selengkapnya' }}</button>
            <p :class="['mt-1 text-xs', p.pengirim === 'PENGGUNA' ? 'text-white/70' : 'text-text-muted']">{{ formatWaktu(p.waktu_kirim) }}</p>
          </div>
        </div>
      </div>

      <!-- Riwayat analisis foto -->
      <div v-else class="mt-6 flex flex-col gap-3">
        <p v-if="riwayatFoto.length === 0" class="rounded-xl border border-border bg-white p-6 text-text-muted">
          Belum ada riwayat analisis foto untuk wadah ini.
        </p>
        <div v-for="a in riwayatFoto" :key="a.id_analisis" class="flex gap-4 rounded-xl border border-border bg-white p-4">
          <img :src="a.path_foto" alt="Foto yang dianalisis" class="h-20 w-20 shrink-0 rounded-lg bg-bg object-cover" />
          <div class="min-w-0 flex-1">
            <div class="flex items-start justify-between gap-4">
              <p class="text-sm text-text-muted">{{ formatWaktu(a.waktu_analisis) }}</p>
              <button class="text-sm font-semibold text-error" @click="konfirmasi = { jenis: 'foto', item: a }">Hapus</button>
            </div>
            <p class="mt-1 whitespace-pre-line">{{ tampilkan(a.hasil_analisis, 'f' + a.id_analisis) }}</p>
            <button v-if="panjang(a.hasil_analisis)" class="mt-1 text-sm font-semibold text-primary"
              @click="alihkan('f' + a.id_analisis)">{{ terbuka.has('f' + a.id_analisis) ? 'Tutup' : 'Lihat selengkapnya' }}</button>
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
