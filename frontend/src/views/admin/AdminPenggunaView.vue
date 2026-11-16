<script setup>
import { ref, onMounted } from 'vue'
import AdminLayout from '@/components/AdminLayout.vue'
import { api } from '@/services/api'

const filter = ref('') // '', 'GRATIS', atau 'PREMIUM'
const data = ref(null)
const memuat = ref(true)
const pesanError = ref('')

// UC-22: Melihat Daftar Pengguna dan Langganan
async function muat() {
  memuat.value = true
  pesanError.value = ''
  try {
    data.value = await api.get(`/admin/pengguna${filter.value ? `?jenis=${filter.value}` : ''}`)
  } catch (err) {
    pesanError.value = err.pesan || 'Gagal memuat daftar pengguna, silakan coba lagi nanti'
  } finally {
    memuat.value = false
  }
}
onMounted(muat)

function pilihFilter(nilai) {
  filter.value = nilai
  muat()
}

const pilihanFilter = [
  { label: 'Semua', nilai: '' },
  { label: 'Gratis', nilai: 'GRATIS' },
  { label: 'Premium', nilai: 'PREMIUM' },
]
const formatTanggal = (t) => new Date(t).toLocaleDateString('id-ID', { dateStyle: 'medium' })
</script>

<template>
  <AdminLayout>
    <h1 class="text-3xl font-bold">Pengguna</h1>
    <p class="mt-1 text-text-muted">Daftar pengguna terdaftar beserta jenis akunnya</p>

    <div v-if="data" class="mt-6 grid max-w-xl grid-cols-3 gap-4">
      <div class="rounded-xl border border-border bg-white p-4">
        <p class="text-sm text-text-muted">Total pengguna</p>
        <p class="text-2xl font-bold">{{ data.total }}</p>
      </div>
      <div class="rounded-xl border border-border bg-white p-4">
        <p class="text-sm text-text-muted">Premium</p>
        <p class="text-2xl font-bold">{{ data.totalPremium }}</p>
      </div>
      <div class="rounded-xl border border-border bg-white p-4">
        <p class="text-sm text-text-muted">Persentase premium</p>
        <p class="text-2xl font-bold">{{ data.total ? Math.round((data.totalPremium / data.total) * 100) : 0 }}%</p>
      </div>
    </div>

    <div class="mt-6 flex max-w-sm rounded-lg border border-border bg-white p-1">
      <button v-for="p in pilihanFilter" :key="p.nilai"
        :class="['flex-1 rounded-md py-2 font-semibold', filter === p.nilai ? 'bg-primary text-white' : 'text-text']"
        @click="pilihFilter(p.nilai)">{{ p.label }}</button>
    </div>

    <p v-if="pesanError" class="mt-6 rounded-lg bg-error/10 px-4 py-3 text-error">{{ pesanError }}</p>
    <p v-else-if="memuat" class="mt-6 text-text-muted">Memuat daftar pengguna...</p>
    <p v-else-if="data.pengguna.length === 0" class="mt-6 rounded-xl border border-border bg-white p-6 text-text-muted">
      Belum ada pengguna pada kategori ini.
    </p>

    <div v-else class="mt-6 overflow-x-auto rounded-xl border border-border bg-white">
      <table class="w-full text-left text-sm">
        <thead class="border-b border-border bg-bg text-text-muted">
          <tr>
            <th class="px-5 py-3 font-semibold">Nama</th>
            <th class="px-5 py-3 font-semibold">Email</th>
            <th class="px-5 py-3 font-semibold">Jenis akun</th>
            <th class="px-5 py-3 font-semibold">Jumlah wadah</th>
            <th class="px-5 py-3 font-semibold">Tanggal bergabung</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in data.pengguna" :key="p.id_pengguna" class="border-b border-border last:border-0">
            <td class="px-5 py-3">{{ p.nama }}</td>
            <td class="px-5 py-3">{{ p.email }}</td>
            <td class="px-5 py-3">
              <span :class="['rounded-full px-3 py-0.5 text-xs font-semibold',
                p.status_akun === 'PREMIUM' ? 'bg-primary text-white' : 'bg-bg text-text']">
                {{ p.status_akun === 'PREMIUM' ? 'Premium' : 'Gratis' }}
              </span>
            </td>
            <td class="px-5 py-3">{{ p.jumlah_wadah }}</td>
            <td class="px-5 py-3">{{ formatTanggal(p.tanggal_daftar) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </AdminLayout>
</template>
