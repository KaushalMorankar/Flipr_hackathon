import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// payload: { ticketId: string; note?: string }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const ticketId = body.ticketId as string | undefined;
  const note     = body.note as string | undefined;

  if (!ticketId) {
    return NextResponse.json({ error: "Missing ticketId" }, { status: 400 });
  }

  try {
    // 1) Mark the ticket as RESOLVED, bumping updatedAt
    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: { status: "RESOLVED" },
    });

    // 2) If the admin provided resolution notes, record them as a new Message
    if (note && note.trim().length > 0) {
      await prisma.message.create({
        data: {
          ticketId: ticketId,
          role:     "AGENT",
          content:  `Resolution Note: ${note}`,
        }
      });
    }

    return NextResponse.json({
      status:        "ok",
      ticketId:      updated.id,
      resolutionTime: updated.updatedAt.toISOString(),
    });
  } catch (e: any) {
    console.error("Admin resolve error:", e);
    return NextResponse.json(
      { error: "Failed to resolve ticket" },
      { status: 500 }
    );
  }
}
