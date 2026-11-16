<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/services/api'

const auth = useAuthStore()

const form = ref({ nama: '', email: '', kataSandiLama: '', kataSandiBaru: '' })
const akun = ref(null)
const memuat = ref(true)
const menyimpan = ref(false)
const pesanError = ref('')
const pesanBerhasil = ref('')
const tampilkanSandi = ref(false)

// UC-19 langkah 1: tampilkan data akun saat ini pada form
onMounted(async () => {
  try {
    akun.value = (await api.get('/akun')).akun
    form.value.nama = akun.value.nama
    form.value.email = akun.value.email
  } catch (err) {
    pesanError.value = err.pesan || 'Gagal memuat data akun, silakan coba lagi nanti'
  } finally {
    memuat.value = false
  }
})

// Syarat kata sandi baru sama dengan registrasi
const syaratSandi = computed(() => [
  { teks: 'Minimal 8 karakter', ok: form.value.kataSandiBaru.length >= 8 },
  { teks: 'Mengandung huruf', ok: /[A-Za-z]/.test(form.value.kataSandiBaru) },
  { teks: 'Mengandung angka', ok: /[0-9]/.test(form.value.kataSandiBaru) },
])

// UC-19: Mengubah Data Akun
async function simpan() {
  pesanError.value = ''
  pesanBerhasil.value = ''
  const f = form.value
  if (!f.nama.trim() || !f.email.trim()) {
    pesanError.value = 'Harap isi kolom ini'
    return
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) {
    pesanError.value = 'Format email tidak valid'
    return
  }
  if (f.kataSandiBaru) {
    if (!f.kataSandiLama) {
      pesanError.value = 'Masukkan kata sandi lama untuk mengganti kata sandi'
      return
    }
    if (!syaratSandi.value.every((s) => s.ok)) {
      pesanError.value = 'Kata sandi baru belum memenuhi syarat'
      return
    }
  }

  menyimpan.value = true
  try {
    const data = await api.put('/akun', {
      nama: f.nama,
      email: f.email,
      kataSandiLama: f.kataSandiLama || undefined,
      kataSandiBaru: f.kataSandiBaru || undefined,
    })
    auth.perbaruiPengguna(data.pengguna)
    form.value.email = data.pengguna.email
    form.value.kataSandiLama = ''
    form.value.kataSandiBaru = ''
    pesanBerhasil.value = data.pesan
  } catch (err) {
    pesanError.value = err.pesan || 'Perubahan gagal disimpan, silakan coba lagi nanti'
  } finally {
    menyimpan.value = false
  }
}

const kelasInput = 'mt-2 w-full rounded-lg border border-border bg-white px-4 py-3 outline-none focus:border-primary'
</script>

<template>
  <AppLayout>
    <h1 class="text-3xl font-bold">Profil</h1>
    <p class="mt-1 text-text-muted">Lihat dan perbarui data akunmu</p>

    <p v-if="memuat" class="mt-6 text-text-muted">Memuat data akun...</p>

    <form v-else class="mt-6 max-w-2xl rounded-xl border border-border bg-white p-6 md:p-8" @submit.prevent="simpan">
      <div v-if="akun" class="flex flex-wrap gap-x-6 gap-y-1 text-sm text-text-muted">
        <p>Jenis akun: <b class="text-text">{{ akun.status_akun === 'PREMIUM' ? 'Premium' : 'Gratis' }}</b></p>
        <p>Bergabung: {{ new Date(akun.tanggal_daftar).toLocaleDateString('id-ID', { dateStyle: 'long' }) }}</p>
      </div>

      <h2 class="mt-6 text-lg font-semibold">Data akun</h2>
      <label class="mt-4 block text-sm font-semibold">Nama</label>
      <input v-model="form.nama" type="text" :class="kelasInput" />

      <label class="mt-4 block text-sm font-semibold">Email</label>
      <input v-model="form.email" type="email" :class="kelasInput" />

      <h2 class="mt-8 text-lg font-semibold">Ganti kata sandi</h2>
      <p class="text-sm text-text-muted">Kosongkan jika tidak ingin mengganti kata sandi</p>

      <label class="mt-4 block text-sm font-semibold">Kata sandi lama</label>
      <input v-model="form.kataSandiLama" :type="tampilkanSandi ? 'text' : 'password'" :class="kelasInput" />

      <label class="mt-4 block text-sm font-semibold">Kata sandi baru</label>
      <div class="relative">
        <input v-model="form.kataSandiBaru" :type="tampilkanSandi ? 'text' : 'password'" :class="kelasInput + ' pr-20'" />
        <button type="button" class="absolute bottom-3 right-3 text-sm font-semibold text-primary"
          @click="tampilkanSandi = !tampilkanSandi">{{ tampilkanSandi ? 'Sembunyi' : 'Lihat' }}</button>
      </div>
      <ul v-if="form.kataSandiBaru" class="mt-2 space-y-1 text-sm">
        <li v-for="s in syaratSandi" :key="s.teks" :class="s.ok ? 'text-primary' : 'text-text-muted'">
          {{ s.ok ? '✓' : '•' }} {{ s.teks }}
        </li>
      </ul>

      <p v-if="pesanError" class="mt-6 rounded-lg bg-error/10 px-4 py-2 text-sm text-error">{{ pesanError }}</p>
      <p v-if="pesanBerhasil" class="mt-6 rounded-lg bg-success/10 px-4 py-2 text-sm text-success">{{ pesanBerhasil }}</p>

      <div class="mt-8 flex justify-end">
        <button type="submit" :disabled="menyimpan"
          class="rounded-lg bg-primary px-6 py-2.5 font-semibold text-white disabled:opacity-60">
          {{ menyimpan ? 'Menyimpan...' : 'Simpan' }}
        </button>
      </div>
    </form>
  </AppLayout>
</template>
