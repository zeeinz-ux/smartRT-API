import type { HttpContext } from '@adonisjs/core/http'
import { errors } from '@adonisjs/core'
import type User from '#models/user'

export default class BaseController {
  protected requireAdminOrBendahara(user: User | undefined | null): boolean {
    return !!(user && (user.role === 'admin' || user.role === 'bendahara'))
  }

  protected async safeExecute<T>(
    response: HttpContext['response'],
    errorPrefix: string,
    fn: () => Promise<T>,
  ): Promise<void> {
    try {
      const result = await fn()
      if (result !== undefined) {
        response.json(result)
      }
    } catch (error) {
      if (error instanceof errors.E_ROUTE_NOT_FOUND) {
        throw error
      }
      console.error(`${errorPrefix} error:`, error)
      response.status(500).json({
        success: false,
        message: 'Terjadi kesalahan',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  protected async syncGoogleSheets(fn: () => Promise<void>): Promise<void> {
    try {
      await fn()
    } catch (error) {
      console.error('Google Sheets sync error (non-critical):', error)
    }
  }
}
