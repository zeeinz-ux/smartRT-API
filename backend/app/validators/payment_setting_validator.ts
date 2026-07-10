import vine from '@vinejs/vine'

export const storePaymentSettingValidator = vine.compile(
  vine.object({
    nama_bank: vine.string(),
    nomor_rekening: vine.string(),
    nama_penerima: vine.string(),
  })
)

export const updatePaymentSettingValidator = vine.compile(
  vine.object({
    nama_bank: vine.string().optional(),
    nomor_rekening: vine.string().optional(),
    nama_penerima: vine.string().optional(),
  })
)
