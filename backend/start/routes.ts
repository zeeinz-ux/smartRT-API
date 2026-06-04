import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
import AuthController from '#controllers/auth_controller'
import WargaController from '#controllers/warga_controller'
import AdminController from '#controllers/admin_controller'

// ─── Public Routes ───
router.group(() => {
  router.post('/auth/login', [AuthController, 'login'])
  router.post('/auth/logout', [AuthController, 'logout'])
  router.get('/auth/me', [AuthController, 'me'])
  // router.get('/auth/google/redirect', [AuthController, 'googleRedirect']) // nanti
}).prefix('/api')

// ─── Warga Routes (Auth Required) ───
router.group(() => {
  router.post('/warga/onboarding', [WargaController, 'onboarding'])
  router.get('/warga/profile', [WargaController, 'profile'])
  router.patch('/warga/profile', [WargaController, 'updateProfile'])
  router.get('/warga/dashboard', [WargaController, 'dashboard'])
}).prefix('/api').middleware(middleware.auth())

// ─── Admin Routes (Auth + Admin Role) ───
router.group(() => {
  // Dashboard stats
  router.get('/admin/dashboard', [AdminController, 'dashboard'])
  
  // Warga CRUD
  router.get('/admin/warga', [AdminController, 'listWarga'])
  router.post('/admin/warga', [AdminController, 'createWarga'])
  router.get('/admin/warga/:id', [AdminController, 'detailWarga'])
  router.patch('/admin/warga/:id', [AdminController, 'updateWarga'])
  router.delete('/admin/warga/:id', [AdminController, 'deleteWarga'])
  
  // Verifikasi
  router.post('/admin/warga/:id/verify', [AdminController, 'verifyWarga'])
  router.post('/admin/warga/:id/reject', [AdminController, 'rejectWarga'])
}).prefix('/api').middleware(middleware.auth())

export default router
