import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'iuran_payments'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.uuid('iuran_id').notNullable().references('id').inTable('iurans').onDelete('CASCADE')
      table.decimal('jumlah', 12, 2).notNullable()
      table.enum('metode_pembayaran', ['tunai', 'transfer', 'qris']).nullable()
      table.timestamp('paid_at', { useTz: true }).notNullable().defaultTo(this.db.rawQuery("TIMEZONE('Asia/Jakarta', NOW())").knexQuery)
      table.text('keterangan').nullable()
      table.uuid('admin_id').nullable().references('id').inTable('users').onDelete('SET NULL')

      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.db.rawQuery("TIMEZONE('Asia/Jakarta', NOW())").knexQuery)
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.db.rawQuery("TIMEZONE('Asia/Jakarta', NOW())").knexQuery)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
