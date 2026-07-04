import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'
import hash from '@adonisjs/core/services/hash'

// ─────────────────────────────────────────────────────────────────────────────
// 🔧 KONFIGURASI ADMIN — ubah sebelum jalankan seeder
// ─────────────────────────────────────────────────────────────────────────────
const ADMIN_CONFIG = {
  nama:     'Ketua RT-003',
  email:    'admin@example.com',   // ← ganti email admin
  password: 'Admin12345',        // ← ganti password (min 8 char, huruf+angka+simbol)
  no_hp:    '6285288888888',        // ← ganti nomor HP admin
}
// ─────────────────────────────────────────────────────────────────────────────

export default class AdminSeeder extends BaseSeeder {
  async run() {
    // Cek apakah admin sudah ada — hindari duplikasi
    const existing = await db.from('users').where('email', ADMIN_CONFIG.email).first()

    if (existing) {
      console.log('⚠️  Admin sudah ada, seeder dilewati.')
      console.log(`   Email: ${existing.email}`)
      console.log(`   Role:  ${existing.role}`)
      return
    }

    // Hash password dengan Argon2 (default AdonisJS)
    const passwordHash = await hash.make(ADMIN_CONFIG.password)

    await db.table('users').insert({
      // UUID di-generate otomatis oleh PostgreSQL (gen_random_uuid())
      nama:          ADMIN_CONFIG.nama,
      email:         ADMIN_CONFIG.email,
      password_hash: passwordHash,
      role:          'admin',
      status:        'active',        // Admin langsung aktif tanpa verifikasi
      no_hp:         ADMIN_CONFIG.no_hp,
      created_at:    new Date(),
      updated_at:    new Date(),
    })

    console.log('✅  Admin berhasil dibuat!')
    console.log('─────────────────────────────────────')
    console.log(`   Nama  : ${ADMIN_CONFIG.nama}`)
    console.log(`   Email : ${ADMIN_CONFIG.email}`)
    console.log(`   Role  : admin`)
    console.log('─────────────────────────────────────')
    console.log('⚠️  Segera ganti password setelah login pertama!')
  }
}