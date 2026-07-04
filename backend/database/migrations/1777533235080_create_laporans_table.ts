import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'laporans'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.string('judul').notNullable()
      table.text('isi').notNullable()
      table.string('foto').nullable()
      table.enum('status', ['diproses', 'selesai', 'ditolak']).notNullable().defaultTo('diproses')
      table.text('tanggapan').nullable()
      table.uuid('ditanggapi_oleh').nullable().references('id').inTable('users').onDelete('SET NULL')
      table.timestamp('ditanggapi_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
