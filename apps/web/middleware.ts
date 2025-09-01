import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Let Next.js handle all requests normally
  // The locale detection will be handled by i18n.ts through cookies
  return NextResponse.next();
}

export const config = {
  // Match all routes except API and static files
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};