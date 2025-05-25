// // middleware.ts
// import { NextRequest, NextResponse } from 'next/server';

// export async function middleware(req: NextRequest) {
//   const host = req.headers.get('host');
//   const url = req.nextUrl;

//   // Subdomain routing
//   if (host && host.includes('localhost')) {
//     const [subdomain] = host.split('.');
//     url.pathname = `/${subdomain}/agent/dashboard`;
//     return NextResponse.rewrite(url); // Keep rewrite for subdomain support
//   }

//   return NextResponse.next();
// }
// middleware.ts
// middleware.ts
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { decodeJWT } from '@/lib/jwt';

export async function middleware(req: NextRequest) {
  const cookies = req.cookies;
  const token = cookies.get('auth_token')?.value;

  const url = req.nextUrl;

  // Protect agent routes
  if (url.pathname.startsWith('/agent') && !token) {
    return NextResponse.redirect(new URL('/agent/login', req.url));
  }

  // Subdomain routing
  const host = req.headers.get('host');
  if (host && host.includes('localhost')) {
    const [subdomain] = host.split('.');
    url.pathname = `/${subdomain}/agent/dashboard`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}