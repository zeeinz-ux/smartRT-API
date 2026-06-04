import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class SilentAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    try {
      // Mencoba cek apakah user login atau tidak
      // Jika login, ctx.auth.user akan terisi
      await ctx.auth.check()
    } catch {
      // Jika tidak login, biarkan saja (silent fail)
      // Kita tidak melakukan apa-apa agar request tetap berlanjut
    }
    return next()
  }
}