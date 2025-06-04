// app/api/assist-agent/route.ts
import { NextRequest, NextResponse } from "next/server";

const PYTHON_BACKEND = process.env.PYTHON_BACKEND_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    // 1. Read incoming JSON (ticketId + messages)
    const body = await req.json();

    // 2. Forward to your Python FastAPI /assist-agent endpoint
    const res = await fetch(`${PYTHON_BACKEND}/assist-agent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    // 3. If Python returned an error, bubble it up
    if (!res.ok) {
      const errBody = await res.text();
      console.error("Python /assist-agent error:", res.status, errBody);
      return NextResponse.json(
        { error: `Backend error (${res.status})` },
        { status: 502 }
      );
    }

    // 4. Parse the AI suggestion JSON and pass it back to the client
    const { suggestion } = await res.json();
    return NextResponse.json({ suggestion });
  } catch (e) {
    console.error("Proxy to Python /assist-agent failed:", e);
    return NextResponse.json(
      { error: "Internal proxy error" },
      { status: 500 }
    );
  }
}
