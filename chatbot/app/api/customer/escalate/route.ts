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
    console.log(company);
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
// app/api/customer/escalate/route.ts
// import { NextRequest } from 'next/server';
// import prisma from '@/lib/prisma';

// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json().catch(() => null);
    
//     if (!body || !body.message || (!body.companyId && !body.subdomain)) {
//       return new Response(
//         JSON.stringify({ error: 'Missing message or companyId/subdomain' }),
//         { status: 400 }
//       );
//     }

//     const { message, companyId, subdomain, sessionId } = body;

//     // ✅ Use companyId to get subdomain if not provided
//     let resolvedSubdomain = subdomain;
//     if (!resolvedSubdomain && companyId) {
//       const company = await prisma.company.findUnique({
//         where: { id: companyId },
//         select: { subdomain: true }
//       });

//       if (!company) {
//         return new Response(
//           JSON.stringify({ error: 'Company not found' }),
//           { status: 404 }
//         );
//       }

//       resolvedSubdomain = company.subdomain;
//     }

//     // ✅ Create ticket with companyId
//     const ticket = await prisma.ticket.create({
//       data: {
//         subject: `Escalated Chat: ${message.slice(0, 30)}...`,
//         status: 'OPEN',
//         companyId: companyId || null,
//         priority: 10
//       }
//     });

//     // ✅ Create message
//     await prisma.message.create({
//       data: {
//         content: message,
//         role: 'USER',
//         senderId: null,
//         ticketId: ticket.id
//       }
//     });

//     return new Response(
//       JSON.stringify({
//         response: 'Your request has been escalated to an agent.',
//         ticketId: ticket.id,
//         subdomain: resolvedSubdomain
//       }),
//       { status: 201 }
//     );

//   } catch (error: any) {
//     console.error('Escalation error:', error.message);
//     return new Response(
//       JSON.stringify({ error: 'Failed to escalate chat' }),
//       { status: 500 }
//     );
//   }
// }