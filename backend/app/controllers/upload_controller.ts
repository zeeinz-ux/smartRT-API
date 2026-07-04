import { HttpContext } from '@adonisjs/core/http'
import { v4 as uuid } from 'uuid'
import app from '@adonisjs/core/services/app'

export default class UploadController {
  async image({ request, response }: HttpContext) {
    try {
      const file = request.file('file', {
        size: '5mb',
        extnames: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'],
      })

      if (!file) {
        return response.status(400).json({ success: false, message: 'Tidak ada file yang diupload' })
      }

      if (file.hasErrors) {
        return response.status(400).json({
          success: false,
          message: file.errors[0]?.message || 'File tidak valid',
        })
      }

      const fileName = `${uuid()}.${file.extname}`
      const folder = 'uploads/pengumuman'
      const filePath = `${folder}/${fileName}`

      await file.move(app.publicPath(folder), { name: fileName })

      const url = `/${filePath.replace(/\\/g, '/')}`

      return response.json({
        success: true,
        message: 'File berhasil diupload',
        data: { url, fileName },
      })
    } catch (error) {
      console.error('Upload error:', error)
      return response.status(500).json({ success: false, message: 'Gagal upload file' })
    }
  }
}
