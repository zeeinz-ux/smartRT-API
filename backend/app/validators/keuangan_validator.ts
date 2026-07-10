import vine from '@vinejs/vine'

export const storePengeluaranValidator = vine.compile(
  vine.object({
    nama: vine.string(),
    jumlah: vine.number(),
    kategori: vine.string().optional(),
    tanggal: vine.date(),
    keterangan: vine.string().optional().nullable(),
  })
)

export const updatePengeluaranValidator = vine.compile(
  vine.object({
    nama: vine.string().optional(),
    jumlah: vine.number().optional(),
    kategori: vine.string().optional(),
    tanggal: vine.date().optional(),
    keterangan: vine.string().optional().nullable(),
  })
)
