import app from '@adonisjs/core/services/app'
import { type HttpContext, ExceptionHandler } from '@adonisjs/core/http'

export default class HttpExceptionHandler extends ExceptionHandler {
  protected debug = !app.inProduction

  async handle(error: unknown, ctx: HttpContext) {
    if (this.debug) {
      console.error(error)
    }

    const statusCode = error instanceof Error && 'status' in error
      ? (error as any).status
      : 500

    return ctx.response.status(statusCode).json({
      success: false,
      message: error instanceof Error ? error.message : 'Terjadi kesalahan server',
    })
  }

  async report(_error: unknown, _ctx: HttpContext) {
  }
}
