// app/api/pinecone/suggestions/route.ts
import { NextRequest } from 'next/server';
import { decodeJWT } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const decoded = decodeJWT(token);
  if (!decoded || decoded.role !== 'AGENT') {
    return new Response(JSON.stringify({ error: 'Agent role required' }), { status: 403 });
  }

  const { query } = await req.json();

  // Generate embedding (mocked for now)
  const embeddingResult = await generateEmbedding(query);
  const suggestions = await searchKnowledgeBase(decoded.companyId, embeddingResult);

  return new Response(JSON.stringify(suggestions), { status: 200 });
}