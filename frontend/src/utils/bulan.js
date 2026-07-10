const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
]

const NAMA_BULAN_SINGKAT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
]

export const BULAN = [
  { value: 0, label: "Semua Bulan" },
  ...NAMA_BULAN.map((label, i) => ({ value: i + 1, label })),
]

export const BULAN_TANPA_SEMUA = NAMA_BULAN.map((label, i) => ({
  value: i + 1,
  label,
}))

export const BULAN_SINGKAT = NAMA_BULAN_SINGKAT.map((label, i) => ({
  value: i + 1,
  label,
}))

export const BULAN_LABEL = ["", ...NAMA_BULAN_SINGKAT]
