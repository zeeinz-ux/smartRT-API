import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'iurans'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('verified_at', { useTz: true }).nullable().after('bukti_pembayaran_url')
      table.uuid('verified_by').nullable().references('id').inTable('users').onDelete('SET NULL').after('verified_at')
      table.text('rejection_reason').nullable().after('verified_by')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('verified_at')
      table.dropColumn('verified_by')
      table.dropColumn('rejection_reason')
    })
  }
}
