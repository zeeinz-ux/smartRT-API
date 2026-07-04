import { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import EmergencyAlert from '#models/emergency_alert'
import User from '#models/user'
import Notifikasi from '#models/notifikasi'

export default class DaruratController {
  /**
   * POST /api/darurat
   */
  async store({ request, auth, response }: HttpContext) {
    try {
      if (!auth.user) {
        return response.status(401).json({ success: false, message: 'Belum login' })
      }

      const { latitude, longitude, keterangan } = request.only(['latitude', 'longitude', 'keterangan'])

      if (!latitude || !longitude) {
        return response.status(400).json({
          success: false,
          message: 'Lokasi tidak ditemukan. Aktifkan GPS dan coba lagi.',
        })
      }

      const alert = await EmergencyAlert.create({
        user_id: auth.user.id,
        latitude,
        longitude,
        keterangan: keterangan || null,
        status: 'active',
      })

      // Notifikasi ke semua admin & bendahara
      const admins = await User.query()
        .whereIn('role', ['admin', 'bendahara'])
        .select('id')

      if (admins.length > 0) {
        const currentUser = auth.user!
        await Notifikasi.createMany(
          admins.map((a) => ({
            user_id: a.id,
            type: 'emergency',
            title: 'Sinyal Darurat!',
            message: `${currentUser.nama || 'Warga'} mengirim sinyal darurat. ${keterangan ? `Keterangan: ${keterangan}` : 'Segera cek lokasi.'}`,
            data: { alert_id: alert.id, user_id: currentUser.id },
          }))
        )
      }

      return response.status(201).json({
        success: true,
        message: 'Sinyal darurat terkirim! Bantuan akan segera diproses.',
        data: alert,
      })
    } catch (error) {
      console.error('Darurat store error:', error)
      return response.status(500).json({ success: false, message: 'Terjadi kesalahan' })
    }
  }

  /**
   * GET /api/darurat/saya
   */
  async myAlerts({ auth, response }: HttpContext) {
    try {
      if (!auth.user) {
        return response.status(401).json({ success: false, message: 'Belum login' })
      }

      const alerts = await EmergencyAlert.query()
        .where('user_id', auth.user.id)
        .orderBy('created_at', 'desc')
        .limit(20)

      return response.json({
        success: true,
        data: alerts.map((a) => ({
          id: a.id,
          latitude: a.latitude,
          longitude: a.longitude,
          keterangan: a.keterangan,
          status: a.status,
          created_at: a.created_at.toISO(),
          resolved_at: a.resolved_at?.toISO() || null,
        })),
      })
    } catch (error) {
      console.error('My alerts error:', error)
      return response.status(500).json({ success: false, message: 'Terjadi kesalahan' })
    }
  }

  /**
   * GET /api/darurat/active
   */
  async active({ auth, response }: HttpContext) {
    try {
      if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
        return response.status(403).json({ success: false, message: 'Akses ditolak' })
      }

      const alerts = await EmergencyAlert.query()
        .where('status', 'active')
        .preload('user', (q) => q.select('id', 'nama', 'email', 'no_hp'))
        .orderBy('created_at', 'desc')

      return response.json({
        success: true,
        data: alerts.map((a) => ({
          id: a.id,
          latitude: a.latitude,
          longitude: a.longitude,
          keterangan: a.keterangan,
          status: a.status,
          created_at: a.created_at.toISO(),
          user: a.user
            ? { id: a.user.id, nama: a.user.nama, email: a.user.email, no_hp: a.user.no_hp }
            : null,
        })),
      })
    } catch (error) {
      console.error('Active alerts error:', error)
      return response.status(500).json({ success: false, message: 'Terjadi kesalahan' })
    }
  }

  /**
   * PATCH /api/darurat/:id/resolve
   */
  async resolve({ params, auth, response }: HttpContext) {
    try {
      if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
        return response.status(403).json({ success: false, message: 'Akses ditolak' })
      }

      const alert = await EmergencyAlert.findOrFail(params.id)

      if (alert.status !== 'active') {
        return response.status(400).json({
          success: false,
          message: 'Sinyal darurat ini sudah ditangani',
        })
      }

      alert.status = 'resolved'
      alert.resolved_by = auth.user.id
      alert.resolved_at = DateTime.now()
      await alert.save()

      // Notifikasi ke pengirim
      await Notifikasi.create({
        user_id: alert.user_id,
        type: 'info',
        title: 'Sinyal Darurat Ditangani',
        message: `Sinyal darurat Anda telah ditangani oleh ${auth.user.nama || 'petugas'}.`,
        data: { alert_id: alert.id, resolved_by: auth.user.id },
      })

      return response.json({
        success: true,
        message: 'Sinyal darurat telah ditangani',
        data: alert,
      })
    } catch (error) {
      console.error('Resolve alert error:', error)
      return response.status(500).json({ success: false, message: 'Terjadi kesalahan' })
    }
  }
}
