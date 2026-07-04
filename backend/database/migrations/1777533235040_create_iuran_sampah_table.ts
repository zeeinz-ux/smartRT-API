import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'iuran_sampah'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.uuid('warga_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.integer('bulan').notNullable()
      table.integer('tahun').notNullable()
      table.decimal('jumlah', 12, 2).notNullable().defaultTo(0)
      table.enum('status', ['lunas', 'belum_lunas', 'pending']).notNullable().defaultTo('belum_lunas')
      table.enum('metode_pembayaran', ['tunai', 'transfer', 'qris']).nullable()
      table.timestamp('paid_at').nullable()
      table.text('keterangan').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      table.unique(['warga_id', 'bulan', 'tahun'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
