import vine from '@vinejs/vine'

const statusHuniOptions = ['pemilik', 'penyewa', 'numpang'] as const

export const onboardingValidator = vine.compile(
  vine.object({
    nama_lengkap: vine.string(),
    nik: vine.string().fixedLength(16).regex(/^\d{16}$/),
    kk: vine.string().fixedLength(16).regex(/^\d{16}$/),
    no_hp: vine.string().regex(/^(\+62|62|0)\d{8,13}$/),
    alamat: vine.string(),
    no_rumah: vine.string(),
    status_huni: vine.enum(statusHuniOptions),
  })
)

export const updateProfileValidator = vine.compile(
  vine.object({
    alamat: vine.string().optional(),
    no_rumah: vine.string().optional(),
    status_huni: vine.enum(statusHuniOptions).optional(),
  })
)
