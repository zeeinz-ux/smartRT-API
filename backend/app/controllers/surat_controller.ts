import { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import app from '@adonisjs/core/services/app'
import fs from 'node:fs/promises'
import path from 'node:path'
import QRCode from 'qrcode'
import SuratPengantar from '#models/surat_pengantar'
import SuratTemplate from '#models/surat_template'
import User from '#models/user'

let PdfPrinter: any = null
async function getPdfPrinter() {
  if (!PdfPrinter) {
    // @ts-expect-error
    const mod = await import('pdfmake/js/Printer.js')
    PdfPrinter = mod.default.default
  }
  return PdfPrinter
}

const JENIS_SURAT: Record<string, string> = {
  domisili: 'Surat Keterangan Domisili',
  kk: 'Surat Pengantar Kartu Keluarga',
  ktp: 'Surat Pengantar KTP',
  tidak_mampu: 'Surat Keterangan Tidak Mampu',
  usaha: 'Surat Keterangan Usaha',
  izin_keramaian: 'Surat Izin Keramaian',
  lainnya: 'Surat Keterangan Lainnya',
}

function labelJenis(key: string): string {
  return JENIS_SURAT[key] || key
}

export default class SuratController {
  async index({ request, auth, response }: HttpContext) {
    try {
      if (!auth.user) return response.status(401).json({ success: false, message: 'Belum login' })

      const page = Number(request.input('page', 1))
      const limit = Number(request.input('limit', 50))
      const isAdmin = auth.user.role === 'admin' || auth.user.role === 'bendahara'

      let query = SuratPengantar.query()
        .preload('user', (q) => q.select('id', 'nama', 'email'))
        .preload('creator', (q) => q.select('id', 'nama'))
        .orderBy('created_at', 'desc')

      if (isAdmin && request.input('mine') === 'true') {
        query = query.where('created_by', auth.user.id)
      }

      if (!isAdmin) {
        query = query.where('user_id', auth.user.id)
      }

      const result = await query.paginate(page, limit)

      const mapped = result.all().map((s) => ({
        id: s.id,
        jenis_surat: s.jenis_surat,
        jenis_label: labelJenis(s.jenis_surat),
        keperluan: s.keperluan,
        keterangan: s.keterangan,
        status: s.status,
        nomor_surat: s.nomor_surat,
        file_pdf: s.file_pdf,
        qr_code: s.qr_code,
        alasan_tolak: s.alasan_tolak,
        approved_at: s.approved_at?.toISO() || null,
        created_at: s.created_at.toISO(),
        updated_at: s.updated_at.toISO(),
        user: s.user ? { id: s.user.id, nama: s.user.nama, email: s.user.email } : null,
        creator: s.creator ? { id: s.creator.id, nama: s.creator.nama } : null,
      }))

      return response.json({ success: true, data: mapped, pagination: { page: result.currentPage, limit: result.perPage, total: result.total, totalPages: result.lastPage } })
    } catch (error) {
      console.error('List surat error:', error)
      return response.status(500).json({ success: false, message: 'Terjadi kesalahan' })
    }
  }

  async store({ request, auth, response }: HttpContext) {
    try {
      if (!auth.user) return response.status(401).json({ success: false, message: 'Belum login' })

      const { jenis_surat, keperluan, keterangan } = request.only(['jenis_surat', 'keperluan', 'keterangan'])

      if (!jenis_surat || !keperluan) {
        return response.status(400).json({ success: false, message: 'Jenis surat dan keperluan wajib diisi' })
      }

      const surat = await SuratPengantar.create({
        user_id: auth.user.id,
        jenis_surat,
        keperluan,
        keterangan: keterangan || null,
        status: 'pending',
      })

      return response.status(201).json({ success: true, message: 'Pengajuan surat berhasil dikirim', data: surat })
    } catch (error) {
      console.error('Create surat error:', error)
      return response.status(500).json({ success: false, message: 'Terjadi kesalahan' })
    }
  }

  async storeAsAdmin({ request, auth, response }: HttpContext) {
    try {
      if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
        return response.status(403).json({ success: false, message: 'Akses ditolak' })
      }

      const { user_id, jenis_surat, keperluan, keterangan } = request.only(['user_id', 'jenis_surat', 'keperluan', 'keterangan'])

      if (!user_id || !jenis_surat || !keperluan) {
        return response.status(400).json({ success: false, message: 'Warga, jenis surat, dan keperluan wajib diisi' })
      }

      const warga = await User.find(user_id)
      if (!warga) return response.status(404).json({ success: false, message: 'Warga tidak ditemukan' })

      const surat = await SuratPengantar.create({
        user_id,
        jenis_surat,
        keperluan,
        keterangan: keterangan || null,
        created_by: auth.user.id,
        status: 'pending',
      })

      return response.status(201).json({ success: true, message: 'Surat berhasil dibuat untuk warga', data: surat })
    } catch (error) {
      console.error('Admin create surat error:', error)
      return response.status(500).json({ success: false, message: 'Terjadi kesalahan' })
    }
  }

  async show({ params, auth, response }: HttpContext) {
    try {
      if (!auth.user) return response.status(401).json({ success: false, message: 'Belum login' })

      const surat = await SuratPengantar.query()
        .where('id', params.id)
        .preload('user', (q) => q.select('id', 'nama', 'email'))
        .preload('approver', (q) => q.select('id', 'nama'))
        .first()

      if (!surat) return response.status(404).json({ success: false, message: 'Surat tidak ditemukan' })

      const isAdmin = auth.user.role === 'admin' || auth.user.role === 'bendahara'
      if (!isAdmin && surat.user_id !== auth.user.id) {
        return response.status(403).json({ success: false, message: 'Akses ditolak' })
      }

      return response.json({
        success: true,
        data: {
          id: surat.id,
          jenis_surat: surat.jenis_surat,
          jenis_label: labelJenis(surat.jenis_surat),
          keperluan: surat.keperluan,
          keterangan: surat.keterangan,
          status: surat.status,
          nomor_surat: surat.nomor_surat,
          file_pdf: surat.file_pdf,
          qr_code: surat.qr_code,
          alasan_tolak: surat.alasan_tolak,
          approved_at: surat.approved_at?.toISO() || null,
          created_at: surat.created_at.toISO(),
          updated_at: surat.updated_at.toISO(),
          user: surat.user ? { id: surat.user.id, nama: surat.user.nama, email: surat.user.email } : null,
          approver: surat.approver ? { id: surat.approver.id, nama: surat.approver.nama } : null,
        },
      })
    } catch (error) {
      console.error('Detail surat error:', error)
      return response.status(500).json({ success: false, message: 'Terjadi kesalahan' })
    }
  }

  async approve({ params, request, auth, response }: HttpContext) {
    try {
      if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
        return response.status(403).json({ success: false, message: 'Akses ditolak' })
      }

      const surat = await SuratPengantar.query()
        .where('id', params.id)
        .preload('user', (q) => q.select('id', 'nama', 'email', 'no_hp'))
        .first()

      if (!surat) return response.status(404).json({ success: false, message: 'Surat tidak ditemukan' })
      if (surat.status !== 'pending') return response.status(400).json({ success: false, message: 'Surat sudah diproses' })

      const nomorSurat = `RT003/${String(await this.#getNextNomor()).padStart(3, '0')}/BKPM/${DateTime.now().year}`
      const baseUrl = `${request.protocol()}://${request.host()}`
      const verifyUrl = `${baseUrl}/verifikasi-surat/${surat.id}`

      const folder = 'uploads/surat'
      const publicPath = app.publicPath(folder)
      await fs.mkdir(publicPath, { recursive: true })

      const qrFileName = `qr_${surat.id}.png`
      await QRCode.toFile(path.join(publicPath, qrFileName), verifyUrl, { width: 300 })

      const pdfFileName = `surat_${surat.id}.pdf`
      const pdfOutputPath = path.join(publicPath, pdfFileName)

      const template = await SuratTemplate.findBy('jenis_surat', surat.jenis_surat)
      if (template) {
        const templateSrc = app.publicPath(template.file_path.replace(/^\//, ''))
        await fs.copyFile(templateSrc, pdfOutputPath)
      } else {
        try {
          await this.#generatePdf(surat, nomorSurat, pdfOutputPath)
        } catch (pdfError) {
          console.error('PDF generation failed (non-fatal):', pdfError)
        }
      }

      surat.status = 'disetujui'
      surat.nomor_surat = nomorSurat
      surat.file_pdf = `/${folder}/${pdfFileName}`
      surat.qr_code = `/${folder}/${qrFileName}`
      surat.approved_by = auth.user.id
      surat.approved_at = DateTime.now()
      await surat.save()

      return response.json({ success: true, message: 'Surat berhasil disetujui', data: surat })
    } catch (error) {
      console.error('Approve surat error:', error)
      return response.status(500).json({ success: false, message: 'Gagal menyetujui surat' })
    }
  }

  async reject({ params, request, auth, response }: HttpContext) {
    try {
      if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
        return response.status(403).json({ success: false, message: 'Akses ditolak' })
      }

      const surat = await SuratPengantar.findOrFail(params.id)
      if (surat.status !== 'pending') return response.status(400).json({ success: false, message: 'Surat sudah diproses' })

      const { alasan } = request.only(['alasan'])
      surat.status = 'ditolak'
      surat.alasan_tolak = alasan || 'Tidak memenuhi syarat'
      surat.approved_by = auth.user.id
      surat.approved_at = DateTime.now()
      await surat.save()

      return response.json({ success: true, message: 'Surat ditolak', data: surat })
    } catch (error) {
      console.error('Reject surat error:', error)
      return response.status(500).json({ success: false, message: 'Gagal menolak surat' })
    }
  }

  async destroy({ params, auth, response }: HttpContext) {
    try {
      if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
        return response.status(403).json({ success: false, message: 'Akses ditolak' })
      }

      const surat = await SuratPengantar.findOrFail(params.id)
      await surat.delete()

      return response.json({ success: true, message: 'Surat berhasil dihapus' })
    } catch (error) {
      console.error('Delete surat error:', error)
      return response.status(500).json({ success: false, message: 'Gagal menghapus surat' })
    }
  }

  async #getNextNomor(): Promise<number> {
    const last = await SuratPengantar.query()
      .whereNotNull('nomor_surat')
      .orderBy('created_at', 'desc')
      .first()
    if (!last?.nomor_surat) return 1
    const parts = last.nomor_surat.split('/')
    const num = parseInt(parts[1], 10)
    return isNaN(num) ? 1 : num + 1
  }

  async #generatePdf(surat: SuratPengantar, nomorSurat: string, outputPath: string) {
    const userSurat = await User.query().where('id', surat.user_id).preload('wargaProfile').firstOrFail()
    const fonts = {
      Roboto: { normal: 'Helvetica', bold: 'Helvetica-Bold', italics: 'Helvetica-Oblique', bolditalics: 'Helvetica-BoldOblique' },
    }
    const printer = new (await getPdfPrinter())(fonts, null, { resolve() {}, resolved() { return Promise.resolve() } })

    const docDefinition: any = {
      pageSize: 'A4',
      pageMargins: [60, 60, 60, 60],
      content: [
        { text: 'KOP SURAT RT 003', style: 'header', alignment: 'center', margin: [0, 0, 0, 4] },
        { text: 'KELURAHAN/DESA ……………………… KECAMATAN ………………………', style: 'subheader', alignment: 'center', margin: [0, 0, 0, 20] },
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 490, y2: 0, lineWidth: 2 }], margin: [0, 0, 0, 20] },

        { text: `Nomor: ${nomorSurat}`, alignment: 'center', margin: [0, 0, 0, 4] },
        { text: 'Lampiran: -', alignment: 'center', margin: [0, 0, 0, 4] },
        { text: 'Perihal: Surat Pengantar', alignment: 'center', margin: [0, 0, 0, 20] },

        { text: 'Kepada Yth.', margin: [0, 0, 0, 2] },
        { text: '……….……………………', margin: [0, 0, 0, 2] },
        { text: 'di Tempat', margin: [0, 0, 0, 16] },

        { text: 'Dengan hormat,', margin: [0, 0, 0, 8] },
        { text: `Yang bertanda tangan di bawah ini Ketua RT 003, menerangkan bahwa:`, margin: [0, 0, 0, 12] },

        { text: `Nama: ${userSurat?.nama || '-'}`, margin: [0, 0, 0, 4] },
        { text: `NIK: ${userSurat?.wargaProfile?.nik || '-'}`, margin: [0, 0, 0, 4] },
        { text: `Email: ${userSurat?.email || '-'}`, margin: [0, 0, 0, 4] },
        { text: `No. HP: ${userSurat?.no_hp || '-'}`, margin: [0, 0, 0, 16] },

        { text: `Bahwa yang bersangkutan benar adalah warga RT 003 dan memerlukan ${labelJenis(surat.jenis_surat)} dengan keperluan:`, margin: [0, 0, 0, 8] },
        { text: surat.keperluan, bold: true, margin: [0, 0, 0, 12] },
        ...(surat.keterangan ? [{ text: `Keterangan: ${surat.keterangan}`, margin: [0, 0, 0, 12] }] : []),

        { text: 'Demikian surat pengantar ini dibuat untuk dipergunakan sebagaimana mestinya.', margin: [0, 0, 0, 24] },

        { columns: [
          { width: '*', text: '' },
          { width: 'auto', stack: [
            { text: `Tangerang, ${DateTime.now().setLocale('id').toFormat('d MMMM yyyy')}`, alignment: 'right', margin: [0, 0, 0, 4] },
            { text: 'Ketua RT 003', alignment: 'right', margin: [0, 0, 0, 40] },
            { text: '( ………………………… )', alignment: 'right' },
          ]},
        ]},
      ],
      styles: {
        header: { fontSize: 14, bold: true },
        subheader: { fontSize: 10, italics: true },
      },
    }

    return new Promise<void>(async (resolve, reject) => {
      try {
        const pdfDoc = await printer.createPdfKitDocument(docDefinition)
        const chunks: Buffer[] = []
        pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk))
        pdfDoc.on('end', async () => {
          await fs.writeFile(outputPath, Buffer.concat(chunks))
          resolve()
        })
        pdfDoc.on('error', reject)
        pdfDoc.end()
      } catch (e) { reject(e) }
    })
  }
}
