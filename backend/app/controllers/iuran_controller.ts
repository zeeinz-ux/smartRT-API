import { HttpContext } from '@adonisjs/core/http'
import BaseController from './base_controller.js'
import { DateTime } from 'luxon'
import { v4 as uuid } from 'uuid'
import db from '@adonisjs/lucid/services/db'
import app from '@adonisjs/core/services/app'
import Iuran from '#models/iuran'
import IuranPayment from '#models/iuran_payment'
import Notifikasi from '#models/notifikasi'
import GoogleSheetsService from '#services/google_sheets'

interface WargaRow {
  warga_id: number
  nama: string
  email?: string
  no_hp?: string | null
  nik: string | null
  no_rumah: string | null
}

interface MergedItem {
  warga_id: number
  nama: string
  nik: string | null | '-'
  no_rumah: string | null | '-'
  no_hp?: string | null | '-'
  pembayaran?: {
    id: string
    jumlah: number
    status: string
    metode_pembayaran: string | null
    paid_at: DateTime | null
    keterangan: string | null
  } | null
  status_sekarang?: string
  jumlah_bulan_ini?: number
  total_tunggakan?: number
}

export default class IuranController extends BaseController {
  /**
   * GET /api/admin/iuran?kategori_id=&bulan=&tahun=&search=&status=&page=1&limit=50
   */
  async index({ request, auth, response }: HttpContext) {
    return this.safeExecute(response, 'List iuran', async () => {
      if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
        response.status(403).json({ success: false, message: 'Akses ditolak' })
        return
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

      const wargaRows = allWarga as WargaRow[]
      let merged: MergedItem[] = wargaRows.map((w) => {
        const payment = iuranMap.get(String(w.warga_id))
        return {
          warga_id: w.warga_id,
          nama: w.nama,
          nik: w.nik,
          no_rumah: w.no_rumah,
          pembayaran: payment
            ? {
                id: payment.id,
                jumlah: Number(payment.jumlah),
                sisa: Number(payment.sisa),
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

      response.json({
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
    })
  }

  /**
   * POST /api/admin/iuran
   */
  async store({ request, auth, response }: HttpContext) {
    return this.safeExecute(response, 'Create iuran', async () => {
      if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
        response.status(403).json({ success: false, message: 'Akses ditolak' })
        return
      }

      const { warga_id, kategori_id, bulan, tahun, jumlah, status, metode_pembayaran, keterangan } = request.only([
        'warga_id', 'kategori_id', 'bulan', 'tahun', 'jumlah', 'status', 'metode_pembayaran', 'keterangan',
      ])

      if (!warga_id || !kategori_id || !tahun || jumlah === undefined) {
        response.status(400).json({
          success: false,
          message: 'warga_id, kategori_id, tahun, dan jumlah wajib diisi',
        })
        return
      }

      const existing = await Iuran.query()
        .where('warga_id', warga_id)
        .where('kategori_id', kategori_id)
        .where('bulan', bulan ?? null)
        .where('tahun', tahun)
        .first()

      if (existing) {
        response.status(409).json({
          success: false,
          message: `Pembayaran untuk iuran ini sudah ada`,
        })
        return
      }

      const bayarStatus = status || 'lunas'
      const paidAt = bayarStatus === 'lunas' ? DateTime.now() : null

      const jumlahNum = Number(jumlah)
      const pembayaran = await Iuran.create({
        warga_id,
        kategori_id,
        bulan: bulan ?? null,
        tahun,
        jumlah: jumlahNum,
        sisa: bayarStatus === 'lunas' ? 0 : jumlahNum,
        status: bayarStatus,
        metode_pembayaran: metode_pembayaran || null,
        paid_at: paidAt,
        keterangan: keterangan || null,
      })

      await this.syncGoogleSheets(async () => {
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
      })

      response.status(201).json({
        success: true,
        message: 'Pembayaran berhasil dicatat',
        data: pembayaran,
      })
    })
  }

  /**
   * PATCH /api/admin/iuran/:id
   */
  async update({ params, request, auth, response }: HttpContext) {
    return this.safeExecute(response, 'Update iuran', async () => {
      if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
        response.status(403).json({ success: false, message: 'Akses ditolak' })
        return
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

      response.json({
        success: true,
        message: 'Pembayaran berhasil diupdate',
        data: pembayaran,
      })
    })
  }

  /**
   * DELETE /api/admin/iuran/:id
   */
  async destroy({ params, auth, response }: HttpContext) {
    return this.safeExecute(response, 'Delete iuran', async () => {
      if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
        response.status(403).json({ success: false, message: 'Akses ditolak' })
        return
      }

      const pembayaran = await Iuran.findOrFail(params.id)
      await pembayaran.delete()

      response.json({
        success: true,
        message: 'Pembayaran berhasil dihapus',
      })
    })
  }

  /**
   * POST /api/admin/iuran/:id/bayar
   * Bayar cicilan (partial payment) untuk iuran tertentu
   */
  async bayarCicilan({ params, request, auth, response }: HttpContext) {
    return this.safeExecute(response, 'Bayar cicilan', async () => {
      if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
        response.status(403).json({ success: false, message: 'Akses ditolak' })
        return
      }

      const { jumlah, metode_pembayaran, keterangan } = request.only([
        'jumlah', 'metode_pembayaran', 'keterangan',
      ])

      const jumlahNum = Number(jumlah)
      if (!jumlahNum || jumlahNum <= 0) {
        response.status(400).json({ success: false, message: 'Jumlah pembayaran harus lebih dari 0' })
        return
      }

      const iuran = await Iuran.findOrFail(params.id)

      if (iuran.status === 'lunas') {
        response.status(400).json({ success: false, message: 'Iuran ini sudah lunas' })
        return
      }

      const sisaSaatIni = Number(iuran.sisa)
      if (jumlahNum > sisaSaatIni) {
        response.status(400).json({
          success: false,
          message: `Jumlah pembayaran (Rp ${jumlahNum.toLocaleString('id-ID')}) melebihi sisa tagihan (Rp ${sisaSaatIni.toLocaleString('id-ID')})`,
        })
        return
      }

      const sisaBaru = sisaSaatIni - jumlahNum

      await IuranPayment.create({
        iuran_id: iuran.id,
        jumlah: jumlahNum,
        metode_pembayaran: metode_pembayaran || null,
        paid_at: DateTime.now(),
        keterangan: keterangan || null,
        admin_id: auth.user.id,
      })

      iuran.sisa = sisaBaru
      if (sisaBaru <= 0) {
        iuran.status = 'lunas'
        iuran.paid_at = DateTime.now()
      }
      await iuran.save()

      const message = sisaBaru <= 0
        ? 'Pembayaran lunas'
        : `Pembayaran dicatat. Sisa: Rp ${sisaBaru.toLocaleString('id-ID')}`

      response.json({
        success: true,
        message,
        data: {
          id: iuran.id,
          jumlah: Number(iuran.jumlah),
          sisa: Number(iuran.sisa),
          status: iuran.status,
        },
      })
    })
  }

  /**
   * GET /api/admin/iuran/:id/payments
   * Riwayat cicilan pembayaran untuk iuran tertentu
   */
  async riwayatPembayaran({ params, auth, response }: HttpContext) {
    return this.safeExecute(response, 'Riwayat pembayaran', async () => {
      if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
        response.status(403).json({ success: false, message: 'Akses ditolak' })
        return
      }

      const payments = await IuranPayment.query()
        .where('iuran_id', params.id)
        .preload('admin', (q) => q.select('id', 'nama'))
        .preload('warga', (q) => q.select('id', 'nama'))
        .orderBy('paid_at', 'desc')

      const iuran = await Iuran.query()
        .where('id', params.id)
        .preload('kategori', (q) => q.select('id', 'nama'))
        .preload('warga', (q) => q.select('id', 'nama'))
        .firstOrFail()

      response.json({
        success: true,
        data: {
          iuran: {
            id: iuran.id,
            jumlah: Number(iuran.jumlah),
            sisa: Number(iuran.sisa),
            status: iuran.status,
            kategori: iuran.kategori ? { id: iuran.kategori.id, nama: iuran.kategori.nama } : null,
            warga: iuran.warga ? { id: iuran.warga.id, nama: iuran.warga.nama } : null,
            bulan: iuran.bulan,
            tahun: iuran.tahun,
          },
          payments: payments.map((p) => ({
            id: p.id,
            jumlah: Number(p.jumlah),
            metode_pembayaran: p.metode_pembayaran,
            paid_at: p.paid_at,
            status: p.status,
            keterangan: p.keterangan,
            admin: p.admin ? { id: p.admin.id, nama: p.admin.nama } : null,
            warga: p.warga ? { id: p.warga.id, nama: p.warga.nama } : null,
          })),
        },
      })
    })
  }

  /**
   * GET /api/warga/tagihan
   */
  async tagihanSaya({ auth, response }: HttpContext) {
    return this.safeExecute(response, 'Tagihan saya', async () => {
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
        sisa: Number(t.sisa),
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

      response.json({
        success: true,
        data: tagihan,
        stats,
      })
    })
  }

  /**
   * PATCH /api/warga/tagihan/:id/bayar
   */
  async wargaBayar({ params, request, auth, response }: HttpContext) {
    return this.safeExecute(response, 'Warga bayar', async () => {
      const user = auth.user!
      const { metode_pembayaran } = request.only(['metode_pembayaran'])

      if (!['tunai', 'transfer', 'qris'].includes(metode_pembayaran)) {
        response.status(400).json({
          success: false,
          message: 'Metode pembayaran tidak valid. Pilih: tunai, transfer, atau qris',
        })
        return
      }

      const iuran = await Iuran.query()
        .where('id', params.id)
        .where('warga_id', user.id)
        .first()

      if (!iuran) {
        response.status(404).json({
          success: false,
          message: 'Tagihan tidak ditemukan',
        })
        return
      }

      if (iuran.status !== 'belum_lunas') {
        response.status(400).json({
          success: false,
          message: `Tagihan sudah ${iuran.status === 'lunas' ? 'lunas' : 'dalam proses pengajuan'}`,
        })
        return
      }

      // Handle bukti pembayaran upload
      let buktiUrl: string | null = null
      if (metode_pembayaran !== 'tunai') {
        const file = request.file('bukti_pembayaran', {
          size: '5mb',
          extnames: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
        })

        if (!file) {
          response.status(400).json({
            success: false,
            message: 'Bukti pembayaran wajib diupload untuk metode transfer/QRIS',
          })
          return
        }

        if (!file.isValid) {
          response.status(400).json({
            success: false,
            message: 'File bukti pembayaran tidak valid. Format: JPG/PNG/WEBP/PDF, max 5MB.',
            errors: file.errors,
          })
          return
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

      response.json({
        success: true,
        message: 'Pembayaran berhasil diajukan, menunggu verifikasi admin',
        data: {
          id: iuran.id,
          status: iuran.status,
          metode_pembayaran: iuran.metode_pembayaran,
          bukti_pembayaran_url: iuran.bukti_pembayaran_url,
        },
      })
    })
  }

  /**
   * POST /api/admin/iuran/generate
   * Generate tagihan massal untuk semua warga berdasarkan kategori iuran aktif
   */
  async generate({ request, auth, response }: HttpContext) {
    return this.safeExecute(response, 'Generate iuran', async () => {
      if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
        response.status(403).json({ success: false, message: 'Akses ditolak' })
        return
      }

      const bulan = Number(request.input('bulan'))
      const tahun = Number(request.input('tahun'))

      if (!bulan || !tahun || bulan < 1 || bulan > 12) {
        response.status(400).json({
          success: false,
          message: 'Bulan (1-12) dan tahun wajib diisi',
        })
        return
      }

      const kategoris = await db.from('kategori_iurans')
        .where('aktif', true)
        .where('periode', 'bulanan')
        .select('id', 'nama', 'jumlah_default')

      if (kategoris.length === 0) {
        response.status(400).json({
          success: false,
          message: 'Tidak ada kategori iuran bulanan yang aktif',
        })
        return
      }

      const allWarga = await db.from('users')
        .where('role', 'warga')
        .select('id')

      if (allWarga.length === 0) {
        response.status(400).json({
          success: false,
          message: 'Tidak ada warga terdaftar',
        })
        return
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

          const jml = Number(kategori.jumlah_default)
          await Iuran.create({
            warga_id: warga.id,
            kategori_id: kategori.id,
            bulan,
            tahun,
            jumlah: jml,
            sisa: jml,
            status: 'belum_lunas',
          })
          created++
        }
      }

      response.json({
        success: true,
        message: `Berhasil membuat ${created} tagihan baru (${skipped} sudah ada)`,
        data: { created, skipped, bulan, tahun },
      })
    })
  }

  /**
   * GET /api/admin/iuran/verifikasi
   * List iuran dengan status pending untuk diverifikasi
   */
  async pendingVerifikasi({ request, auth, response }: HttpContext) {
    return this.safeExecute(response, 'List pending verifikasi', async () => {
      if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
        response.status(403).json({ success: false, message: 'Akses ditolak' })
        return
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

      response.json({
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
    })
  }

  /**
   * POST /api/admin/iuran/:id/approve
   */
  async approve({ params, auth, response }: HttpContext) {
    return this.safeExecute(response, 'Approve iuran', async () => {
      if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
        response.status(403).json({ success: false, message: 'Akses ditolak' })
        return
      }

      const iuran = await Iuran.findOrFail(params.id)

      if (iuran.status !== 'pending') {
        response.status(400).json({
          success: false,
          message: `Tagihan tidak dalam status pending (saat ini: ${iuran.status})`,
        })
        return
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

      await this.syncGoogleSheets(async () => {
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
      })

      response.json({
        success: true,
        message: 'Pembayaran berhasil diverifikasi',
        data: {
          id: iuran.id,
          status: iuran.status,
          verified_at: iuran.verified_at,
        },
      })
    })
  }

  /**
   * POST /api/admin/iuran/:id/reject
   */
  async reject({ params, request, auth, response }: HttpContext) {
    return this.safeExecute(response, 'Reject iuran', async () => {
      if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
        response.status(403).json({ success: false, message: 'Akses ditolak' })
        return
      }

      const { reason } = request.only(['reason'])
      const iuran = await Iuran.findOrFail(params.id)

      if (iuran.status !== 'pending') {
        response.status(400).json({
          success: false,
          message: `Tagihan tidak dalam status pending (saat ini: ${iuran.status})`,
        })
        return
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

      response.json({
        success: true,
        message: 'Pembayaran ditolak',
        data: {
          id: iuran.id,
          status: iuran.status,
          rejection_reason: iuran.rejection_reason,
        },
      })
    })
  }

  /**
   * POST /api/warga/tagihan/:id/bayar-cicilan
   * Warga membayar cicilan (partial payment)
   */
  async bayarCicilanWarga({ params, request, auth, response }: HttpContext) {
    return this.safeExecute(response, 'Bayar cicilan warga', async () => {
      const user = auth.user!
      const { jumlah, metode_pembayaran } = request.only(['jumlah', 'metode_pembayaran'])

      const jumlahNum = Number(jumlah)
      if (!jumlahNum || jumlahNum <= 0) {
        response.status(400).json({ success: false, message: 'Jumlah pembayaran harus lebih dari 0' })
        return
      }

      if (!['tunai', 'transfer', 'qris'].includes(metode_pembayaran)) {
        response.status(400).json({
          success: false,
          message: 'Metode pembayaran tidak valid. Pilih: tunai, transfer, atau qris',
        })
        return
      }

      const iuran = await Iuran.query()
        .where('id', params.id)
        .where('warga_id', user.id)
        .first()

      if (!iuran) {
        response.status(404).json({ success: false, message: 'Tagihan tidak ditemukan' })
        return
      }

      if (iuran.status !== 'belum_lunas') {
        response.status(400).json({
          success: false,
          message: `Tagihan sudah ${iuran.status === 'lunas' ? 'lunas' : 'dalam proses pengajuan'}`,
        })
        return
      }

      const sisaSaatIni = Number(iuran.sisa)
      if (jumlahNum > sisaSaatIni) {
        response.status(400).json({
          success: false,
          message: `Jumlah pembayaran (Rp ${jumlahNum.toLocaleString('id-ID')}) melebihi sisa tagihan (Rp ${sisaSaatIni.toLocaleString('id-ID')})`,
        })
        return
      }

      // Handle bukti pembayaran upload
      let buktiUrl: string | null = null
      if (metode_pembayaran !== 'tunai') {
        const file = request.file('bukti_pembayaran', {
          size: '5mb',
          extnames: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
        })

        if (!file) {
          response.status(400).json({
            success: false,
            message: 'Bukti pembayaran wajib diupload untuk metode transfer/QRIS',
          })
          return
        }

        if (!file.isValid) {
          response.status(400).json({
            success: false,
            message: 'File bukti pembayaran tidak valid. Format: JPG/PNG/WEBP/PDF, max 5MB.',
            errors: file.errors,
          })
          return
        }

        const fileName = `${uuid()}.${file.extname}`
        const folder = 'uploads/bukti-bayar'
        await file.move(app.publicPath(folder), { name: fileName })
        buktiUrl = `/${folder}/${fileName}`
      }

      // Create pending payment record
      await IuranPayment.create({
        iuran_id: iuran.id,
        jumlah: jumlahNum,
        metode_pembayaran: metode_pembayaran,
        paid_at: DateTime.now(),
        keterangan: buktiUrl ? `Bukti: ${buktiUrl}` : null,
        status: 'pending',
        warga_id: user.id,
      })

      response.json({
        success: true,
        message: 'Pembayaran cicilan berhasil diajukan, menunggu verifikasi admin',
        data: {
          id: iuran.id,
          sisa: Number(iuran.sisa),
          jumlah_dibayar: jumlahNum,
        },
      })
    })
  }

  /**
   * POST /api/admin/iuran/:id/approve-cicilan/:paymentId
   * Admin menyetujui pembayaran cicilan warga
   */
  async approveCicilan({ params, auth, response }: HttpContext) {
    return this.safeExecute(response, 'Approve cicilan', async () => {
      if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
        response.status(403).json({ success: false, message: 'Akses ditolak' })
        return
      }

      const payment = await IuranPayment.query()
        .where('id', params.paymentId)
        .where('iuran_id', params.id)
        .where('status', 'pending')
        .first()

      if (!payment) {
        response.status(404).json({ success: false, message: 'Pembayaran cicilan tidak ditemukan atau sudah diproses' })
        return
      }

      const iuran = await Iuran.findOrFail(params.id)
      const jumlahBayar = Number(payment.jumlah)
      const sisaBaru = Number(iuran.sisa) - jumlahBayar

      payment.status = 'confirmed'
      payment.admin_id = auth.user.id
      await payment.save()

      iuran.sisa = sisaBaru
      if (sisaBaru <= 0) {
        iuran.status = 'lunas'
        iuran.paid_at = DateTime.now()
      }
      iuran.verified_at = DateTime.now()
      iuran.verified_by = auth.user.id
      await iuran.save()

      await Notifikasi.create({
        user_id: iuran.warga_id,
        type: 'info',
        title: 'Pembayaran Cicilan Diverifikasi',
        message: `Pembayaran cicilan sebesar Rp ${jumlahBayar.toLocaleString('id-ID')} telah diverifikasi.${sisaBaru <= 0 ? ' Tagihan dinyatakan lunas.' : ` Sisa tagihan: Rp ${sisaBaru.toLocaleString('id-ID')}.`}`,
        data: { iuran_id: iuran.id, payment_id: payment.id, status: 'approved' },
      })

      response.json({
        success: true,
        message: sisaBaru <= 0
          ? 'Pembayaran diverifikasi. Tagihan lunas.'
          : `Pembayaran diverifikasi. Sisa tagihan: Rp ${sisaBaru.toLocaleString('id-ID')}`,
        data: {
          id: iuran.id,
          sisa: Number(iuran.sisa),
          status: iuran.status,
        },
      })
    })
  }

  /**
   * POST /api/admin/iuran/:id/reject-cicilan/:paymentId
   * Admin menolak pembayaran cicilan warga
   */
  async rejectCicilan({ params, request, auth, response }: HttpContext) {
    return this.safeExecute(response, 'Reject cicilan', async () => {
      if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
        response.status(403).json({ success: false, message: 'Akses ditolak' })
        return
      }

      const { reason } = request.only(['reason'])

      const payment = await IuranPayment.query()
        .where('id', params.paymentId)
        .where('iuran_id', params.id)
        .where('status', 'pending')
        .first()

      if (!payment) {
        response.status(404).json({ success: false, message: 'Pembayaran cicilan tidak ditemukan atau sudah diproses' })
        return
      }

      payment.status = 'rejected'
      payment.admin_id = auth.user.id
      payment.keterangan = reason || 'Bukti pembayaran tidak valid'
      await payment.save()

      await Notifikasi.create({
        user_id: (await Iuran.findOrFail(params.id)).warga_id,
        type: 'info',
        title: 'Pembayaran Cicilan Ditolak',
        message: `Pembayaran cicilan sebesar Rp ${Number(payment.jumlah).toLocaleString('id-ID')} ditolak. Alasan: ${payment.keterangan}`,
        data: { iuran_id: params.id, payment_id: payment.id, status: 'rejected' },
      })

      response.json({
        success: true,
        message: 'Pembayaran cicilan ditolak',
      })
    })
  }

  /**
   * GET /api/warga/tagihan/:id/payments
   * Riwayat pembayaran cicilan untuk warga
   */
  async riwayatPembayaranWarga({ params, auth, response }: HttpContext) {
    return this.safeExecute(response, 'Riwayat pembayaran warga', async () => {
      const user = auth.user!

      const iuran = await Iuran.query()
        .where('id', params.id)
        .where('warga_id', user.id)
        .preload('kategori', (q) => q.select('id', 'nama'))
        .first()

      if (!iuran) {
        response.status(404).json({ success: false, message: 'Tagihan tidak ditemukan' })
        return
      }

      const payments = await IuranPayment.query()
        .where('iuran_id', params.id)
        .orderBy('paid_at', 'desc')

      response.json({
        success: true,
        data: {
          iuran: {
            id: iuran.id,
            jumlah: Number(iuran.jumlah),
            sisa: Number(iuran.sisa),
            status: iuran.status,
            kategori: iuran.kategori ? { id: iuran.kategori.id, nama: iuran.kategori.nama } : null,
            bulan: iuran.bulan,
            tahun: iuran.tahun,
          },
          payments: payments.map((p) => ({
            id: p.id,
            jumlah: Number(p.jumlah),
            metode_pembayaran: p.metode_pembayaran,
            paid_at: p.paid_at,
            status: p.status,
            keterangan: p.keterangan,
          })),
        },
      })
    })
  }

  /**
   * GET /api/admin/iuran/monitoring
   * Monitoring status tagihan per warga untuk bulan/tahun tertentu
   */
  async monitoring({ request, auth, response }: HttpContext) {
    return this.safeExecute(response, 'Monitoring iuran', async () => {
      if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
        response.status(403).json({ success: false, message: 'Akses ditolak' })
        return
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

      const iuranMap = new Map<string, { status: string; jumlah: number; sisa: number; metode: string | null }>()
      for (const iuran of allIuran) {
        iuranMap.set(iuran.warga_id, {
          status: iuran.status,
          jumlah: Number(iuran.jumlah),
          sisa: Number(iuran.sisa),
          metode: iuran.metode_pembayaran,
        })
      }

      const wargaRows = allWarga as WargaRow[]
      const allWargaIbanIds = wargaRows.map((w) => w.warga_id)
      const tunggakanRows = await db.from('iurans')
        .whereIn('status', ['belum_lunas', 'pending'])
        .whereIn('warga_id', allWargaIbanIds)
        .groupBy('warga_id')
        .select('warga_id')
        .sum('jumlah as total') as unknown as { warga_id: number; total: number }[]
      const totalTunggakanMap = new Map<number, number>()
      for (const row of tunggakanRows) {
        totalTunggakanMap.set(row.warga_id, Number(row.total))
      }

      const merged: MergedItem[] = wargaRows.map((w) => {
        const statusBulanIni = iuranMap.get(String(w.warga_id))
        const tunggakan = totalTunggakanMap.get(w.warga_id) || 0
        return {
          warga_id: w.warga_id,
          nama: w.nama,
          nik: w.nik || '-',
          no_rumah: w.no_rumah || '-',
          no_hp: w.no_hp || '-',
          status_sekarang: statusBulanIni?.status || 'belum_dibayar',
          jumlah_bulan_ini: statusBulanIni?.jumlah || 0,
          sisa_bulan_ini: statusBulanIni?.sisa || 0,
          total_tunggakan: tunggakan,
        }
      })

      response.json({
        success: true,
        data: merged,
        meta: {
          bulan,
          tahun,
          total: merged.length,
          lunas: merged.filter((m) => m.status_sekarang === 'lunas').length,
          pending: merged.filter((m) => m.status_sekarang === 'pending').length,
          belumLunas: merged.filter((m) => m.status_sekarang === 'belum_lunas' || m.status_sekarang === 'belum_dibayar').length,
        },
      })
    })
  }
}