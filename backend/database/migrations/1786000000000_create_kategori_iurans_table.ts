import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'kategori_iurans'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.string('nama', 100).notNullable()
      table.text('deskripsi').nullable()
      table.decimal('jumlah_default', 12, 2).notNullable().defaultTo(0)
      table.enum('periode', ['bulanan', 'tahunan', 'insidental']).notNullable().defaultTo('bulanan')
      table.boolean('aktif').notNullable().defaultTo(true)

      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.db.rawQuery("TIMEZONE('Asia/Jakarta', NOW())").knexQuery)
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.db.rawQuery("TIMEZONE('Asia/Jakarta', NOW())").knexQuery)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}