import vine from '@vinejs/vine'

const validRoles = ['admin', 'bendahara', 'warga'] as const
const validUserStatus = ['active', 'pending', 'suspended'] as const

export const createWargaValidator = vine.compile(
  vine.object({
    nama: vine.string(),
    email: vine.string().email().normalizeEmail(),
    no_hp: vine.string().regex(/^(\+62|62|0)\d{8,13}$/),
    password: vine.string().minLength(6),
    role: vine.enum(validRoles).optional(),
  })
)

export const updateWargaValidator = vine.compile(
  vine.object({
    nama: vine.string().optional(),
    no_hp: vine.string().regex(/^(\+62|62|0)\d{8,13}$/).optional(),
    alamat: vine.string().optional(),
    no_rumah: vine.string().optional(),
    status_huni: vine.enum(['pemilik', 'penyewa', 'numpang'] as const).optional(),
    user_status: vine.enum(validUserStatus).optional(),
  })
)
