// components/CustomerChat.tsx
'use client';
import { useState, useEffect } from 'react';

export default function CustomerChat({ companyId }: { companyId: string }) {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string>('');

  // Initialize session ID on mount
  useEffect(() => {
    const newSessionId = `session_${Math.random().toString(36).substring(2, 15)}`;
    setSessionId(newSessionId);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const payload = { message, companyId, sessionId };

    if (message.toLowerCase() === 'escalate') {
      // Directly escalate to ticket creation
      const ticketRes = await fetch('/api/customer/escalate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const ticketData = await ticketRes.json();
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: ticketData.response
      }]);
      setMessage('');
      return;
    }

    // Send to backend
    const res = await fetch('/api/customer/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    setChatHistory(prev => [...prev, {
      role: 'user',
      content: message
    }, {
      role: 'assistant',
      content: data.reply
    }]);
    setMessage('');
  };

  return (
    <div className="h-96 flex flex-col">
      <div className="flex-1 overflow-y-auto p-2 border rounded mb-4 bg-gray-50">
        {chatHistory.length === 0 && (
          <p className="text-gray-500 text-center mt-4">Start typing to talk to our AI assistant</p>
        )}
        {chatHistory.map((msg, i) => (
          <div 
            key={i} 
            className={`mb-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
          >
            <p className="inline-block p-2 rounded bg-white border max-w-md">
              {msg.content}
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 p-2 border rounded"
        />
        <button 
          type="submit" 
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Send
        </button>
      </form>
    </div>
  );
}