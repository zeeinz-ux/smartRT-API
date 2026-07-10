import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Iuran from './iuran.js'
import User from './user.js'

export default class IuranPayment extends BaseModel {
  static table = 'iuran_payments'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare iuran_id: string

  @column()
  declare jumlah: number

  @column()
  declare metode_pembayaran: 'tunai' | 'transfer' | 'qris' | null

  @column.dateTime()
  declare paid_at: DateTime

  @column()
  declare keterangan: string | null

  @column()
  declare status: 'pending' | 'confirmed' | 'rejected'

  @column()
  declare admin_id: string | null

  @column()
  declare warga_id: string | null

  @belongsTo(() => Iuran, { foreignKey: 'iuran_id' })
  declare iuran: BelongsTo<typeof Iuran>

  @belongsTo(() => User, { foreignKey: 'admin_id' })
  declare admin: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'warga_id' })
  declare warga: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime
}
