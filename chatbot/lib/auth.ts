// lib/jwt.ts
import { sign, verify } from 'jsonwebtoken';

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