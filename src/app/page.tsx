'use client';

import { useState } from 'react';
import ChatSidebar from './components/ChatSidebar';
import ChartDisplay from './components/ChartDisplay';
import { generateChart } from './lib/api';

export default function Home() {
  const [chartCode, setChartCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateChart = async (message: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await generateChart(message);
      setChartCode(response.chartCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <ChatSidebar 
        onGenerateChart={handleGenerateChart}
        isGenerating={isLoading}
      />
      <ChartDisplay 
        chartCode={chartCode}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
}
