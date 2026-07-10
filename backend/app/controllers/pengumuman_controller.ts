import { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Pengumuman from '#models/pengumuman'
import { storePengumumanValidator, updatePengumumanValidator } from '#validators/pengumuman_validator'

export default class PengumumanController {
  async index({ request, auth, response }: HttpContext) {
    try {
      if (!auth.user) {
        return response.status(401).json({ success: false, message: 'Belum login' })
      }

      const page = Number(request.input('page', 1))
      const limit = Number(request.input('limit', 50))
      const isAdmin = auth.user.role === 'admin' || auth.user.role === 'bendahara'
      const now = DateTime.now()

      let query = Pengumuman.query()
        .preload('user', (q) => q.select('id', 'nama'))
        .orderBy('created_at', 'desc')

      if (!isAdmin) {
        query = query.whereNotNull('published_at').where('published_at', '<=', now.toSQL()!)
      }

      const result = await query.paginate(page, limit)

      function getStatus(publishedAt: DateTime | null) {
        if (!publishedAt) return 'draft'
        return publishedAt <= now ? 'published' : 'scheduled'
      }

      const mapped = result.all().map((p) => ({
        id: p.id,
        judul: p.judul,
        isi: p.isi,
        file: p.file,
        status: getStatus(p.published_at),
        published_at: p.published_at?.toISO() || null,
        created_at: p.created_at.toISO(),
        updated_at: p.updated_at.toISO(),
        user: p.user ? { id: p.user.id, nama: p.user.nama } : null,
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
      console.error('List pengumuman error:', error)
      return response.status(500).json({ success: false, message: 'Terjadi kesalahan' })
    }
  }

  async store({ request, auth, response }: HttpContext) {
    try {
      if (!auth.user) {
        return response.status(401).json({ success: false, message: 'Belum login' })
      }

      const { judul, isi, file, scheduled_at } = await storePengumumanValidator.validate(request.only(['judul', 'isi', 'file', 'scheduled_at']))

      let published_at: DateTime | null = null
      let msg = 'Pengumuman berhasil disimpan sebagai draft'

      if (scheduled_at) {
        published_at = scheduled_at
        msg = scheduled_at <= DateTime.now()
          ? 'Pengumuman berhasil dipublikasikan'
          : 'Pengumuman akan dipublikasikan sesuai jadwal'
      }

      const pengumuman = await Pengumuman.create({
        user_id: auth.user.id,
        judul,
        isi,
        file: file || null,
        published_at,
      })

      return response.status(201).json({ success: true, message: msg, data: pengumuman })
    } catch (error) {
      console.error('Create pengumuman error:', error)
      return response.status(500).json({ success: false, message: 'Terjadi kesalahan' })
    }
  }

  async show({ params, response }: HttpContext) {
    try {
      const pengumuman = await Pengumuman.query()
        .where('id', params.id)
        .preload('user', (q) => q.select('id', 'nama'))
        .first()

      if (!pengumuman) {
        return response.status(404).json({ success: false, message: 'Pengumuman tidak ditemukan' })
      }

      const now = DateTime.now()

      return response.json({
        success: true,
        data: {
          id: pengumuman.id,
          judul: pengumuman.judul,
          isi: pengumuman.isi,
          file: pengumuman.file,
          status: !pengumuman.published_at ? 'draft' : pengumuman.published_at <= now ? 'published' : 'scheduled',
          published_at: pengumuman.published_at?.toISO() || null,
          created_at: pengumuman.created_at.toISO(),
          updated_at: pengumuman.updated_at.toISO(),
          user: pengumuman.user ? { id: pengumuman.user.id, nama: pengumuman.user.nama } : null,
        },
      })
    } catch (error) {
      console.error('Detail pengumuman error:', error)
      return response.status(500).json({ success: false, message: 'Terjadi kesalahan' })
    }
  }

  async update({ params, request, auth, response }: HttpContext) {
    try {
      if (!auth.user) {
        return response.status(401).json({ success: false, message: 'Belum login' })
      }

      const pengumuman = await Pengumuman.findOrFail(params.id)
      const { judul, isi, file, scheduled_at } = await updatePengumumanValidator.validate(request.only(['judul', 'isi', 'file', 'scheduled_at']))

      if (judul !== undefined) pengumuman.judul = judul
      if (isi !== undefined) pengumuman.isi = isi
      if (file !== undefined) pengumuman.file = file

      if (scheduled_at !== undefined) {
        pengumuman.published_at = scheduled_at
      }

      await pengumuman.save()

      return response.json({
        success: true,
        message: 'Pengumuman berhasil diupdate',
        data: pengumuman,
      })
    } catch (error) {
      console.error('Update pengumuman error:', error)
      return response.status(500).json({ success: false, message: 'Terjadi kesalahan' })
    }
  }

  async destroy({ params, auth, response }: HttpContext) {
    try {
      if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
        return response.status(403).json({ success: false, message: 'Akses ditolak' })
      }

      const pengumuman = await Pengumuman.findOrFail(params.id)
      await pengumuman.delete()

      return response.json({ success: true, message: 'Pengumuman berhasil dihapus' })
    } catch (error) {
      console.error('Delete pengumuman error:', error)
      return response.status(500).json({ success: false, message: 'Terjadi kesalahan' })
    }
  }
}
