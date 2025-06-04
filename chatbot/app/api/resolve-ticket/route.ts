// app/api/resolve-ticket/route.ts
import { NextRequest, NextResponse } from "next/server";
import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();
const redis = new Redis("redis://localhost:6379/0");

export async function POST(req: NextRequest) {
  const { ticketId, companyId } = await req.json().catch(() => ({}));
  if (!ticketId || !companyId) {
    return NextResponse.json(
      { error: "ticketId and companyId are required" },
      { status: 400 }
    );
  }

  const key = `ticket:${ticketId}`;
  const raw = await redis.get(key);
  if (!raw) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  const ticket = JSON.parse(raw);
  ticket.status = "RESOLVED";
  ticket.resolution_time = new Date().toISOString();
  await redis.set(key, JSON.stringify(ticket));

  return NextResponse.json({
    status: "success",
    message: `Ticket ${ticketId} resolved`,
  });
}
