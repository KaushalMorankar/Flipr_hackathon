import { NextRequest, NextResponse } from 'next/server';

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL!;

export async function POST(req: NextRequest) {
  try {
    const { message, companyId } = await req.json();

    // Optional: log to verify env var
    console.log("Proxying to Python at:", PYTHON_BACKEND_URL);

    const pythonResp = await fetch(`${PYTHON_BACKEND_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, companyId }),
    });

    if (!pythonResp.ok) {
      const errorText = await pythonResp.text();
      return new NextResponse(JSON.stringify({ error: errorText }), {
        status: pythonResp.status,
      });
    }

    const { reply } = await pythonResp.json();
    return NextResponse.json({ reply });

  } catch (err: any) {
    console.error('Proxy error:', err);
    return new NextResponse(
      JSON.stringify({ error: err.message || 'Unknown error' }),
      { status: 500 }
    );
  }
}
