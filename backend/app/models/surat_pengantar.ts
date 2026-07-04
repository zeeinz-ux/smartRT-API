import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.ts'

export default class SuratPengantar extends BaseModel {
  static table = 'surat_pengantars'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare user_id: string

  @column()
  declare jenis_surat: string

  @column()
  declare keperluan: string

  @column()
  declare keterangan: string | null

  @column()
  declare status: 'pending' | 'disetujui' | 'ditolak'

  @column()
  declare file_pdf: string | null

  @column()
  declare qr_code: string | null

  @column()
  declare nomor_surat: string | null

  @column()
  declare alasan_tolak: string | null

  @column()
  declare approved_by: string | null

  @column()
  declare created_by: string | null

  @column.dateTime()
  declare approved_at: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime

  @belongsTo(() => User, { foreignKey: 'user_id' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'approved_by' })
  declare approver: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'created_by' })
  declare creator: BelongsTo<typeof User>
}
