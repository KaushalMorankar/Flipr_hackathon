// components/CustomerChat.tsx
"use client";

import { useState, useRef, useEffect } from "react";

interface Props {
  companyId: string;
}

interface Message {
  from: "user" | "bot";
  text: string;
}

interface ChatResponse {
  reply: string;
  escalated: boolean;
  ticketId: string | null;
  sessionId: string;   // backend can return an updated sessionId
  error?: string;
}

export default function CustomerChat({ companyId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  // generate or load the sessionId once
  const [sessionId, setSessionId] = useState<string>("");
  useEffect(() => {
    let sid = localStorage.getItem("sessionId");
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem("sessionId", sid);
    }
    setSessionId(sid);
  }, []);

  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setMessages((m) => [...m, { from: "user", text }]);
    setInput("");
    setIsSending(true);

    try {
      // ⚡ HERE we include both companyId and sessionId in the POST body
      const res = await fetch("/api/customer/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          companyId,
          sessionId,
        }),
      });
      const body: ChatResponse = await res.json();

      if (res.ok) {
        // backend could return an updated sessionId
        if (body.sessionId && body.sessionId !== sessionId) {
          localStorage.setItem("sessionId", body.sessionId);
          setSessionId(body.sessionId);
        }
        setMessages((m) => [...m, { from: "bot", text: body.reply }]);
      } else {
        setMessages((m) => [
          ...m,
          { from: "bot", text: `Error: ${body.error || res.statusText}` },
        ]);
      }
    } catch (err: any) {
      setMessages((m) => [
        ...m,
        { from: "bot", text: `Network error: ${err.message}` },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px]">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${
              m.from === "bot" ? "justify-start" : "justify-end"
            }`}
          >
            <div
              className={`px-4 py-2 rounded-lg max-w-xs ${
                m.from === "bot"
                  ? "bg-gray-100 text-gray-800"
                  : "bg-blue-500 text-white"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="p-4 border-t flex space-x-2">
        <input
          className="flex-1 border rounded-lg px-3 py-2 focus:outline-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !isSending && send()}
          disabled={isSending}
          placeholder="Type your message..."
        />
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          onClick={send}
          disabled={isSending}
        >
          Send
        </button>
      </div>
    </div>
  );
}
