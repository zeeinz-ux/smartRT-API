import { DateTime } from 'luxon'

/**
 * ─── Daftar Kode Provinsi Indonesia ───
 * Rentang valid: 11 – 94 (sesuai aturan BPS/Dukcapil)
 */
const VALID_PROVINCE_CODES = new Set<number>()
const PROVINCE_RANGES: [number, number][] = [
  [11, 94],
]
for (const [start, end] of PROVINCE_RANGES) {
  for (let i = start; i <= end; i++) {
    VALID_PROVINCE_CODES.add(i)
  }
}

export interface ValidationResult {
  valid: boolean
  message?: string
}

/**
 * Cek pola mencurigakan: semua digit sama atau berurutan
 */
function isSuspiciousPattern(str: string): boolean {
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
 * Validasi 16 digit angka
 */
function isAllDigits(str: string): boolean {
  return /^\d{16}$/.test(str)
}

/**
 * Parse kode wilayah: provinsi (2), kota/kab (2), kecamatan (2)
 */
function parseWilayah(nik: string): { prov: number; kota: number; kec: number } | null {
  const prov = parseInt(nik.substring(0, 2), 10)
  const kota = parseInt(nik.substring(2, 4), 10)
  const kec = parseInt(nik.substring(4, 6), 10)
  return { prov, kota, kec }
}

/**
 * Validasi kode wilayah Indonesia
 */
function validasiWilayah(prov: number, kota: number, kec: number): string | null {
  if (prov === 0) return 'Kode provinsi tidak boleh 00'
  if (!VALID_PROVINCE_CODES.has(prov)) return `Kode provinsi ${prov} tidak valid`

  if (kota === 0) return 'Kode kota/kabupaten tidak boleh 00'
  if (kec === 0) return 'Kode kecamatan tidak boleh 00'
  return null
}

/**
 * Validasi tanggal lahir dari NIK (mempertimbangkan gender)
 * Pria: DD 01–31
 * Wanita: DD 41–71 (tanggal + 40)
 */
function validasiTanggalLahirNik(nik: string): string | null {
  const raw = parseInt(nik.substring(6, 8), 10)
  const bulan = parseInt(nik.substring(8, 10), 10)
  const tahun2 = parseInt(nik.substring(10, 12), 10)

  if (bulan < 1 || bulan > 12) return `Bulan lahir tidak valid: ${bulan}`

  // Tentukan abad untuk tahun 2 digit
  const now = DateTime.now()
  const currentYear = now.year
  const currentCentury = Math.floor(currentYear / 100) * 100
  let tahunLengkap = currentCentury + tahun2
  if (tahunLengkap > currentYear) {
    tahunLengkap -= 100
  }

  const hari = raw > 40 ? raw - 40 : raw

  if (hari < 1 || hari > 31) return `Tanggal lahir tidak valid: ${raw}`

  const tanggal = DateTime.local(tahunLengkap, bulan, hari)
  if (!tanggal.isValid) {
    return `Tanggal lahir tidak valid (${hari}/${bulan}/${tahunLengkap})`
  }

  if (tanggal > now) return `Tanggal lahir tidak boleh di masa depan`

  return null
}

/**
 * Validasi nomor urut penerbitan NIK (4 digit terakhir)
 */
function validasiNomorUrut(nomor: string): string | null {
  if (nomor === '0000') return 'Nomor urut tidak boleh 0000'
  return null
}

/**
 * Validasi NIK berdasarkan aturan Dukcapil Indonesia
 *
 * Format: AABBCCDDMMYYXXXX
 * AA = kode provinsi (11-94)
 * BB = kode kota/kabupaten
 * CC = kode kecamatan
 * DD = tanggal lahir (01-31 pria, 41-71 wanita)
 * MM = bulan lahir (01-12)
 * YY = 2 digit tahun lahir
 * XXXX = nomor urut penerbitan
 */
export function validateNIK(nik: string): ValidationResult {
  const clean = nik.toString().trim()

  if (!isAllDigits(clean)) {
    return { valid: false, message: 'NIK harus 16 digit angka' }
  }

  if (isSuspiciousPattern(clean)) {
    return { valid: false, message: 'NIK tidak valid (pola tidak dikenal)' }
  }

  const wilayah = parseWilayah(clean)
  if (!wilayah) return { valid: false, message: 'Gagal parse NIK' }

  const errorWilayah = validasiWilayah(wilayah.prov, wilayah.kota, wilayah.kec)
  if (errorWilayah) return { valid: false, message: errorWilayah }

  const errorTanggal = validasiTanggalLahirNik(clean)
  if (errorTanggal) return { valid: false, message: errorTanggal }

  const errorNomor = validasiNomorUrut(clean.substring(12))
  if (errorNomor) return { valid: false, message: errorNomor }

  return { valid: true }
}

/**
 * Validasi KK berdasarkan aturan Dukcapil Indonesia
 *
 * Format: AABBCCDDMMYYXXXX
 * AA = kode provinsi (11-94)
 * BB = kode kota/kabupaten
 * CC = kode kecamatan
 * DDMMYY = tanggal penerbitan KK (DD 01-31, MM 01-12)
 * XXXX = nomor urut
 */
export function validateKK(kk: string): ValidationResult {
  const clean = kk.toString().trim()

  if (!isAllDigits(clean)) {
    return { valid: false, message: 'Nomor KK harus 16 digit angka' }
  }

  if (isSuspiciousPattern(clean)) {
    return { valid: false, message: 'Nomor KK tidak valid (pola tidak dikenal)' }
  }

  const wilayah = parseWilayah(clean)
  if (!wilayah) return { valid: false, message: 'Gagal parse KK' }

  const errorWilayah = validasiWilayah(wilayah.prov, wilayah.kota, wilayah.kec)
  if (errorWilayah) return { valid: false, message: errorWilayah }

  const hari = parseInt(clean.substring(6, 8), 10)
  const bulan = parseInt(clean.substring(8, 10), 10)
  const tahun2 = parseInt(clean.substring(10, 12), 10)

  if (hari < 1 || hari > 31) return { valid: false, message: `Tanggal penerbitan KK tidak valid: ${hari}` }

  if (bulan < 1 || bulan > 12) return { valid: false, message: `Bulan penerbitan KK tidak valid: ${bulan}` }

  const now = DateTime.now()
  const currentYear = now.year
  const currentCentury = Math.floor(currentYear / 100) * 100
  let tahunLengkap = currentCentury + tahun2
  if (tahunLengkap > currentYear) {
    tahunLengkap -= 100
  }

  const tanggal = DateTime.local(tahunLengkap, bulan, hari)
  if (!tanggal.isValid) {
    return { valid: false, message: `Tanggal penerbitan KK tidak valid (${hari}/${bulan}/${tahunLengkap})` }
  }

  if (tanggal > now) return { valid: false, message: 'Tanggal penerbitan KK tidak boleh di masa depan' }

  const errorNomor = validasiNomorUrut(clean.substring(12))
  if (errorNomor) return { valid: false, message: errorNomor }

  return { valid: true }
}
