import { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import WargaProfile from '#models/warga_profile'
import env from '#start/env'

export default class AuthController {
  /**
   * POST /api/auth/login
   * Email & Password login with role selection
   */
  async login({ request, response, auth }: HttpContext) {
    try {
      const { email, password, role } = request.only(['email', 'password', 'role'])

      // Validasi input
      if (!email || !password) {
        return response.status(400).json({
          success: false,
          message: 'Email dan password harus diisi',
        })
      }

      if (!role) {
        return response.status(400).json({
          success: false,
          message: 'Role harus dipilih',
        })
      }

      const validRoles = ['admin', 'bendahara', 'warga']
      if (!validRoles.includes(role)) {
        return response.status(400).json({
          success: false,
          message: 'Role tidak valid',
        })
      }

      // Cari user berdasarkan email
      const user = await User.findBy('email', email.toLowerCase())

      if (!user) {
        return response.status(401).json({
          success: false,
          message: 'Email atau password salah',
        })
      }

      // Validasi role yang dipilih sesuai dengan role akun
      if (user.role !== role) {
        return response.status(403).json({
          success: false,
          message: 'Role yang dipilih tidak sesuai dengan akun Anda',
        })
      }

      // Cek status akun
      if (user.status === 'suspended') {
        return response.status(403).json({
          success: false,
          message: 'Akun Anda telah dibekukan. Hubungi Admin.',
        })
      }

      // Verifikasi password
      const isPasswordValid = await user.verifyPassword(password)

      if (!isPasswordValid) {
        return response.status(401).json({
          success: false,
          message: 'Email atau password salah',
        })
      }

      // Auto-migrasi: hash scrypt → argon2id
      if (user.password_hash && user.password_hash.startsWith('$scrypt$')) {
        user.password_hash = password
        await user.save()
      }

      // Untuk warga yang pending verification, cegah login
      // Kecuali mereka belum punya profil (belum onboarding)
      let profile: any = null
      if (user.role === 'warga') {
        profile = await WargaProfile.findBy('user_id', user.id)
      }

      if (user.role === 'warga' && user.status === 'pending' && profile) {
        return response.status(403).json({
          success: false,
          message: 'Akun Anda masih menunggu verifikasi Admin. Silakan tunggu 1×24 jam.',
          requiresVerification: true,
        })
      }

      // Cek apakah warga sudah onboarding
      const requiresOnboarding = user.role === 'warga' && !profile

      // Buat session
      await auth.use('web').login(user)

      // Return user data + requiresOnboarding
      return response.status(200).json({
        success: true,
        message: 'Login berhasil',
        user: {
          id: user.id,
          email: user.email,
          nama: user.nama,
          role: user.role,
          status: user.status,
          foto_url: user.foto_url,
        },
        requiresOnboarding, // ✅ Frontend pakai ini untuk redirect
      })
    } catch (error) {
      console.error('Login error:', error)
      return response.status(500).json({
        success: false,
        message: 'Terjadi kesalahan. Silakan coba lagi.',
      })
    }
  }

  /**
   * GET /api/auth/check-role?email=xxx
   * Cek role akun berdasarkan email (untuk frontend pre-fill dropdown)
   */
  async checkRole({ request, response }: HttpContext) {
    try {
      const email = request.input('email')

      if (!email) {
        return response.status(400).json({
          success: false,
          message: 'Email harus diisi',
        })
      }

      const user = await User.findBy('email', email.toLowerCase())

      if (!user) {
        return response.json({
          success: true,
          exists: false,
          role: null,
        })
      }

      return response.json({
        success: true,
        exists: true,
        role: user.role,
        nama: user.nama,
      })
    } catch (error) {
      console.error('Check role error:', error)
      return response.status(500).json({
        success: false,
        message: 'Terjadi kesalahan',
      })
    }
  }

  /**
   * GET /api/auth/me
   * Get current logged-in user info
   */
  async me({ auth, response }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user!

      // ✅ TAMBAHAN: Cek apakah warga sudah onboarding
      let requiresOnboarding = false
      if (user.role === 'warga') {
        const profile = await WargaProfile.findBy('user_id', user.id)
        requiresOnboarding = !profile
      }

      return response.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          nama: user.nama,
          role: user.role,
          status: user.status,
          foto_url: user.foto_url,
        },
        requiresOnboarding, // ✅ Frontend pakai ini saat refresh
      })
    } catch (_error) {
      return response.status(401).json({
        success: false,
        message: 'Tidak ada user yang login',
      })
    }
  }

  /**
   * POST /api/auth/logout
   * Logout user
   */
  async logout({ auth, response }: HttpContext) {
    try {
      await auth.use('web').logout()
      return response.json({
        success: true,
        message: 'Logout berhasil',
      })
    } catch (error) {
      console.error('Logout error:', error)
      return response.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat logout',
      })
    }
  }

  /**
   * PATCH /api/auth/password
   * Ubah password sendiri
   */
  async changePassword({ request, auth, response }: HttpContext) {
    try {
      if (!auth.user) {
        return response.status(401).json({ success: false, message: 'Belum login' })
      }

      const { current_password, new_password, confirm_password } = request.only([
        'current_password',
        'new_password',
        'confirm_password',
      ])

      if (!current_password || !new_password || !confirm_password) {
        return response.status(400).json({
          success: false,
          message: 'Semua field harus diisi',
        })
      }

      if (new_password.length < 6) {
        return response.status(400).json({
          success: false,
          message: 'Password baru minimal 6 karakter',
        })
      }

      if (new_password !== confirm_password) {
        return response.status(400).json({
          success: false,
          message: 'Konfirmasi password tidak cocok',
        })
      }

      const isValid = await auth.user.verifyPassword(current_password)
      if (!isValid) {
        return response.status(400).json({
          success: false,
          message: 'Password saat ini salah',
        })
      }

      auth.user.password_hash = new_password
      await auth.user.save()

      return response.json({
        success: true,
        message: 'Password berhasil diubah',
      })
    } catch (error) {
      console.error('Change password error:', error)
      return response.status(500).json({ success: false, message: 'Terjadi kesalahan' })
    }
  }

  /**
   * POST /api/auth/verify-password
   * Cek apakah password saat ini benar (real-time validation)
   */
  async verifyPassword({ request, auth, response }: HttpContext) {
    try {
      if (!auth.user) {
        return response.status(401).json({ success: false, message: 'Belum login' })
      }

      const { password } = request.only(['password'])
      if (!password) {
        return response.json({ success: true, valid: false })
      }

      const isValid = await auth.user.verifyPassword(password)
      return response.json({ success: true, valid: isValid })
    } catch (error) {
      console.error('Verify password error:', error)
      return response.status(500).json({ success: false, message: 'Terjadi kesalahan' })
    }
  }

  /**
   * GET /api/auth/google/redirect
   * Redirect ke Google OAuth
   */
  async googleRedirect({ ally, response }: HttpContext) {
    try {
      const google = ally.use('google') as any
      await google.redirect()
    } catch (error) {
      console.error('Google redirect error:', error)
      return response.status(500).json({ success: false, message: 'Gagal menghubungkan ke Google' })
    }
  }

  /**
   * GET /api/auth/google/callback
   * Handle Google OAuth callback
   */
  async googleCallback({ ally, auth, response }: HttpContext) {
    try {
      const google = ally.use('google') as any

      if (google.accessDenied()) {
        return response.redirect(`${env.get('FRONTEND_URL')}/login?error=access_denied`, false)
      }
      if (google.stateMisMatch()) {
        return response.redirect(`${env.get('FRONTEND_URL')}/login?error=state_mismatch`, false)
      }
      if (google.hasError()) {
        return response.redirect(`${env.get('FRONTEND_URL')}/login?error=${google.getError()}`, false)
      }

      const googleUser: any = await google.user()

      if (!googleUser.email) {
        return response.redirect(`${env.get('FRONTEND_URL')}/login?error=no_email`, false)
      }

      let user = await User.findBy('email', googleUser.email)

      if (!user) {
        return response.redirect(`${env.get('FRONTEND_URL')}/login?error=email_not_registered`, false)
      }

      user.google_id = googleUser.id
      if (googleUser.avatarUrl) user.foto_url = googleUser.avatarUrl
      await user.save()

      await auth.use('web').login(user)

      const roleHome: Record<string, string> = {
        admin: '/admin/dashboard',
        bendahara: '/bendahara/dashboard',
        warga: '/warga/dashboard',
      }
      const frontendUrl = env.get('FRONTEND_URL')
      const redirectTo = roleHome[user.role] || '/warga/dashboard'

      return response.redirect(`${frontendUrl}${redirectTo}`, false)
    } catch (error) {
      console.error('Google callback error:', error)
      return response.redirect(`${env.get('FRONTEND_URL')}/login?error=server_error`, false)
    }
  }
}