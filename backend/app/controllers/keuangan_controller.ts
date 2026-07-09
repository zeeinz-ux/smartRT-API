import { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import Pengeluaran from '#models/pengeluaran'

export default class KeuanganController {
  /**
   * GET /api/admin/keuangan/rekap?bulan=&tahun=
   */
  async rekap({ request, auth, response }: HttpContext) {
    try {
      if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
        return response.status(403).json({ success: false, message: 'Akses ditolak' })
      }

      const now = DateTime.now()
      const bulan = Number(request.input('bulan', 0))
      const tahun = Number(request.input('tahun', now.year))

      // Pemasukan dari iuran (unified)
      let iuranQuery = db.from('iurans')
        .leftJoin('kategori_iurans', 'kategori_iurans.id', 'iurans.kategori_id')
      if (bulan >= 1 && bulan <= 12) {
        iuranQuery = iuranQuery.where('iurans.bulan', bulan)
      }
      iuranQuery = iuranQuery.where('iurans.tahun', tahun).where('iurans.status', 'lunas')
        .select('iurans.*', 'kategori_iurans.nama as kategori_nama')
      const iuranRows = await iuranQuery
      const totalPemasukan = iuranRows.reduce((sum: number, r: any) => sum + Number(r.jumlah), 0)

      // Breakdown per kategori
      const pemasukanByKategori: Record<string, number> = {}
      for (const r of iuranRows) {
        const kate = r.kategori_nama || 'Unknown'
        pemasukanByKategori[kate] = (pemasukanByKategori[kate] || 0) + Number(r.jumlah)
      }

      // Pengeluaran
      let pengeluaranQuery = Pengeluaran.query()
      if (bulan >= 1 && bulan <= 12) {
        pengeluaranQuery = pengeluaranQuery.whereRaw('EXTRACT(MONTH FROM tanggal) = ?', [bulan])
      }
      pengeluaranQuery = pengeluaranQuery.whereRaw('EXTRACT(YEAR FROM tanggal) = ?', [tahun])
      const pengeluaranRows = await pengeluaranQuery
      const totalPengeluaran = pengeluaranRows.reduce((sum: number, p) => sum + Number(p.jumlah), 0)

      // Mutasi — gabung pemasukan & pengeluaran
      const mutasi: any[] = []

      for (const r of iuranRows) {
        mutasi.push({
          id: r.id,
          tipe: 'pemasukan',
          kategori: r.kategori_nama || 'Iuran',
          nama: `Pembayaran ${r.kategori_nama || 'iuran'}${r.bulan ? ` (${r.bulan}/${r.tahun})` : ` ${r.tahun}`}`,
          jumlah: Number(r.jumlah),
          tanggal: r.paid_at || r.created_at,
          warga_id: r.warga_id,
        })
      }

      for (const p of pengeluaranRows) {
        mutasi.push({
          id: p.id,
          tipe: 'pengeluaran',
          kategori: p.kategori,
          nama: p.nama,
          jumlah: Number(p.jumlah),
          tanggal: p.tanggal.toISO(),
          keterangan: p.keterangan,
        })
      }

      mutasi.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())

      // ── Chart data: pemasukan & pengeluaran per bulan ──
      const allIuranYear = await db.from('iurans').where('tahun', tahun).where('status', 'lunas')
      const allPengYear = await Pengeluaran.query().whereRaw('EXTRACT(YEAR FROM tanggal) = ?', [tahun])

      const pemasukanByMonth: Record<number, number> = {}
      const pengeluaranByMonth: Record<number, number> = {}
      for (let m = 1; m <= 12; m++) { pemasukanByMonth[m] = 0; pengeluaranByMonth[m] = 0 }

      for (const r of allIuranYear) {
        if (r.bulan) pemasukanByMonth[r.bulan] += Number(r.jumlah)
        else pemasukanByMonth[1] += Number(r.jumlah) // tahunan/insidental masuk bulan 1
      }
      for (const p of allPengYear) {
        const m = p.tanggal.month
        pengeluaranByMonth[m] += Number(p.jumlah)
      }

      const chartBulanan = Array.from({ length: 12 }, (_, i) => ({
        bulan: i + 1,
        pemasukan: pemasukanByMonth[i + 1],
        pengeluaran: pengeluaranByMonth[i + 1],
      }))

      // ── Chart data: pengeluaran per kategori ──
      const chartKategoriRaw: any[] = await Pengeluaran.query()
        .whereRaw('EXTRACT(YEAR FROM tanggal) = ?', [tahun])
        .select('kategori')
        .select(db.rawQuery('SUM(jumlah) as total').knexQuery)
        .groupBy('kategori')

      const chartKategori = chartKategoriRaw.map((r: any) => ({
        kategori: r.kategori,
        jumlah: Number(r.total),
      }))

      return response.json({
        success: true,
        data: {
          totalPemasukan,
          totalPengeluaran,
          saldo: totalPemasukan - totalPengeluaran,
          pemasukanByKategori,
          mutasi,
          chartBulanan,
          chartKategori,
        },
      })
    } catch (error) {
      console.error('Rekap keuangan error:', error)
      return response.status(500).json({
        success: false,
        message: 'Terjadi kesalahan',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * GET /api/admin/keuangan/pengeluaran?bulan=&tahun=&page=&limit=
   */
  async indexPengeluaran({ request, auth, response }: HttpContext) {
    try {
      if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
        return response.status(403).json({ success: false, message: 'Akses ditolak' })
      }

      const now = DateTime.now()
      const bulan = Number(request.input('bulan', 0))
      const tahun = Number(request.input('tahun', now.year))
      const page = Number(request.input('page', 1))
      const limit = Number(request.input('limit', 50))

      let query = Pengeluaran.query().orderBy('tanggal', 'desc')

      if (bulan >= 1 && bulan <= 12) {
        query = query.whereRaw('EXTRACT(MONTH FROM tanggal) = ?', [bulan])
      }
      query = query.whereRaw('EXTRACT(YEAR FROM tanggal) = ?', [tahun])

      const result = await query.paginate(page, limit)

      return response.json({
        success: true,
        data: result.all(),
        pagination: {
          page: result.currentPage,
          limit: result.perPage,
          total: result.total,
          totalPages: result.lastPage,
        },
      })
    } catch (error) {
      console.error('List pengeluaran error:', error)
      return response.status(500).json({ success: false, message: 'Terjadi kesalahan' })
    }
  }

  /**
   * POST /api/admin/keuangan/pengeluaran
   */
  async storePengeluaran({ request, auth, response }: HttpContext) {
    try {
      if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
        return response.status(403).json({ success: false, message: 'Akses ditolak' })
      }

      const { nama, jumlah, kategori, tanggal, keterangan } = request.only([
        'nama', 'jumlah', 'kategori', 'tanggal', 'keterangan',
      ])

      if (!nama || jumlah === undefined || !tanggal) {
        return response.status(400).json({
          success: false,
          message: 'nama, jumlah, dan tanggal wajib diisi',
        })
      }

      const pengeluaran = await Pengeluaran.create({
        nama,
        jumlah: Number(jumlah),
        kategori: kategori || 'Lainnya',
        tanggal: DateTime.fromISO(tanggal),
        keterangan: keterangan || null,
        created_by: auth.user.id,
      })

      return response.status(201).json({
        success: true,
        message: 'Pengeluaran berhasil dicatat',
        data: pengeluaran,
      })
    } catch (error) {
      console.error('Create pengeluaran error:', error)
      return response.status(500).json({ success: false, message: 'Terjadi kesalahan' })
    }
  }

  /**
   * PATCH /api/admin/keuangan/pengeluaran/:id
   */
  async updatePengeluaran({ params, request, auth, response }: HttpContext) {
    try {
      if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
        return response.status(403).json({ success: false, message: 'Akses ditolak' })
      }

      const pengeluaran = await Pengeluaran.findOrFail(params.id)
      const { nama, jumlah, kategori, tanggal, keterangan } = request.only([
        'nama', 'jumlah', 'kategori', 'tanggal', 'keterangan',
      ])

      if (nama !== undefined) pengeluaran.nama = nama
      if (jumlah !== undefined) pengeluaran.jumlah = Number(jumlah)
      if (kategori !== undefined) pengeluaran.kategori = kategori
      if (tanggal !== undefined) pengeluaran.tanggal = DateTime.fromISO(tanggal)
      if (keterangan !== undefined) pengeluaran.keterangan = keterangan

      await pengeluaran.save()

      return response.json({
        success: true,
        message: 'Pengeluaran berhasil diupdate',
        data: pengeluaran,
      })
    } catch (error) {
      console.error('Update pengeluaran error:', error)
      return response.status(500).json({ success: false, message: 'Terjadi kesalahan' })
    }
  }

  /**
   * DELETE /api/admin/keuangan/pengeluaran/:id
   */
  async destroyPengeluaran({ params, auth, response }: HttpContext) {
    try {
      if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'bendahara')) {
        return response.status(403).json({ success: false, message: 'Akses ditolak' })
      }

      const pengeluaran = await Pengeluaran.findOrFail(params.id)
      await pengeluaran.delete()

      return response.json({
        success: true,
        message: 'Pengeluaran berhasil dihapus',
      })
    } catch (error) {
      console.error('Delete pengeluaran error:', error)
      return response.status(500).json({ success: false, message: 'Terjadi kesalahan' })
    }
  }
}
