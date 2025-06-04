// lib/jwt.ts
import { sign, verify } from 'jsonwebtoken';

import { cookies } from 'next/headers';

export async function getUserEmailFromCookie(): Promise<string | null> {
  const cookieStore = await cookies(); // ✅ await it!
  const token = cookieStore.get('auth_token')?.value;

  if (!token) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString()
    );
    return payload.email;
  } catch {
    return null;
  }
}


export function generateJWT(user: {
  id: string;
  email: string;
  role: string;
  companyId: string;
}) {
  return sign(
    { id: user.id, email: user.email, role: user.role, companyId: user.companyId },
    process.env.JWT_SECRET!,
    { expiresIn: '1d' }
  );
}

export function decodeJWT(token: string) {
  try {
    return verify(token, process.env.JWT_SECRET!) as {
      id: string;
      email: string;
      role: string;
      companyId: string;
    };
  } catch (error) {
    console.error('JWT decode error:', error);
    return null;
  }
}