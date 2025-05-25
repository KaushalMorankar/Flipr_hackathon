// /app/api/prisma-sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const ticket = await req.json();
    
    // Create ticket in Prisma
    const createdTicket = await prisma.ticket.create({
      data: {
        id: ticket.ticketId,
        companyId: ticket.companyId,
        sessionId: ticket.sessionId || "",
        status: ticket.status || "OPEN",
        subject: ticket.subject || "No subject",  // Add this line
        priority: ticket.priority || 3,  // Add this line
        createdAt: new Date(ticket.timestamp),
        updatedAt: ticket.resolution_time ? new Date(ticket.resolution_time) : undefined,
        csat_score: ticket.csat_score || null,
        messages: {  // Changed from 'conversation' to 'messages'
        create: ticket.conversation.map((msg: any) => ({
            role: msg.role,
            content: msg.text
        }))
        }
    },
    include: { messages: true }
    });
    console.log(createdTicket);
    return NextResponse.json(createdTicket, { status: 201 });
  } catch (error) {
    console.error("Prisma sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync ticket to Prisma" },
      { status: 500 }
    );
  }
}