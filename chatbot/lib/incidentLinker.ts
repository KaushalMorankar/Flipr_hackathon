// lib/incidentLinker.ts
import { Pinecone } from '@pinecone-database/pinecone';
import prisma from '@/lib/prisma';

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });

export async function findRelatedTickets(subdomain: string, embedding: number[]) {
  const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);
  
  const results = await index.namespace(subdomain).query({
    vector: embedding,
    topK: 5,
    includeMetadata: true
  });

  return results.matches
    .filter(match => match.metadata?.ticketId)
    .map(match => match.metadata?.ticketId);
}