// ─── Daftar Kode Provinsi Indonesia ───
const VALID_PROVINCE_CODES = new Set()
for (let i = 11; i <= 94; i++) {
  VALID_PROVINCE_CODES.add(i)
}

function parseWilayah(str) {
  return {
    prov: parseInt(str.substring(0, 2), 10),
    kota: parseInt(str.substring(2, 4), 10),
    kec: parseInt(str.substring(4, 6), 10),
  }
}

function validasiWilayah(prov, kota, kec) {
  if (prov === 0) return 'Kode provinsi tidak boleh 00'
  if (!VALID_PROVINCE_CODES.has(prov)) return `Kode provinsi ${prov} tidak valid`
  if (kota === 0) return 'Kode kota/kabupaten tidak boleh 00'
  if (kec === 0) return 'Kode kecamatan tidak boleh 00'
  return null
}

function isSuspiciousPattern(str) {
  if (/^(\d)\1{15}$/.test(str)) return true
  if (/^0123456789012345$/.test(str)) return true
  if (/^1234567890123456$/.test(str)) return true
  if (/^2345678901234567$/.test(str)) return true
  if (/^9876543210987654$/.test(str)) return true
  if (/^8765432109876543$/.test(str)) return true
  if (/^7654321098765432$/.test(str)) return true
  return false
}

/**
 * Validasi NIK berdasarkan aturan Dukcapil Indonesia
 * Format: AABBCCDDMMYYXXXX
 */
export function validateNIK(nik) {
  const clean = (nik || '').toString().trim()
  if (!clean) return 'NIK wajib diisi'
  if (!/^\d+$/.test(clean)) return 'NIK hanya boleh angka'
  if (clean.length !== 16) return `NIK harus 16 digit (sekarang ${clean.length} digit)`
  if (isSuspiciousPattern(clean)) return 'NIK tidak valid (pola tidak dikenal)'

  const wilayah = parseWilayah(clean)
  const errorWilayah = validasiWilayah(wilayah.prov, wilayah.kota, wilayah.kec)
  if (errorWilayah) return errorWilayah

  const raw = parseInt(clean.substring(6, 8), 10)
  const bulan = parseInt(clean.substring(8, 10), 10)
  const tahun2 = parseInt(clean.substring(10, 12), 10)

  if (bulan < 1 || bulan > 12) return `Bulan lahir tidak valid: ${bulan}`

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentCentury = Math.floor(currentYear / 100) * 100
  let tahunLengkap = currentCentury + tahun2
  if (tahunLengkap > currentYear) tahunLengkap -= 100

  const hari = raw > 40 ? raw - 40 : raw
  if (hari < 1 || hari > 31) return `Tanggal lahir tidak valid: ${raw}`

  const tgl = new Date(tahunLengkap, bulan - 1, hari)
  if (tgl.getDate() !== hari || tgl.getMonth() !== bulan - 1 || tgl.getFullYear() !== tahunLengkap) {
    return `Tanggal lahir tidak valid (${hari}/${bulan}/${tahunLengkap})`
  }
  if (tgl > now) return 'Tanggal lahir tidak boleh di masa depan'

  const nomor = clean.substring(12)
  if (nomor === '0000') return 'Nomor urut NIK tidak boleh 0000'

  return null
}

/**
 * Validasi KK berdasarkan aturan Dukcapil Indonesia
 * Format: AABBCCDDMMYYXXXX
 */
export function validateKK(kk) {
  const clean = (kk || '').toString().trim()
  if (!clean) return 'Nomor KK wajib diisi'
  if (!/^\d+$/.test(clean)) return 'Nomor KK hanya boleh angka'
  if (clean.length !== 16) return `Nomor KK harus 16 digit (sekarang ${clean.length} digit)`
  if (isSuspiciousPattern(clean)) return 'Nomor KK tidak valid (pola tidak dikenal)'

  const wilayah = parseWilayah(clean)
  const errorWilayah = validasiWilayah(wilayah.prov, wilayah.kota, wilayah.kec)
  if (errorWilayah) return errorWilayah

  const hari = parseInt(clean.substring(6, 8), 10)
  const bulan = parseInt(clean.substring(8, 10), 10)
  const tahun2 = parseInt(clean.substring(10, 12), 10)

  if (hari < 1 || hari > 31) return `Tanggal penerbitan KK tidak valid: ${hari}`
  if (bulan < 1 || bulan > 12) return `Bulan penerbitan KK tidak valid: ${bulan}`

  const currentYear = new Date().getFullYear()
  const currentCentury = Math.floor(currentYear / 100) * 100
  let tahunLengkap = currentCentury + tahun2
  if (tahunLengkap > currentYear) tahunLengkap -= 100

  const tgl = new Date(tahunLengkap, bulan - 1, hari)
  if (tgl.getDate() !== hari || tgl.getMonth() !== bulan - 1 || tgl.getFullYear() !== tahunLengkap) {
    return `Tanggal penerbitan KK tidak valid (${hari}/${bulan}/${tahunLengkap})`
  }

  const nomor = clean.substring(12)
  if (nomor === '0000') return 'Nomor urut KK tidak boleh 0000'

  return null
}
