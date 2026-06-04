import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'warga_profiles'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.string('nik', 16).nullable().unique()
      table.string('kk', 16).nullable()
      table.text('alamat').nullable()
      table.string('no_rumah').nullable()
      // ✅ GANTI INI — dari enum lama ke enum baru
      table.enum('status_huni', ['pemilik', 'penyewa']).nullable()
      table.string('foto_ktp_url').nullable()
      table.enum('verification_status', ['pending', 'verified', 'rejected']).notNullable().defaultTo('pending')
      table.uuid('verified_by').nullable().references('id').inTable('users')
      table.timestamp('verified_at').nullable()
      table.text('rejection_reason').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}