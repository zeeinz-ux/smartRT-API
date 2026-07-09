import { BaseSchema } from '@adonisjs/lucid/schema'
import db from '@adonisjs/lucid/services/db'

export default class extends BaseSchema {
  async up() {
    const existing = await db.from('kategori_iurans').first()
    if (existing) return

    await db.table('kategori_iurans').multiInsert([
      {
        id: '00000000-0000-0000-0000-000000000001',
        nama: 'Iuran Sampah',
        deskripsi: 'Iuran kebersihan dan pengelolaan sampah bulanan',
        jumlah_default: 150000,
        periode: 'bulanan',
        aktif: true,
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        nama: 'Iuran Qurban',
        deskripsi: 'Iuran hewan qurban tahunan',
        jumlah_default: 500000,
        periode: 'tahunan',
        aktif: true,
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        nama: 'Iuran 17 Agustus',
        deskripsi: 'Iuran perayaan HUT Kemerdekaan RI',
        jumlah_default: 50000,
        periode: 'insidental',
        aktif: true,
      },
      {
        id: '00000000-0000-0000-0000-000000000004',
        nama: 'Iuran Maulid Nabi',
        deskripsi: 'Iuran perayaan Maulid Nabi Muhammad SAW',
        jumlah_default: 50000,
        periode: 'insidental',
        aktif: true,
      },
    ])
  }

  async down() {
    await db.from('kategori_iurans').delete()
  }
}