import { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Laporan from '#models/laporan'

export default class LaporanController {
  /**
   * GET /api/laporan?status=&page=&limit=
   * Admin: semua laporan, Warga: laporan sendiri
   */
  async index({ request, auth, response }: HttpContext) {
    try {
      if (!auth.user) {
        return response.status(401).json({ success: false, message: 'Belum login' })
      }

      const statusFilter = request.input('status', '')
      const page = Number(request.input('page', 1))
      const limit = Number(request.input('limit', 50))
      const isAdmin = auth.user.role === 'admin' || auth.user.role === 'bendahara'

      let query = Laporan.query()
        .preload('user', (q) => q.select('id', 'nama', 'email'))
        .orderBy('created_at', 'desc')

      if (!isAdmin) {
        query = query.where('user_id', auth.user.id)
      }

      if (statusFilter) {
        query = query.where('status', statusFilter)
      }

      const result = await query.paginate(page, limit)

      const mapped = result.all().map((l) => ({
        id: l.id,
        judul: l.judul,
        isi: l.isi,
        foto: l.foto,
        status: l.status,
        tanggapan: l.tanggapan,
        ditanggapi_oleh: l.ditanggapi_oleh,
        ditanggapi_at: l.ditanggapi_at?.toISO() || null,
        created_at: l.created_at.toISO(),
        user: l.user ? { id: l.user.id, nama: l.user.nama, email: l.user.email } : null,
      }))

      return response.json({
        success: true,
        data: mapped,
        pagination: {
          page: result.currentPage,
          limit: result.perPage,
          total: result.total,
          totalPages: result.lastPage,
        },
      })
    } catch (error) {
      console.error('List laporan error:', error)
      return response.status(500).json({ success: false, message: 'Terjadi kesalahan' })
    }
  }

  /**
   * POST /api/laporan
   */
  async store({ request, auth, response }: HttpContext) {
    try {
      if (!auth.user) {
        return response.status(401).json({ success: false, message: 'Belum login' })
      }

      const isAdmin = auth.user.role === 'admin' || auth.user.role === 'bendahara'
      const { judul, isi, foto, user_id } = request.only(['judul', 'isi', 'foto', 'user_id'])

      if (!judul || !isi) {
        return response.status(400).json({
          success: false,
          message: 'Judul dan isi laporan wajib diisi',
        })
      }

      if (isAdmin && !user_id) {
        return response.status(400).json({
          success: false,
          message: 'Pilih warga yang membuat laporan',
        })
      }

      const laporan = await Laporan.create({
        user_id: isAdmin ? user_id : auth.user.id,
        judul,
        isi,
        foto: foto || null,
        status: 'diproses',
      })

      return response.status(201).json({
        success: true,
        message: 'Laporan berhasil dikirim',
        data: laporan,
      })
    } catch (error) {
      console.error('Create laporan error:', error)
      return response.status(500).json({ success: false, message: 'Terjadi kesalahan' })
    }
  }

  /**
   * GET /api/laporan/:id
   */
  async show({ params, auth, response }: HttpContext) {
    try {
      if (!auth.user) {
        return response.status(401).json({ success: false, message: 'Belum login' })
      }

      const laporan = await Laporan.query()
        .where('id', params.id)
        .preload('user', (q) => q.select('id', 'nama', 'email'))
        .preload('penanggap', (q) => q.select('id', 'nama'))
        .first()

      if (!laporan) {
        return response.status(404).json({ success: false, message: 'Laporan tidak ditemukan' })
      }

      const isAdmin = auth.user.role === 'admin' || auth.user.role === 'bendahara'
      if (!isAdmin && laporan.user_id !== auth.user.id) {
        return response.status(403).json({ success: false, message: 'Akses ditolak' })
      }

      return response.json({
        success: true,
        data: {
          id: laporan.id,
          judul: laporan.judul,
          isi: laporan.isi,
          foto: laporan.foto,
          status: laporan.status,
          tanggapan: laporan.tanggapan,
          ditanggapi_at: laporan.ditanggapi_at?.toISO() || null,
          created_at: laporan.created_at.toISO(),
          user: laporan.user ? { id: laporan.user.id, nama: laporan.user.nama, email: laporan.user.email } : null,
          penanggap: laporan.penanggap ? { id: laporan.penanggap.id, nama: laporan.penanggap.nama } : null,
        },
      })
    } catch (error) {
      console.error('Detail laporan error:', error)
      return response.status(500).json({ success: false, message: 'Terjadi kesalahan' })
    }
  }

  /**
   * PATCH /api/laporan/:id
   * Warga bisa edit selama status masih 'diproses'
   */
  async update({ params, request, auth, response }: HttpContext) {
    try {
      if (!auth.user) {
        return response.status(401).json({ success: false, message: 'Belum login' })
      }

      const laporan = await Laporan.findOrFail(params.id)

      if (laporan.user_id !== auth.user.id) {
        return response.status(403).json({ success: false, message: 'Akses ditolak' })
      }

      if (laporan.status !== 'diproses') {
        return response.status(400).json({
          success: false,
          message: 'Laporan sudah ditanggapi, tidak bisa diedit',
        })
      }

      const { judul, isi, foto } = request.only(['judul', 'isi', 'foto'])
      if (judul !== undefined) laporan.judul = judul
      if (isi !== undefined) laporan.isi = isi
      if (foto !== undefined) laporan.foto = foto

      await laporan.save()

      return response.json({
        success: true,
        message: 'Laporan berhasil diupdate',
        data: laporan,
      })
    } catch (error) {
      console.error('Update laporan error:', error)
      return response.status(500).json({ success: false, message: 'Terjadi kesalahan' })
    }
  }

  /**
   * POST /api/laporan/:id/tanggapi
   * Admin/bendahara memberi tanggapan dan mengubah status
   */
  async tanggapi({ params, request, auth, response }: HttpContext) {
    try {
      if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
        return response.status(403).json({ success: false, message: 'Akses ditolak' })
      }

      const laporan = await Laporan.findOrFail(params.id)
      const { status, tanggapan } = request.only(['status', 'tanggapan'])

      if (status && !['diproses', 'selesai', 'ditolak'].includes(status)) {
        return response.status(400).json({ success: false, message: 'Status tidak valid' })
      }

      if (status) laporan.status = status
      if (tanggapan !== undefined) laporan.tanggapan = tanggapan
      laporan.ditanggapi_oleh = auth.user.id
      laporan.ditanggapi_at = DateTime.now()

      await laporan.save()

      return response.json({
        success: true,
        message: 'Tanggapan berhasil dikirim',
        data: laporan,
      })
    } catch (error) {
      console.error('Tanggapi laporan error:', error)
      return response.status(500).json({ success: false, message: 'Terjadi kesalahan' })
    }
  }

  /**
   * DELETE /api/laporan/:id
   * Admin/bendahara bisa hapus
   */
  async destroy({ params, auth, response }: HttpContext) {
    try {
      if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
        return response.status(403).json({ success: false, message: 'Akses ditolak' })
      }

      const laporan = await Laporan.findOrFail(params.id)
      await laporan.delete()

      return response.json({
        success: true,
        message: 'Laporan berhasil dihapus',
      })
    } catch (error) {
      console.error('Delete laporan error:', error)
      return response.status(500).json({ success: false, message: 'Terjadi kesalahan' })
    }
  }
}
