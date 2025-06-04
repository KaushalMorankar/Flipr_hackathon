// app/api/user/tickets/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "97a9e10a5c110bfc771f5a8434da1ae45f8ff95521e75fe5f1fd9b6109f990dd1c0a9b364d876b8829757400aa7c253570226754b3fc60982cd138ead6ad6884";

// If your prisma Ticket model is:
//
// model Ticket {
//   id        String @id @default(cuid())
//   subject   String
//   status    TicketStatus
//   companyId String
//   …
// }
//
// Then the “raw” result from findMany({ select: { id, subject, status } }) 
// has this shape:
interface RawTicket {
  id: string;
  subject: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
}

export async function GET(request: Request) {
  // 1) Read the "token" cookie
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/(^|;\s*)token=([^;]+)/);

  if (!match) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = match[2];

  // 2) Verify the token
  let payload: { id: string; email: string; role: string };
  try {
    payload = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      role: string;
    };
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // 3) Find the user to get companyId
  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { id: true, companyId: true, role: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // 4) Fetch all tickets belonging to this user's company:
  const rawTickets: RawTicket[] = await prisma.ticket.findMany({
    where: { companyId: user.companyId },
    select: {
      id: true,
      subject: true,
      status: true,
    },
  });

  // 5) Map them into the shape your React UI expects, with explicit typing:
  const tickets = rawTickets.map((t: RawTicket) => ({
    id: t.id,
    title: t.subject,               // your frontend wants `t.title`
    status: t.status.toLowerCase(), // e.g. "OPEN" → "open"
    feedback: "",                   // no column in Prisma, so blank
  }));

  return NextResponse.json(tickets);
}
