import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.ts'

export default class Pengeluaran extends BaseModel {
  static table = 'pengeluarans'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare nama: string

  @column()
  declare jumlah: number

  @column()
  declare kategori: string

  @column.date()
  declare tanggal: DateTime

  @column()
  declare keterangan: string | null

  @column()
  declare created_by: string

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime

  @belongsTo(() => User, { foreignKey: 'created_by' })
  declare creator: BelongsTo<typeof User>
}
