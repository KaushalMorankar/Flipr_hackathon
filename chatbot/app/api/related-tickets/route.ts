// app/api/related-tickets/route.ts
import { NextRequest } from 'next/server';
import { findRelatedTickets } from '@/lib/incidentLinker';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { embedding } = await req.json();
    const related = await findRelatedTickets(params.id, embedding);
    return new Response(JSON.stringify(related), { status: 200 });
  } catch (error) {
    console.error('Incident linking error:', error);
    return new Response(JSON.stringify({ error: 'Failed to find related tickets' }), { status: 500 });
  }
}