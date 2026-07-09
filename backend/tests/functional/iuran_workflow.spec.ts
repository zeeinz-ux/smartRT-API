import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import KategoriIuran from '#models/kategori_iuran'
import Iuran from '#models/iuran'

test.group('Iuran Workflow - Functional', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  let warga: User
  let admin: User
  let kategori: KategoriIuran

  group.each.setup(async () => {
    warga = await User.create({
      email: 'warga@test.com',
      password_hash: 'password',
      nama: 'Warga Test',
      role: 'warga',
      status: 'active',
    })

    admin = await User.create({
      email: 'admin@test.com',
      password_hash: 'password',
      nama: 'Admin Test',
      role: 'admin',
      status: 'active',
    })

    kategori = await KategoriIuran.create({
      nama: 'Test Kategori',
      jumlah_default: 50000,
      periode: 'bulanan',
      aktif: true,
    })
  })

  test('warga submits payment → admin approves', async ({ client, assert }) => {
    const iuran = await Iuran.create({
      warga_id: warga.id,
      kategori_id: kategori.id,
      jumlah: 50000,
      bulan: 7,
      tahun: 2026,
      status: 'belum_lunas',
    })

    const bayarRes = await client
      .patch(`/api/warga/tagihan/${iuran.id}/bayar`)
      .loginAs(warga)
      .json({ metode_pembayaran: 'tunai' })

    bayarRes.assertStatus(200)
    bayarRes.assertBodyContains({ success: true })
    assert.equal(bayarRes.body().data.status, 'pending')

    const approveRes = await client
      .post(`/api/admin/iuran/${iuran.id}/approve`)
      .loginAs(admin)

    approveRes.assertStatus(200)

    approveRes.assertStatus(200)
    approveRes.assertBodyContains({ success: true })
    assert.equal(approveRes.body().data.status, 'lunas')

    const updated = await Iuran.find(iuran.id)
    assert.equal(updated!.status, 'lunas')
    assert.isNotNull(updated!.verified_at)
    assert.equal(updated!.verified_by, admin.id)
    assert.isNotNull(updated!.paid_at)
  })

  test('warga submits payment → admin rejects', async ({ client, assert }) => {
    const iuran = await Iuran.create({
      warga_id: warga.id,
      kategori_id: kategori.id,
      jumlah: 50000,
      bulan: 7,
      tahun: 2026,
      status: 'belum_lunas',
    })

    const bayarRes = await client
      .patch(`/api/warga/tagihan/${iuran.id}/bayar`)
      .loginAs(warga)
      .json({ metode_pembayaran: 'tunai' })

    bayarRes.assertStatus(200)
    assert.equal(bayarRes.body().data.status, 'pending')

    const rejectRes = await client
      .post(`/api/admin/iuran/${iuran.id}/reject`)
      .loginAs(admin)
      .json({ reason: 'Bukti tidak jelas' })

    rejectRes.assertStatus(200)
    rejectRes.assertBodyContains({ success: true })
    assert.equal(rejectRes.body().data.status, 'belum_lunas')
    assert.equal(rejectRes.body().data.rejection_reason, 'Bukti tidak jelas')

    const updated = await Iuran.find(iuran.id)
    assert.equal(updated!.status, 'belum_lunas')
    assert.equal(updated!.rejection_reason, 'Bukti tidak jelas')
    assert.isNotNull(updated!.verified_at)
    assert.equal(updated!.verified_by, admin.id)
  })

  test('unauthenticated request returns 404', async ({ client }) => {
    const res = await client.get('/api/admin/iuran/verifikasi')
    res.assertStatus(404)
  })

  test('warga cannot access admin verify endpoint', async ({ client }) => {
    const res = await client
      .get('/api/admin/iuran/verifikasi')
      .loginAs(warga)

    res.assertStatus(403)
  })

  test('approve non-pending iuran returns 400', async ({ client }) => {
    const iuran = await Iuran.create({
      warga_id: warga.id,
      kategori_id: kategori.id,
      jumlah: 50000,
      bulan: 7,
      tahun: 2026,
      status: 'lunas',
    })

    const res = await client
      .post(`/api/admin/iuran/${iuran.id}/approve`)
      .loginAs(admin)

    res.assertStatus(400)
    res.assertBodyContains({ success: false })
  })
})

test.group('Iuran Generate - Functional', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('admin generates monthly tagihan for all warga', async ({ client, assert }) => {
    const admin = await User.create({
      email: 'admin-gen@test.com',
      password_hash: 'password',
      nama: 'Admin',
      role: 'admin',
      status: 'active',
    })

    const warga1 = await User.create({
      email: 'warga1@test.com',
      password_hash: 'password',
      nama: 'Warga 1',
      role: 'warga',
      status: 'active',
    })

    const warga2 = await User.create({
      email: 'warga2@test.com',
      password_hash: 'password',
      nama: 'Warga 2',
      role: 'warga',
      status: 'active',
    })

    const kategori = await KategoriIuran.create({
      nama: 'Iuran Wajib',
      jumlah_default: 50000,
      periode: 'bulanan',
      aktif: true,
    })

    const res = await client
      .post('/api/admin/iuran/generate')
      .loginAs(admin)
      .json({ bulan: 8, tahun: 2026 })

    res.assertStatus(200)
    res.assertBodyContains({ success: true })
    assert.equal(res.body().data.created, 2)
    assert.equal(res.body().data.skipped, 0)

    const count = await Iuran.query()
      .where('bulan', 8)
      .where('tahun', 2026)
      .where('kategori_id', kategori.id)
      .where('status', 'belum_lunas')

    assert.lengthOf(count, 2)
  })

  test('generate skips existing iuran records', async ({ client, assert }) => {
    const admin = await User.create({
      email: 'admin-gen2@test.com',
      password_hash: 'password',
      nama: 'Admin',
      role: 'admin',
      status: 'active',
    })

    const warga = await User.create({
      email: 'warga-gen@test.com',
      password_hash: 'password',
      nama: 'Warga',
      role: 'warga',
      status: 'active',
    })

    const kategori = await KategoriIuran.create({
      nama: 'Iuran Wajib',
      jumlah_default: 50000,
      periode: 'bulanan',
      aktif: true,
    })

    await Iuran.create({
      warga_id: warga.id,
      kategori_id: kategori.id,
      jumlah: 50000,
      bulan: 8,
      tahun: 2026,
      status: 'belum_lunas',
    })

    const res = await client
      .post('/api/admin/iuran/generate')
      .loginAs(admin)
      .json({ bulan: 8, tahun: 2026 })

    res.assertStatus(200)
    assert.equal(res.body().data.created, 0)
    assert.equal(res.body().data.skipped, 1)
  })

  test('generate fails without active kategori', async ({ client, assert }) => {
    const admin = await User.create({
      email: 'admin-gen3@test.com',
      password_hash: 'password',
      nama: 'Admin',
      role: 'admin',
      status: 'active',
    })

    const res = await client
      .post('/api/admin/iuran/generate')
      .loginAs(admin)
      .json({ bulan: 8, tahun: 2026 })

    res.assertStatus(400)
    res.assertBodyContains({ success: false })
  })
})
