import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'pengeluarans'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.string('nama').notNullable()
      table.decimal('jumlah', 12, 2).notNullable().defaultTo(0)
      table.string('kategori').notNullable().defaultTo('Lainnya')
      table.date('tanggal').notNullable()
      table.text('keterangan').nullable()
      table.uuid('created_by').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
