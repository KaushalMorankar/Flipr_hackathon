// app/company/[subdomain]/knowledge/page.tsx
import { useState, useEffect } from 'react';

export default function KnowledgeBase({ params }: { params: { subdomain: string } }) {
  const [entries, setEntries] = useState<any[]>([]);
  const [newEntry, setNewEntry] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntries = async () => {
      const res = await fetch(`/api/company/${params.subdomain}/knowledge`);
      const data = await res.json();
      setEntries(data);
      setLoading(false);
    };
    fetchEntries();
  }, [params.subdomain]);

  const createEntry = async () => {
    const res = await fetch(`/api/company/${params.subdomain}/knowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEntry)
    });

    if (res.ok) {
      const updated = await res.json();
      setEntries([...entries, updated]);
      setNewEntry({ title: '', content: '' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-blue-600">Knowledge Base</h1>
          <p className="text-gray-600 mt-2">
            Manage FAQs, troubleshooting guides, and policies for your AI chatbot.
          </p>
        </header>

        {/* Add New Entry */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Add New Entry</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Title"
              value={newEntry.title}
              onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <textarea
              placeholder="Content"
              value={newEntry.content}
              onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
              className="w-full p-3 border rounded-lg h-40 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={createEntry}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Add Entry
            </button>
          </div>
        </div>

        {/* Existing Entries */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Existing Entries</h2>
          {loading ? (
            <p>Loading entries...</p>
          ) : entries.length === 0 ? (
            <p className="text-gray-500">No knowledge base entries yet.</p>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium">{entry.title}</h3>
                <p className="text-gray-700 mt-2">{entry.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}