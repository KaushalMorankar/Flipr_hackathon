// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GenerativeAI, EmbeddingModel, TextGenerationModel } from "@google/generative-ai";
import { PineconeClient } from "@pinecone-database/pinecone";
import Redis from "ioredis";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

// —– Initialize clients —–
const genai = new GenerativeAI({ apiKey: process.env.GEMINI_API_KEY! });
const redis = new Redis("redis://localhost:6379/0");
const pinecone = new PineconeClient();
await pinecone.init({
  apiKey: process.env.PINECONE_API_KEY!,
  environment: process.env.PINECONE_ENV!,
});
const pineIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME!);

// —– Request/response schemas —–
const ChatReq = z.object({
  sessionId: z.string(),
  companyId: z.string(),
  message: z.string(),
});
type ChatRequest = z.infer<typeof ChatReq>;

// —– Helpers —–
async function embedText(text: string): Promise<number[]> {
  const resp = await genai.embed({
    model: EmbeddingModel.TEXT_EMBEDDING_003,  // maps to “embedding-001”
    input: text,
  });
  return resp.embedding;
}

function cosine(a: number[], b: number[]) {
  const dot = a.reduce((sum, v, i) => sum + v * (b[i] ?? 0), 0);
  const normA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const normB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  return dot / (normA * normB);
}

async function getHistory(sessionId: string): Promise<{ role: string; text: string }[]> {
  const raw = await redis.get(`hist:${sessionId}`);
  return raw ? JSON.parse(raw) : [];
}
async function saveHistory(sessionId: string, hist: any[]) {
  await redis.set(`hist:${sessionId}`, JSON.stringify(hist), "EX", 24 * 3600);
}

function shouldHandoff(userMsg: string, botReply: string) {
  const triggers = ["human", "agent", "ticket", "escalate", "help from a person"];
  const combined = (userMsg + " " + botReply).toLowerCase();
  return triggers.some((t) => combined.includes(t));
}

function generateTicketId() {
  return `TICKET-${uuidv4().slice(0, 8).toUpperCase()}`;
}

// —– The chat POST handler —–
export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = ChatReq.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { sessionId, companyId, message } = parsed.data;

  // 1) load & append user message
  const history = await getHistory(sessionId);
  history.push({ role: "user", text: message });

  // 2) embed and query Pinecone
  const userEmb = await embedText(message);
  const pineResp = await pineIndex.query({
    vector: userEmb,
    topK: 3,
    includeMetadata: true,
    namespace: companyId,
  });
  const docs = (pineResp.matches || []).map((m) => ({
    id: m.id,
    title: m.metadata.title,
    content: m.metadata.text,
    score: m.score,
  }));

  // 3) build contextBlock
  let contextBlock: string;
  if (docs.length) {
    contextBlock = docs
      .map((d) => `— **${d.title}** (#${d.id}): ${d.content}`)
      .join("\n");
  } else {
    // fallback: search recent history
    const recent = history.filter((m) => m.role === "user").slice(-5);
    const rel: string[] = [];
    for (const ru of recent) {
      const emb2 = await embedText(ru.text);
      if (cosine(userEmb, emb2) > 0.7) {
        const idx = history.findIndex((h) => h === ru);
        if (history[idx + 1]?.role === "bot") {
          rel.push(
            `Prev Q: ${ru.text}\nPrev A: ${history[idx + 1].text}`
          );
        }
      }
    }
    contextBlock = rel.length
      ? rel.join("\n")
      : "No relevant info found in KB or history.";
  }

  // 4) prompt for Gemini
  const systemPrompt = `
You are a support assistant for ${companyId}.
QUESTION:
${message}

KNOWLEDGE:
${contextBlock}

CONVERSATION:
${history
    .map((m) => `${m.role === "bot" ? "Bot" : "User"}: ${m.text}`)
    .join("\n")}

INSTRUCTIONS:
1. Prioritize KB. 2. Use history only if KB lacks info. 3. If unsure, reply “No relevant information.” 4. Be concise.

REPLY:
Bot:
`;

  const gen = await genai.generate({
    model: TextGenerationModel.GEN_IMAGE_EMBED_TEXT, // use “gemini-1.5-flash” equivalent
    prompt: systemPrompt,
    temperature: 0.2,
    maxOutputTokens: 512,
  });
  const reply = gen.candidates[0].output.trim();

  // 5) update & persist history
  history.push({ role: "bot", text: reply });
  await saveHistory(sessionId, history);

  // 6) decide if we hand off
  if (shouldHandoff(message, reply)) {
    const ticketId = generateTicketId();
    // here you’d also push to Redis & your monitoring.log_agent_interaction
    const ticketData = {
      ticketId,
      companyId,
      sessionId,
      conversation: history,
      timestamp: new Date().toISOString(),
      status: "IN_PROGRESS",
      subject: history[0].text.slice(0, 100),
      priority: 3,
    };
    await redis.set(`ticket:${ticketId}`, JSON.stringify(ticketData));
    // you can also publish to a channel if needed

    return NextResponse.json({
      reply: `I'm escalating you to a human agent. Your ticket is #${ticketId}.`,
      escalated: true,
      ticketId,
    });
  }

  return NextResponse.json({
    reply,
    escalated: false,
    ticketId: null,
  });
}
