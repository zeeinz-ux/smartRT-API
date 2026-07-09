import { HttpContext } from '@adonisjs/core/http'
import KategoriIuran from '#models/kategori_iuran'

export default class KategoriIuranController {
  async index({ auth, response }: HttpContext) {
    if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
      return response.status(403).json({ success: false, message: 'Akses ditolak' })
    }

    const data = await KategoriIuran.query().orderBy('nama', 'asc')
    return response.json({ success: true, data })
  }

  async store({ request, auth, response }: HttpContext) {
    if (!auth.user || auth.user.role !== 'admin') {
      return response.status(403).json({ success: false, message: 'Akses ditolak' })
    }

    const { nama, deskripsi, jumlah_default, periode } = request.only([
      'nama', 'deskripsi', 'jumlah_default', 'periode',
    ])

    if (!nama) {
      return response.status(400).json({ success: false, message: 'Nama kategori wajib diisi' })
    }

    const kategori = await KategoriIuran.create({
      nama,
      deskripsi: deskripsi || null,
      jumlah_default: Number(jumlah_default) || 0,
      periode: periode || 'insidental',
      aktif: true,
    })

    return response.status(201).json({ success: true, message: 'Kategori iuran berhasil dibuat', data: kategori })
  }

  async update({ params, request, auth, response }: HttpContext) {
    if (!auth.user || auth.user.role !== 'admin') {
      return response.status(403).json({ success: false, message: 'Akses ditolak' })
    }

    const kategori = await KategoriIuran.findOrFail(params.id)
    const { nama, deskripsi, jumlah_default, periode, aktif } = request.only([
      'nama', 'deskripsi', 'jumlah_default', 'periode', 'aktif',
    ])

    if (nama !== undefined) kategori.nama = nama
    if (deskripsi !== undefined) kategori.deskripsi = deskripsi
    if (jumlah_default !== undefined) kategori.jumlah_default = Number(jumlah_default)
    if (periode !== undefined) kategori.periode = periode
    if (aktif !== undefined) kategori.aktif = aktif

    await kategori.save()
    return response.json({ success: true, message: 'Kategori iuran berhasil diupdate', data: kategori })
  }

  async destroy({ params, auth, response }: HttpContext) {
    if (!auth.user || auth.user.role !== 'admin') {
      return response.status(403).json({ success: false, message: 'Akses ditolak' })
    }

    const kategori = await KategoriIuran.findOrFail(params.id)

    const activeIuran = await kategori.related('iurans').query().first()
    if (activeIuran) {
      return response.status(409).json({
        success: false,
        message: 'Kategori ini masih memiliki data iuran, tidak bisa dihapus. Nonaktifkan saja.',
      })
    }

    await kategori.delete()
    return response.json({ success: true, message: 'Kategori iuran berhasil dihapus' })
  }
}