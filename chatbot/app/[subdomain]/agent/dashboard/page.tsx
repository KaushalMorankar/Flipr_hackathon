// File: app/[subdomain]/agent/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Metrics {
  totalTickets: number;
  resolutionRate: number | null;
  backlog: number;
}

export default function AgentDashboard() {
  const params = useParams<{ subdomain: string }>();
  const subdomain = params.subdomain;

  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [summary, setSummary] = useState<string>('');
  const [prediction, setPrediction] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // 1) Load metrics once on mount
  useEffect(() => {
    fetch(`/api/agent/metrics`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch metrics');
        return res.json();
      })
      .then((data: Metrics) => setMetrics(data))
      .catch(() =>
        setMetrics({ totalTickets: 0, resolutionRate: 0, backlog: 0 })
      )
      .finally(() => setLoading(false));
  }, []);

  // 2) Generate AI summary
  const generateSummary = (timeframe: string) => {
    setSummary('Generating summary...');
    fetch(`/api/agent/summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeframe, subdomain }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Summary request failed');
        return res.json();
      })
      .then((data) => {
        if (data.error) {
          setSummary(`Error: ${data.error}`);
        } else {
          setSummary(data.summary);
        }
      })
      .catch((err) => setSummary(`Error: ${err.message}`));
  };

  // 3) Generate predictive insight
  const generatePrediction = () => {
    setPrediction('Generating forecast...');
    fetch(`/api/agent/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subdomain }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Prediction request failed');
        return res.json();
      })
      .then((data) => {
        if (data.error) {
          setPrediction(`Error: ${data.error}`);
        } else {
          setPrediction(data.prediction);
        }
      })
      .catch((err) => setPrediction(`Error: ${err.message}`));
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-600 text-lg animate-pulse">
          Loading dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ===== Top Navigation Bar ===== */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            {subdomain}.yourapp.com Analytics
          </h1>
          <nav className="space-x-4">
            <Link
              href={`/${subdomain}/dashboard`}
              className="inline-block bg-gradient-to-r from-green-500 to-teal-400 text-white px-4 py-2 rounded-lg shadow hover:from-green-600 hover:to-teal-500 transition"
            >
              Main Dashboard
            </Link>
          </nav>
        </div>
      </header>

      {/* ===== Main Content ===== */}
      <main className="max-w-7xl mx-auto py-8 px-6 space-y-8">
        {/* Metrics Section */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Total Tickets Card */}
          <div className="bg-white rounded-lg shadow-md border-l-4 border-blue-500 p-6 hover:shadow-lg transition">
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-blue-500 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 13h18M3 6h18M3 20h18"
                />
              </svg>
              <div>
                <h2 className="text-lg font-semibold text-gray-700">
                  Total Tickets
                </h2>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {metrics?.totalTickets ?? 0}
                </p>
              </div>
            </div>
          </div>

          {/* Resolution Rate Card */}
          <div className="bg-white rounded-lg shadow-md border-l-4 border-green-500 p-6 hover:shadow-lg transition">
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-green-500 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2l4 -4M7 16l3 3l6 -6"
                />
              </svg>
              <div>
                <h2 className="text-lg font-semibold text-gray-700">
                  Resolution Rate
                </h2>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {Number(metrics?.resolutionRate ?? 0).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Backlog Card */}
          <div className="bg-white rounded-lg shadow-md border-l-4 border-red-500 p-6 hover:shadow-lg transition">
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-red-500 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h2 className="text-lg font-semibold text-gray-700">Backlog</h2>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {metrics?.backlog ?? 0}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* AI Summary Section */}
        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            AI-Powered Summary
          </h2>
          <div className="flex flex-wrap gap-3 mb-4">
            <button
              onClick={() => generateSummary('daily')}
              className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition"
            >
              Daily
            </button>
            <button
              onClick={() => generateSummary('weekly')}
              className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition"
            >
              Weekly
            </button>
            <button
              onClick={() => generateSummary('monthly')}
              className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition"
            >
              Monthly
            </button>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 min-h-[120px] overflow-y-auto">
            {summary ? (
              <p className="text-gray-700 whitespace-pre-line">{summary}</p>
            ) : (
              <p className="text-gray-500">
                Click a button above to generate a summary…
              </p>
            )}
          </div>
        </section>

        {/* Predictive Insights Section */}
        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Predictive Insights
          </h2>
          <button
            onClick={generatePrediction}
            className="bg-purple-600 text-white px-4 py-2 rounded-full hover:bg-purple-700 transition mb-4"
          >
            Generate Forecast
          </button>
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 min-h-[100px] overflow-y-auto">
            {prediction ? (
              <p className="text-gray-700 whitespace-pre-line">{prediction}</p>
            ) : (
              <p className="text-gray-500">
                Click “Generate Forecast” for predictive insights…
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
