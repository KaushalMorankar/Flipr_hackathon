// app/api/agent/logout/route.ts
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Set-Cookie': 'auth_token=; Path=/; Max-Age=0'
    }
  });
}