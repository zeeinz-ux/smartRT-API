import { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import { v4 as uuid } from 'uuid'
import db from '@adonisjs/lucid/services/db'
import app from '@adonisjs/core/services/app'
import Iuran from '#models/iuran'
import Notifikasi from '#models/notifikasi'
import GoogleSheetsService from '#services/google_sheets'

export default class IuranController {
  /**
   * GET /api/admin/iuran?kategori_id=&bulan=&tahun=&search=&status=&page=1&limit=50
   */
  async index({ request, auth, response }: HttpContext) {
    try {
      if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
        return response.status(403).json({ success: false, message: 'Akses ditolak' })
      }

      const now = DateTime.now()
      const kategoriId = request.input('kategori_id', '')
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

      let iuranQuery = Iuran.query().where('tahun', tahun)
      let isBulanan = false
      if (kategoriId) {
        iuranQuery = iuranQuery.where('kategori_id', kategoriId)
        const kategori = await db.from('kategori_iurans').where('id', kategoriId).first()
        isBulanan = kategori?.periode === 'bulanan'
      }
      if (isBulanan || !kategoriId) {
        iuranQuery = iuranQuery.where('bulan', bulan)
      }

      const allIuran = await iuranQuery

      const iuranMap = new Map(allIuran.map((s) => [s.warga_id, s]))

      let merged = allWarga.map((w: any) => {
        const payment = iuranMap.get(w.warga_id)
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
        lunas: allIuran.filter((s) => s.status === 'lunas').length,
        pending: allIuran.filter((s) => s.status === 'pending').length,
        belumLunas: allWarga.length - allIuran.filter((s) => s.status === 'lunas' || s.status === 'pending').length,
        totalAmount: allIuran.reduce((sum, s) => sum + Number(s.jumlah), 0),
        collectedAmount: allIuran.filter((s) => s.status === 'lunas').reduce((sum, s) => sum + Number(s.jumlah), 0),
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
      console.error('List iuran error:', error)
      return response.status(500).json({
        success: false,
        message: 'Terjadi kesalahan',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * POST /api/admin/iuran
   */
  async store({ request, auth, response }: HttpContext) {
    try {
      if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
        return response.status(403).json({ success: false, message: 'Akses ditolak' })
      }

      const { warga_id, kategori_id, bulan, tahun, jumlah, status, metode_pembayaran, keterangan } = request.only([
        'warga_id', 'kategori_id', 'bulan', 'tahun', 'jumlah', 'status', 'metode_pembayaran', 'keterangan',
      ])

      if (!warga_id || !kategori_id || !tahun || jumlah === undefined) {
        return response.status(400).json({
          success: false,
          message: 'warga_id, kategori_id, tahun, dan jumlah wajib diisi',
        })
      }

      const existing = await Iuran.query()
        .where('warga_id', warga_id)
        .where('kategori_id', kategori_id)
        .where('bulan', bulan ?? null)
        .where('tahun', tahun)
        .first()

      if (existing) {
        return response.status(409).json({
          success: false,
          message: `Pembayaran untuk iuran ini sudah ada`,
        })
      }

      const bayarStatus = status || 'lunas'
      const paidAt = bayarStatus === 'lunas' ? DateTime.now() : null

      const pembayaran = await Iuran.create({
        warga_id,
        kategori_id,
        bulan: bulan ?? null,
        tahun,
        jumlah: Number(jumlah),
        status: bayarStatus,
        metode_pembayaran: metode_pembayaran || null,
        paid_at: paidAt,
        keterangan: keterangan || null,
      })

      try {
        const user = await db.from('users').where('id', warga_id).first()
        await GoogleSheetsService.appendIuran({
          id: pembayaran.id,
          warga: user?.nama || 'Unknown',
          kategori_id,
          bulan: bulan ?? null,
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
      console.error('Create iuran error:', error)
      return response.status(500).json({
        success: false,
        message: 'Terjadi kesalahan',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * PATCH /api/admin/iuran/:id
   */
  async update({ params, request, auth, response }: HttpContext) {
    try {
      if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
        return response.status(403).json({ success: false, message: 'Akses ditolak' })
      }

      const pembayaran = await Iuran.findOrFail(params.id)
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
      console.error('Update iuran error:', error)
      return response.status(500).json({
        success: false,
        message: 'Terjadi kesalahan',
      })
    }
  }

  /**
   * DELETE /api/admin/iuran/:id
   */
  async destroy({ params, auth, response }: HttpContext) {
    try {
      if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
        return response.status(403).json({ success: false, message: 'Akses ditolak' })
      }

      const pembayaran = await Iuran.findOrFail(params.id)
      await pembayaran.delete()

      return response.json({
        success: true,
        message: 'Pembayaran berhasil dihapus',
      })
    } catch (error) {
      console.error('Delete iuran error:', error)
      return response.status(500).json({
        success: false,
        message: 'Terjadi kesalahan',
      })
    }
  }

  /**
   * GET /api/warga/tagihan
   */
  async tagihanSaya({ auth, response }: HttpContext) {
    try {
      const user = auth.user!
      const statusFilter = (await import('@adonisjs/core/http')).HttpContext.prototype.request?.input?.('status') || ''

      let query = Iuran.query()
        .where('warga_id', user.id)
        .preload('kategori')
        .orderBy('tahun', 'desc')
        .orderBy('created_at', 'desc')

      if (statusFilter) {
        query = query.where('status', statusFilter)
      }

      const data = await query

      const tagihan = data.map((t) => ({
        id: t.id,
        kategori: t.kategori ? { id: t.kategori.id, nama: t.kategori.nama, periode: t.kategori.periode } : null,
        jumlah: Number(t.jumlah),
        bulan: t.bulan,
        tahun: t.tahun,
        status: t.status,
        metode_pembayaran: t.metode_pembayaran,
        paid_at: t.paid_at,
        keterangan: t.keterangan,
        bukti_pembayaran_url: t.bukti_pembayaran_url,
        created_at: t.created_at,
      }))

      const stats = {
        total: tagihan.length,
        lunas: tagihan.filter((t) => t.status === 'lunas').length,
        belumLunas: tagihan.filter((t) => t.status === 'belum_lunas').length,
        pending: tagihan.filter((t) => t.status === 'pending').length,
        totalTagihan: tagihan.reduce((sum, t) => sum + t.jumlah, 0),
        totalLunas: tagihan.filter((t) => t.status === 'lunas').reduce((sum, t) => sum + t.jumlah, 0),
      }

      return response.json({
        success: true,
        data: tagihan,
        stats,
      })
    } catch (error) {
      console.error('Tagihan saya error:', error)
      return response.status(500).json({
        success: false,
        message: 'Terjadi kesalahan',
      })
    }
  }

  /**
   * PATCH /api/warga/tagihan/:id/bayar
   */
  async wargaBayar({ params, request, auth, response }: HttpContext) {
    try {
      const user = auth.user!
      const { metode_pembayaran } = request.only(['metode_pembayaran'])

      if (!['tunai', 'transfer', 'qris'].includes(metode_pembayaran)) {
        return response.status(400).json({
          success: false,
          message: 'Metode pembayaran tidak valid. Pilih: tunai, transfer, atau qris',
        })
      }

      const iuran = await Iuran.query()
        .where('id', params.id)
        .where('warga_id', user.id)
        .first()

      if (!iuran) {
        return response.status(404).json({
          success: false,
          message: 'Tagihan tidak ditemukan',
        })
      }

      if (iuran.status !== 'belum_lunas') {
        return response.status(400).json({
          success: false,
          message: `Tagihan sudah ${iuran.status === 'lunas' ? 'lunas' : 'dalam proses pengajuan'}`,
        })
      }

      // Handle bukti pembayaran upload
      let buktiUrl: string | null = null
      if (metode_pembayaran !== 'tunai') {
        const file = request.file('bukti_pembayaran', {
          size: '5mb',
          extnames: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
        })

        if (!file) {
          return response.status(400).json({
            success: false,
            message: 'Bukti pembayaran wajib diupload untuk metode transfer/QRIS',
          })
        }

        if (!file.isValid) {
          return response.status(400).json({
            success: false,
            message: 'File bukti pembayaran tidak valid. Format: JPG/PNG/WEBP/PDF, max 5MB.',
            errors: file.errors,
          })
        }

        const fileName = `${uuid()}.${file.extname}`
        const folder = 'uploads/bukti-bayar'
        await file.move(app.publicPath(folder), { name: fileName })
        buktiUrl = `/${folder}/${fileName}`
      }

      iuran.status = 'pending'
      iuran.metode_pembayaran = metode_pembayaran
      iuran.bukti_pembayaran_url = buktiUrl
      await iuran.save()

      return response.json({
        success: true,
        message: 'Pembayaran berhasil diajukan, menunggu verifikasi admin',
        data: {
          id: iuran.id,
          status: iuran.status,
          metode_pembayaran: iuran.metode_pembayaran,
          bukti_pembayaran_url: iuran.bukti_pembayaran_url,
        },
      })
    } catch (error) {
      console.error('Warga bayar error:', error)
      return response.status(500).json({
        success: false,
        message: 'Terjadi kesalahan',
      })
    }
  }

  /**
   * POST /api/admin/iuran/generate
   * Generate tagihan massal untuk semua warga berdasarkan kategori iuran aktif
   */
  async generate({ request, auth, response }: HttpContext) {
    try {
      if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
        return response.status(403).json({ success: false, message: 'Akses ditolak' })
      }

      const bulan = Number(request.input('bulan'))
      const tahun = Number(request.input('tahun'))

      if (!bulan || !tahun || bulan < 1 || bulan > 12) {
        return response.status(400).json({
          success: false,
          message: 'Bulan (1-12) dan tahun wajib diisi',
        })
      }

      const kategoris = await db.from('kategori_iurans')
        .where('aktif', true)
        .where('periode', 'bulanan')
        .select('id', 'nama', 'jumlah_default')

      if (kategoris.length === 0) {
        return response.status(400).json({
          success: false,
          message: 'Tidak ada kategori iuran bulanan yang aktif',
        })
      }

      const allWarga = await db.from('users')
        .where('role', 'warga')
        .select('id')

      if (allWarga.length === 0) {
        return response.status(400).json({
          success: false,
          message: 'Tidak ada warga terdaftar',
        })
      }

      let created = 0
      let skipped = 0

      for (const warga of allWarga) {
        for (const kategori of kategoris) {
          const existing = await Iuran.query()
            .where('warga_id', warga.id)
            .where('kategori_id', kategori.id)
            .where('bulan', bulan)
            .where('tahun', tahun)
            .first()

          if (existing) {
            skipped++
            continue
          }

          await Iuran.create({
            warga_id: warga.id,
            kategori_id: kategori.id,
            bulan,
            tahun,
            jumlah: Number(kategori.jumlah_default),
            status: 'belum_lunas',
          })
          created++
        }
      }

      return response.json({
        success: true,
        message: `Berhasil membuat ${created} tagihan baru (${skipped} sudah ada)`,
        data: { created, skipped, bulan, tahun },
      })
    } catch (error) {
      console.error('Generate iuran error:', error)
      return response.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat generate tagihan',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * GET /api/admin/iuran/verifikasi
   * List iuran dengan status pending untuk diverifikasi
   */
  async pendingVerifikasi({ request, auth, response }: HttpContext) {
    try {
      if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
        return response.status(403).json({ success: false, message: 'Akses ditolak' })
      }

      const bulan = Number(request.input('bulan', 0))
      const tahun = Number(request.input('tahun', 0))

      let query = Iuran.query()
        .where('iurans.status', 'pending')
        .preload('warga', (q) => q.select('id', 'nama', 'no_hp'))
        .preload('kategori', (q) => q.select('id', 'nama', 'jumlah_default'))
        .preload('verifier', (q) => q.select('id', 'nama'))
        .orderBy('iurans.created_at', 'desc')

      if (bulan > 0) {
        query = query.where('iurans.bulan', bulan)
      }
      if (tahun > 0) {
        query = query.where('iurans.tahun', tahun)
      }

      const data = await query

      const stats = {
        total: data.length,
        totalAmount: data.reduce((sum, d) => sum + Number(d.jumlah), 0),
      }

      return response.json({
        success: true,
        data: data.map((d) => ({
          id: d.id,
          warga: d.warga ? { id: d.warga.id, nama: d.warga.nama, no_hp: d.warga.no_hp } : null,
          kategori: d.kategori ? { id: d.kategori.id, nama: d.kategori.nama } : null,
          jumlah: Number(d.jumlah),
          bulan: d.bulan,
          tahun: d.tahun,
          metode_pembayaran: d.metode_pembayaran,
          bukti_pembayaran_url: d.bukti_pembayaran_url,
          keterangan: d.keterangan,
          created_at: d.created_at,
        })),
        stats,
      })
    } catch (error) {
      console.error('List pending verifikasi error:', error)
      return response.status(500).json({
        success: false,
        message: 'Terjadi kesalahan',
      })
    }
  }

  /**
   * POST /api/admin/iuran/:id/approve
   */
  async approve({ params, auth, response }: HttpContext) {
    try {
      if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
        return response.status(403).json({ success: false, message: 'Akses ditolak' })
      }

      const iuran = await Iuran.findOrFail(params.id)

      if (iuran.status !== 'pending') {
        return response.status(400).json({
          success: false,
          message: `Tagihan tidak dalam status pending (saat ini: ${iuran.status})`,
        })
      }

      iuran.status = 'lunas'
      iuran.verified_at = DateTime.now()
      iuran.verified_by = auth.user.id
      iuran.paid_at = DateTime.now()
      await iuran.save()

      await Notifikasi.create({
        user_id: iuran.warga_id,
        type: 'info',
        title: 'Pembayaran Diverifikasi',
        message: `Pembayaran iuran sebesar Rp ${Number(iuran.jumlah).toLocaleString('id-ID')} telah diverifikasi dan dicatat sebagai lunas.`,
        data: { iuran_id: iuran.id, kategori_id: iuran.kategori_id, status: 'approved' },
      })

      try {
        const warga = await iuran.related('warga').query().select('nama').first()
        await GoogleSheetsService.appendIuran({
          id: iuran.id,
          warga: warga?.nama || 'Unknown',
          kategori_id: iuran.kategori_id,
          bulan: iuran.bulan ?? null,
          tahun: iuran.tahun,
          jumlah: Number(iuran.jumlah),
          status: 'lunas',
          metode: iuran.metode_pembayaran || null,
          paid_at: iuran.paid_at?.toISO() || null,
        })
      } catch (sheetError) {
        console.error('Google Sheets sync error (non-critical):', sheetError)
      }

      return response.json({
        success: true,
        message: 'Pembayaran berhasil diverifikasi',
        data: {
          id: iuran.id,
          status: iuran.status,
          verified_at: iuran.verified_at,
        },
      })
    } catch (error) {
      console.error('Approve iuran error:', error)
      return response.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat verifikasi',
      })
    }
  }

  /**
   * POST /api/admin/iuran/:id/reject
   */
  async reject({ params, request, auth, response }: HttpContext) {
    try {
      if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
        return response.status(403).json({ success: false, message: 'Akses ditolak' })
      }

      const { reason } = request.only(['reason'])
      const iuran = await Iuran.findOrFail(params.id)

      if (iuran.status !== 'pending') {
        return response.status(400).json({
          success: false,
          message: `Tagihan tidak dalam status pending (saat ini: ${iuran.status})`,
        })
      }

      iuran.status = 'belum_lunas'
      iuran.rejection_reason = reason || 'Bukti pembayaran tidak valid'
      iuran.verified_at = DateTime.now()
      iuran.verified_by = auth.user.id
      await iuran.save()

      await Notifikasi.create({
        user_id: iuran.warga_id,
        type: 'info',
        title: 'Pembayaran Ditolak',
        message: `Pembayaran iuran ditolak. Alasan: ${iuran.rejection_reason}. Silakan upload ulang bukti pembayaran.`,
        data: { iuran_id: iuran.id, kategori_id: iuran.kategori_id, status: 'rejected', reason: iuran.rejection_reason },
      })

      return response.json({
        success: true,
        message: 'Pembayaran ditolak',
        data: {
          id: iuran.id,
          status: iuran.status,
          rejection_reason: iuran.rejection_reason,
        },
      })
    } catch (error) {
      console.error('Reject iuran error:', error)
      return response.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat menolak pembayaran',
      })
    }
  }

  /**
   * GET /api/admin/iuran/monitoring
   * Monitoring status tagihan per warga untuk bulan/tahun tertentu
   */
  async monitoring({ request, auth, response }: HttpContext) {
    try {
      if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
        return response.status(403).json({ success: false, message: 'Akses ditolak' })
      }

      const search = request.input('search', '')
      const bulan = Number(request.input('bulan', DateTime.now().month))
      const tahun = Number(request.input('tahun', DateTime.now().year))

      const allWarga = await db.from('users')
        .leftJoin('warga_profiles', 'warga_profiles.user_id', 'users.id')
        .select(
          'users.id as warga_id',
          'users.nama',
          'users.no_hp',
          'warga_profiles.nik',
          'warga_profiles.no_rumah',
        )
        .where('users.role', 'warga')
        .where((builder) => {
          if (search) {
            builder
              .whereILike('users.nama', `%${search}%`)
              .orWhereILike('warga_profiles.nik', `%${search}%`)
              .orWhereILike('warga_profiles.no_rumah', `%${search}%`)
          }
        })
        .orderBy('users.nama', 'asc')

      const allIuran = await Iuran.query()
        .where('bulan', bulan)
        .where('tahun', tahun)

      const iuranMap = new Map<string, { status: string; jumlah: number; metode: string | null }>()
      for (const iuran of allIuran) {
        iuranMap.set(iuran.warga_id, {
          status: iuran.status,
          jumlah: Number(iuran.jumlah),
          metode: iuran.metode_pembayaran,
        })
      }

      const allWargaIbanIds = allWarga.map((w: any) => w.warga_id)
      const tunggakanRows = await db.from('iurans')
        .whereIn('status', ['belum_lunas', 'pending'])
        .whereIn('warga_id', allWargaIbanIds)
        .groupBy('warga_id')
        .select('warga_id')
        .sum('jumlah as total')
      const totalTunggakanMap = new Map<string, number>()
      for (const row of tunggakanRows as any[]) {
        totalTunggakanMap.set(row.warga_id, Number(row.total))
      }

      const merged = allWarga.map((w: any) => {
        const statusBulanIni = iuranMap.get(w.warga_id)
        const tunggakan = totalTunggakanMap.get(w.warga_id) || 0
        return {
          warga_id: w.warga_id,
          nama: w.nama,
          nik: w.nik || '-',
          no_rumah: w.no_rumah || '-',
          no_hp: w.no_hp || '-',
          status_sekarang: statusBulanIni?.status || 'belum_dibayar',
          jumlah_bulan_ini: statusBulanIni?.jumlah || 0,
          total_tunggakan: tunggakan,
        }
      })

      return response.json({
        success: true,
        data: merged,
        meta: {
          bulan,
          tahun,
          total: merged.length,
          lunas: merged.filter((m: any) => m.status_sekarang === 'lunas').length,
          pending: merged.filter((m: any) => m.status_sekarang === 'pending').length,
          belumLunas: merged.filter((m: any) => m.status_sekarang === 'belum_lunas' || m.status_sekarang === 'belum_dibayar').length,
        },
      })
    } catch (error) {
      console.error('Monitoring iuran error:', error)
      return response.status(500).json({
        success: false,
        message: 'Terjadi kesalahan',
      })
    }
  }
}