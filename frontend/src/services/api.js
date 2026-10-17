// Pemanggil REST API backend. Token JWT disertakan otomatis di header Authorization.
async function permintaan(url, opsi = {}) {
  const token = localStorage.getItem('token')
  const headers = { ...(opsi.headers || {}) }

  if (token) headers.Authorization = `Bearer ${token}`
  // FormData (upload foto) mengatur Content-Type sendiri
  if (opsi.body && !(opsi.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
    opsi.body = JSON.stringify(opsi.body)
  }

  let respons
  try {
    respons = await fetch(`/api${url}`, { ...opsi, headers })
  } catch {
    throw { status: 0, pesan: 'Tidak dapat terhubung ke server, silakan coba lagi nanti' }
  }

  const data = await respons.json().catch(() => ({}))

  if (respons.status === 401 && token) {
    // Sesi berakhir: hapus token dan kembali ke halaman login
    localStorage.removeItem('token')
    localStorage.removeItem('pengguna')
    window.location.href = '/login'
  }
  if (!respons.ok) {
    throw { status: respons.status, ...data }
  }
  return data
}

export const api = {
  get: (url) => permintaan(url),
  post: (url, body) => permintaan(url, { method: 'POST', body }),
}