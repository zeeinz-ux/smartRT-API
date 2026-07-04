import { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import fs from 'node:fs/promises'
import SuratTemplate from '#models/surat_template'

const JENIS_SURAT: Record<string, string> = {
  domisili: 'Surat Keterangan Domisili',
  kk: 'Surat Pengantar Kartu Keluarga',
  ktp: 'Surat Pengantar KTP',
  tidak_mampu: 'Surat Keterangan Tidak Mampu',
  usaha: 'Surat Keterangan Usaha',
  izin_keramaian: 'Surat Izin Keramaian',
  lainnya: 'Surat Keterangan Lainnya',
}

export default class SuratTemplateController {
  async index({ auth, response }: HttpContext) {
    try {
      if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
        return response.status(403).json({ success: false, message: 'Akses ditolak' })
      }
      const templates = await SuratTemplate.all()
      const mapped = templates.map((t) => ({
        id: t.id,
        jenis_surat: t.jenis_surat,
        jenis_label: JENIS_SURAT[t.jenis_surat] || t.jenis_surat,
        file_path: t.file_path,
        original_name: t.original_name,
      }))
      return response.json({ success: true, data: mapped })
    } catch (error) {
      console.error('List template error:', error)
      return response.status(500).json({ success: false, message: 'Terjadi kesalahan' })
    }
  }

  async store({ request, auth, response }: HttpContext) {
    try {
      if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
        return response.status(403).json({ success: false, message: 'Akses ditolak' })
      }

      const jenis_surat = request.input('jenis_surat')
      if (!jenis_surat || !JENIS_SURAT[jenis_surat]) {
        return response.status(400).json({ success: false, message: 'Jenis surat tidak valid' })
      }

      const file = request.file('file', { extnames: ['pdf'], size: '5mb' })
      if (!file) {
        return response.status(400).json({ success: false, message: 'File PDF wajib diupload' })
      }
      if (!file.isValid) {
        return response.status(400).json({ success: false, message: file.errors?.[0]?.message || 'File tidak valid' })
      }

      const folder = 'uploads/surat/templates'
      const publicPath = app.publicPath(folder)
      await fs.mkdir(publicPath, { recursive: true })

      const fileName = `template_${jenis_surat}.pdf`
      await file.move(publicPath, { name: fileName, overwrite: true })

      const existing = await SuratTemplate.findBy('jenis_surat', jenis_surat)
      if (existing) {
        existing.file_path = `/${folder}/${fileName}`
        existing.original_name = file.clientName
        await existing.save()
        return response.json({ success: true, message: 'Template diperbarui', data: existing })
      }

      const template = await SuratTemplate.create({
        jenis_surat,
        file_path: `/${folder}/${fileName}`,
        original_name: file.clientName,
      })

      return response.status(201).json({ success: true, message: 'Template berhasil diupload', data: template })
    } catch (error) {
      console.error('Upload template error:', error)
      return response.status(500).json({ success: false, message: 'Gagal upload template' })
    }
  }

  async destroy({ params, auth, response }: HttpContext) {
    try {
      if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
        return response.status(403).json({ success: false, message: 'Akses ditolak' })
      }

      const template = await SuratTemplate.find(params.id)
      if (!template) return response.status(404).json({ success: false, message: 'Template tidak ditemukan' })

      const filePath = app.publicPath(template.file_path.replace(/^\//, ''))
      await fs.unlink(filePath).catch(() => {})
      await template.delete()

      return response.json({ success: true, message: 'Template dihapus' })
    } catch (error) {
      console.error('Delete template error:', error)
      return response.status(500).json({ success: false, message: 'Gagal hapus template' })
    }
  }
}
