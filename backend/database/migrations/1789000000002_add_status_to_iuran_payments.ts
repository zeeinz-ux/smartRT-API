import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'iuran_payments'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.enum('status', ['pending', 'confirmed', 'rejected']).notNullable().defaultTo('confirmed')
      table.uuid('warga_id').nullable().references('id').inTable('users').onDelete('SET NULL')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('status')
      table.dropColumn('warga_id')
    })
  }
}
