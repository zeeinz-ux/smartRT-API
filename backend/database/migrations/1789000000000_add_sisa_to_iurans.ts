import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'iurans'

  async up() {
    await this.db.rawQuery('ALTER TABLE iurans ADD COLUMN sisa DECIMAL(12,2) NOT NULL DEFAULT 0')
    await this.db.rawQuery('UPDATE iurans SET sisa = jumlah')
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('sisa')
    })
  }
}
