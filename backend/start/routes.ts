import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
import AuthController from '#controllers/auth_controller'
import WargaController from '#controllers/warga_controller'
import AdminController from '#controllers/admin_controller'
import SampahController from '#controllers/sampah_controller'
import QurbanController from '#controllers/qurban_controller'
import KeuanganController from '#controllers/keuangan_controller'
import LaporanController from '#controllers/laporan_controller'
import PengumumanController from '#controllers/pengumuman_controller'
import SuratController from '#controllers/surat_controller'
import SuratTemplateController from '#controllers/surat_template_controller'
import UploadController from '#controllers/upload_controller'
import DaruratController from '#controllers/darurat_controller'
import NotifikasiController from '#controllers/notifikasi_controller'

// ─── Public Routes ───
router.group(() => {
  router.post('/auth/login', [AuthController, 'login'])
  router.post('/auth/logout', [AuthController, 'logout'])
  router.get('/auth/me', [AuthController, 'me'])
  router.get('/auth/check-role', [AuthController, 'checkRole'])
  router.get('/auth/google/redirect', [AuthController, 'googleRedirect']).as('auth.google.redirect')
  router.get('/auth/google/callback', [AuthController, 'googleCallback']).as('auth.google.callback')
}).prefix('/api')

// ─── Warga Routes (Auth Required) ───
router.group(() => {
  router.post('/warga/onboarding', [WargaController, 'onboarding'])
  router.get('/warga/profile', [WargaController, 'profile'])
  router.patch('/warga/profile', [WargaController, 'updateProfile'])
  router.get('/warga/dashboard', [WargaController, 'dashboard'])

  // Laporan (warga)
  router.get('/warga/laporan', [LaporanController, 'index']).as('laporan.warga.index')
  router.post('/warga/laporan', [LaporanController, 'store']).as('laporan.warga.store')
  router.get('/warga/laporan/:id', [LaporanController, 'show']).as('laporan.warga.show')
  router.patch('/warga/laporan/:id', [LaporanController, 'update']).as('laporan.warga.update')

  // Pengumuman (warga — hanya yg published)
  router.get('/warga/pengumuman', [PengumumanController, 'index']).as('pengumuman.warga.index')

  // Surat (warga)
  router.get('/warga/surat', [SuratController, 'index']).as('surat.warga.index')
  router.post('/warga/surat', [SuratController, 'store']).as('surat.warga.store')

  // Upload file (auth required)
  router.post('/upload', [UploadController, 'image']).as('upload.image')

  // Ubah password sendiri
  router.patch('/auth/password', [AuthController, 'changePassword']).as('auth.password')
  router.post('/auth/verify-password', [AuthController, 'verifyPassword']).as('auth.verifyPassword')

  // Notifikasi
  router.get('/notifikasi', [NotifikasiController, 'index'])
  router.patch('/notifikasi/:id/read', [NotifikasiController, 'markRead'])
  router.patch('/notifikasi/read-all', [NotifikasiController, 'markAllRead'])
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
  router.post('/admin/warga/:id/deactivate', [AdminController, 'deactivateWarga'])
  
  // Verifikasi
  router.post('/admin/warga/:id/verify', [AdminController, 'verifyWarga'])
  router.post('/admin/warga/:id/reject', [AdminController, 'rejectWarga'])

  // Iuran Sampah
  router.get('/admin/sampah', [SampahController, 'index'])
  router.post('/admin/sampah', [SampahController, 'store'])
  router.patch('/admin/sampah/:id', [SampahController, 'update'])
  router.delete('/admin/sampah/:id', [SampahController, 'destroy'])

  // Iuran Qurban
  router.get('/admin/qurban', [QurbanController, 'index'])
  router.post('/admin/qurban', [QurbanController, 'store'])
  router.patch('/admin/qurban/:id', [QurbanController, 'update'])
  router.delete('/admin/qurban/:id', [QurbanController, 'destroy'])

  // Google Sheets
  router.post('/admin/sheets/setup', [AdminController, 'setupSheets'])

  // Keuangan
  router.get('/admin/keuangan/rekap', [KeuanganController, 'rekap'])
  router.get('/admin/keuangan/pengeluaran', [KeuanganController, 'indexPengeluaran'])
  router.post('/admin/keuangan/pengeluaran', [KeuanganController, 'storePengeluaran'])
  router.patch('/admin/keuangan/pengeluaran/:id', [KeuanganController, 'updatePengeluaran'])
  router.delete('/admin/keuangan/pengeluaran/:id', [KeuanganController, 'destroyPengeluaran'])

  // Laporan (admin)
  router.get('/admin/laporan', [LaporanController, 'index']).as('laporan.admin.index')
  router.post('/admin/laporan', [LaporanController, 'store']).as('laporan.admin.store')
  router.get('/admin/laporan/:id', [LaporanController, 'show']).as('laporan.admin.show')
  router.post('/admin/laporan/:id/tanggapi', [LaporanController, 'tanggapi']).as('laporan.admin.tanggapi')
  router.delete('/admin/laporan/:id', [LaporanController, 'destroy']).as('laporan.admin.destroy')

  // Pengumuman (admin)
  router.get('/admin/pengumuman', [PengumumanController, 'index']).as('pengumuman.admin.index')
  router.post('/admin/pengumuman', [PengumumanController, 'store']).as('pengumuman.admin.store')
  router.get('/admin/pengumuman/:id', [PengumumanController, 'show']).as('pengumuman.admin.show')
  router.patch('/admin/pengumuman/:id', [PengumumanController, 'update']).as('pengumuman.admin.update')
  router.delete('/admin/pengumuman/:id', [PengumumanController, 'destroy']).as('pengumuman.admin.destroy')

  // Template Surat (admin) — MUST be before :id routes
  router.get('/admin/surat/templates', [SuratTemplateController, 'index']).as('surat.template.index')
  router.post('/admin/surat/templates', [SuratTemplateController, 'store']).as('surat.template.store')
  router.delete('/admin/surat/templates/:id', [SuratTemplateController, 'destroy']).as('surat.template.destroy')

  // Surat (admin)
  router.get('/admin/surat', [SuratController, 'index']).as('surat.admin.index')
  router.post('/admin/surat', [SuratController, 'storeAsAdmin']).as('surat.admin.store')
  router.get('/admin/surat/:id', [SuratController, 'show']).as('surat.admin.show')
  router.post('/admin/surat/:id/approve', [SuratController, 'approve']).as('surat.admin.approve')
  router.post('/admin/surat/:id/reject', [SuratController, 'reject']).as('surat.admin.reject')
  router.delete('/admin/surat/:id', [SuratController, 'destroy']).as('surat.admin.destroy')

  // Darurat
  router.post('/darurat', [DaruratController, 'store']).as('darurat.store')
  router.get('/darurat/saya', [DaruratController, 'myAlerts']).as('darurat.saya')
  router.get('/darurat/active', [DaruratController, 'active']).as('darurat.active')
  router.patch('/darurat/:id/resolve', [DaruratController, 'resolve']).as('darurat.resolve')
}).prefix('/api').middleware(middleware.auth())

export default router
