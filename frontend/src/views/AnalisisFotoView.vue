<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import { useWadahStore } from '@/stores/wadah'
import { api } from '@/services/api'

const router = useRouter()
const wadahStore = useWadahStore()

const inputFoto = ref(null)
const foto = ref(null)
const pratinjau = ref('')
const menganalisis = ref(false)
const hasil = ref(null)
const pesanError = ref('')
const sisaKuota = ref(null)

onMounted(async () => {
  if (wadahStore.daftar.length === 0) await wadahStore.muatDaftar().catch(() => {})
})

// validasiFoto() di sisi klien; server tetap memeriksa ulang dari isi berkas
function pilihFoto(berkas) {
  pesanError.value = ''
  hasil.value = null
  if (!berkas) return
  if (!['image/jpeg', 'image/png'].includes(berkas.type)) {
    pesanError.value = 'Format harus JPG atau PNG'
    return
  }
  if (berkas.size > 5 * 1024 * 1024) {
    pesanError.value = 'Ukuran foto maksimal 5 MB'
    return
  }
  foto.value = berkas
  pratinjau.value = URL.createObjectURL(berkas)
}

function saatDilepas(e) {
  pilihFoto(e.dataTransfer.files[0])
}

// UC-13 + UC-14: Mengunggah dan memproses analisis foto
async function analisis() {
  if (!foto.value) {
    pesanError.value = 'Harap pilih foto terlebih dahulu'
    return
  }
  pesanError.value = ''
  menganalisis.value = true
  try {
    const formData = new FormData()
    formData.append('idWadah', wadahStore.idWadahAktif)
    formData.append('foto', foto.value)
    const data = await api.post('/analisis-foto', formData)
    hasil.value = data.analisis
    sisaKuota.value = data.sisaKuota
  } catch (err) {
    pesanError.value = err.pesan || 'Layanan analisis sementara tidak tersedia, silakan coba lagi nanti'
  } finally {
    menganalisis.value = false
  }
}

// Alternative flow UC-13: lanjut bertanya dengan hasil analisis sebagai konteks
function tanyakanKeChatbot() {
  router.push({ path: '/chatbot', query: { idAnalisis: hasil.value.id_analisis } })
}

function gantiWadah(e) {
  wadahStore.pilihWadahAktif(Number(e.target.value))
  hasil.value = null
}

const bersihkan = (teks) => teks.replace(/\*\*/g, '').replace(/^\s*\* /gm, '• ').replace(/\*/g, '')
</script>

<template>
  <AppLayout>
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">Analisis Foto</h1>
        <p class="mt-1 text-text-muted">Unggah foto hewan atau wadah untuk dianalisis</p>
      </div>
      <label v-if="wadahStore.daftar.length" class="block">
        <span class="text-sm font-semibold">Wadah aktif</span>
        <select :value="wadahStore.idWadahAktif" @change="gantiWadah"
          class="mt-1 block w-56 rounded-lg border border-border bg-white px-4 py-2.5">
          <option v-for="w in wadahStore.daftar" :key="w.id_wadah" :value="w.id_wadah">{{ w.nama_wadah }}</option>
        </select>
      </label>
    </div>

    <div v-if="!wadahStore.daftar.length" class="mt-6 rounded-xl border border-dashed border-border bg-white p-10 text-center">
      <p class="font-semibold">Belum ada wadah</p>
      <p class="mt-1 text-text-muted">Tambahkan wadah dulu sebelum menganalisis foto.</p>
    </div>

    <div v-else class="mt-6 grid gap-5 lg:grid-cols-2">
      <div class="space-y-5">
        <div class="rounded-xl border border-border bg-white p-6">
          <h2 class="text-lg font-semibold">Unggah foto</h2>
          <div class="mt-4 flex h-64 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border"
            @click="inputFoto.click()" @dragover.prevent @drop.prevent="saatDilepas">
            <img v-if="pratinjau" :src="pratinjau" alt="Pratinjau foto" class="h-full w-full object-contain" />
            <div v-else class="text-center">
              <p class="text-3xl text-primary">↑</p>
              <p class="font-semibold">Tarik foto ke sini atau klik untuk memilih</p>
            </div>
          </div>
          <input ref="inputFoto" type="file" accept="image/jpeg,image/png" class="hidden"
            @change="pilihFoto($event.target.files[0])" />
          <p class="mt-3 text-sm text-text-muted">Format JPG atau PNG, maksimal 5 MB</p>

          <p v-if="pesanError" class="mt-4 rounded-lg bg-error/10 px-4 py-2 text-sm text-error">{{ pesanError }}</p>

          <div class="mt-5 flex justify-end gap-3">
            <button class="rounded-lg border border-primary px-5 py-2.5 font-semibold text-primary"
              @click="inputFoto.click()">{{ foto ? 'Ganti foto' : 'Pilih foto' }}</button>
            <button :disabled="menganalisis" class="rounded-lg bg-primary px-6 py-2.5 font-semibold text-white disabled:opacity-60"
              @click="analisis">{{ menganalisis ? 'Menganalisis...' : 'Analisis' }}</button>
          </div>
        </div>

        <div class="rounded-xl bg-accent-soft p-6">
          <p class="font-semibold">Tips foto yang baik</p>
          <ul class="mt-2 list-disc pl-5 text-sm">
            <li>Ambil foto di tempat terang</li>
            <li>Fokus pada ikan atau bagian yang bermasalah</li>
            <li>Hindari pantulan cahaya di kaca</li>
          </ul>
          <p v-if="sisaKuota !== null" class="mt-3 text-sm text-text-muted">Sisa analisis foto bulan ini: {{ sisaKuota }}</p>
        </div>
      </div>

      <div class="rounded-xl border border-border bg-white p-6">
        <h2 class="text-lg font-semibold">Hasil analisis</h2>
        <p v-if="menganalisis" class="mt-4 text-text-muted">AI sedang menganalisis foto, mohon tunggu...</p>
        <p v-else-if="!hasil" class="mt-4 text-text-muted">Hasil analisis akan tampil di sini setelah foto dianalisis.</p>
        <template v-else>
          <p class="mt-1 text-sm text-text-muted">
            {{ wadahStore.wadahAktif?.nama_wadah }} ·
            {{ new Date(hasil.waktu_analisis).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) }}
          </p>
          <div class="mt-4 whitespace-pre-line">{{ bersihkan(hasil.hasil_analisis) }}</div>
          <p class="mt-6 rounded-lg bg-accent-soft px-4 py-3 text-sm">
            Hasil analisis bersifat indikatif dan edukasi awal, bukan diagnosis profesional.
            Untuk kasus serius, konsultasikan ke ahli perikanan.
          </p>
          <button class="mt-5 rounded-lg bg-primary px-5 py-2.5 font-semibold text-white" @click="tanyakanKeChatbot">
            Tanyakan lebih lanjut ke chatbot
          </button>
        </template>
      </div>
    </div>
  </AppLayout>
</template>