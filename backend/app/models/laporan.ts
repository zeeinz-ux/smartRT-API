import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.ts'

export default class Laporan extends BaseModel {
  static table = 'laporans'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare user_id: string

  @column()
  declare judul: string

  @column()
  declare isi: string

  @column()
  declare foto: string | null

  @column()
  declare status: 'diproses' | 'selesai' | 'ditolak'

  @column()
  declare tanggapan: string | null

  @column()
  declare ditanggapi_oleh: string | null

  @column.dateTime()
  declare ditanggapi_at: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime

  @belongsTo(() => User, { foreignKey: 'user_id' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'ditanggapi_oleh' })
  declare penanggap: BelongsTo<typeof User>
}
