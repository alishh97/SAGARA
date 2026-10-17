<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import { useWadahStore } from '@/stores/wadah'
import { api } from '@/services/api'

const route = useRoute()
const router = useRouter()
const wadahStore = useWadahStore()

const pesan = ref([])
const detail = ref(null)
const pertanyaan = ref('')
const mengetik = ref(false)
const pesanError = ref('')
const sisaKuota = ref(null)
const areaChat = ref(null)
// Hasil analisis foto yang dibawa dari tombol "Tanyakan lebih lanjut ke chatbot"
const idAnalisis = ref(route.query.idAnalisis || null)

onMounted(async () => {
  try {
    if (wadahStore.daftar.length === 0) await wadahStore.muatDaftar()
    await muatWadahAktif()
  } catch (err) {
    pesanError.value = err.pesan || 'Gagal memuat data, silakan coba lagi nanti'
  }
})

// UC-10: setiap wadah aktif berganti, muat konteks dan riwayatnya
watch(() => wadahStore.idWadahAktif, muatWadahAktif)

async function muatWadahAktif() {
  const id = wadahStore.idWadahAktif
  if (!id) return
  pesanError.value = ''
  detail.value = await api.get(`/wadah/${id}`)
  pesan.value = (await api.get(`/chat/${id}`)).pesan
  gulirKeBawah()
}

function gantiWadah(e) {
  idAnalisis.value = null
  router.replace({ query: {} })
  wadahStore.pilihWadahAktif(Number(e.target.value))
}

async function gulirKeBawah() {
  await nextTick()
  if (areaChat.value) areaChat.value.scrollTop = areaChat.value.scrollHeight
}

// UC-11: Bertanya kepada Chatbot AI
async function kirim() {
  pesanError.value = ''
  const teks = pertanyaan.value.trim()
  if (!teks) {
    pesanError.value = 'Harap masukkan pertanyaan'
    return
  }
  pesan.value.push({ pengirim: 'PENGGUNA', isi_pesan: teks, waktu_kirim: new Date() })
  pertanyaan.value = ''
  mengetik.value = true
  gulirKeBawah()

  try {
    const data = await api.post('/chat', {
      idWadah: wadahStore.idWadahAktif,
      pertanyaan: teks,
      idAnalisis: idAnalisis.value,
    })
    pesan.value.push({ pengirim: 'AI', isi_pesan: data.jawaban, waktu_kirim: new Date() })
    sisaKuota.value = data.sisaKuota
  } catch (err) {
    // Gagal: pertanyaan tidak tersimpan, jadi dihapus dari tampilan
    pesan.value.pop()
    pertanyaan.value = teks
    pesanError.value = err.pesan || 'Layanan konsultasi sementara tidak tersedia, silakan coba lagi nanti'
  } finally {
    mengetik.value = false
    gulirKeBawah()
  }
}

// Jawaban AI bisa memuat tanda ** (markdown), dibersihkan agar mudah dibaca
const bersihkan = (teks) => teks.replace(/\*\*/g, '').replace(/^\s*\* /gm, '• ').replace(/\*/g, '')
const jam = (w) => new Date(w).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
</script>

<template>
  <AppLayout>
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">Chatbot</h1>
        <p class="mt-1 text-text-muted">Tanya apa saja soal wadahmu</p>
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
      <p class="mt-1 text-text-muted">Tambahkan wadah dulu agar chatbot tahu konteksnya.</p>
    </div>

    <div v-else class="mt-6 grid gap-5 lg:grid-cols-[1fr_20rem]">
      <!-- Jendela chat -->
      <div class="flex h-[70vh] flex-col rounded-xl border border-border bg-white">
        <p class="border-b border-border bg-accent-soft/60 px-5 py-2 text-xs text-text-muted">
          Jawaban chatbot bersifat edukasi awal, bukan diagnosis profesional.
        </p>
        <p v-if="idAnalisis" class="border-b border-border bg-primary-light/40 px-5 py-2 text-sm">
          Membahas hasil analisis foto sebagai konteks tambahan
        </p>

        <div ref="areaChat" class="flex-1 space-y-4 overflow-y-auto p-5">
          <div class="max-w-[85%] rounded-xl border border-border bg-bg px-4 py-3">
            Halo! Saya asisten SAGARA. Saya sudah membaca data
            <b>{{ detail?.wadah.nama_wadah }}</b>. Ada yang ingin ditanyakan?
          </div>

          <div v-for="(p, i) in pesan" :key="i" :class="p.pengirim === 'AI' ? '' : 'flex flex-col items-end'">
            <div :class="p.pengirim === 'AI'
                ? 'max-w-[85%] whitespace-pre-line rounded-xl border border-border bg-bg px-4 py-3'
                : 'max-w-[85%] whitespace-pre-line rounded-xl bg-primary px-4 py-3 text-white'">
              {{ bersihkan(p.isi_pesan) }}
            </div>
            <p class="mt-1 text-xs text-text-muted">{{ jam(p.waktu_kirim) }}</p>
          </div>

          <p v-if="mengetik" class="text-sm text-text-muted">AI sedang mengetik...</p>
        </div>

        <p v-if="pesanError" class="mx-5 mb-2 rounded-lg bg-error/10 px-4 py-2 text-sm text-error">{{ pesanError }}</p>

        <form class="flex gap-3 border-t border-border p-4" @submit.prevent="kirim">
          <input v-model="pertanyaan" :disabled="mengetik"
            :placeholder="`Ketik pertanyaan tentang ${detail?.wadah.nama_wadah || 'wadahmu'}...`"
            class="flex-1 rounded-lg border border-border px-4 py-2.5 outline-none focus:border-primary" />
          <button type="submit" :disabled="mengetik"
            class="rounded-lg bg-primary px-5 font-semibold text-white disabled:opacity-60">Kirim</button>
        </form>
      </div>

      <!-- Panel konteks -->
      <div class="space-y-5">
        <div v-if="detail" class="rounded-xl border border-border bg-white p-6">
          <h2 class="text-lg font-semibold">Konteks AI</h2>
          <dl class="mt-4 grid grid-cols-[6rem_1fr] gap-y-3 text-sm">
            <dt class="text-text-muted">Jenis</dt>
            <dd>{{ detail.wadah.jenis_wadah === 'KOLAM' ? 'Kolam' : 'Akuarium' }}</dd>
            <dt class="text-text-muted">Volume</dt>
            <dd>{{ Number(detail.wadah.volume).toLocaleString('id-ID') }} liter</dd>
            <template v-for="h in detail.hewan" :key="h.id_hewan">
              <dt class="text-text-muted">Hewan</dt>
              <dd>{{ h.jenis_hewan }}, {{ h.jumlah }} ekor</dd>
            </template>
          </dl>
        </div>
        <div class="rounded-xl border border-border bg-white p-6">
          <p class="font-semibold">Sisa chat hari ini</p>
          <p class="mt-1 text-text-muted">
            {{ sisaKuota === null ? 'Terlihat setelah bertanya' : `${sisaKuota} pertanyaan lagi` }}
          </p>
        </div>
      </div>
    </div>
  </AppLayout>
</template>