import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.string('email', 254).notNullable().unique()
      table.string('password_hash').nullable()          // null jika pakai Google OAuth
      table.string('google_id').nullable().unique()
      table.string('nama').notNullable()
      table.string('no_hp').nullable()
      table.string('foto_url').nullable()
      table.enum('role', ['admin', 'bendahara', 'warga']).notNullable().defaultTo('warga')
      table.enum('status', ['active', 'pending', 'suspended']).notNullable().defaultTo('pending')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}