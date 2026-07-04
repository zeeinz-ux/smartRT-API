import { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Notifikasi from '#models/notifikasi'

export default class NotifikasiController {
  async index({ auth, response }: HttpContext) {
    try {
      if (!auth.user) {
        return response.status(401).json({ success: false, message: 'Belum login' })
      }

      const notifs = await Notifikasi.query()
        .where('user_id', auth.user.id)
        .orderBy('created_at', 'desc')
        .limit(20)

      const unreadCount = await Notifikasi.query()
        .where('user_id', auth.user.id)
        .whereNull('read_at')
        .count('* as total')

      return response.json({
        success: true,
        data: notifs.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          data: n.data,
          read: !!n.read_at,
          created_at: n.created_at.toISO(),
        })),
        unread_count: Number(unreadCount[0].$extras.total) || 0,
      })
    } catch (error) {
      console.error('List notifikasi error:', error)
      return response.status(500).json({ success: false, message: 'Terjadi kesalahan' })
    }
  }

  async markRead({ params, auth, response }: HttpContext) {
    try {
      if (!auth.user) {
        return response.status(401).json({ success: false, message: 'Belum login' })
      }

      const notif = await Notifikasi.query()
        .where('id', params.id)
        .where('user_id', auth.user.id)
        .first()

      if (!notif) {
        return response.status(404).json({ success: false, message: 'Notifikasi tidak ditemukan' })
      }

      notif.read_at = DateTime.now()
      await notif.save()

      return response.json({ success: true, message: 'Notifikasi telah dibaca' })
    } catch (error) {
      console.error('Mark read notifikasi error:', error)
      return response.status(500).json({ success: false, message: 'Terjadi kesalahan' })
    }
  }

  async markAllRead({ auth, response }: HttpContext) {
    try {
      if (!auth.user) {
        return response.status(401).json({ success: false, message: 'Belum login' })
      }

      await Notifikasi.query()
        .where('user_id', auth.user.id)
        .whereNull('read_at')
        .update({ read_at: DateTime.now().toSQL() })

      return response.json({ success: true, message: 'Semua notifikasi telah dibaca' })
    } catch (error) {
      console.error('Mark all read notifikasi error:', error)
      return response.status(500).json({ success: false, message: 'Terjadi kesalahan' })
    }
  }
}
