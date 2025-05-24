// app/agent/incidents/page.tsx
import { Pinecone } from '@pinecone-database/pinecone';
import { useState, useEffect } from 'react';

export default function IncidentDashboard() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
  const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);

  useEffect(() => {
    const fetchIncidents = async () => {
      const results = await index.query({
        vector: [0.1, 0.2, 0.3, ...Array(768).fill(0.1)], // Sample vector
        topK: 5,
        includeMetadata: true
      });

      setIncidents(results.matches.map(m => m.metadata));
    };
    fetchIncidents();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Incident Dashboard</h1>
      <div className="space-y-4">
        {incidents.map((incident, i) => (
          <div key={i} className="border p-4 rounded shadow">
            <p>{incident.text}</p>
            <div>Ticket ID: {incident.ticketId}</div>
          </div>
        ))}
      </div>
    </div>
  );
}