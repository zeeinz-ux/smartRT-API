import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'iurans'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.uuid('warga_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.uuid('kategori_id').notNullable().references('id').inTable('kategori_iurans').onDelete('CASCADE')
      table.decimal('jumlah', 12, 2).notNullable()
      table.integer('bulan').nullable()
      table.integer('tahun').notNullable()
      table.enum('status', ['lunas', 'belum_lunas', 'pending']).notNullable().defaultTo('belum_lunas')
      table.enum('metode_pembayaran', ['tunai', 'transfer', 'qris']).nullable()
      table.timestamp('paid_at', { useTz: true }).nullable()
      table.text('keterangan').nullable()

      table.unique(['warga_id', 'kategori_id', 'bulan', 'tahun'])

      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.db.rawQuery("TIMEZONE('Asia/Jakarta', NOW())").knexQuery)
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.db.rawQuery("TIMEZONE('Asia/Jakarta', NOW())").knexQuery)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}