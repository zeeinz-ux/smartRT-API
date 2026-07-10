import vine from '@vinejs/vine'

export const storePengumumanValidator = vine.compile(
  vine.object({
    judul: vine.string(),
    isi: vine.string(),
    file: vine.string().optional().nullable(),
    scheduled_at: vine.date().optional().nullable(),
  })
)

export const updatePengumumanValidator = vine.compile(
  vine.object({
    judul: vine.string().optional(),
    isi: vine.string().optional(),
    file: vine.string().optional().nullable(),
    scheduled_at: vine.date().optional().nullable(),
  })
)
