import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import KategoriIuran from './kategori_iuran.js'

export default class Iuran extends BaseModel {
  static table = 'iurans'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare warga_id: string

  @column()
  declare kategori_id: string

  @column()
  declare jumlah: number

  @column()
  declare bulan: number | null

  @column()
  declare tahun: number

  @column()
  declare status: 'lunas' | 'belum_lunas' | 'pending'

  @column()
  declare metode_pembayaran: 'tunai' | 'transfer' | 'qris' | null

  @column.dateTime()
  declare paid_at: DateTime | null

  @column()
  declare keterangan: string | null

  @column()
  declare bukti_pembayaran_url: string | null

  @column.dateTime()
  declare verified_at: DateTime | null

  @column()
  declare verified_by: string | null

  @column()
  declare rejection_reason: string | null

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime

  @belongsTo(() => User, { foreignKey: 'warga_id' })
  declare warga: BelongsTo<typeof User>

  @belongsTo(() => KategoriIuran, { foreignKey: 'kategori_id' })
  declare kategori: BelongsTo<typeof KategoriIuran>

  @belongsTo(() => User, { foreignKey: 'verified_by' })
  declare verifier: BelongsTo<typeof User>
}