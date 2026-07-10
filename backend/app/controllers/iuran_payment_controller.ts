import { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import type IuranSampah from '#models/iuran_sampah'
import type IuranQurban from '#models/iuran_qurban'
import GoogleSheetsService from '#services/google_sheets'
import BaseController from './base_controller.js'

type PaymentModel = typeof IuranSampah | typeof IuranQurban

interface PaymentRow {
  id: string
  warga_id: number
  bulan: number
  tahun: number
  jumlah: number
  status: string
  metode_pembayaran: string | null
  paid_at: DateTime | null
  keterangan: string | null
}

interface WargaRow {
  warga_id: number
  nama: string
  email: string
  nik: string | null
  no_rumah: string | null
}

interface MergedPaymentItem {
  warga_id: number
  nama: string
  nik: string | null
  no_rumah: string | null
  pembayaran: {
    id: string
    bulan?: number
    jumlah: number
    status: string
    metode_pembayaran: string | null
    paid_at: DateTime | null
    keterangan: string | null
  } | null
}

export default class IuranPaymentController extends BaseController {
  static forSampah(): IuranPaymentController {
    return new IuranPaymentController(
      () => import('#models/iuran_sampah'),
      'appendSampah',
      'sampah',
      { defaultBulan: () => DateTime.now().month, includeBulan: true, msgPrefix: '' },
    )
  }

  static forQurban(): IuranPaymentController {
    return new IuranPaymentController(
      () => import('#models/iuran_qurban'),
      'appendQurban',
      'qurban',
      { defaultBulan: () => 0, includeBulan: false, msgPrefix: 'qurban ' },
    )
  }

  private constructor(
    private modelLoader: () => Promise<{ default: PaymentModel }>,
    private sheetMethod: 'appendSampah' | 'appendQurban',
    private label: string,
    private opts: {
      defaultBulan: () => number
      includeBulan: boolean
      msgPrefix: string
    },
  ) {
    super()
  }

  private async getModel(): Promise<PaymentModel> {
    const mod = await this.modelLoader()
    return mod.default
  }

  async index({ request, auth, response }: HttpContext) {
    return this.safeExecute(response, `List ${this.label}`, async () => {
      if (!this.requireAdminOrBendahara(auth.user)) {
        return { success: false, message: 'Akses ditolak' }
      }

      const now = DateTime.now()
      const bulan = Number(request.input('bulan', this.opts.defaultBulan()))
      const tahun = Number(request.input('tahun', now.year))
      const search = request.input('search', '')
      const statusFilter = request.input('status', '')
      const page = Number(request.input('page', 1))
      const limit = Number(request.input('limit', 50))

      const allWarga = await db.from('users')
        .leftJoin('warga_profiles', 'warga_profiles.user_id', 'users.id')
        .select('users.id as warga_id', 'users.nama', 'users.email', 'warga_profiles.nik', 'warga_profiles.no_rumah')
        .where('users.role', 'warga')
        .where((builder) => {
          if (search) {
            builder.whereILike('users.nama', `%${search}%`).orWhereILike('users.email', `%${search}%`).orWhereILike('warga_profiles.nik', `%${search}%`)
          }
        })
        .orderBy('users.nama', 'asc')

      const Model = await this.getModel()
      let query = Model.query().where('tahun', tahun)
      if (this.opts.includeBulan || (bulan >= 1 && bulan <= 12)) {
        query = query.where('bulan', bulan)
      }
      const allPayments = (await query) as unknown as PaymentRow[]
      const paymentMap = new Map<number, PaymentRow>(allPayments.map((p) => [p.warga_id, p]))

      const wargaRows = allWarga as WargaRow[]
      let merged: MergedPaymentItem[] = wargaRows.map((w) => {
        const payment = paymentMap.get(w.warga_id)
        return {
          warga_id: w.warga_id, nama: w.nama, nik: w.nik, no_rumah: w.no_rumah,
          pembayaran: payment
            ? {
                id: payment.id,
                ...(this.opts.includeBulan ? {} : { bulan: payment.bulan }),
                jumlah: Number(payment.jumlah),
                status: payment.status,
                metode_pembayaran: payment.metode_pembayaran,
                paid_at: payment.paid_at,
                keterangan: payment.keterangan,
              }
            : null,
        }
      })

      if (statusFilter === 'lunas') merged = merged.filter((m) => m.pembayaran?.status === 'lunas')
      else if (statusFilter === 'belum_lunas') merged = merged.filter((m) => !m.pembayaran)
      else if (statusFilter === 'pending') merged = merged.filter((m) => m.pembayaran?.status === 'pending')

      const paginated = merged.slice((page - 1) * limit, page * limit)
      const stats = {
        total: allWarga.length,
        lunas: allPayments.filter((p) => p.status === 'lunas').length,
        pending: allPayments.filter((p) => p.status === 'pending').length,
        belumLunas: allWarga.length - allPayments.filter((p) => p.status === 'lunas' || p.status === 'pending').length,
        totalAmount: allPayments.reduce((sum, p) => sum + Number(p.jumlah), 0),
        collectedAmount: allPayments.filter((p) => p.status === 'lunas').reduce((sum, p) => sum + Number(p.jumlah), 0),
      }

      return {
        success: true, data: paginated,
        pagination: { page, limit, total: merged.length, totalPages: Math.ceil(merged.length / limit) },
        stats,
      }
    })
  }

  async store({ request, auth, response }: HttpContext) {
    return this.safeExecute(response, `Create ${this.label}`, async () => {
      if (!this.requireAdminOrBendahara(auth.user)) {
        return response.status(403).json({ success: false, message: 'Akses ditolak' })
      }

      const { warga_id, bulan, tahun, jumlah, status, metode_pembayaran, keterangan } = request.only([
        'warga_id', 'bulan', 'tahun', 'jumlah', 'status', 'metode_pembayaran', 'keterangan',
      ])

      if (!warga_id || !bulan || !tahun || jumlah === undefined) {
        return response.status(400).json({ success: false, message: 'warga_id, bulan, tahun, dan jumlah wajib diisi' })
      }

      const Model = await this.getModel()
      const existing = await Model.query().where('warga_id', warga_id).where('bulan', bulan).where('tahun', tahun).first()
      if (existing) {
        return response.status(409).json({
          success: false,
          message: this.opts.includeBulan
            ? `Pembayaran ${bulan}/${tahun} untuk warga ini sudah ada`
            : `Pembayaran bulan ${bulan}/${tahun} untuk warga ini sudah ada`,
        })
      }

      const bayarStatus = status || 'lunas'
      const paidAt = bayarStatus === 'lunas' ? DateTime.now() : null

      const pembayaran = await Model.create({
        warga_id, bulan, tahun, jumlah: Number(jumlah), status: bayarStatus,
        metode_pembayaran: metode_pembayaran || null, paid_at: paidAt, keterangan: keterangan || null,
      })

      await this.syncGoogleSheets(async () => {
        const user = await db.from('users').where('id', warga_id).first()
        const payload: Record<string, unknown> = {
          id: pembayaran.id,
          warga: (user as Record<string, unknown>)?.nama || 'Unknown',
          tahun,
          jumlah: Number(jumlah),
          status: bayarStatus,
          metode: metode_pembayaran || null,
          paid_at: paidAt?.toISO() || null,
        }
        if (this.opts.includeBulan) payload.bulan = bulan
        const sheetService = GoogleSheetsService as unknown as {
          [key: string]: (data: Record<string, unknown>) => Promise<void>
        }
        await sheetService[this.sheetMethod](payload)
      })

      return response.status(201).json({
        success: true,
        message: `Pembayaran ${this.opts.msgPrefix}berhasil dicatat`,
        data: pembayaran,
      })
    })
  }

  async update({ params, request, auth, response }: HttpContext) {
    return this.safeExecute(response, `Update ${this.label}`, async () => {
      if (!this.requireAdminOrBendahara(auth.user)) {
        return { success: false, message: 'Akses ditolak' }
      }

      const Model = await this.getModel()
      const pembayaran = await Model.findOrFail(params.id)
      const { jumlah, status, metode_pembayaran, keterangan } = request.only([
        'jumlah', 'status', 'metode_pembayaran', 'keterangan',
      ])

      if (status !== undefined) pembayaran.status = status
      if (jumlah !== undefined) pembayaran.jumlah = Number(jumlah)
      if (metode_pembayaran !== undefined) pembayaran.metode_pembayaran = metode_pembayaran
      if (keterangan !== undefined) pembayaran.keterangan = keterangan
      if (status === 'lunas' && !pembayaran.paid_at) pembayaran.paid_at = DateTime.now()
      await pembayaran.save()

      return { success: true, message: `Pembayaran ${this.opts.msgPrefix}berhasil diupdate`, data: pembayaran }
    })
  }

  async destroy({ params, auth, response }: HttpContext) {
    return this.safeExecute(response, `Delete ${this.label}`, async () => {
      if (!this.requireAdminOrBendahara(auth.user)) {
        return { success: false, message: 'Akses ditolak' }
      }

      const Model = await this.getModel()
      const pembayaran = await Model.findOrFail(params.id)
      await pembayaran.delete()

      return { success: true, message: `Pembayaran ${this.opts.msgPrefix}berhasil dihapus` }
    })
  }
}
