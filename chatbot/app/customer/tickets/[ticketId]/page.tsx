// app/customer/tickets/[ticketId]/page.tsx
"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface Message {
  id: string;
  content: string;
  role: string;   // e.g. "user" or "agent" or "system"
  senderEmail?: string; // optional: if you included sender info
  createdAt: string;
}

export default function TicketChatPage() {
  const { ticketId } = useParams(); // e.g. { ticketId: "cjg382..." }
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ticketId) {
      setError("No ticket ID provided.");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        // Include credentials so the JWT cookie is sent
        const res = await fetch(`/api/user/tickets/${ticketId}/messages`, {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error("Failed to load messages");
        }
        const data: Message[] = await res.json();
        setMessages(data);
      } catch (e) {
        console.error(e);
        setError("Could not load chat history.");
      } finally {
        setLoading(false);
      }
    })();
  }, [ticketId]);

  if (loading) return <p className="p-6 text-center">Loading chat…</p>;
  if (error) return <p className="p-6 text-red-500">{error}</p>;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white shadow-md rounded p-6">
        <h1 className="text-2xl font-semibold mb-4">Ticket: {ticketId}</h1>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <p>No messages yet.</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-4 rounded-md ${
                  msg.role === "agent"
                    ? "bg-blue-50 text-black"
                    : "bg-green-50 text-black"
                }`}
              >
                <div className="flex justify-between mb-1">
                  <span className="font-medium">{msg.senderEmail || msg.role}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(msg.createdAt).toLocaleString()}
                  </span>
                </div>
                <p>{msg.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
