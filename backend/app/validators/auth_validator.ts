import vine from '@vinejs/vine'

const roles = ['admin', 'bendahara', 'warga'] as const

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().email().normalizeEmail(),
    password: vine.string(),
    role: vine.enum(roles),
  })
)

export const changePasswordValidator = vine.compile(
  vine.object({
    current_password: vine.string(),
    new_password: vine.string().minLength(6),
    confirm_password: vine.string(),
  })
)

export const verifyPasswordValidator = vine.compile(
  vine.object({
    password: vine.string(),
  })
)

export const checkRoleValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
  })
)
