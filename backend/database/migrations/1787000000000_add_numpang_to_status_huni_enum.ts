import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.raw(`
      ALTER TABLE warga_profiles
      DROP CONSTRAINT IF EXISTS warga_profiles_status_huni_check
    `)
    this.schema.raw(`
      ALTER TABLE warga_profiles
      ADD CONSTRAINT warga_profiles_status_huni_check
      CHECK (status_huni = ANY (ARRAY['pemilik'::text, 'penyewa'::text, 'numpang'::text]))
    `)
  }

  async down() {
    this.schema.raw(`
      ALTER TABLE warga_profiles
      DROP CONSTRAINT IF EXISTS warga_profiles_status_huni_check
    `)
    this.schema.raw(`
      ALTER TABLE warga_profiles
      ADD CONSTRAINT warga_profiles_status_huni_check
      CHECK (status_huni = ANY (ARRAY['pemilik'::text, 'penyewa'::text]))
    `)
  }
}
