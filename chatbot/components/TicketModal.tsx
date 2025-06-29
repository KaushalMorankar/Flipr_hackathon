"use client";

import { useEffect, useState } from "react";
import ConversationViewer from "./ConversationViewer";
import type { Ticket } from "@/types";
import axios from "axios";

interface TicketModalProps {
  ticket: Ticket;
  onClose: () => void;
  onResolve: (note: string) => void;
}

export default function TicketModal({
  ticket,
  onClose,
  onResolve,
}: TicketModalProps) {
  const [aiSuggestion, setAiSuggestion] = useState<string>("");
  const [note, setNote] = useState<string>("");

  useEffect(() => {
    // Reset states when a new ticket is opened
    setAiSuggestion("");
    setNote("");

    async function getAISuggestion() {
      try {
        const res = await axios.post<{ suggestion: string }>("/api/assist-agent", {
          ticketId: ticket.id,
          messages: ticket.conversation,
        });
        console.log("🛠️  /api/assist-agent response:", res.data);
        const suggestion = res.data.suggestion?.trim() || "No suggestion available.";

        // 1) display it above
        setAiSuggestion(suggestion);
        // 2) AND prefill the textarea with it
        setNote(suggestion);
      } catch (err) {
        console.error("AI suggestion error:", err);
        setAiSuggestion("Could not load suggestion.");
        // still prefill the textarea so user can type
        setNote("");
      }
    }

    if (ticket.status !== "RESOLVED") {
      getAISuggestion();
    }
  }, [ticket]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-3xl rounded shadow-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-600 hover:text-black"
        >
          ✕
        </button>

        <h2 className="text-xl font-semibold mb-2">{ticket.subject}</h2>
        <p className="text-sm text-gray-500 mb-4">
          {new Date(ticket.timestamp).toLocaleString()}
        </p>

        <ConversationViewer conversation={ticket.conversation} />

        {ticket.status !== "RESOLVED" && (
          <>
            {/* AI Suggestion Display */}
            <div className="mt-4">
              <h3 className="text-lg font-medium">AI Suggestion</h3>
              <p className="text-sm text-gray-700 bg-gray-100 p-3 rounded mt-1 whitespace-pre-line">
                {aiSuggestion || "Thinking..."}
              </p>
            </div>

            {/* Prefilled / Editable Resolution Note */}
            <div className="mt-4">
              <h3 className="text-lg font-medium">Your Resolution Note</h3>
              <textarea
                rows={4}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="You can edit the AI suggestion or write your own…"
                className="w-full border rounded p-2"
              />
            </div>

            {/* Resolve Button */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => onResolve(note)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Resolve Ticket
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
