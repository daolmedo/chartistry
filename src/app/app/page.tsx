'use client';

import { useState } from 'react';
import Link from 'next/link';
import DataInput from '../components/DataInput';
import ChartPreview from '../components/ChartPreview';

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

export default function ChartApp() {
  const [csv, setCsv] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('');
  const [chartSpec, setChartSpec] = useState<VChartSpec | null>(null);
  const [generationTime, setGenerationTime] = useState<number | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleGenerate = async () => {
    if (!csv.trim() || !prompt.trim()) {
      setError('Please provide CSV data and prompt');
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
          prompt 
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
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg"></div>
              <span className="text-2xl font-bold text-gray-900">chartz.ai</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main App Content */}
      <div className="flex h-[calc(100vh-80px)]">
        <DataInput
          csv={csv}
          setCsv={setCsv}
          prompt={prompt}
          setPrompt={setPrompt}
          onGenerate={handleGenerate}
          isLoading={isLoading}
        />
        <ChartPreview
          spec={chartSpec}
          generationTime={generationTime}
          error={error}
        />
      </div>
    </div>
  );
}