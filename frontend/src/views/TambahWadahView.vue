<script setup>
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import { api } from '@/services/api'

const router = useRouter()

const form = ref({
  namaWadah: '',
  jenisWadah: 'AKUARIUM',
  volume: '',
  jenisHewan: '',
  jumlah: '',
  tujuan: 'PEMELIHARAAN',
  suhu: '',
  ph: '',
})
const pesanError = ref('')
const menyimpan = ref(false)

// UC-05: Menambah Wadah
async function simpan() {
  pesanError.value = ''
  const f = form.value
  if (!f.namaWadah || !f.volume || !f.jenisHewan || !f.jumlah) {
    pesanError.value = 'Harap isi kolom ini'
    return
  }
  menyimpan.value = true
  try {
    await api.post('/wadah', {
      namaWadah: f.namaWadah,
      jenisWadah: f.jenisWadah,
      volume: Number(f.volume),
      hewan: [{ jenisHewan: f.jenisHewan, jumlah: Number(f.jumlah), tujuan: f.tujuan }],
      suhu: f.suhu ? Number(f.suhu) : null,
      ph: f.ph ? Number(f.ph) : null,
    })
    router.push('/')
  } catch (err) {
    pesanError.value = err.pesan || 'Wadah gagal disimpan, silakan coba lagi nanti'
  } finally {
    menyimpan.value = false
  }
}

const kelasInput = 'mt-2 w-full rounded-lg border border-border bg-white px-4 py-3 outline-none focus:border-primary'
const kelasPilihan = (aktif) =>
  `flex-1 rounded-md py-2.5 font-semibold ${aktif ? 'bg-primary text-white' : 'text-text'}`
</script>

<template>
  <AppLayout>
    <RouterLink to="/" class="text-sm text-primary">← Kembali ke Wadah Saya</RouterLink>
    <h1 class="mt-2 text-3xl font-bold">Tambah Wadah</h1>
    <p class="mt-1 text-text-muted">Isi data sekali, AI akan mengingatnya</p>

    <form class="mt-6 max-w-3xl rounded-xl border border-border bg-white p-6 md:p-8" @submit.prevent="simpan">
      <h2 class="text-lg font-semibold">Data wadah</h2>
      <label class="mt-4 block text-sm font-semibold">Nama wadah</label>
      <input v-model="form.namaWadah" placeholder="Contoh: Kolam 1" :class="kelasInput" />

      <div class="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <label class="block text-sm font-semibold">Jenis wadah</label>
          <div class="mt-2 flex rounded-lg border border-border p-1">
            <button type="button" :class="kelasPilihan(form.jenisWadah === 'AKUARIUM')"
              @click="form.jenisWadah = 'AKUARIUM'">Akuarium</button>
            <button type="button" :class="kelasPilihan(form.jenisWadah === 'KOLAM')"
              @click="form.jenisWadah = 'KOLAM'">Kolam</button>
          </div>
        </div>
        <div>
          <label class="block text-sm font-semibold">Volume (liter)</label>
          <input v-model="form.volume" type="number" min="1" placeholder="Contoh: 5000" :class="kelasInput" />
        </div>
      </div>

      <h2 class="mt-8 text-lg font-semibold">Hewan</h2>
      <div class="mt-2 grid gap-4 md:grid-cols-2">
        <div>
          <label class="block text-sm font-semibold">Jenis hewan</label>
          <input v-model="form.jenisHewan" placeholder="Contoh: Lele" :class="kelasInput" />
        </div>
        <div>
          <label class="block text-sm font-semibold">Jumlah</label>
          <input v-model="form.jumlah" type="number" min="1" placeholder="Contoh: 200" :class="kelasInput" />
        </div>
      </div>
      <label class="mt-4 block text-sm font-semibold">Tujuan</label>
      <div class="mt-2 flex rounded-lg border border-border p-1 md:w-1/2">
        <button type="button" :class="kelasPilihan(form.tujuan === 'PEMELIHARAAN')"
          @click="form.tujuan = 'PEMELIHARAAN'">Pemeliharaan</button>
        <button type="button" :class="kelasPilihan(form.tujuan === 'BREEDING')"
          @click="form.tujuan = 'BREEDING'">Breeding</button>
      </div>

      <h2 class="mt-8 text-lg font-semibold">Parameter air</h2>
      <div class="mt-2 grid gap-4 md:grid-cols-2">
        <div>
          <label class="block text-sm font-semibold">Suhu (°C)</label>
          <input v-model="form.suhu" type="number" step="0.1" placeholder="Contoh: 28" :class="kelasInput" />
        </div>
        <div>
          <label class="block text-sm font-semibold">pH</label>
          <input v-model="form.ph" type="number" step="0.1" placeholder="Contoh: 7,0" :class="kelasInput" />
        </div>
      </div>

      <p v-if="pesanError" class="mt-6 rounded-lg bg-error/10 px-4 py-2 text-sm text-error">{{ pesanError }}</p>

      <div class="mt-8 flex justify-end gap-3">
        <RouterLink to="/" class="rounded-lg border border-primary px-5 py-2.5 font-semibold text-primary">Batal</RouterLink>
        <button type="submit" :disabled="menyimpan"
          class="rounded-lg bg-primary px-6 py-2.5 font-semibold text-white disabled:opacity-60">
          {{ menyimpan ? 'Menyimpan...' : 'Simpan' }}
        </button>
      </div>
    </form>
  </AppLayout>
</template>