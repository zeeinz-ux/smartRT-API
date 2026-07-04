import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class SuratTemplate extends BaseModel {
  static table = 'surat_templates'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare jenis_surat: string

  @column()
  declare file_path: string

  @column()
  declare original_name: string | null

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime
}
