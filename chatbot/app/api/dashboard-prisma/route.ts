// app/api/dashboard-prisma/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { Ticket, Message as TicketMessage } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get("path") || "";
  if (!companyId) {
    return NextResponse.json(
      { error: "Missing companyId" },
      { status: 400 }
    );
  }

  // 1) Lookup company (by subdomain)
  const company = await prisma.company.findUnique({
    where: { subdomain: companyId },
    include: {
      tickets: {
        include: { messages: true }
      }
    }
  });

  if (!company) {
    return NextResponse.json(
      { error: `Company '${companyId}' not found` },
      { status: 404 }
    );
  }

  // 2) Shape the tickets
  const tickets = company.tickets.map(
    (t: Ticket & { messages: TicketMessage[] }) => ({
      id:              t.id,
      subject:         t.subject,
      status:          t.status,
      timestamp:       t.createdAt.toISOString(),
      resolution_time: t.updatedAt?.toISOString() ?? null,
      conversation:    t.messages.map((m: TicketMessage) => ({
                         role:      m.role.toLowerCase(),
                         text:      m.content,
                         timestamp: m.createdAt.toISOString(), 
                       })),
      csat_score:      t.csat_score,
      feedback:        t.feedback
    })
  );

  // 3) Return payload
  return NextResponse.json({ tickets });
}
