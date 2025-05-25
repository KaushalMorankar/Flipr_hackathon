// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { decodeJWT } from '@/lib/jwt';

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const token = req.cookies.get('auth_token')?.value;

  // Allow static assets
  if (url.pathname.startsWith('/_next') || url.pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  // Protect agent routes
  if (url.pathname.startsWith('/agent') && !token) {
    return NextResponse.redirect(new URL('/agent/login', req.url));
  }

  // ✅ No need to rewrite subdomain from host
  return NextResponse.next();
}