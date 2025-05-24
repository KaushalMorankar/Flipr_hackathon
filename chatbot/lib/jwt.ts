// lib/jwt.ts
// import { verify } from 'jsonwebtoken';
import { sign, verify } from 'jsonwebtoken'; // ✅ Add sign here
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