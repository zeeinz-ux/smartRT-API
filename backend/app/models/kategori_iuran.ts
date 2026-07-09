import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Iuran from './iuran.js'

export default class KategoriIuran extends BaseModel {
  static table = 'kategori_iurans'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare nama: string

  @column()
  declare deskripsi: string | null

  @column()
  declare jumlah_default: number

  @column()
  declare periode: 'bulanan' | 'tahunan' | 'insidental'

  @column()
  declare aktif: boolean

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime

  @hasMany(() => Iuran, { foreignKey: 'kategori_id' })
  declare iurans: HasMany<typeof Iuran>
}