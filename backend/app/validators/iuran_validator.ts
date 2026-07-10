import vine from '@vinejs/vine'

const statusIuran = ['lunas', 'belum_lunas', 'pending'] as const
const metodeBayar = ['tunai', 'transfer', 'qris'] as const

export const storeIuranValidator = vine.compile(
  vine.object({
    warga_id: vine.string(),
    kategori_id: vine.string(),
    bulan: vine.number().range([1, 12]).optional(),
    tahun: vine.number(),
    jumlah: vine.number(),
    status: vine.enum(statusIuran).optional(),
    metode_pembayaran: vine.enum(metodeBayar).optional().nullable(),
    keterangan: vine.string().optional().nullable(),
  })
)

export const updateIuranValidator = vine.compile(
  vine.object({
    jumlah: vine.number().optional(),
    status: vine.enum(statusIuran).optional(),
    metode_pembayaran: vine.enum(metodeBayar).optional().nullable(),
    keterangan: vine.string().optional().nullable(),
  })
)

export const wargaBayarValidator = vine.compile(
  vine.object({
    metode_pembayaran: vine.enum(metodeBayar),
  })
)

export const generateIuranValidator = vine.compile(
  vine.object({
    bulan: vine.number().range([1, 12]),
    tahun: vine.number(),
  })
)

export const storePaymentValidator = vine.compile(
  vine.object({
    warga_id: vine.string(),
    bulan: vine.number().range([1, 12]).optional(),
    tahun: vine.number(),
    jumlah: vine.number(),
    status: vine.enum(statusIuran).optional(),
    metode_pembayaran: vine.enum(metodeBayar).optional().nullable(),
    keterangan: vine.string().optional().nullable(),
  })
)

export const updatePaymentValidator = vine.compile(
  vine.object({
    jumlah: vine.number().optional(),
    status: vine.enum(statusIuran).optional(),
    metode_pembayaran: vine.enum(metodeBayar).optional().nullable(),
    keterangan: vine.string().optional().nullable(),
  })
)
