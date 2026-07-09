import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'iurans'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.text('bukti_pembayaran_url').nullable().after('keterangan')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('bukti_pembayaran_url')
    })
  }
}
