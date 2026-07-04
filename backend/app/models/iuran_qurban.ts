import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.ts'

export default class IuranQurban extends BaseModel {
  static table = 'iuran_qurban'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare warga_id: string

  @column()
  declare bulan: number

  @column()
  declare tahun: number

  @column()
  declare jumlah: number

  @column()
  declare status: 'lunas' | 'belum_lunas' | 'pending'

  @column()
  declare metode_pembayaran: 'tunai' | 'transfer' | 'qris' | null

  @column.dateTime()
  declare paid_at: DateTime | null

  @column()
  declare keterangan: string | null

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime

  @belongsTo(() => User, { foreignKey: 'warga_id' })
  declare warga: BelongsTo<typeof User>
}
