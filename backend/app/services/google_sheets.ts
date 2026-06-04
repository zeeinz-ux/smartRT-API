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
   * Cari row index berdasarkan ID warga (kolom A)
   */
  private async findRowById(id: string): Promise<number | null> {
    if (!this.isAvailable()) return null

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Sheet1!A:A',
      })

      const rows = response.data.values || []
      for (let i = 0; i < rows.length; i++) {
        if (rows[i][0] === id) {
          return i + 1
        }
      }
      return null
    } catch (error) {
      console.error('❌ Failed to find row by ID:', error)
      return null
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
      const row = [
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
        range: 'Sheet1!A2',
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [row] },
      })

      console.log(`✅ Warga ${data.nama} synced to Google Sheets`)
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
    id: string,
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
      const rowIndex = await this.findRowById(id)
      if (!rowIndex) {
        console.warn(`⚠️ Warga ID ${id} tidak ditemukan di Google Sheets. Melakukan append...`)
        return this.appendWarga({
          id,
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
        range: `Sheet1!A${rowIndex}:M${rowIndex}`,
      })

      const oldRow = oldData.data.values?.[0] || []
      const newRow = [
        id,
        data.nama ?? oldRow[1] ?? '',
        data.email ?? oldRow[2] ?? '',
        data.no_hp ?? oldRow[3] ?? '',
        data.nik ?? oldRow[4] ?? '',
        data.kk ?? oldRow[5] ?? '',
        data.alamat ?? oldRow[6] ?? '',
        data.no_rumah ?? oldRow[7] ?? '',
        data.status_huni ?? oldRow[8] ?? '',
        data.verification_status ?? oldRow[9] ?? '',
        data.verified_at ?? oldRow[10] ?? '',
        data.verified_by ?? oldRow[11] ?? '',
        new Date().toISOString(),
      ]

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `Sheet1!A${rowIndex}:M${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [newRow] },
      })

      console.log(`✅ Warga ${data.nama || id} updated in Google Sheets`)
      return true
    } catch (error) {
      console.error('❌ Failed to update Google Sheets:', error)
      return false
    }
  }

  /**
   * Hapus data warga dari Google Sheets (clear row)
   */
  async deleteWarga(id: string): Promise<boolean> {
    if (!this.isAvailable()) {
      console.warn('Google Sheets not available, skipping delete')
      return false
    }

    try {
      const rowIndex = await this.findRowById(id)
      if (!rowIndex) {
        console.warn(`⚠️ Warga ID ${id} tidak ditemukan di Google Sheets`)
        return false
      }

      const emptyRow = Array(13).fill('')
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `Sheet1!A${rowIndex}:M${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [emptyRow] },
      })

      console.log(`✅ Warga ${id} removed from Google Sheets`)
      return true
    } catch (error) {
      console.error('❌ Failed to delete from Google Sheets:', error)
      return false
    }
  }

  async setupHeaders(): Promise<boolean> {
    if (!this.isAvailable()) return false

    try {
      const headers = [['ID', 'Nama', 'Email', 'No HP', 'NIK', 'KK', 'Alamat', 'No Rumah', 'Status Huni', 'Status Verifikasi', 'Terverifikasi', 'Diverifikasi Oleh', 'Timestamp Sync']]

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: 'Sheet1!A1:M1',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: headers },
      })

      console.log('✅ Spreadsheet headers setup complete')
      return true
    } catch (error) {
      console.error('❌ Failed to setup headers:', error)
      return false
    }
  }
}

export default new GoogleSheetsService()