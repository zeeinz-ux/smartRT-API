import fs from 'node:fs'
import path from 'node:path'
import env from '#start/env'
import { google } from 'googleapis'
import { JWT } from 'google-auth-library'

class GoogleSheetsService {
  private auth: any = null
  private sheets: any = null
  private spreadsheetId: string = ''
  private initialized: boolean = false

  constructor() {
    this.spreadsheetId = env.get('GOOGLE_SHEET_ID', '')
    const serviceAccountKeyPath = env.get('GOOGLE_SERVICE_ACCOUNT_KEY_PATH', '')

    if (!this.spreadsheetId || !serviceAccountKeyPath) {
      console.warn('⚠️ Google Sheets not configured.')
      return
    }

    try {
      const absolutePath = path.resolve(process.cwd(), serviceAccountKeyPath.replace('./', ''))
      const fileContent = fs.readFileSync(absolutePath, 'utf-8')
      const keyFile = JSON.parse(fileContent)

      this.auth = new JWT({
        email: keyFile.client_email,
        key: keyFile.private_key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      })

      this.sheets = google.sheets({ version: 'v4', auth: this.auth })
      this.initialized = true
      console.log('✅ Google Sheets service initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize Google Sheets. Check path:', serviceAccountKeyPath)
      console.error(error)
    }
  }

  isAvailable(): boolean {
    return this.initialized && this.sheets !== null
  }

  /**
   * Cari row index berdasarkan UUID (kolom B)
   */
  private async findRowByUuid(uuid: string): Promise<number | null> {
    if (!this.isAvailable()) return null

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Data Warga!B:B',
      })

      const rows = response.data.values || []
      for (let i = 0; i < rows.length; i++) {
        if ((rows[i][0] || '').toString().trim() === uuid) {
          return i + 1
        }
      }
      return null
    } catch (error) {
      console.error('❌ Failed to find row by UUID:', error)
      return null
    }
  }

  /**
   * Cari nomor urut berikutnya — isi gap dari data yg dihapus
   */
  private async getNextAvailableNo(): Promise<string> {
    if (!this.isAvailable()) return '001'

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Data Warga!A:A',
      })

      const rows = response.data.values || []
      const numbers = new Set<number>()

      for (let i = 1; i < rows.length; i++) {
        const val = (rows[i][0] || '').toString().trim()
        if (val) {
          const num = Number.parseInt(val, 10)
          if (!Number.isNaN(num)) numbers.add(num)
        }
      }

      // Cari gap terkecil
      let next = 1
      while (numbers.has(next)) {
        next++
      }

      return String(next).padStart(3, '0')
    } catch (error) {
      console.error('❌ Failed to get next available number:', error)
      return '001'
    }
  }

  async appendWarga(data: {
    id: string
    nama: string
    email: string
    no_hp: string | null
    nik: string | null
    kk: string | null
    alamat: string | null
    no_rumah: string | null
    status_huni: string | null
    verification_status: string
    verified_at: string | null
    verified_by: string | null
  }): Promise<boolean> {
    if (!this.isAvailable()) {
      console.warn('Google Sheets not available, skipping sync')
      return false
    }

    try {
      const no = await this.getNextAvailableNo()
      const row = [
        no,
        data.id,
        data.nama,
        data.email,
        data.no_hp || '',
        data.nik || '',
        data.kk || '',
        data.alamat || '',
        data.no_rumah || '',
        data.status_huni || '',
        data.verification_status,
        data.verified_at || '',
        data.verified_by || '',
        new Date().toISOString(),
      ]

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Data Warga!A2',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [row] },
      })

      console.log(`✅ Warga ${data.nama} synced to Google Sheets (No. ${no})`)
      return true
    } catch (error) {
      console.error('❌ Failed to sync to Google Sheets:', error)
      return false
    }
  }

  /**
   * Update data warga yang sudah ada di Google Sheets
   */
  async updateWarga(
    uuid: string,
    data: {
      nama?: string
      email?: string
      no_hp?: string | null
      nik?: string | null
      kk?: string | null
      alamat?: string | null
      no_rumah?: string | null
      status_huni?: string | null
      verification_status?: string
      verified_at?: string | null
      verified_by?: string | null
    }
  ): Promise<boolean> {
    if (!this.isAvailable()) {
      console.warn('Google Sheets not available, skipping update')
      return false
    }

    try {
      const rowIndex = await this.findRowByUuid(uuid)
      if (!rowIndex) {
        console.warn(`⚠️ Warga UUID ${uuid} tidak ditemukan di Google Sheets. Melakukan append...`)
        return this.appendWarga({
          id: uuid,
          nama: data.nama || '',
          email: data.email || '',
          no_hp: data.no_hp || null,
          nik: data.nik || null,
          kk: data.kk || null,
          alamat: data.alamat || null,
          no_rumah: data.no_rumah || null,
          status_huni: data.status_huni || null,
          verification_status: data.verification_status || 'verified',
          verified_at: data.verified_at || null,
          verified_by: data.verified_by || null,
        })
      }

      const oldData = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `Data Warga!A${rowIndex}:N${rowIndex}`,
      })

      const oldRow = oldData.data.values?.[0] || []
      const newRow = [
        oldRow[0] ?? '',  // No — pertahankan nomor lama
        uuid,
        data.nama ?? oldRow[2] ?? '',
        data.email ?? oldRow[3] ?? '',
        data.no_hp ?? oldRow[4] ?? '',
        data.nik ?? oldRow[5] ?? '',
        data.kk ?? oldRow[6] ?? '',
        data.alamat ?? oldRow[7] ?? '',
        data.no_rumah ?? oldRow[8] ?? '',
        data.status_huni ?? oldRow[9] ?? '',
        data.verification_status ?? oldRow[10] ?? '',
        data.verified_at ?? oldRow[11] ?? '',
        data.verified_by ?? oldRow[12] ?? '',
        new Date().toISOString(),
      ]

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `Data Warga!A${rowIndex}:N${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [newRow] },
      })

      console.log(`✅ Warga ${data.nama || uuid} updated in Google Sheets`)
      return true
    } catch (error) {
      console.error('❌ Failed to update Google Sheets:', error)
      return false
    }
  }

  /**
   * Hapus data warga dari Google Sheets (clear row)
   */
  async deleteWarga(uuid: string): Promise<boolean> {
    if (!this.isAvailable()) {
      console.warn('Google Sheets not available, skipping delete')
      return false
    }

    try {
      const rowIndex = await this.findRowByUuid(uuid)
      if (!rowIndex) {
        console.warn(`⚠️ Warga UUID ${uuid} tidak ditemukan di Google Sheets`)
        return false
      }

      const emptyRow = Array(14).fill('')
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `Data Warga!A${rowIndex}:N${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [emptyRow] },
      })

      console.log(`✅ Warga ${uuid} removed from Google Sheets`)
      return true
    } catch (error) {
      console.error('❌ Failed to delete from Google Sheets:', error)
      return false
    }
  }

  /**
   * Catat pembayaran iuran sampah ke sheet "Iuran Sampah"
   */
  async appendSampah(data: {
    id: string
    warga: string
    bulan: number
    tahun: number
    jumlah: number
    status: string
    metode: string | null
    paid_at: string | null
  }): Promise<boolean> {
    if (!this.isAvailable()) {
      console.warn('Google Sheets not available, skipping sampah sync')
      return false
    }

    try {
      const sheetTitle = 'Iuran Sampah'
      const row = [
        data.id,
        data.warga,
        `Sampah ${data.bulan}/${data.tahun}`,
        data.jumlah,
        data.status,
        data.metode || '',
        data.paid_at || '',
        new Date().toISOString(),
      ]

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetTitle}!A2`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [row] },
      })

      console.log(`✅ Pembayaran sampah ${data.warga} synced to Google Sheets`)
      return true
    } catch (error) {
      console.error('❌ Failed to sync sampah to Google Sheets:', error)
      return false
    }
  }

  /**
   * Setup headers untuk sheet "Iuran Sampah"
   */
  async setupIuranSampahHeaders(): Promise<boolean> {
    if (!this.isAvailable()) return false

    try {
      const headers = [['ID', 'Warga', 'Keterangan', 'Jumlah', 'Status', 'Metode', 'Tanggal Bayar', 'Timestamp Sync']]
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: 'Iuran Sampah!A1:H1',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: headers },
      })
      console.log('✅ Iuran Sampah sheet headers setup complete')
      return true
    } catch (error) {
      console.error('❌ Failed to setup Iuran Sampah headers:', error)
      return false
    }
  }

  /**
   * Catat pembayaran iuran qurban ke sheet "Iuran Qurban"
   */
  async appendQurban(data: {
    id: string
    warga: string
    tahun: number
    jumlah: number
    status: string
    metode: string | null
    paid_at: string | null
  }): Promise<boolean> {
    if (!this.isAvailable()) {
      console.warn('Google Sheets not available, skipping qurban sync')
      return false
    }

    try {
      const sheetTitle = 'Iuran Qurban'
      const row = [
        data.id,
        data.warga,
        `Qurban ${data.tahun}`,
        data.jumlah,
        data.status,
        data.metode || '',
        data.paid_at || '',
        new Date().toISOString(),
      ]

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetTitle}!A2`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [row] },
      })

      console.log(`✅ Pembayaran qurban ${data.warga} synced to Google Sheets`)
      return true
    } catch (error) {
      console.error('❌ Failed to sync qurban to Google Sheets:', error)
      return false
    }
  }

  /**
   * Setup headers untuk sheet "Iuran Qurban"
   */
  async setupIuranQurbanHeaders(): Promise<boolean> {
    if (!this.isAvailable()) return false

    try {
      const headers = [['ID', 'Warga', 'Keterangan', 'Jumlah', 'Status', 'Metode', 'Tanggal Bayar', 'Timestamp Sync']]
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: 'Iuran Qurban!A1:H1',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: headers },
      })
      console.log('✅ Iuran Qurban sheet headers setup complete')
      return true
    } catch (error) {
      console.error('❌ Failed to setup Iuran Qurban headers:', error)
      return false
    }
  }

  async setupHeaders(): Promise<boolean> {
    if (!this.isAvailable()) return false

    try {
      const headers = [['No', 'UUID', 'Nama', 'Email', 'No HP', 'NIK', 'KK', 'Alamat', 'No Rumah', 'Status Huni', 'Status Verifikasi', 'Terverifikasi', 'Diverifikasi Oleh', 'Timestamp Sync']]

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: 'Data Warga!A1:N1',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: headers },
      })

      // Format kolom A (No) sebagai plain text biar 001 tidak jadi 1
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: 0,
                  startRowIndex: 1,
                  startColumnIndex: 0,
                  endColumnIndex: 1,
                },
                cell: {
                  userEnteredFormat: {
                    numberFormat: {
                      type: 'TEXT',
                    },
                  },
                },
                fields: 'userEnteredFormat.numberFormat',
              },
            },
          ],
        },
      })

      console.log('✅ Data Warga sheet headers setup complete')

      await this.setupIuranSampahHeaders()
      await this.setupIuranQurbanHeaders()

      return true
    } catch (error) {
      console.error('❌ Failed to setup headers:', error)
      return false
    }
  }
}

export default new GoogleSheetsService()
