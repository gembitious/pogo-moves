import { i18n } from 'i18n-config'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const locales = i18n.locales

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  )
  if (pathnameHasLocale) return

  // Redirect if there is no locale
  request.nextUrl.pathname = `/ko/${pathname}`

  return NextResponse.redirect(request.nextUrl)
}

export const config = {
  matcher: '/((?!api|static|.*\\..*|_next).*)',
}
