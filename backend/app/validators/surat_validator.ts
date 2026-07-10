import vine from '@vinejs/vine'

const jenisSurat = [
  'domisili',
  'kk',
  'ktp',
  'tidak_mampu',
  'usaha',
  'izin_keramaian',
  'lainnya',
] as const

export const storeSuratValidator = vine.compile(
  vine.object({
    jenis_surat: vine.enum(jenisSurat),
    keperluan: vine.string(),
    keterangan: vine.string().optional().nullable(),
  })
)

export const storeSuratAsAdminValidator = vine.compile(
  vine.object({
    user_id: vine.string(),
    jenis_surat: vine.enum(jenisSurat),
    keperluan: vine.string(),
    keterangan: vine.string().optional().nullable(),
  })
)
