import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.ts'

export default class WargaProfile extends BaseModel {
  protected tableName = 'warga_profiles'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare user_id: string

  @column()
  declare nik: string | null

  @column()
  declare kk: string | null

  @column()
  declare alamat: string | null

  @column()
  declare no_rumah: string | null

  // ✅ FIX: Sinkronkan dengan controller — 'pemilik' | 'penyewa'
  @column()
  declare status_huni: 'pemilik' | 'penyewa' | 'numpang' | null

  @column()
  declare foto_ktp_url: string | null

  @column()
  declare verification_status: 'pending' | 'verified' | 'rejected'

  @column()
  declare verified_by: string | null

  @column.dateTime()
  declare verified_at: DateTime | null

  @column()
  declare rejection_reason: string | null

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime

  // ─── Relations ───
  @belongsTo(() => User, {
    foreignKey: 'user_id',
  })
  declare user: BelongsTo<typeof User>
}