// app/agent/dashboard/page.tsx
'use client';
import { useState, useEffect } from 'react';

export default function AgentDashboard({ params }: { params: { subdomain: string } }) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [suggestion, setSuggestion] = useState<string>('');

  useEffect(() => {
    fetch('/api/agent/tickets')
      .then(res => res.json())
      .then(setTickets);
  }, []);

  const loadSuggestions = async (ticket: any) => {
    // Step 1: Get KB + Past Tickets
    const res = await fetch('/api/pinecone/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: ticket.subject, subdomain: params.subdomain })
    });
    const data = await res.json();

    // Step 2: Get AI-drafted response
    const aiRes = await fetch('/api/generate/response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suggestions: data })
    });
    const aiData = await aiRes.json();

    setSelectedTicket({ ...ticket, suggestions: data });
    setSuggestion(aiData.response);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Agent Dashboard</h1>
      <div className="flex gap-4">
        {/* Ticket List */}
        <div className="w-1/3">
          <h2 className="font-semibold mb-2">Open Tickets</h2>
          {tickets.filter(t => t.status === 'OPEN').map(ticket => (
            <div 
              key={ticket.id}
              className="border p-3 mb-2 cursor-pointer hover:bg-gray-100"
              onClick={() => loadSuggestions(ticket)}
            >
              <strong>{ticket.subject}</strong>
              <div>Priority: {ticket.priority}</div>
            </div>
          ))}
        </div>

        {/* Ticket Details + AI Suggestions */}
        <div className="w-2/3">
          {selectedTicket && (
            <div className="bg-white shadow rounded p-4">
              <h2 className="text-xl font-semibold">{selectedTicket.subject}</h2>
              
              <div className="mt-4">
                <h3 className="font-medium">Knowledge Base Matches:</h3>
                <ul className="list-disc pl-5 mt-2">
                  {selectedTicket.suggestions.kbResults.map((kb: string, i: number) => (
                    <li key={i}>{kb}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-4">
                <h3 className="font-medium">Past Ticket Matches:</h3>
                <ul className="list-disc pl-5 mt-2">
                  {selectedTicket.suggestions.pastTickets.map((t: any, i: number) => (
                    <li key={i}>{t.subject}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-4">
                <h3 className="font-medium">Suggested Response:</h3>
                <div className="bg-gray-100 p-2 mt-2 rounded">{suggestion || 'Loading...'}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}