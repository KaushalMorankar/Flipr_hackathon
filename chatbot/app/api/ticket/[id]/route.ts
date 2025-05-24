// app/api/ticket/[id]/route.ts
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

// export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
//   const body = await req.json();
//   const updated = await prisma.ticket.update({
//     where: { id: params.id },
//     data: body
//   });
//   return new Response(JSON.stringify(updated), { status: 200 });
// }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const updated = await prisma.ticket.update({
    where: { id: params.id },
    data: body
  });
  return new Response(JSON.stringify(updated), { status: 200 });
}