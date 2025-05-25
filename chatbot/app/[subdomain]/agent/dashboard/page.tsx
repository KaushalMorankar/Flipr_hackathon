// app/[subdomain]/agent/dashboard/page.tsx
'use client';
import { useState, useEffect } from 'react';

export default function AgentDashboard({ params }: { params: { subdomain: string } }) {
  const [metrics, setMetrics] = useState<any>(null);
  const [summary, setSummary] = useState<string>('');
  const [prediction, setPrediction] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Load metrics
  useEffect(() => {
    fetch(`/api/agent/metrics`)
      .then(res => res.json())
      .then(setMetrics)
      .finally(() => setLoading(false));
  }, []);

  // Generate summary
  const generateSummary = (timeframe: string) => {
    fetch(`/api/agent/summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeframe, subdomain: params.subdomain })
    }).then(res => res.json())
      .then(data => setSummary(data.summary));
  };

  // Generate prediction
  const generatePrediction = () => {
    fetch(`/api/agent/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subdomain: params.subdomain })
    }).then(res => res.json())
      .then(data => setPrediction(data.prediction));
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Analytics Dashboard for {params.subdomain}.yourapp.com</h1>

      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-2">Ticket Volume</h2>
          <p className="text-3xl font-bold">{metrics?.totalTickets || 0}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-2">Resolution Rate</h2>
          <p className="text-3xl font-bold">{metrics?.resolutionRate || 'N/A'}%</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-2">Backlog</h2>
          <p className="text-3xl font-bold">{metrics?.backlog || 0}</p>
        </div>
      </div>

      {/* Summary Section */}
      <div className="bg-white p-4 rounded shadow mb-8">
        <h2 className="font-semibold mb-2">AI Summary</h2>
        <div className="flex gap-2 mb-4">
          <button 
            onClick={() => generateSummary('daily')}
            className="bg-blue-600 text-white px-3 py-1 rounded"
          >
            Daily
          </button>
          <button 
            onClick={() => generateSummary('weekly')}
            className="bg-blue-600 text-white px-3 py-1 rounded"
          >
            Weekly
          </button>
          <button 
            onClick={() => generateSummary('monthly')}
            className="bg-blue-600 text-white px-3 py-1 rounded"
          >
            Monthly
          </button>
        </div>
        <p>{summary || 'Generate a summary to view insights...'}</p>
      </div>

      {/* Predictive Insights */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-2">Predictive Insights</h2>
        <button 
          onClick={generatePrediction}
          className="bg-purple-600 text-white px-3 py-1 rounded mb-4"
        >
          Generate Forecast
        </button>
        <p>{prediction || 'Click "Generate Forecast" for predictive insights...'}</p>
      </div>
    </div>
  );
}