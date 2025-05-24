// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const host = req.headers.get('host');
  const url = req.nextUrl;

  // Subdomain routing
  if (host && host.includes('localhost')) {
    const [subdomain] = host.split('.');
    url.pathname = `/${subdomain}/agent/dashboard`;
    return NextResponse.rewrite(url); // Keep rewrite for subdomain support
  }

  return NextResponse.next();
}