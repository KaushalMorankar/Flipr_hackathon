// /app/api/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const path = url.searchParams.get("path") || "flipr";
  const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";
  
  try {
    // ✅ Fixed: Use backticks for the URL string
    const res = await axios.get(`${PYTHON_API_URL}/dashboard/${path}`);
    return NextResponse.json(res.data);
  } catch (error: any) {
    console.error("Proxy error:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}