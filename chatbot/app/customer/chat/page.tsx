'use client';
import UserHeader from '@/components/UserHeader';
import { useState, useEffect, useRef } from 'react';

type Company = { id: string; name: string; subdomain: string };
type ChatMessage = { role: 'user' | 'assistant'; content: string };

export default function ChatPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string>('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  useEffect(() => {
    fetch('/api/company')
      .then(res => res.json())
      .then((data: Company[]) => {
        setCompanies(data);
        if (data.length > 0) setSelectedCompanyId(data[0].id);
      });
  }, []);

  useEffect(() => {
    setSessionId(`session_${Math.random().toString(36).substring(2, 15)}`);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = message.trim();
    if (!text || !selectedCompanyId) return;

    // add user bubble
    setChatHistory(prev => [...prev, { role: 'user', content: text }]);
    setMessage('');

    const payload = { companyId: selectedCompanyId, sessionId, message: text };
    const isEscalate = text.toLowerCase() === 'escalate';
    const endpoint = isEscalate ? '/api/customer/escalate' : '/api/customer/chat';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      const reply = isEscalate ? data.response : data.reply;
      setChatHistory(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setChatHistory(prev => [
        ...prev,
        { role: 'assistant', content: '❗ Something went wrong.' },
      ]);
    }
  };

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  return (
    <div>
      <UserHeader/>
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-8 px-4">
      <div className="bg-white shadow-lg rounded-lg w-full max-w-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-blue-600 text-white p-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">
            {selectedCompany
              ? `${selectedCompany.subdomain}.yourapp.com`
              : 'Select a Company'}
          </h1>
          <select
            className="bg-white text-gray-800 rounded px-2 py-1"
            value={selectedCompanyId}
            onChange={e => {
              setSelectedCompanyId(e.target.value);
              setChatHistory([]);
            }}
          >
            <option value="" disabled>
              -- pick company --
            </option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </header>

        {/* Chat area */}
        <main className="flex-1 p-4 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-3 px-2">
            {chatHistory.length === 0 && (
              <p className="text-center text-gray-400 mt-10">
                Start the conversation…
              </p>
            )}
            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`
                    max-w-[70%] px-4 py-2 rounded-lg
                    ${
                      msg.role === 'user'
                        ? 'bg-blue-500 text-white rounded-br-none'
                        : 'bg-gray-200 text-gray-800 rounded-bl-none'
                    }
                  `}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="mt-4 flex items-center border-t px-4 pt-3 pb-4 bg-gray-50"
          >
            <input
              type="text"
              className="flex-1 border rounded-l px-4 py-2 focus:outline-none"
              placeholder={
                selectedCompany ? 'Type your message...' : 'Select a company first'
              }
              value={message}
              onChange={e => setMessage(e.target.value)}
              disabled={!selectedCompany}
            />
            <button
              type="submit"
              className={`
                px-4 py-2 rounded-r
                ${
                  selectedCompany
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
              disabled={!selectedCompany || !message.trim()}
            >
              Send
            </button>
          </form>
        </main>
      </div>
    </div>
    </div>
  );
}
