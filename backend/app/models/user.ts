import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { BaseModel, column, hasOne } from '@adonisjs/lucid/orm'
import { beforeSave } from '@adonisjs/lucid/orm'  // ✅ TAMBAH INI
import type { HasOne } from '@adonisjs/lucid/types/relations'
import WargaProfile from './warga_profile.ts'

export default class User extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password_hash: string | null

  @column()
  declare google_id: string | null

  @column()
  declare nama: string

  @column()
  declare no_hp: string | null

  @column()
  declare foto_url: string | null

  @column()
  declare role: 'admin' | 'bendahara' | 'warga'

  @column()
  declare status: 'active' | 'pending' | 'suspended'

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime

  // ─── Relations ───
  @hasOne(() => WargaProfile, {
    foreignKey: 'user_id',
  })
  declare wargaProfile: HasOne<typeof WargaProfile>

  // ✅ FIX: Tambah @beforeSave decorator
  @beforeSave()
  static async hashPassword(user: User) {
    if (user.$dirty.password_hash && user.password_hash) {
      user.password_hash = await hash.make(user.password_hash)
    }
  }

  /**
   * Verifikasi password plain text dengan hash
   */
  async verifyPassword(password: string): Promise<boolean> {
    if (!this.password_hash) return false
    return hash.verify(this.password_hash, password)
  }
}