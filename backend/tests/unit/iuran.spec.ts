import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import User from '#models/user'
import KategoriIuran from '#models/kategori_iuran'
import db from '@adonisjs/lucid/services/db'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('Iuran - Model Layer', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('generate iuran records for warga', async ({ assert }) => {
    const warga = await User.create({
      email: 'warga@test.com',
      password_hash: 'password',
      nama: 'Warga',
      role: 'warga',
      status: 'active',
    })

    const kategori = await KategoriIuran.create({
      nama: 'Iuran Kebersihan',
      jumlah_default: 50000,
      periode: 'bulanan',
      aktif: true,
    })

    const iuran = await warga.related('iuran').create({
      kategori_id: kategori.id,
      jumlah: kategori.jumlah_default,
      bulan: 7,
      tahun: 2025,
      status: 'belum_lunas',
    })

    assert.isTrue(iuran.$isPersisted)
    assert.equal(iuran.status, 'belum_lunas')
    assert.equal(iuran.jumlah, 50000)
  })

  test('approve pending iuran sets status to lunas', async ({ assert }) => {
    const admin = await User.create({
      email: 'admin@test.com',
      password_hash: 'password',
      nama: 'Admin',
      role: 'admin',
      status: 'active',
    })

    const warga = await User.create({
      email: 'warga-b@test.com',
      password_hash: 'password',
      nama: 'Warga',
      role: 'warga',
      status: 'active',
    })

    const kategori = await KategoriIuran.create({
      nama: 'Iuran RT',
      jumlah_default: 30000,
      periode: 'bulanan',
      aktif: true,
    })

    const iuran = await warga.related('iuran').create({
      kategori_id: kategori.id,
      jumlah: 30000,
      bulan: 7,
      tahun: 2025,
      status: 'pending',
      metode_pembayaran: 'transfer',
    })

    // Simulate approve logic
    iuran.status = 'lunas'
    iuran.verified_by = admin.id
    iuran.verified_at = DateTime.now()
    await iuran.save()

    await iuran.refresh()
    assert.equal(iuran.status, 'lunas')
    assert.equal(iuran.verified_by, admin.id)
    assert.isNotNull(iuran.verified_at)
  })

  test('reject pending iuran sets rejection fields', async ({ assert }) => {
    const warga = await User.create({
      email: 'warga-c@test.com',
      password_hash: 'password',
      nama: 'Warga',
      role: 'warga',
      status: 'active',
    })

    const kategori = await KategoriIuran.create({
      nama: 'Iuran RT',
      jumlah_default: 30000,
      periode: 'bulanan',
      aktif: true,
    })

    const iuran = await warga.related('iuran').create({
      kategori_id: kategori.id,
      jumlah: 30000,
      bulan: 7,
      tahun: 2025,
      status: 'pending',
      metode_pembayaran: 'transfer',
    })

    // Simulate reject logic
    iuran.status = 'belum_lunas'
    iuran.rejection_reason = 'Bukti tidak jelas'
    await iuran.save()

    await iuran.refresh()
    assert.equal(iuran.status, 'belum_lunas')
    assert.equal(iuran.rejection_reason, 'Bukti tidak jelas')
  })
})