'use client';

import { useState } from 'react';

// Define the type for the strategic analysis response
type StrategicAnalysis = {
  summary: string;
  recommendations: string[];
};

export default function AnalyticsPage() {
  const [analysis, setAnalysis] = useState<StrategicAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const response = await fetch('/api/strategic-reflection', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to run analysis.');
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-4">Campaign Analytics</h1>
      <p className="text-gray-400 mb-8">Analyze your campaign performance over the last 30 days and get AI-driven strategic recommendations.</p>

      <div className="mb-8">
        <button
          onClick={handleRunAnalysis}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500"
          disabled={isLoading}
        >
          {isLoading ? 'Analyzing...' : 'Run Strategic Analysis'}
        </button>
      </div>

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-6">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {analysis && (
        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Analysis Results</h2>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Summary</h3>
            <p className="text-gray-400 bg-gray-700 p-4 rounded-md">{analysis.summary}</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Recommendations</h3>
            <ul className="list-disc list-inside space-y-2 bg-gray-700 p-4 rounded-md">
              {analysis.recommendations.map((rec, index) => (
                <li key={index} className="text-gray-400">{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
