// import { NextResponse } from 'next/server';
// import { PrismaClient } from '@prisma/client';
// import bcrypt from 'bcryptjs';

// const prisma = new PrismaClient();

// export async function POST(req: Request) {
//   const { email, password } = await req.json();

//   try {
//     const company = await prisma.company.findUnique({
//       where: { email },
//     });

//     if (!company || !company.passwordHash) {
//       return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
//     }

//     const passwordMatch = await bcrypt.compare(password, company.passwordHash);

//     if (!passwordMatch) {
//       return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
//     }

//     // Exclude sensitive data
//     return NextResponse.json({
//       id: company.id,
//       name: company.name,
//       email: company.email,
//       subdomain: company.subdomain,
//     });
//   } catch (error) {
//     console.error('Company login error:', error);
//     return NextResponse.json({ message: 'Server error' }, { status: 500 });
//   }
// }
