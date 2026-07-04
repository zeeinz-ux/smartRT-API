import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'surat_pengantars'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.uuid('created_by').nullable().references('id').inTable('users').onDelete('SET NULL')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('created_by')
    })
  }
}