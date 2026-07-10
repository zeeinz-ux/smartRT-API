import vine from '@vinejs/vine'

export const storeDaruratValidator = vine.compile(
  vine.object({
    latitude: vine.string(),
    longitude: vine.string(),
    keterangan: vine.string().optional().nullable(),
  })
)
