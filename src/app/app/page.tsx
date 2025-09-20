'use client';

import { useState } from 'react';
import Link from 'next/link';
import DataInput from '../components/app/DataInput';
import ChartPreview from '../components/app/ChartPreview';
import DatasetViewer from '../components/app/DatasetViewer';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/UserContext';
import { Dataset } from '../lib/api';

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
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [showDatasetPreview, setShowDatasetPreview] = useState(false);
  const [streamingThoughts, setStreamingThoughts] = useState<string[]>([]);
  const [enableStreaming, setEnableStreaming] = useState(true);
  const [generationResponse, setGenerationResponse] = useState<any>(null);
  
  const { currentUser, userId, logout } = useAuth();
  
  const handleDatasetSelect = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    setShowDatasetPreview(true);
  };
  
  const handleDatasetPreviewClose = () => {
    setShowDatasetPreview(false);
    // Keep selectedDataset intact - just hide the preview
  };
  
  const handleGenerate = async () => {
    if (!selectedDataset) {
      setError('Please select a dataset first');
      return;
    }
    
    if (!prompt.trim()) {
      setError('Please provide a prompt for chart generation');
      return;
    }

    setIsLoading(true);
    setError(null);
    setChartSpec(null);
    setGenerationTime(undefined);
    setStreamingThoughts([]);
    setGenerationResponse(null);

    try {
      const startTime = Date.now();
      
      if (enableStreaming) {
        // Streaming mode
        const response = await fetch('/api/generate-chart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_intent: prompt,
            dataset_id: selectedDataset.dataset_id,
            table_name: selectedDataset.table_name,
            user_id: userId,
            stream: true
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to generate chart: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body reader available');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'progress') {
                  setStreamingThoughts([data.content]); // Replace with latest status instead of appending
                } else if (data.type === 'complete') {
                  const endTime = Date.now();
                  setGenerationResponse(data.content); // Store full response for metadata
                  setChartSpec(data.content.spec); // data.content is the result object, so .spec gets the VChart spec
                  setGenerationTime(endTime - startTime);
                } else if (data.type === 'error') {
                  throw new Error(data.content);
                }
              } catch (parseError) {
                console.warn('Failed to parse streaming data:', line);
              }
            }
          }
        }
      } else {
        // Non-streaming mode (original)
        const response = await fetch('/api/generate-chart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_intent: prompt,
            dataset_id: selectedDataset.dataset_id,
            table_name: selectedDataset.table_name,
            user_id: userId
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate chart');
        }

        const data: GenerationResponse = await response.json();
        const endTime = Date.now();
        
        setGenerationResponse(data); // Store full response for metadata
        setChartSpec(data.spec);
        setGenerationTime(data.time || (endTime - startTime));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white">
        {/* Navigation */}
        <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <Link href="/" className="flex items-center space-x-2">
                <img src="/logo.png" alt="chartz.ai logo" className="w-8 h-8 rounded-lg" />
                <span className="text-2xl font-bold text-gray-900">chartz.ai</span>
              </Link>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Welcome, {currentUser?.displayName || currentUser?.email}
                </span>
                <button
                  onClick={() => logout()}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Sign Out
                </button>
                <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                  ← Back to Home
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Main App Content */}
        <div className="flex h-[calc(100vh-80px)] relative">
          <DataInput
            csv={csv}
            setCsv={setCsv}
            prompt={prompt}
            setPrompt={setPrompt}
            onGenerate={handleGenerate}
            isLoading={isLoading}
            onDatasetSelect={handleDatasetSelect}
            selectedDataset={selectedDataset}
          />
          <ChartPreview
            spec={chartSpec}
            generationTime={generationTime}
            error={error}
            selectedDataset={selectedDataset}
            streamingThoughts={streamingThoughts}
            isGenerating={isLoading}
            enableStreaming={enableStreaming}
            onToggleStreaming={() => setEnableStreaming(!enableStreaming)}
            generationResponse={generationResponse}
          />
          
          {/* Dataset Viewer - Resizable Bottom Panel */}
          <DatasetViewer
            dataset={showDatasetPreview ? selectedDataset : null}
            onClose={handleDatasetPreviewClose}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}