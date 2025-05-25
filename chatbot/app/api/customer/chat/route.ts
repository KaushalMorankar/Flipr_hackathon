// app/api/customer/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL!;

export async function POST(req: NextRequest) {
  try {
    const { message, companyId, sessionId } = await req.json();
    console.log(message,companyId,sessionId);
    // Forward everything—including sessionId—to Python
    const pythonResp = await fetch(`${PYTHON_BACKEND_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, companyId, sessionId }),
    });

    if (!pythonResp.ok) {
      const errorText = await pythonResp.text();
      return new NextResponse(JSON.stringify({ error: errorText }), {
        status: pythonResp.status,
      });
    }

    // Python now returns { reply, escalated, ticketId, sessionId }
    const body = await pythonResp.json();
    return NextResponse.json(body);

  } catch (err: any) {
    console.error('Proxy error:', err);
    return new NextResponse(
      JSON.stringify({ error: err.message || 'Unknown error' }),
      { status: 500 }
    );
  }
}
