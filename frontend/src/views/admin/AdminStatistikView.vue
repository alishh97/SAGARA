<script setup>
import { ref, computed, onMounted } from 'vue'
import AdminLayout from '@/components/AdminLayout.vue'
import { api } from '@/services/api'

const periode = ref('mingguan')
const data = ref(null)
const memuat = ref(true)
const pesanError = ref('')

// UC-23: Melihat Statistik Penggunaan AI (termasuk jumlah token)
async function muat() {
  memuat.value = true
  pesanError.value = ''
  try {
    data.value = await api.get(`/admin/statistik?periode=${periode.value}`)
  } catch (err) {
    pesanError.value = err.pesan || 'Gagal memuat statistik, silakan coba lagi nanti'
  } finally {
    memuat.value = false
  }
}
onMounted(muat)

function pilihPeriode(nilai) {
  periode.value = nilai
  muat()
}

const pilihanPeriode = [
  { label: 'Hari ini', nilai: 'harian' },
  { label: '7 hari', nilai: 'mingguan' },
  { label: '30 hari', nilai: 'bulanan' },
]

const kosong = computed(() => data.value && data.value.ringkasan.jumlahChat + data.value.ringkasan.jumlahFoto + data.value.ringkasan.jumlahGagal === 0)
const tokenTertinggi = computed(() => Math.max(1, ...(data.value?.perHari || []).map((h) => h.token)))

const angka = (n) => Number(n).toLocaleString('id-ID')
const formatHari = (t) => new Date(t).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
</script>

<template>
  <AdminLayout>
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">Statistik Penggunaan AI</h1>
        <p class="mt-1 text-text-muted">Pemakaian chatbot, analisis foto, dan token Gemini</p>
      </div>
      <div class="flex rounded-lg border border-border bg-white p-1">
        <button v-for="p in pilihanPeriode" :key="p.nilai"
          :class="['rounded-md px-4 py-2 font-semibold', periode === p.nilai ? 'bg-primary text-white' : 'text-text']"
          @click="pilihPeriode(p.nilai)">{{ p.label }}</button>
      </div>
    </div>

    <p v-if="pesanError" class="mt-6 rounded-lg bg-error/10 px-4 py-3 text-error">{{ pesanError }}</p>
    <p v-else-if="memuat" class="mt-6 text-text-muted">Memuat statistik...</p>
    <p v-else-if="kosong" class="mt-6 rounded-xl border border-border bg-white p-6 text-text-muted">
      Belum ada data statistik untuk periode ini.
    </p>

    <template v-else>
      <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-xl border border-border bg-white p-5">
          <p class="text-sm text-text-muted">Percakapan chatbot</p>
          <p class="mt-1 text-3xl font-bold">{{ angka(data.ringkasan.jumlahChat) }}</p>
        </div>
        <div class="rounded-xl border border-border bg-white p-5">
          <p class="text-sm text-text-muted">Analisis foto</p>
          <p class="mt-1 text-3xl font-bold">{{ angka(data.ringkasan.jumlahFoto) }}</p>
        </div>
        <div class="rounded-xl border border-border bg-white p-5">
          <p class="text-sm text-text-muted">Total token AI</p>
          <p class="mt-1 text-3xl font-bold">{{ angka(data.ringkasan.totalToken) }}</p>
          <p class="mt-1 text-xs text-text-muted">
            Chat {{ angka(data.ringkasan.tokenChat) }} · Foto {{ angka(data.ringkasan.tokenFoto) }}
          </p>
        </div>
        <div class="rounded-xl border border-border bg-white p-5">
          <p class="text-sm text-text-muted">Pengguna aktif AI</p>
          <p class="mt-1 text-3xl font-bold">{{ angka(data.ringkasan.penggunaAktif) }}</p>
          <p class="mt-1 text-xs text-text-muted">{{ angka(data.ringkasan.jumlahGagal) }} permintaan gagal</p>
        </div>
      </div>

      <div class="mt-6 rounded-xl border border-border bg-white p-6">
        <h2 class="text-lg font-semibold">Rincian per hari</h2>
        <table class="mt-4 w-full text-left text-sm">
          <thead class="text-text-muted">
            <tr>
              <th class="py-2 font-semibold">Tanggal</th>
              <th class="py-2 font-semibold">Chat</th>
              <th class="py-2 font-semibold">Foto</th>
              <th class="w-1/2 py-2 font-semibold">Token</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="h in data.perHari" :key="h.tanggal" class="border-t border-border">
              <td class="py-2">{{ formatHari(h.tanggal) }}</td>
              <td class="py-2">{{ h.chat }}</td>
              <td class="py-2">{{ h.foto }}</td>
              <td class="py-2">
                <div class="flex items-center gap-3">
                  <div class="h-2 rounded-full bg-primary" :style="{ width: `${(h.token / tokenTertinggi) * 70}%` }"></div>
                  <span>{{ angka(h.token) }}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </AdminLayout>
</template>
