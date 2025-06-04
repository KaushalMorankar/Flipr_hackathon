import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "97a9e10a5c110bfc771f5a8434da1ae45f8ff95521e75fe5f1fd9b6109f990dd1c0a9b364d876b8829757400aa7c253570226754b3fc60982cd138ead6ad6884";

// This interface must match exactly what you `select` from Prisma:
interface RawMessage {
  id: string;
  content: string;
  role: string;
  createdAt: Date;
  sender: { email: string | null } | null;
}

export async function GET(
  request: Request,
  { params }: { params: { ticketId: string } }
) {
  // 1) Destructure ticketId out of params
  const { ticketId } = await params;

  // 2) Read the "token" cookie
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/(^|;\s*)token=([^;]+)/);
  if (!match) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = match[2];

  // 3) Verify & decode the JWT
  let payload: { id: string; email: string; role: string };
try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log("Decoded Token:", decoded); // 📝 Debugging line

  if (!decoded || typeof decoded !== "object") {
    return NextResponse.json({ error: "Invalid token payload" }, { status: 401 });
  }

  payload = decoded as { id: string; email: string; role: string };
} catch (error: any) {
  console.error("JWT Error:", error.message); // 📝 Debugging line
  return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
}

  // 4) Confirm that this ticket belongs to the user’s company
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { companyId: true },
  });
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { companyId: true },
  });
  if (!user || user.companyId !== ticket.companyId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 5) Fetch all messages for this ticket in ascending order
  const rawMessages: RawMessage[] = await prisma.message.findMany({
    where: { ticketId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      content: true,
      role: true,
      createdAt: true,
      sender: { select: { email: true } },
    },
  });

  // 6) Map them to a simpler shape
  const messages = rawMessages.map((m) => ({
    id: m.id,
    content: m.content,
    role: m.role,
    senderEmail: m.sender?.email || null,
    createdAt: m.createdAt.toISOString(),
  }));

  return NextResponse.json(messages);
}
