import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'surat_pengantars'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.string('jenis_surat').notNullable()
      table.string('keperluan').notNullable()
      table.text('keterangan').nullable()
      table.enum('status', ['pending', 'disetujui', 'ditolak']).notNullable().defaultTo('pending')
      table.string('file_pdf').nullable()
      table.string('qr_code').nullable()
      table.string('nomor_surat').nullable()
      table.text('alasan_tolak').nullable()
      table.uuid('approved_by').nullable().references('id').inTable('users').onDelete('SET NULL')
      table.timestamp('approved_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
