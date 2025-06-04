// app/customer/chat/page.tsx
'use client';
import { useState, useEffect } from 'react';

export default function ChatPage() {
  const [companies, setCompanies] = useState<{ id: string; name: string; subdomain: string }[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    const fetchCompanies = async () => {
      const res = await fetch('/api/company');
      const data = await res.json();
      setCompanies(data);
      if (data.length > 0) setSelectedCompanyId(data[0].id);
    };
    fetchCompanies();
  }, []);

  useEffect(() => {
    const newSessionId = `session_${Math.random().toString(36).substring(2, 15)}`;
    setSessionId(newSessionId);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const payload = { message, companyId: selectedCompanyId, sessionId };

    if (message.toLowerCase() === 'escalate') {
      const res = await fetch('/api/customer/escalate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: data.response
      }]);
      setMessage('');
      return;
    }

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
    // console.log(data)
    // setMessage(data.reply);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <label className="block mb-2">Select Company</label>
          <select
            className="w-full p-3 border rounded"
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
          >
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name} ({company.subdomain})
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white p-4 rounded shadow mb-4 h-80 overflow-y-auto">
          {chatHistory.map((msg, i) => (
            <div key={i} className={`mb-2 ${msg.role === 'user' ? 'text-right' : ''}`}>
              <p className="inline-block p-2 bg-gray-100 rounded">{msg.content}</p>
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
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}