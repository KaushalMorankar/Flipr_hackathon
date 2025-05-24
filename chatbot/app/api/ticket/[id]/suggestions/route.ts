// // app/api/ticket/[id]/suggestions/route.ts
// import { NextRequest } from 'next/server';
// import { getTicketSuggestions } from '@/lib/ticketSuggestions';

// export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
//   const subdomain = 'techco'; // Replace with real subdomain logic
//   const suggestions = await getTicketSuggestions(params.id, subdomain);
//   return new Response(JSON.stringify(suggestions), { status: 200 });
// }
// app/api/ticket/[id]/suggestions/route.ts
import { NextRequest } from 'next/server';
import { fetchSuggestions } from '@/lib/ticketSuggestions';
import prisma from '@/lib/prisma';
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: { messages: true }
  });

  const suggestions = await fetchSuggestions(
    params.id,
    ticket!.messages[0].content
  );

  return new Response(JSON.stringify(suggestions), { status: 200 });
}