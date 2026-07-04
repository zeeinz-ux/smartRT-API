import { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import IuranQurban from '#models/iuran_qurban'
import GoogleSheetsService from '#services/google_sheets'

export default class QurbanController {
  /**
   * GET /api/admin/qurban?bulan=1&tahun=2026&search=&status=&page=1&limit=50
   */
  async index({ request, auth, response }: HttpContext) {
    try {
      if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
        return response.status(403).json({ success: false, message: 'Akses ditolak' })
      }

      const now = DateTime.now()
      const bulan = Number(request.input('bulan', 0))
      const tahun = Number(request.input('tahun', now.year))
      const search = request.input('search', '')
      const statusFilter = request.input('status', '')
      const page = Number(request.input('page', 1))
      const limit = Number(request.input('limit', 50))

      const allWarga = await db.from('users')
        .leftJoin('warga_profiles', 'warga_profiles.user_id', 'users.id')
        .select(
          'users.id as warga_id',
          'users.nama',
          'users.email',
          'warga_profiles.nik',
          'warga_profiles.no_rumah',
        )
        .where('users.role', 'warga')
        .where((builder) => {
          if (search) {
            builder
              .whereILike('users.nama', `%${search}%`)
              .orWhereILike('users.email', `%${search}%`)
              .orWhereILike('warga_profiles.nik', `%${search}%`)
          }
        })
        .orderBy('users.nama', 'asc')

      let qurbanQuery = IuranQurban.query().where('tahun', tahun)
      if (bulan >= 1 && bulan <= 12) {
        qurbanQuery = qurbanQuery.where('bulan', bulan)
      }
      const allQurban = await qurbanQuery

      const qurbanMap = new Map(allQurban.map((q) => [q.warga_id, q]))

      let merged = allWarga.map((w: any) => {
        const payment = qurbanMap.get(w.warga_id)
        return {
          warga_id: w.warga_id,
          nama: w.nama,
          nik: w.nik,
          no_rumah: w.no_rumah,
          pembayaran: payment
            ? {
                id: payment.id,
                bulan: payment.bulan,
                jumlah: Number(payment.jumlah),
                status: payment.status,
                metode_pembayaran: payment.metode_pembayaran,
                paid_at: payment.paid_at,
                keterangan: payment.keterangan,
              }
            : null,
        }
      })

      if (statusFilter === 'lunas') {
        merged = merged.filter((m) => m.pembayaran?.status === 'lunas')
      } else if (statusFilter === 'belum_lunas') {
        merged = merged.filter((m) => !m.pembayaran)
      } else if (statusFilter === 'pending') {
        merged = merged.filter((m) => m.pembayaran?.status === 'pending')
      }

      const paginated = merged.slice((page - 1) * limit, page * limit)

      const stats = {
        total: allWarga.length,
        lunas: allQurban.filter((q) => q.status === 'lunas').length,
        pending: allQurban.filter((q) => q.status === 'pending').length,
        belumLunas: allWarga.length - allQurban.filter((q) => q.status === 'lunas' || q.status === 'pending').length,
        totalAmount: allQurban.reduce((sum, q) => sum + Number(q.jumlah), 0),
        collectedAmount: allQurban.filter((q) => q.status === 'lunas').reduce((sum, q) => sum + Number(q.jumlah), 0),
      }

      return response.json({
        success: true,
        data: paginated,
        pagination: {
          page,
          limit,
          total: merged.length,
          totalPages: Math.ceil(merged.length / limit),
        },
        stats,
      })
    } catch (error) {
      console.error('List qurban error:', error)
      return response.status(500).json({
        success: false,
        message: 'Terjadi kesalahan',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * POST /api/admin/qurban
   */
  async store({ request, auth, response }: HttpContext) {
    try {
      if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
        return response.status(403).json({ success: false, message: 'Akses ditolak' })
      }

      const { warga_id, bulan, tahun, jumlah, status, metode_pembayaran, keterangan } = request.only([
        'warga_id', 'bulan', 'tahun', 'jumlah', 'status', 'metode_pembayaran', 'keterangan',
      ])

      if (!warga_id || !bulan || !tahun || jumlah === undefined) {
        return response.status(400).json({
          success: false,
          message: 'warga_id, bulan, tahun, dan jumlah wajib diisi',
        })
      }

      const existing = await IuranQurban.query()
        .where('warga_id', warga_id)
        .where('bulan', bulan)
        .where('tahun', tahun)
        .first()

      if (existing) {
        return response.status(409).json({
          success: false,
          message: `Pembayaran bulan ${bulan}/${tahun} untuk warga ini sudah ada`,
        })
      }

      const bayarStatus = status || 'lunas'
      const paidAt = bayarStatus === 'lunas' ? DateTime.now() : null

      const pembayaran = await IuranQurban.create({
        warga_id,
        bulan,
        tahun,
        jumlah: Number(jumlah),
        status: bayarStatus,
        metode_pembayaran: metode_pembayaran || null,
        paid_at: paidAt,
        keterangan: keterangan || null,
      })

      try {
        const user = await db.from('users').where('id', warga_id).first()
        await GoogleSheetsService.appendQurban({
          id: pembayaran.id,
          warga: user?.nama || 'Unknown',
          tahun,
          jumlah: Number(jumlah),
          status: bayarStatus,
          metode: metode_pembayaran || null,
          paid_at: paidAt?.toISO() || null,
        })
      } catch (sheetError) {
        console.error('Google Sheets sync error (non-critical):', sheetError)
      }

      return response.status(201).json({
        success: true,
        message: 'Pembayaran qurban berhasil dicatat',
        data: pembayaran,
      })
    } catch (error) {
      console.error('Create qurban error:', error)
      return response.status(500).json({
        success: false,
        message: 'Terjadi kesalahan',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * PATCH /api/admin/qurban/:id
   */
  async update({ params, request, auth, response }: HttpContext) {
    try {
      if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
        return response.status(403).json({ success: false, message: 'Akses ditolak' })
      }

      const pembayaran = await IuranQurban.findOrFail(params.id)
      const { jumlah, status, metode_pembayaran, keterangan } = request.only([
        'jumlah', 'status', 'metode_pembayaran', 'keterangan',
      ])

      if (status !== undefined) pembayaran.status = status
      if (jumlah !== undefined) pembayaran.jumlah = Number(jumlah)
      if (metode_pembayaran !== undefined) pembayaran.metode_pembayaran = metode_pembayaran
      if (keterangan !== undefined) pembayaran.keterangan = keterangan

      if (status === 'lunas' && !pembayaran.paid_at) {
        pembayaran.paid_at = DateTime.now()
      }

      await pembayaran.save()

      return response.json({
        success: true,
        message: 'Pembayaran qurban berhasil diupdate',
        data: pembayaran,
      })
    } catch (error) {
      console.error('Update qurban error:', error)
      return response.status(500).json({
        success: false,
        message: 'Terjadi kesalahan',
      })
    }
  }

  /**
   * DELETE /api/admin/qurban/:id
   */
  async destroy({ params, auth, response }: HttpContext) {
    try {
      if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
        return response.status(403).json({ success: false, message: 'Akses ditolak' })
      }

      const pembayaran = await IuranQurban.findOrFail(params.id)
      await pembayaran.delete()

      return response.json({
        success: true,
        message: 'Pembayaran qurban berhasil dihapus',
      })
    } catch (error) {
      console.error('Delete qurban error:', error)
      return response.status(500).json({
        success: false,
        message: 'Terjadi kesalahan',
      })
    }
  }
}
