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
      if (!admin || admin.role !== 'admin') {
        return response.status(403).json({
          success: false,
          message: 'Akses ditolak. Hanya admin yang bisa mengakses.',
        })
      }

      const { search, status, verification_status, status_huni, page = 1, limit = 10 } = request.qs()

      let query = db.from('warga_profiles')
        .join('users', 'warga_profiles.user_id', 'users.id')
        .select(
          'warga_profiles.id',
          'warga_profiles.user_id',
          'users.nama',
          'users.email',
          'users.no_hp',
          'users.status as user_status',
          'warga_profiles.nik',
          'warga_profiles.kk',
          'warga_profiles.alamat',
          'warga_profiles.no_rumah',
          'warga_profiles.status_huni',
          'warga_profiles.foto_ktp_url',
          'warga_profiles.verification_status',
          'warga_profiles.verified_at',
          'warga_profiles.rejection_reason',
          'warga_profiles.created_at',
          'warga_profiles.updated_at'
        )
        .where('users.role', 'warga')

      if (search) {
        query = query.where((builder) => {
          builder
            .whereILike('users.nama', `%${search}%`)
            .orWhereILike('users.email', `%${search}%`)
            .orWhere('warga_profiles.nik', 'like', `%${search}%`)
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

      query = query.orderBy('warga_profiles.created_at', 'desc')

      // ✅ FIX: Count pakai separate query tanpa select columns
      let countQuery = db.from('warga_profiles')
        .join('users', 'warga_profiles.user_id', 'users.id')
        .where('users.role', 'warga')
      
      if (search) {
        countQuery = countQuery.where((builder) => {
          builder
            .whereILike('users.nama', `%${search}%`)
            .orWhereILike('users.email', `%${search}%`)
            .orWhere('warga_profiles.nik', 'like', `%${search}%`)
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

      const warga = await db.from('warga_profiles')
        .join('users', 'warga_profiles.user_id', 'users.id')
        .select(
          'warga_profiles.*',
          'users.nama',
          'users.email',
          'users.no_hp',
          'users.status as user_status',
          'users.foto_url'
        )
        .where('warga_profiles.id', params.id)
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
        await GoogleSheetsService.appendWarga({
          id: profile.id,
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
   * Tambah warga manual oleh admin + sync ke Google Sheets
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

      const {
        nama,
        email,
        no_hp,
        password,
        nik,
        kk,
        alamat,
        no_rumah,
        status_huni,
      } = request.only([
        'nama',
        'email',
        'no_hp',
        'password',
        'nik',
        'kk',
        'alamat',
        'no_rumah',
        'status_huni',
      ])

      // ✅ FIX: Trim & clean NIK/KK
      const cleanNik = (nik || '').toString().trim()
      const cleanKk = (kk || '').toString().trim()

      if (!nama || !email || !password || !cleanNik || !cleanKk) {
        return response.status(400).json({
          success: false,
          message: 'Nama, email, password, NIK, dan KK wajib diisi',
        })
      }

      if (!/^\d{16}$/.test(cleanNik)) {
        return response.status(400).json({
          success: false,
          message: `NIK harus 16 digit angka (diterima: ${cleanNik.length} digit)`,
        })
      }

      if (!/^\d{16}$/.test(cleanKk)) {
        return response.status(400).json({
          success: false,
          message: 'KK harus 16 digit angka',
        })
      }

      const existingEmail = await User.findBy('email', email.toLowerCase())
      if (existingEmail) {
        return response.status(409).json({
          success: false,
          message: 'Email sudah terdaftar',
        })
      }

      const existingNik = await WargaProfile.findBy('nik', cleanNik)
      if (existingNik) {
        return response.status(409).json({
          success: false,
          message: 'NIK sudah terdaftar',
        })
      }

      const user = await User.create({
        email: email.toLowerCase(),
        password_hash: password,
        nama,
        no_hp,
        role: 'warga',
        status: 'active',
      })

      const profile = await WargaProfile.create({
        user_id: user.id,
        nik: cleanNik,
        kk: cleanKk,
        alamat,
        no_rumah,
        status_huni,
        verification_status: 'verified',
        verified_at: DateTime.now(),
        verified_by: admin.id,
      })

      try {
        await GoogleSheetsService.appendWarga({
          id: profile.id,
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

      return response.status(201).json({
        success: true,
        message: 'Warga berhasil ditambahkan',
        data: {
          user_id: user.id,
          profile_id: profile.id,
          nama: user.nama,
          email: user.email,
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

      const profile = await WargaProfile.findOrFail(params.id)
      const user = await User.findOrFail(profile.user_id)

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

      if (alamat) profile.alamat = alamat
      if (no_rumah) profile.no_rumah = no_rumah
      if (status_huni) profile.status_huni = status_huni
      await profile.save()

      try {
        await GoogleSheetsService.updateWarga(profile.id, {
          nama: nama || undefined,
          no_hp: no_hp || undefined,
          alamat: alamat || undefined,
          no_rumah: no_rumah || undefined,
          status_huni: status_huni || undefined,
        })
      } catch (sheetError) {
        console.error('Google Sheets update error (non-critical):', sheetError)
      }

      return response.json({
        success: true,
        message: 'Data warga berhasil diupdate',
        data: {
          id: profile.id,
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

      const profile = await WargaProfile.findOrFail(params.id)
      const user = await User.findOrFail(profile.user_id)

      user.status = 'suspended'
      await user.save()

      try {
        await GoogleSheetsService.deleteWarga(profile.id)
      } catch (sheetError) {
        console.error('Google Sheets delete error (non-critical):', sheetError)
      }

      return response.json({
        success: true,
        message: `Warga ${user.nama} berhasil dinonaktifkan`,
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

      const [totalWargaRow] = await db.rawQuery(
        `SELECT COUNT(*) as total FROM users WHERE role = 'warga'`
      )
      const [wargaPendingRow] = await db.rawQuery(
        `SELECT COUNT(*) as total FROM warga_profiles WHERE verification_status = 'pending'`
      )
      const [wargaVerifiedRow] = await db.rawQuery(
        `SELECT COUNT(*) as total FROM warga_profiles WHERE verification_status = 'verified'`
      )
      const [wargaRejectedRow] = await db.rawQuery(
        `SELECT COUNT(*) as total FROM warga_profiles WHERE verification_status = 'rejected'`
      )

      const recentPending = await db.from('warga_profiles')
        .join('users', 'warga_profiles.user_id', 'users.id')
        .select('warga_profiles.id', 'users.nama', 'users.email', 'warga_profiles.created_at')
        .where('warga_profiles.verification_status', 'pending')
        .orderBy('warga_profiles.created_at', 'desc')
        .limit(5)

      return response.json({
        success: true,
        stats: {
          totalWarga: Number(totalWargaRow?.total || 0),
          wargaPending: Number(wargaPendingRow?.total || 0),
          wargaVerified: Number(wargaVerifiedRow?.total || 0),
          wargaRejected: Number(wargaRejectedRow?.total || 0),
        },
        recentPending,
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