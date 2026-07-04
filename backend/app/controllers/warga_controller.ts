import { HttpContext } from '@adonisjs/core/http'
import cuid from 'cuid'
import WargaProfile from '#models/warga_profile'
import { validateNIK, validateKK } from '#utils/kependudukan'

export default class WargaController {
  /**
   * POST /api/warga/onboarding
   */
  async onboarding({ request, auth, response }: HttpContext) {
    try {
      const user = auth.user
      if (!user) {
        return response.status(401).json({
          success: false,
          message: 'Harus login terlebih dahulu',
        })
      }

      if (user.role !== 'warga') {
        return response.status(403).json({
          success: false,
          message: 'Hanya warga yang bisa melakukan onboarding',
        })
      }

      const existingProfile = await WargaProfile.findBy('user_id', user.id)
      if (existingProfile) {
        return response.status(400).json({
          success: false,
          message: 'Profil sudah pernah dibuat sebelumnya',
        })
      }

      const {
        nama_lengkap,
        nik,
        kk,
        no_hp,
        alamat,
        no_rumah,
        status_huni,
      } = request.only([
        'nama_lengkap',
        'nik',
        'kk',
        'no_hp',
        'alamat',
        'no_rumah',
        'status_huni',
      ])

      // ✅ FIX: Trim & clean semua input
      const cleanNik = (nik || '').toString().trim()
      const cleanKk = (kk || '').toString().trim()
      const cleanNama = (nama_lengkap || '').toString().trim()
      const cleanNoHp = (no_hp || '').toString().trim()
      const cleanAlamat = (alamat || '').toString().trim()
      const cleanNoRumah = (no_rumah || '').toString().trim()

      if (!cleanNama || !cleanNik || !cleanKk || !cleanNoHp || !cleanAlamat || !cleanNoRumah || !status_huni) {
        return response.status(400).json({
          success: false,
          message: 'Semua field wajib diisi',
        })
      }

      if (cleanNik === cleanKk) {
        return response.status(400).json({
          success: false,
          message: 'NIK dan Nomor KK tidak boleh sama',
        })
      }

      if (!/^\d{16}$/.test(cleanNik)) {
        return response.status(400).json({
          success: false,
          message: `NIK harus 16 digit angka (diterima: ${cleanNik.length} digit)`,
        })
      }

      const nikResult = validateNIK(cleanNik)
      if (!nikResult.valid) {
        return response.status(400).json({
          success: false,
          message: `NIK tidak valid: ${nikResult.message}`,
        })
      }

      if (!/^\d{16}$/.test(cleanKk)) {
        return response.status(400).json({
          success: false,
          message: 'Nomor KK harus 16 digit angka',
        })
      }

      const kkResult = validateKK(cleanKk)
      if (!kkResult.valid) {
        return response.status(400).json({
          success: false,
          message: `Nomor KK tidak valid: ${kkResult.message}`,
        })
      }

      if (!/^\d{10,15}$/.test(cleanNoHp.replace(/\D/g, ''))) {
        return response.status(400).json({
          success: false,
          message: 'Nomor HP tidak valid',
        })
      }

      const existingNik = await WargaProfile.findBy('nik', cleanNik)
      if (existingNik) {
        return response.status(409).json({
          success: false,
          message: 'NIK sudah terdaftar. Hubungi Admin jika ini kesalahan.',
        })
      }

      user.nama = cleanNama
      user.no_hp = cleanNoHp
      user.status = 'active'
      await user.save()

      const fotoKtpFile = request.file('foto_ktp', {
        size: '5mb',
        extnames: ['jpg', 'jpeg', 'png'],
      })

      let fotoKtpUrl: string | null = null

      if (fotoKtpFile) {
        if (!fotoKtpFile.isValid) {
          return response.status(400).json({
            success: false,
            message: 'File foto KTP tidak valid. Format: JPG/PNG, max 5MB.',
            errors: fotoKtpFile.errors,
          })
        }

        fotoKtpUrl = `https://storage.example.com/ktp/${user.id}/${cuid()}.jpg`
      } else {
        return response.status(400).json({
          success: false,
          message: 'Foto KTP wajib diupload',
        })
      }

      const wargaProfile = await WargaProfile.create({
        user_id: user.id,
        nik: cleanNik,
        kk: cleanKk,
        alamat: cleanAlamat,
        no_rumah: cleanNoRumah,
        status_huni,
        foto_ktp_url: fotoKtpUrl,
        verification_status: 'pending',
      })

      console.log(`✅ Onboarding warga: ${user.nama} (${user.email})`)

      return response.status(201).json({
        success: true,
        message: 'Profil berhasil dibuat. Menunggu verifikasi Admin.',
        data: {
          profile_id: wargaProfile.id,
          verification_status: wargaProfile.verification_status,
        },
      })
    } catch (error) {
      console.error('Onboarding error:', error)
      return response.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat membuat profil',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * GET /api/warga/profile
   */
  async profile({ auth, response }: HttpContext) {
    try {
      const user = auth.user!
      const profile = await WargaProfile.findBy('user_id', user.id)

      if (!profile) {
        return response.json({
          success: true,
          profile: null,
          requiresOnboarding: true,
        })
      }

      return response.json({
        success: true,
        profile: {
          id: profile.id,
          nik: profile.nik,
          kk: profile.kk,
          alamat: profile.alamat,
          no_rumah: profile.no_rumah,
          status_huni: profile.status_huni,
          foto_ktp_url: profile.foto_ktp_url,
          verification_status: profile.verification_status,
          verified_at: profile.verified_at,
          rejection_reason: profile.rejection_reason,
        },
        requiresOnboarding: false,
      })
    } catch (error) {
      console.error('Get profile error:', error)
      return response.status(500).json({
        success: false,
        message: 'Terjadi kesalahan',
      })
    }
  }

  /**
   * PATCH /api/warga/profile
   */
  async updateProfile({ request, auth, response }: HttpContext) {
    try {
      const user = auth.user!
      const profile = await WargaProfile.findBy('user_id', user.id)

      if (!profile) {
        return response.status(404).json({
          success: false,
          message: 'Profil tidak ditemukan',
        })
      }

      const { alamat, no_rumah, status_huni } = request.only([
        'alamat',
        'no_rumah',
        'status_huni',
      ])

      if (alamat) profile.alamat = alamat
      if (no_rumah) profile.no_rumah = no_rumah
      if (status_huni) profile.status_huni = status_huni

      await profile.save()

      return response.json({
        success: true,
        message: 'Profil berhasil diupdate',
      })
    } catch (error) {
      console.error('Update profile error:', error)
      return response.status(500).json({
        success: false,
        message: 'Terjadi kesalahan',
      })
    }
  }

  /**
   * GET /api/warga/dashboard
   */
  async dashboard({ auth, response }: HttpContext) {
    try {
      const user = auth.user!
      const profile = await WargaProfile.findBy('user_id', user.id)

      return response.json({
        success: true,
        dashboard: {
          user_id: user.id,
          nama: user.nama,
          role: user.role,
          verification_status: profile?.verification_status || 'not_registered',
          aktifTagihan: [],
          suratPending: [],
          laporanDraft: [],
        },
      })
    } catch (error) {
      console.error('Dashboard error:', error)
      return response.status(500).json({
        success: false,
        message: 'Terjadi kesalahan',
      })
    }
  }
}