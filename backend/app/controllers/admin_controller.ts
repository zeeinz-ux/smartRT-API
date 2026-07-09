import { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import User from '#models/user'
import WargaProfile from '#models/warga_profile'
import db from '@adonisjs/lucid/services/db'
import GoogleSheetsService from '#services/google_sheets'

export default class AdminController {
  /**
   * GET /api/admin/warga
   * List semua warga dengan filter, search, pagination
   */
  async listWarga({ request, auth, response }: HttpContext) {
    try {
      const admin = auth.user
      if (!admin || (admin.role !== 'admin' && admin.role !== 'bendahara')) {
        return response.status(403).json({
          success: false,
          message: 'Akses ditolak.',
        })
      }

      const { search, status, verification_status, status_huni, role, page = 1, limit = 10 } = request.qs()

      let query = db.from('users')
        .leftJoin('warga_profiles', 'warga_profiles.user_id', 'users.id')
        .select(
          'users.id as user_id',
          'users.nama',
          'users.email',
          'users.no_hp',
          'users.role',
          'users.status as user_status',
          'warga_profiles.id as profile_id',
          'warga_profiles.nik',
          'warga_profiles.kk',
          'warga_profiles.alamat',
          'warga_profiles.no_rumah',
          'warga_profiles.status_huni',
          'warga_profiles.foto_ktp_url',
          'warga_profiles.verification_status',
          'warga_profiles.verified_at',
          'warga_profiles.rejection_reason',
          'users.created_at',
          'users.updated_at'
        )
        .whereNot('users.role', 'admin')

      if (role) {
        query = query.where('users.role', role)
      }

      if (search) {
        query = query.where((builder) => {
          builder
            .whereILike('users.nama', `%${search}%`)
            .orWhereILike('users.email', `%${search}%`)
            .orWhereILike('warga_profiles.nik', `%${search}%`)
        })
      }

      if (status) {
        query = query.where('users.status', status)
      }

      if (verification_status) {
        query = query.where('warga_profiles.verification_status', verification_status)
      }

      if (status_huni) {
        query = query.where('warga_profiles.status_huni', status_huni)
      }

      query = query.orderBy('users.created_at', 'desc')

      let countQuery = db.from('users')
        .leftJoin('warga_profiles', 'warga_profiles.user_id', 'users.id')
        .whereNot('users.role', 'admin')

      if (role) countQuery = countQuery.where('users.role', role)
      if (search) {
        countQuery = countQuery.where((builder) => {
          builder
            .whereILike('users.nama', `%${search}%`)
            .orWhereILike('users.email', `%${search}%`)
            .orWhereILike('warga_profiles.nik', `%${search}%`)
        })
      }
      if (status) countQuery = countQuery.where('users.status', status)
      if (verification_status) countQuery = countQuery.where('warga_profiles.verification_status', verification_status)
      if (status_huni) countQuery = countQuery.where('warga_profiles.status_huni', status_huni)

      const [countRow] = await countQuery.count('* as total')
      const total = Number(countRow?.total || 0)

      const wargaList = await query.limit(limit).offset((page - 1) * limit)

      return response.json({
        success: true,
        data: wargaList,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      })
    } catch (error) {
      console.error('List warga error:', error)
      return response.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil data warga',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * GET /api/admin/warga/:id
   */
  async detailWarga({ params, auth, response }: HttpContext) {
    try {
      const admin = auth.user
      if (!admin || admin.role !== 'admin') {
        return response.status(403).json({
          success: false,
          message: 'Akses ditolak.',
        })
      }

      const warga = await db.from('users')
        .leftJoin('warga_profiles', 'warga_profiles.user_id', 'users.id')
        .select(
          'users.id as user_id',
          'users.nama',
          'users.email',
          'users.no_hp',
          'users.role',
          'users.status as user_status',
          'users.foto_url',
          'warga_profiles.id as profile_id',
          'warga_profiles.nik',
          'warga_profiles.kk',
          'warga_profiles.alamat',
          'warga_profiles.no_rumah',
          'warga_profiles.status_huni',
          'warga_profiles.foto_ktp_url',
          'warga_profiles.verification_status',
          'warga_profiles.verified_at',
          'warga_profiles.rejection_reason',
          'warga_profiles.created_at as profile_created_at',
        )
        .where('users.id', params.id)
        .first()

      if (!warga) {
        return response.status(404).json({
          success: false,
          message: 'Warga tidak ditemukan',
        })
      }

      return response.json({
        success: true,
        data: warga,
      })
    } catch (error) {
      console.error('Detail warga error:', error)
      return response.status(500).json({
        success: false,
        message: 'Terjadi kesalahan',
      })
    }
  }

  /**
   * POST /api/admin/warga/:id/verify
   */
  async verifyWarga({ params, auth, response }: HttpContext) {
    try {
      const admin = auth.user
      if (!admin || admin.role !== 'admin') {
        return response.status(403).json({
          success: false,
          message: 'Akses ditolak.',
        })
      }

      const profile = await WargaProfile.findOrFail(params.id)
      const user = await User.findOrFail(profile.user_id)

      profile.verification_status = 'verified'
      profile.verified_at = DateTime.now()
      profile.verified_by = admin.id
      await profile.save()

      user.status = 'active'
      await user.save()

      try {
        await GoogleSheetsService.updateWarga(user.id, {
          nama: user.nama,
          email: user.email,
          no_hp: user.no_hp,
          nik: profile.nik,
          kk: profile.kk,
          alamat: profile.alamat,
          no_rumah: profile.no_rumah,
          status_huni: profile.status_huni,
          verification_status: profile.verification_status,
          verified_at: profile.verified_at?.toISO() || null,
          verified_by: profile.verified_by,
        })
      } catch (sheetError) {
        console.error('Google Sheets sync error (non-critical):', sheetError)
      }

      return response.json({
        success: true,
        message: `Warga ${user.nama} berhasil diverifikasi`,
        data: {
          id: profile.id,
          verification_status: profile.verification_status,
          verified_at: profile.verified_at,
        },
      })
    } catch (error) {
      console.error('Verify warga error:', error)
      return response.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat verifikasi',
      })
    }
  }

  /**
   * POST /api/admin/warga/:id/reject
   */
  async rejectWarga({ params, request, auth, response }: HttpContext) {
    try {
      const admin = auth.user
      if (!admin || admin.role !== 'admin') {
        return response.status(403).json({
          success: false,
          message: 'Akses ditolak.',
        })
      }

      const { reason } = request.only(['reason'])

      const profile = await WargaProfile.findOrFail(params.id)
      const user = await User.findOrFail(profile.user_id)

      profile.verification_status = 'rejected'
      profile.rejection_reason = reason || 'Tidak memenuhi syarat'
      profile.verified_at = DateTime.now()
      profile.verified_by = admin.id
      await profile.save()

      user.status = 'suspended'
      await user.save()

      return response.json({
        success: true,
        message: `Verifikasi warga ${user.nama} ditolak`,
        data: {
          id: profile.id,
          verification_status: profile.verification_status,
          rejection_reason: profile.rejection_reason,
        },
      })
    } catch (error) {
      console.error('Reject warga error:', error)
      return response.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat menolak verifikasi',
      })
    }
  }

  /**
   * POST /api/admin/warga
   * Tambah akun warga basic oleh admin. Warga lanjut onboarding isi profil sendiri.
   */
  async createWarga({ request, auth, response }: HttpContext) {
    try {
      const admin = auth.user
      if (!admin || admin.role !== 'admin') {
        return response.status(403).json({
          success: false,
          message: 'Akses ditolak.',
        })
      }

      const { nama, email, no_hp, password, role } = request.only([
        'nama',
        'email',
        'no_hp',
        'password',
        'role',
      ])

      if (!nama || !email || !password || !no_hp) {
        return response.status(400).json({
          success: false,
          message: 'Nama, email, no. HP, dan password wajib diisi',
        })
      }

      const validRoles = ['warga', 'bendahara', 'admin']
      const selectedRole = role && validRoles.includes(role) ? role : 'warga'

      if (selectedRole === 'admin' && admin.role !== 'admin') {
        return response.status(403).json({
          success: false,
          message: 'Hanya admin utama yang bisa membuat akun admin',
        })
      }

      const cleanNoHp = (no_hp || '').toString().trim()
      if (!/^\d{10,15}$/.test(cleanNoHp.replace(/\D/g, ''))) {
        return response.status(400).json({
          success: false,
          message: 'Nomor HP tidak valid',
        })
      }

      const existingEmail = await User.findBy('email', email.toLowerCase())
      if (existingEmail) {
        return response.status(409).json({
          success: false,
          message: 'Email sudah terdaftar',
        })
      }

      const isWarga = selectedRole === 'warga'
      const user = await User.create({
        email: email.toLowerCase(),
        password_hash: password,
        nama,
        no_hp: cleanNoHp,
        role: selectedRole,
        status: isWarga ? 'pending' : 'active',
      })

      try {
        await GoogleSheetsService.appendWarga({
          id: user.id,
          nama: user.nama,
          email: user.email,
          no_hp: user.no_hp,
          nik: null,
          kk: null,
          alamat: null,
          no_rumah: null,
          status_huni: null,
          verification_status: 'pending',
          verified_at: null,
          verified_by: null,
        })
      } catch (sheetError) {
        console.error('Google Sheets sync error (non-critical):', sheetError)
      }

      return response.status(201).json({
        success: true,
        message: isWarga
          ? 'Akun warga berhasil dibuat. Warga harus login dan mengisi profil untuk mengaktifkan akun.'
          : `Akun ${selectedRole} berhasil dibuat.`,
        data: {
          user_id: user.id,
          nama: user.nama,
          email: user.email,
          role: selectedRole,
        },
      })
    } catch (error) {
      console.error('Create warga error:', error)
      return response.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat menambah warga',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * PATCH /api/admin/warga/:id
   */
  async updateWarga({ params, request, auth, response }: HttpContext) {
    try {
      const admin = auth.user
      if (!admin || admin.role !== 'admin') {
        return response.status(403).json({
          success: false,
          message: 'Akses ditolak.',
        })
      }

      const user = await User.findOrFail(params.id)
      const profile = await WargaProfile.findBy('user_id', user.id)

      const {
        nama,
        no_hp,
        alamat,
        no_rumah,
        status_huni,
        user_status,
      } = request.only([
        'nama',
        'no_hp',
        'alamat',
        'no_rumah',
        'status_huni',
        'user_status',
      ])

      if (nama) user.nama = nama
      if (no_hp) user.no_hp = no_hp
      if (user_status) user.status = user_status
      await user.save()

      if (profile) {
        if (alamat) profile.alamat = alamat
        if (no_rumah) profile.no_rumah = no_rumah
        if (status_huni) profile.status_huni = status_huni
        await profile.save()
      }

      try {
        await GoogleSheetsService.updateWarga(user.id, {
          nama: nama || undefined,
          no_hp: no_hp || undefined,
          ...(profile ? {
            alamat: alamat || undefined,
            no_rumah: no_rumah || undefined,
            status_huni: status_huni || undefined,
          } : {}),
        })
      } catch (sheetError) {
        console.error('Google Sheets update error (non-critical):', sheetError)
      }

      return response.json({
        success: true,
        message: 'Data warga berhasil diupdate',
        data: {
          id: user.id,
          nama: user.nama,
        },
      })
    } catch (error) {
      console.error('Update warga error:', error)
      return response.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat update warga',
      })
    }
  }

  /**
   * DELETE /api/admin/warga/:id
   * Hard delete — hapus permanen user + profile dari database
   */
  async deleteWarga({ params, auth, response }: HttpContext) {
    try {
      const admin = auth.user
      if (!admin || admin.role !== 'admin') {
        return response.status(403).json({
          success: false,
          message: 'Akses ditolak.',
        })
      }

      const user = await User.findOrFail(params.id)
      const nama = user.nama

      // Hapus iuran terkait
      await db.from('iurans').where('warga_id', user.id).delete()

      // Hapus profile jika ada
      const profile = await WargaProfile.findBy('user_id', user.id)
      if (profile) {
        await profile.delete()
      }

      try {
        await GoogleSheetsService.deleteWarga(user.id)
      } catch (sheetError) {
        console.error('Google Sheets delete error (non-critical):', sheetError)
      }

      // Hapus user
      await user.delete()

      return response.json({
        success: true,
        message: `Warga ${nama} berhasil dihapus permanen`,
      })
    } catch (error) {
      console.error('Delete warga error:', error)
      return response.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat menghapus warga',
      })
    }
  }

  /**
   * POST /api/admin/warga/:id/deactivate
   * Soft deactivate — nonaktifkan akun tanpa hapus data
   */
  async deactivateWarga({ params, auth, response }: HttpContext) {
    try {
      const admin = auth.user
      if (!admin || admin.role !== 'admin') {
        return response.status(403).json({
          success: false,
          message: 'Akses ditolak.',
        })
      }

      const user = await User.findOrFail(params.id)

      user.status = 'suspended'
      await user.save()

      const profile = await WargaProfile.findBy('user_id', user.id)
      if (profile) {
        try {
          await GoogleSheetsService.deleteWarga(user.id)
        } catch (sheetError) {
          console.error('Google Sheets sync error (non-critical):', sheetError)
        }
      }

      return response.json({
        success: true,
        message: `Warga ${user.nama} berhasil dinonaktifkan`,
      })
    } catch (error) {
      console.error('Deactivate warga error:', error)
      return response.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat menonaktifkan warga',
      })
    }
  }

  /**
   * GET /api/admin/dashboard
   */
  async dashboard({ auth, response }: HttpContext) {
    try {
      const admin = auth.user
      if (!admin || admin.role !== 'admin') {
        return response.status(403).json({
          success: false,
          message: 'Akses ditolak.',
        })
      }

      const [{ total: totalWarga }] = await db.from('users').where('role', 'warga').count('* as total')
      const [{ total: wargaPending }] = await db.from('warga_profiles').where('verification_status', 'pending').count('* as total')
      const [{ total: wargaVerified }] = await db.from('warga_profiles').where('verification_status', 'verified').count('* as total')
      const [{ total: wargaRejected }] = await db.from('warga_profiles').where('verification_status', 'rejected').count('* as total')

      // Warga yang belum onboarding (ada di users tapi belum punya profile)
      const [{ total: wargaNonOnboarded }] = await db.from('users')
        .leftJoin('warga_profiles', 'warga_profiles.user_id', 'users.id')
        .where('users.role', 'warga')
        .whereNull('warga_profiles.id')
        .count('* as total')

      // Iuran stats
      const now = DateTime.now()
      const [{ total: iuranPending }] = await db.from('iurans').where('status', 'pending').count('* as total')
      const [{ total: iuranBulanIni }] = await db.from('iurans')
        .where('bulan', now.month)
        .where('tahun', now.year)
        .where('status', 'lunas')
        .count('* as total')
      const [{ total: totalWargaWithIuran }] = await db.from('iurans')
        .where('bulan', now.month)
        .where('tahun', now.year)
        .distinct('warga_id')
        .count('* as total')
      const [{ sum: totalTunggakan }] = await db.from('iurans')
        .whereIn('status', ['belum_lunas', 'pending'])
        .sum('jumlah as sum')

      const recentPending = await db.from('warga_profiles')
        .join('users', 'warga_profiles.user_id', 'users.id')
        .select('warga_profiles.id', 'users.nama', 'users.email', 'warga_profiles.created_at')
        .where('warga_profiles.verification_status', 'pending')
        .orderBy('warga_profiles.created_at', 'desc')
        .limit(5)

      // Warga belum onboarding — terbaru
      const recentNonOnboarded = await db.from('users')
        .leftJoin('warga_profiles', 'warga_profiles.user_id', 'users.id')
        .select('users.id', 'users.nama', 'users.email', 'users.created_at')
        .where('users.role', 'warga')
        .whereNull('warga_profiles.id')
        .orderBy('users.created_at', 'desc')
        .limit(5)

      const persenKepatuhan = Number(totalWargaWithIuran) > 0
        ? Math.round((Number(iuranBulanIni) / Number(totalWargaWithIuran)) * 100)
        : 0

      return response.json({
        success: true,
        stats: {
          totalWarga: Number(totalWarga || 0),
          wargaPending: Number(wargaPending || 0),
          wargaVerified: Number(wargaVerified || 0),
          wargaRejected: Number(wargaRejected || 0),
          wargaNonOnboarded: Number(wargaNonOnboarded || 0),
          iuranPending: Number(iuranPending || 0),
          totalTunggakan: Number(totalTunggakan || 0),
          kepatuhanBulanIni: persenKepatuhan,
        },
        recentPending,
        recentNonOnboarded,
      })
    } catch (error) {
      console.error('Dashboard error:', error)
      return response.status(500).json({
        success: false,
        message: 'Terjadi kesalahan',
      })
    }
  }

  /**
   * POST /api/admin/sheets/setup
   */
  async setupSheets({ auth, response }: HttpContext) {
    try {
      const admin = auth.user
      if (!admin || admin.role !== 'admin') {
        return response.status(403).json({
          success: false,
          message: 'Akses ditolak.',
        })
      }

      const success = await GoogleSheetsService.setupHeaders()
        
      if (success) {
        return response.json({
          success: true,
          message: 'Spreadsheet headers berhasil di-setup',
        })
      } else {
        return response.status(500).json({
          success: false,
          message: 'Gagal setup spreadsheet. Cek konfigurasi Google Sheets.',
        })
      }
    } catch (error) {
      console.error('Setup sheets error:', error)
      return response.status(500).json({
        success: false,
        message: 'Terjadi kesalahan',
      })
    }
  }
}