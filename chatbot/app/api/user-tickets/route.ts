// app/api/user-tickets/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { Ticket as PrismaTicket, Message as PrismaMessage } from "@prisma/client";

interface ShapedMessage {
  role: "user" | "bot";
  text: string;
  timestamp: string;
}

interface ShapedTicket {
  id: string;
  subject: string;
  status: string;
  timestamp: string;
  resolution_time: string | null;
//   csat_score: number | null;
//   fcr: boolean;
  conversation: ShapedMessage[];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customerId");
  if (!customerId) {
    return NextResponse.json({ error: "Missing customerId" }, { status: 400 });
  }

  // Fetch just this customer’s tickets
  const tickets: (PrismaTicket & { messages: PrismaMessage[] })[] =
    await prisma.ticket.findMany({
      where: { customerId },
      include: { messages: true },
      orderBy: { createdAt: "desc" },
    });

  // Shape exactly as your dashboard-prisma does:
  const shaped: ShapedTicket[] = tickets.map(
    (t: PrismaTicket & { messages: PrismaMessage[] }): ShapedTicket => ({
      id: t.id,
      subject: t.subject,
      status: t.status,
      timestamp: t.createdAt.toISOString(),
      resolution_time: t.updatedAt?.toISOString() ?? null,
    //   csat_score: t.csatScore ?? null,
    //   fcr: t.firstCallResolution,
      conversation: t.messages.map(
        (m: PrismaMessage): ShapedMessage => ({
          role: m.role.toLowerCase() as "user" | "bot",
          text: m.content,
          timestamp: m.createdAt.toISOString(),
        })
      ),
    })
  );

  return NextResponse.json({ tickets: shaped });
}
