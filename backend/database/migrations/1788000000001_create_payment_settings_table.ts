import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'payment_settings'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.string('nama_bank', 100).notNullable()
      table.string('nomor_rekening', 50).notNullable()
      table.string('nama_penerima', 200).notNullable()
      table.string('qris_path').nullable()

      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.db.rawQuery("TIMEZONE('Asia/Jakarta', NOW())").knexQuery)
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.db.rawQuery("TIMEZONE('Asia/Jakarta', NOW())").knexQuery)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
