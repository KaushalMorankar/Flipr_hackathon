// // app/api/user/company/route.ts
// import { NextResponse } from 'next/server';

// // Stub: replace with your real database accessor
// async function getCompanyNameForUser(userId: string): Promise<string> {
//   // e.g. query your DB: SELECT name FROM companies WHERE id = (SELECT company_id FROM users WHERE id = userId)
//   return 'Acme Corporation';
// }

// export async function GET(request: Request) {
//   // 1) Extract your user identifier from auth (cookie or localStorage token)
//   //    here we assume you put user info in localStorage for customers,
//   //    but localStorage isn’t available on the server—so you’ll need a cookie/JWT or session.
//   const cookieHeader = request.headers.get('cookie') || '';
//   const match = cookieHeader.match(/auth_token=([^;]+)/);
//   let userId: string | null = null;

//   if (match) {
//     try {
//       const token = match[1];
//       const payload = JSON.parse(atob(token.split('.')[1]));
//       userId = payload.sub; // or however you encode the user’s ID
//     } catch {
//       return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
//     }
//   }

//   if (!userId) {
//     return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
//   }

//   try {
//     const companyName = await getCompanyNameForUser(userId);
//     return NextResponse.json({ companyName });
//   } catch (err) {
//     console.error('Failed to load company name:', err);
//     return NextResponse.json({ error: 'Server error' }, { status: 500 });
//   }
// }


// app/api/user/company/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "97a9e10a5c110bfc771f5a8434da1ae45f8ff95521e75fe5f1fd9b6109f990dd1c0a9b364d876b8829757400aa7c253570226754b3fc60982cd138ead6ad6884";

export async function GET(request: Request) {
  // 1) Look for the cookie named "token"
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/(^|;\s*)token=([^;]+)/);

  if (!match) {
    return NextResponse.json(
      { error: "Not authenticated (no token)" },
      { status: 401 }
    );
  }

  const token = match[2];

  // 2) Verify & decode the JWT
  let payload: { id: string; email: string; role: string };
  try {
    payload = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      role: string;
    };
  } catch (err) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // 3) Look up the user in Prisma
  const user = await prisma.user.findUnique({
    where: { id: payload.id },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // 4) Look up the company name
  const company = await prisma.company.findUnique({
    where: { id: user.companyId },
    select: { name: true },
  });

  if (!company) {
    return NextResponse.json(
      { error: "Company not found for this user" },
      { status: 404 }
    );
  }

  return NextResponse.json({ companyName: company.name });
}
