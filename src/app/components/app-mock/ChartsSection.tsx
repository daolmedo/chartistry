'use client';

import { useState } from 'react';
import DataInputMock from './DataInputMock';
import ChartPreviewMock from './ChartPreviewMock';
import DatasetViewerMock from './DatasetViewerMock';

interface VChartSpec {
  type: string;
  data: any[];
  [key: string]: any;
}

interface Dataset {
  dataset_id: string;
  original_filename: string;
  row_count: number;
  column_count: number;
  ingestion_status: string;
  table_name: string;
}

// Mock dataset
const mockDataset: Dataset = {
  dataset_id: 'mock-dataset-1',
  original_filename: 'sales_data.csv',
  row_count: 1250,
  column_count: 8,
  ingestion_status: 'completed',
  table_name: 'sales_data'
};

// Mock VChart specification for a bar chart
const mockChartSpec: VChartSpec = {
  type: 'bar',
  data: [
    {
      values: [
        { category: 'Product A', sales: 45000, quarter: 'Q1' },
        { category: 'Product B', sales: 32000, quarter: 'Q1' },
        { category: 'Product C', sales: 28000, quarter: 'Q1' },
        { category: 'Product D', sales: 15000, quarter: 'Q1' },
        { category: 'Product A', sales: 52000, quarter: 'Q2' },
        { category: 'Product B', sales: 38000, quarter: 'Q2' },
        { category: 'Product C', sales: 31000, quarter: 'Q2' },
        { category: 'Product D', sales: 18000, quarter: 'Q2' },
      ]
    }
  ],
  xField: 'category',
  yField: 'sales',
  seriesField: 'quarter',
  axes: [
    {
      orient: 'left',
      title: { visible: true, text: 'Sales Revenue ($)' }
    },
    {
      orient: 'bottom',
      title: { visible: true, text: 'Product Category' }
    }
  ],
  title: {
    visible: true,
    text: 'Quarterly Sales by Product Category'
  },
  legends: {
    visible: true,
    orient: 'right'
  },
  bar: {
    state: {
      hover: {
        stroke: '#000',
        strokeWidth: 1
      }
    }
  }
};

export default function ChartsSection() {
  const [csv, setCsv] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('Create a bar chart showing quarterly sales by product category');
  const [chartSpec, setChartSpec] = useState<VChartSpec | null>(mockChartSpec);
  const [generationTime, setGenerationTime] = useState<number | undefined>(1250);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(mockDataset);
  const [showDatasetPreview, setShowDatasetPreview] = useState(false);
  const [streamingThoughts, setStreamingThoughts] = useState<string[]>([]);
  const [enableStreaming, setEnableStreaming] = useState(true);
  const [generationResponse, setGenerationResponse] = useState<any>(null);

  const handleDatasetSelect = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    setShowDatasetPreview(true);
  };

  const handleDatasetPreviewClose = () => {
    setShowDatasetPreview(false);
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

    // Mock streaming thoughts
    const thoughts = [
      'Analyzing dataset structure...',
      'Understanding user intent...',
      'Generating SQL query...',
      'Processing data...',
      'Creating VChart specification...',
      'Optimizing visualization...',
      'Finalizing chart...'
    ];

    // Simulate streaming with delays
    for (let i = 0; i < thoughts.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400));
      setStreamingThoughts([thoughts[i]]);
    }

    // Final result
    await new Promise(resolve => setTimeout(resolve, 500));
    setChartSpec(mockChartSpec);
    setGenerationTime(1250);
    setIsLoading(false);
  };

  return (
    <div className="flex h-full relative">
      <DataInputMock
        csv={csv}
        setCsv={setCsv}
        prompt={prompt}
        setPrompt={setPrompt}
        onGenerate={handleGenerate}
        isLoading={isLoading}
        onDatasetSelect={handleDatasetSelect}
        selectedDataset={selectedDataset}
      />
      <ChartPreviewMock
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
      <DatasetViewerMock
        dataset={showDatasetPreview ? selectedDataset : null}
        onClose={handleDatasetPreviewClose}
      />
    </div>
  );
}