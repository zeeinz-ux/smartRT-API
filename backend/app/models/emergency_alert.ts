import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.ts'

export default class EmergencyAlert extends BaseModel {
  static table = 'emergency_alerts'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare user_id: string

  @column()
  declare latitude: number

  @column()
  declare longitude: number

  @column()
  declare keterangan: string | null

  @column()
  declare status: 'active' | 'resolved' | 'cancelled'

  @column()
  declare resolved_by: string | null

  @column.dateTime()
  declare resolved_at: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime

  @belongsTo(() => User, { foreignKey: 'user_id' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'resolved_by' })
  declare resolver: BelongsTo<typeof User>
}
