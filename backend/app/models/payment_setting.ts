import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class PaymentSetting extends BaseModel {
  static table = 'payment_settings'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare nama_bank: string

  @column()
  declare nomor_rekening: string

  @column()
  declare nama_penerima: string

  @column()
  declare qris_path: string | null

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime
}
