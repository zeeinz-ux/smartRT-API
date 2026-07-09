import { HttpContext } from '@adonisjs/core/http'
import { v4 as uuid } from 'uuid'
import app from '@adonisjs/core/services/app'
import PaymentSetting from '#models/payment_setting'

export default class PaymentSettingController {
  async index({ auth, response }: HttpContext) {
    if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
      return response.status(403).json({ success: false, message: 'Akses ditolak' })
    }

    const setting = await PaymentSetting.first()
    return response.json({
      success: true,
      data: setting,
    })
  }

  async store({ request, auth, response }: HttpContext) {
    if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
      return response.status(403).json({ success: false, message: 'Akses ditolak' })
    }

    const { nama_bank, nomor_rekening, nama_penerima } = request.only([
      'nama_bank', 'nomor_rekening', 'nama_penerima',
    ])

    if (!nama_bank || !nomor_rekening || !nama_penerima) {
      return response.status(400).json({
        success: false,
        message: 'nama_bank, nomor_rekening, dan nama_penerima wajib diisi',
      })
    }

    let qrisPath: string | null = null
    const qrisFile = request.file('qris', {
      size: '2mb',
      extnames: ['jpg', 'jpeg', 'png', 'webp'],
    })

    if (qrisFile) {
      if (!qrisFile.isValid) {
        return response.status(400).json({
          success: false,
          message: 'File QRIS tidak valid. Format: JPG/PNG/WEBP, max 2MB.',
        })
      }
      const fileName = `qris_${uuid()}.${qrisFile.extname}`
      const folder = 'uploads/payment'
      await qrisFile.move(app.publicPath(folder), { name: fileName })
      qrisPath = `${folder}/${fileName}`
    }

    const existing = await PaymentSetting.first()
    if (existing) {
      existing.nama_bank = nama_bank
      existing.nomor_rekening = nomor_rekening
      existing.nama_penerima = nama_penerima
      if (qrisPath) {
        existing.qris_path = qrisPath
      }
      await existing.save()
      return response.json({
        success: true,
        message: 'Pengaturan pembayaran berhasil diperbarui',
        data: existing,
      })
    }

    const setting = await PaymentSetting.create({
      nama_bank,
      nomor_rekening,
      nama_penerima,
      qris_path: qrisPath,
    })

    return response.status(201).json({
      success: true,
      message: 'Pengaturan pembayaran berhasil disimpan',
      data: setting,
    })
  }

  async update({ params, request, auth, response }: HttpContext) {
    if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
      return response.status(403).json({ success: false, message: 'Akses ditolak' })
    }

    const setting = await PaymentSetting.findOrFail(params.id)
    const { nama_bank, nomor_rekening, nama_penerima } = request.only([
      'nama_bank', 'nomor_rekening', 'nama_penerima',
    ])

    if (nama_bank !== undefined) setting.nama_bank = nama_bank
    if (nomor_rekening !== undefined) setting.nomor_rekening = nomor_rekening
    if (nama_penerima !== undefined) setting.nama_penerima = nama_penerima

    const qrisFile = request.file('qris', {
      size: '2mb',
      extnames: ['jpg', 'jpeg', 'png', 'webp'],
    })

    if (qrisFile) {
      if (!qrisFile.isValid) {
        return response.status(400).json({
          success: false,
          message: 'File QRIS tidak valid. Format: JPG/PNG/WEBP, max 2MB.',
        })
      }
      const fileName = `qris_${uuid()}.${qrisFile.extname}`
      const folder = 'uploads/payment'
      await qrisFile.move(app.publicPath(folder), { name: fileName })
      setting.qris_path = `${folder}/${fileName}`
    }

    await setting.save()

    return response.json({
      success: true,
      message: 'Pengaturan pembayaran berhasil diperbarui',
      data: setting,
    })
  }

  async destroy({ params, auth, response }: HttpContext) {
    if (!auth.user || auth.user.role !== 'admin') {
      return response.status(403).json({ success: false, message: 'Akses ditolak' })
    }

    const setting = await PaymentSetting.findOrFail(params.id)
    await setting.delete()

    return response.json({
      success: true,
      message: 'Pengaturan pembayaran berhasil dihapus',
    })
  }

  async show({ response }: HttpContext) {
    const setting = await PaymentSetting.first()
    return response.json({
      success: true,
      data: setting,
    })
  }
}
