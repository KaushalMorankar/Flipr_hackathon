// /components/ConversationViewer.tsx
import type { Message } from "@/types";

interface ConversationViewerProps {
  conversation: Message[];
}

export default function ConversationViewer({ conversation = [] }: ConversationViewerProps) {
  return (
    <div className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-64">
      {conversation.map((msg, i) => (
        <div
          key={i}
          className={`mb-2 px-4 py-2 rounded ${
            msg.role === "user" ? "bg-blue-50 text-blue-800" : "bg-green-50 text-green-800"
          }`}
        >
          <strong>{msg.role}: </strong>
          {msg.text}
        </div>
      ))}
    </div>
  );
}