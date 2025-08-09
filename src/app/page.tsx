'use client';

import { useState } from 'react';
import { generateChart, ChartConfig } from './lib/api';
import Sidebar from './components/Sidebar';
import ChartDisplay from './components/ChartDisplay';

export default function Home() {
  const [chartConfig, setChartConfig] = useState<ChartConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateChart = async (message: string) => {
    setIsLoading(true);
    setError(null);
    setChartConfig(null);
    
    try {
      const response = await generateChart(message);
      setChartConfig(response.config);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar onSendMessage={handleGenerateChart} isLoading={isLoading} />
      <ChartDisplay chartConfig={chartConfig} isLoading={isLoading} error={error} />
    </div>
  );
}
