import { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import IuranSampah from '#models/iuran_sampah'
import GoogleSheetsService from '#services/google_sheets'

export default class SampahController {
  /**
   * GET /api/admin/sampah?bulan=6&tahun=2026&search=&status=&page=1&limit=50
   */
  async index({ request, auth, response }: HttpContext) {
    try {
      if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
        return response.status(403).json({ success: false, message: 'Akses ditolak' })
      }

      const now = DateTime.now()
      const bulan = Number(request.input('bulan', now.month))
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

      const allSampah = await IuranSampah.query()
        .where('bulan', bulan)
        .where('tahun', tahun)

      const sampahMap = new Map(allSampah.map((s) => [s.warga_id, s]))

      let merged = allWarga.map((w: any) => {
        const payment = sampahMap.get(w.warga_id)
        return {
          warga_id: w.warga_id,
          nama: w.nama,
          nik: w.nik,
          no_rumah: w.no_rumah,
          pembayaran: payment
            ? {
                id: payment.id,
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
        lunas: allSampah.filter((s) => s.status === 'lunas').length,
        pending: allSampah.filter((s) => s.status === 'pending').length,
        belumLunas: allWarga.length - allSampah.filter((s) => s.status === 'lunas' || s.status === 'pending').length,
        totalAmount: allSampah.reduce((sum, s) => sum + Number(s.jumlah), 0),
        collectedAmount: allSampah.filter((s) => s.status === 'lunas').reduce((sum, s) => sum + Number(s.jumlah), 0),
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
      console.error('List sampah error:', error)
      return response.status(500).json({
        success: false,
        message: 'Terjadi kesalahan',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * POST /api/admin/sampah
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

      const existing = await IuranSampah.query()
        .where('warga_id', warga_id)
        .where('bulan', bulan)
        .where('tahun', tahun)
        .first()

      if (existing) {
        return response.status(409).json({
          success: false,
          message: `Pembayaran ${bulan}/${tahun} untuk warga ini sudah ada`,
        })
      }

      const bayarStatus = status || 'lunas'
      const paidAt = bayarStatus === 'lunas' ? DateTime.now() : null

      const pembayaran = await IuranSampah.create({
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
        await GoogleSheetsService.appendSampah({
          id: pembayaran.id,
          warga: user?.nama || 'Unknown',
          bulan,
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
        message: 'Pembayaran berhasil dicatat',
        data: pembayaran,
      })
    } catch (error) {
      console.error('Create sampah error:', error)
      return response.status(500).json({
        success: false,
        message: 'Terjadi kesalahan',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * PATCH /api/admin/sampah/:id
   */
  async update({ params, request, auth, response }: HttpContext) {
    try {
      if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
        return response.status(403).json({ success: false, message: 'Akses ditolak' })
      }

      const pembayaran = await IuranSampah.findOrFail(params.id)
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
        message: 'Pembayaran berhasil diupdate',
        data: pembayaran,
      })
    } catch (error) {
      console.error('Update sampah error:', error)
      return response.status(500).json({
        success: false,
        message: 'Terjadi kesalahan',
      })
    }
  }

  /**
   * DELETE /api/admin/sampah/:id
   */
  async destroy({ params, auth, response }: HttpContext) {
    try {
      if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
        return response.status(403).json({ success: false, message: 'Akses ditolak' })
      }

      const pembayaran = await IuranSampah.findOrFail(params.id)
      await pembayaran.delete()

      return response.json({
        success: true,
        message: 'Pembayaran berhasil dihapus',
      })
    } catch (error) {
      console.error('Delete sampah error:', error)
      return response.status(500).json({
        success: false,
        message: 'Terjadi kesalahan',
      })
    }
  }
}
