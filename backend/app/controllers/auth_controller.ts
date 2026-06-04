import { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import WargaProfile from '#models/warga_profile'

export default class AuthController {
  /**
   * POST /api/auth/login
   * Email & Password login
   */
  async login({ request, response, auth }: HttpContext) {
    try {
      const { email, password, stayLoggedIn } = request.only(['email', 'password', 'stayLoggedIn'])

      // Validasi input
      if (!email || !password) {
        return response.status(400).json({
          success: false,
          message: 'Email dan password harus diisi',
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

      // Untuk warga yang pending verification, cegah login
      if (user.role === 'warga' && user.status === 'pending') {
        return response.status(403).json({
          success: false,
          message: 'Akun Anda masih menunggu verifikasi Admin. Silakan tunggu 1×24 jam.',
          requiresVerification: true,
        })
      }

      // ✅ TAMBAHAN: Cek apakah warga sudah onboarding
      let requiresOnboarding = false
      if (user.role === 'warga') {
        const profile = await WargaProfile.findBy('user_id', user.id)
        requiresOnboarding = !profile
      }

      // Buat session
      await auth.use('web').login(user, stayLoggedIn === true)

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
}