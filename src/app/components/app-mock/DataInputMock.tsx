'use client';

import { useState } from 'react';

interface Dataset {
  dataset_id: string;
  original_filename: string;
  row_count: number;
  column_count: number;
  ingestion_status: string;
  table_name: string;
}

interface DataInputMockProps {
  csv: string;
  setCsv: (csv: string) => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  onDatasetSelect?: (dataset: Dataset) => void;
  selectedDataset?: Dataset | null;
}

// Mock datasets
const mockDatasets: Dataset[] = [
  {
    dataset_id: 'mock-dataset-1',
    original_filename: 'sales_data.csv',
    row_count: 1250,
    column_count: 8,
    ingestion_status: 'completed',
    table_name: 'sales_data'
  },
  {
    dataset_id: 'mock-dataset-2',
    original_filename: 'customer_analytics.csv',
    row_count: 8432,
    column_count: 12,
    ingestion_status: 'completed',
    table_name: 'customer_analytics'
  },
  {
    dataset_id: 'mock-dataset-3',
    original_filename: 'inventory_report.csv',
    row_count: 567,
    column_count: 6,
    ingestion_status: 'completed',
    table_name: 'inventory_report'
  },
  {
    dataset_id: 'mock-dataset-4',
    original_filename: 'financial_metrics.csv',
    row_count: 2341,
    column_count: 15,
    ingestion_status: 'processing',
    table_name: 'financial_metrics'
  }
];

export default function DataInputMock({
  csv,
  setCsv,
  prompt,
  setPrompt,
  onGenerate,
  isLoading,
  onDatasetSelect,
  selectedDataset
}: DataInputMockProps) {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string>('');
  const [datasets, setDatasets] = useState<Dataset[]>(mockDatasets);
  const [showDatasets, setShowDatasets] = useState(true); // Show by default in mock
  const [loadingDatasets, setLoadingDatasets] = useState(false);

  const handleMockFileUpload = () => {
    setUploadStatus('uploading');
    setUploadProgress(0);
    setUploadError('');

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploadStatus('success');
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  };

  const canGenerate = (csv.trim() || selectedDataset) && prompt.trim() && !isLoading;

  return (
    <div className="w-80 bg-gradient-to-br from-gray-50 to-white border-r border-gray-200 p-6 overflow-y-auto">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Chart Generation</h2>
          <p className="text-sm text-gray-600">Upload your data and describe the chart you want</p>
        </div>

        {/* Upload Dataset */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Upload New Dataset
          </label>
          <div className="space-y-2">
            <div className="relative">
              <button
                onClick={handleMockFileUpload}
                disabled={uploadStatus === 'uploading'}
                className={`w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer transition-colors ${
                  uploadStatus === 'uploading' ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Select File (Demo)
              </button>
              {uploadStatus === 'uploading' && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                  <div className="flex items-center space-x-2 text-sm text-blue-600">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Uploading... {uploadProgress}%</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">CSV files only</p>
              {uploadStatus === 'success' && (
                <div className="flex items-center space-x-1 text-xs text-green-600">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Uploaded!</span>
                </div>
              )}
            </div>

            {/* Upload Progress Bar */}
            {uploadStatus === 'uploading' && (
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}

            {/* Upload Error */}
            {uploadStatus === 'error' && uploadError && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                {uploadError}
              </div>
            )}
          </div>
        </div>

        {/* My Datasets */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              My Datasets
            </label>
            <button
              onClick={() => setShowDatasets(!showDatasets)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {showDatasets ? 'Hide' : 'Show'}
            </button>
          </div>

          {showDatasets && (
            <div className="border border-gray-200 rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
              {loadingDatasets ? (
                <div className="flex items-center justify-center py-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 text-sm text-gray-600">Loading datasets...</span>
                </div>
              ) : datasets.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-2">No datasets uploaded yet</p>
              ) : (
                datasets.map((dataset) => (
                  <div
                    key={dataset.dataset_id}
                    className={`flex items-center justify-between p-2 bg-gray-50 rounded border hover:bg-gray-100 cursor-pointer ${
                      selectedDataset?.dataset_id === dataset.dataset_id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => {
                      if (onDatasetSelect) {
                        onDatasetSelect(dataset);
                      }
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {dataset.original_filename}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{dataset.row_count} rows</span>
                        <span>•</span>
                        <span>{dataset.column_count} cols</span>
                        <span>•</span>
                        <span className={`px-1.5 py-0.5 rounded text-xs ${
                          dataset.ingestion_status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : dataset.ingestion_status === 'failed'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {dataset.ingestion_status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Prompt Input */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Chart Description
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what kind of chart you want..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm shadow-sm"
          />
        </div>

        {/* Generate Button */}
        <div className="pt-4">
          <button
            onClick={onGenerate}
            disabled={!canGenerate}
            className={`w-full py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl ${
              canGenerate
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-sm'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Generating...</span>
              </div>
            ) : (
              'Generate Chart'
            )}
          </button>
        </div>

        {/* Demo Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-xs text-blue-700">
              <p className="font-medium">Demo Mode</p>
              <p>This is a preview version with mock data. All interactions are simulated.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}