import vine from '@vinejs/vine'

const statusLaporan = ['diproses', 'selesai', 'ditolak'] as const

export const storeLaporanValidator = vine.compile(
  vine.object({
    judul: vine.string(),
    isi: vine.string(),
    foto: vine.string().optional().nullable(),
    user_id: vine.string().optional(),
  })
)

export const updateLaporanValidator = vine.compile(
  vine.object({
    judul: vine.string().optional(),
    isi: vine.string().optional(),
    foto: vine.string().optional().nullable(),
  })
)

export const tanggapiLaporanValidator = vine.compile(
  vine.object({
    status: vine.enum(statusLaporan).optional(),
    tanggapan: vine.string().optional().nullable(),
  })
)
