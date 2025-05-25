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

// lib/jwt.ts
// import { sign } from 'jsonwebtoken';

export function generateJWT(user: {
  id: string;
  email: string;
  role: string;
  companyId: string;
  subdomain: string;
}) {
  return sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      subdomain: user.subdomain // ✅ Ensure this is included
    },
    process.env.JWT_SECRET!,
    { expiresIn: '1d' }
  );
}