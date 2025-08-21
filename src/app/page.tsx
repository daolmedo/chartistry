'use client';

import { useState } from 'react';
import DataInput from './components/DataInput';
import ChartPreview from './components/ChartPreview';

interface VChartSpec {
  type: string;
  data: any[];
  [key: string]: any;
}

interface GenerationResponse {
  spec: VChartSpec;
  time?: number;
  message?: string;
}

export default function Home() {
  const [csv, setCsv] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('');
  const [chartSpec, setChartSpec] = useState<VChartSpec | null>(null);
  const [generationTime, setGenerationTime] = useState<number | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiConfig, setShowApiConfig] = useState(false);

  const handleGenerate = async () => {
    if (!csv.trim() || !prompt.trim() || !apiKey.trim()) {
      setError('Please provide CSV data, prompt, and API key');
      return;
    }

    setIsLoading(true);
    setError(null);
    setChartSpec(null);
    setGenerationTime(undefined);

    try {
      const startTime = Date.now();
      
      const response = await fetch('/api/generate-chart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          csv, 
          prompt, 
          apiKey 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate chart');
      }

      const data: GenerationResponse = await response.json();
      const endTime = Date.now();
      
      setChartSpec(data.spec);
      setGenerationTime(data.time || (endTime - startTime));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <DataInput
        csv={csv}
        setCsv={setCsv}
        prompt={prompt}
        setPrompt={setPrompt}
        onGenerate={handleGenerate}
        isLoading={isLoading}
        apiKey={apiKey}
        setApiKey={setApiKey}
        showApiConfig={showApiConfig}
        setShowApiConfig={setShowApiConfig}
      />
      <ChartPreview
        spec={chartSpec}
        generationTime={generationTime}
        error={error}
      />
    </div>
  );
}
