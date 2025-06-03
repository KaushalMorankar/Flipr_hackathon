// // /app/api/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import prisma from "@/lib/prisma";

// export async function POST(req: NextRequest) {
//   try {
//     const ticket = await req.json();
    
//     // Create ticket in Prisma
//     const createdTicket = await prisma.ticket.create({
//       data: {
//         id: ticket.ticketId,
//         companyId: ticket.companyId,
//         sessionId: ticket.sessionId || "",
//         status: ticket.status || "OPEN",
//         subject: ticket.subject || "No subject",  // Add this line
//         priority: ticket.priority || 3,  // Add this line
//         createdAt: new Date(ticket.timestamp),
//         updatedAt: ticket.resolution_time ? new Date(ticket.resolution_time) : undefined,
//         csat_score: ticket.csat_score || null,
//         messages: {  // Changed from 'conversation' to 'messages'
//         create: ticket.conversation.map((msg: any) => ({
//             role: msg.role,
//             content: msg.text
//         }))
//         }
//     },
//     include: { messages: true }
//     });
//     console.log(createdTicket);
//     return NextResponse.json(createdTicket, { status: 201 });
//   } catch (error) {
//     console.error("Prisma sync error:", error);
//     return NextResponse.json(
//       { error: "Failed to sync ticket to Prisma" },
//       { status: 500 }
//     );
//   }
// }
// app/api/customer/escalate/route.ts
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
export async function POST(req: NextRequest) {
  try {
    const { message, companyId, sessionId } = await req.json();
    // ✅ Check if company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });
    if (!companyId || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      );
    }

    // ✅ Create ticket with required fields
    const ticket = await prisma.ticket.create({
      data: {
        subject: `Escalated Chat: ${message.slice(0, 30)}...`,
        status: 'OPEN',
        companyId,
        priority: 10, // ✅ Set default priority
        messages: {
          create: {
            content: message,
            role: 'USER',
            senderId: null // ✅ No senderId if not logged in
          }
        }
      },
      include: { messages: true }
    });

    return new Response(
      JSON.stringify({
        response: 'Your request has been escalated to an agent.',
        ticketId: ticket.id,
        status: ticket.status
      }),
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Escalation error:', error.message);
    return new Response(
      JSON.stringify({ error: 'Failed to escalate chat' }),
      { status: 500 }
    );
  }
}