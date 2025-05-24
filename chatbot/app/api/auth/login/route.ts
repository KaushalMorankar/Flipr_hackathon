// app/api/auth/login/route.ts
import { NextRequest } from 'next/server';
import { compare } from 'bcryptjs';
import { generateJWT } from '@/lib/jwt';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const user = await prisma.user.findUnique({ where: { email } });
  const isPasswordValid = await compare(password, user?.password || '');

  if (!user || !isPasswordValid) {
    return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });
  }

  const token = generateJWT(user);

  return new Response(JSON.stringify({ token }), {
    status: 200,
    headers: {
      'Set-Cookie': `auth_token=${token}; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Strict`
    }
  });
}