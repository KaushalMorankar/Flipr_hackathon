import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "97a9e10a5c110bfc771f5a8434da1ae45f8ff95521e75fe5f1fd9b6109f990dd1c0a9b364d876b8829757400aa7c253570226754b3fc60982cd138ead6ad6884";

export async function POST(
  request: Request,
  { params }: { params: { ticketId: string } }
) {
  // 1) Destructure ticketId from params
  const { ticketId } = await params;
  const body = await request.json();

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

  // 4) Ensure this ticket exists and belongs to the user’s company
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { companyId: true, status: true },
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

  // 5) Only allow feedback if ticket.status === "RESOLVED"
  if (ticket.status !== "RESOLVED") {
    return NextResponse.json(
      { error: "Can only leave feedback on a resolved ticket." },
      { status: 400 }
    );
  }

  // 6) Update the ticket’s `feedback` column (make sure you migrated this)
  const updated = await prisma.ticket.update({
    where: { id: ticketId },
    data: { feedback: body.feedback },
  });

  return NextResponse.json({ success: true });
}
