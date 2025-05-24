// app/api/auth/me/route.ts
import { NextRequest } from 'next/server';
import { decodeJWT } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const decoded = decodeJWT(token);
  if (!decoded) {
    return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    include: { company: true }
  });

  return new Response(JSON.stringify(user), { status: 200 });
}