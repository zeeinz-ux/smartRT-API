import vine from '@vinejs/vine'

const periodeOptions = ['bulanan', 'tahunan', 'insidental'] as const

export const storeKategoriIuranValidator = vine.compile(
  vine.object({
    nama: vine.string(),
    deskripsi: vine.string().optional().nullable(),
    jumlah_default: vine.string().optional().nullable(),
    periode: vine.enum(periodeOptions).optional(),
  })
)

export const updateKategoriIuranValidator = vine.compile(
  vine.object({
    nama: vine.string().optional(),
    deskripsi: vine.string().optional().nullable(),
    jumlah_default: vine.string().optional().nullable(),
    periode: vine.enum(periodeOptions).optional(),
    aktif: vine.boolean().optional(),
  })
)
