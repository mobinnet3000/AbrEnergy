import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { locales, defaultLocale } from '@/i18n/config';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if pathname has a known locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    // Extract the locale and set as cookie
    const firstSegment = pathname.split('/')[1];
    if (locales.includes(firstSegment as typeof locales[number])) {
      const response = NextResponse.next();
      response.cookies.set('locale', firstSegment, { path: '/' });
      return response;
    }
    return NextResponse.next();
  }

  // Get preferred locale from cookie or use default
  const cookieLocale = request.cookies.get('locale')?.value;
  const preferredLocale = locales.includes(cookieLocale as typeof locales[number])
    ? cookieLocale
    : defaultLocale;

  // Redirect to locale-prefixed path
  const newPathname = `/${preferredLocale}${pathname === '/' ? '' : pathname}`;
  request.nextUrl.pathname = newPathname;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: [
    '/((?!_next|api|favicon.ico|images|locales|.*\\..*).*)',
  ],
};
