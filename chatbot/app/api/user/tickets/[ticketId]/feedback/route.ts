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
  // 1) Destructure ticketId
  const { ticketId } = params;
  if (!ticketId) {
    return NextResponse.json({ error: "Ticket ID missing" }, { status: 400 });
  }

  // 2) Parse JSON body
  let body: { feedback?: string; csatScore?: number } | null = null;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  // 2a) Validate that feedback is a string
  if (!body || typeof body.feedback !== "string") {
    return NextResponse.json({ error: "Feedback must be a string." }, { status: 400 });
  }
  // 2b) Validate that csatScore is a number between 1 and 5
  const csatScoreRaw = body.csatScore;
  if (
    csatScoreRaw === undefined ||
    typeof csatScoreRaw !== "number" ||
    !Number.isInteger(csatScoreRaw) ||
    csatScoreRaw < 1 ||
    csatScoreRaw > 5
  ) {
    return NextResponse.json(
      { error: "csatScore must be an integer between 1 and 5." },
      { status: 400 }
    );
  }
  const feedbackText = body.feedback.trim();
  const csatScore = csatScoreRaw;

  // 3) Read “token” cookie
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/(^|;\s*)token=([^;]+)/);
  if (!match) {
    return NextResponse.json({ error: "Unauthorized: no token cookie" }, { status: 401 });
  }
  const token = match[2];

  // 4) Verify & decode JWT
  let payloadObj: { id: string; email: string; role: string };
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || typeof decoded !== "object") {
      return NextResponse.json({ error: "Invalid or malformed token payload" }, { status: 401 });
    }
    payloadObj = decoded as { id: string; email: string; role: string };
  } catch (err: any) {
    console.error("JWT verification failed:", err.message);
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  // 5) Check that ticket exists and belongs to user’s company
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { companyId: true, status: true },
  });
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }
  const user = await prisma.user.findUnique({
    where: { id: payloadObj.id },
    select: { companyId: true },
  });
  if (!user || user.companyId !== ticket.companyId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 6) Only allow feedback if ticket.status === "RESOLVED"
  if (ticket.status !== "RESOLVED") {
    return NextResponse.json(
      { error: "Can only leave feedback on a resolved ticket." },
      { status: 400 }
    );
  }

  // 7) Update ticket with both feedback and csat_score
  try {
    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        feedback: feedbackText,
        csat_score: csatScore,
      },
      select: { id: true, feedback: true, csat_score: true, status: true },
    });
    return NextResponse.json({ success: true, ticket: updated });
  } catch (prismaErr: any) {
    console.error("Prisma update error:", prismaErr.message);
    return NextResponse.json({ error: "Database update failed" }, { status: 500 });
  }
}
