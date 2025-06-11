// File: app/api/assist-agent/route.ts

import { NextRequest, NextResponse } from "next/server";

const PYTHON_BACKEND = process.env.PYTHON_BACKEND_URL || "http://localhost:8000";
const ROLE_MAP: Record<string, "user" | "agent"> = {
  USER: "user", user: "user",
  ASSISTANT: "agent", assistant: "agent",
};

export async function POST(req: NextRequest) {
  try {
    const { ticketId, messages } = (await req.json()) as {
      ticketId: string;
      messages: Array<Record<string, any>>;
    };

    if (!ticketId || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Must include ticketId and messages" }, { status: 400 });
    }

    console.log("👀 raw messages from client:", JSON.stringify(messages, null, 2));

    const transformed = messages.map((m, i) => {
      const role = ROLE_MAP[m.role] ?? "user";
      const text = m.content ?? m.message ?? m.text;
      if (typeof text !== "string") {
        console.warn(`Message[${i}] missing text:`, m);
      }
      // SEND as `text` so FastAPI’s Pydantic model will accept it
      return { role, text };
    });

    const res = await fetch(`${PYTHON_BACKEND}/assist-agent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId, messages: transformed }),
    });

    if (!res.ok) {
      const details = await res.text();
      console.error("Python /assist-agent error:", res.status, details);
      return NextResponse.json({ error: `Backend error (${res.status})`, details }, { status: 502 });
    }

    const { suggestion } = await res.json();
    return NextResponse.json({ suggestion });
  } catch (e: any) {
    console.error("Proxy to Python /assist-agent failed:", e);
    return NextResponse.json({ error: "Internal proxy error", message: e.message }, { status: 500 });
  }
}
