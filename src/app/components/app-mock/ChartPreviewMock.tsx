'use client';

import { useEffect, useRef, useState } from 'react';
import VChart from '@visactor/vchart';

interface VChartSpec {
  type: string;
  data: any[] | { values: any[] } | any;
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

interface ChartPreviewMockProps {
  spec: VChartSpec | null;
  generationTime?: number;
  error?: string | null;
  selectedDataset?: Dataset | null;
  streamingThoughts?: string[];
  isGenerating?: boolean;
  enableStreaming?: boolean;
  onToggleStreaming?: () => void;
  generationResponse?: any;
}

export default function ChartPreviewMock({
  spec,
  generationTime,
  error,
  selectedDataset,
  streamingThoughts = [],
  isGenerating = false,
  enableStreaming = true,
  onToggleStreaming,
  generationResponse
}: ChartPreviewMockProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const vchartInstance = useRef<any>(null);
  const [showSpec, setShowSpec] = useState(false);
  const [showInsightForm, setShowInsightForm] = useState(false);
  const [isStatusFading, setIsStatusFading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>('');

  // Effect to handle smooth status transitions
  useEffect(() => {
    const latestThought = streamingThoughts[0];
    if (latestThought && latestThought !== currentStatus) {
      if (currentStatus) {
        // Fade out current status
        setIsStatusFading(true);
        setTimeout(() => {
          setCurrentStatus(latestThought);
          setIsStatusFading(false);
        }, 150);
      } else {
        // First status, no fade needed
        setCurrentStatus(latestThought);
      }
    }
  }, [streamingThoughts, currentStatus]);

  // Effect to render chart
  useEffect(() => {
    const renderChart = async () => {
      if (!spec || !chartRef.current) return;

      try {
        // Clean up previous chart instance
        if (vchartInstance.current) {
          vchartInstance.current.release();
          vchartInstance.current = null;
        }

        // Clear the container
        if (chartRef.current) {
          chartRef.current.innerHTML = '';
        }

        // Get container dimensions
        const container = chartRef.current;
        const containerRect = container.getBoundingClientRect();
        const width = Math.max(containerRect.width, 400);
        const height = Math.max(containerRect.height, 400);

        // Ensure spec has proper width/height constraints
        const finalSpec = {
          ...spec,
          width,
          height,
          autoFit: false,
          animation: true, // Enable animations for demo
        };

        // Create new chart instance
        vchartInstance.current = new VChart(finalSpec, {
          dom: chartRef.current,
          mode: 'desktop-browser',
          dpr: window.devicePixelRatio || 1,
        });

        // Render the chart
        await vchartInstance.current.renderAsync();
      } catch (err) {
        console.error('Error rendering chart:', err);
      }
    };

    renderChart();

    // Cleanup on unmount
    return () => {
      if (vchartInstance.current) {
        vchartInstance.current.release();
        vchartInstance.current = null;
      }
    };
  }, [spec]);

  // Handle window resize with throttling
  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;

    const handleResize = () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }

      resizeTimeout = setTimeout(() => {
        if (vchartInstance.current && chartRef.current) {
          const container = chartRef.current;
          const containerRect = container.getBoundingClientRect();
          const width = Math.max(containerRect.width, 400);
          const height = Math.max(containerRect.height, 400);

          vchartInstance.current.updateSpec({
            width,
            height,
            autoFit: false,
          });
        }
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
    };
  }, []);

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center space-y-4 max-w-md p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Generation Failed</h3>
            <p className="text-sm text-gray-600 mt-2">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!spec) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
          <div className="text-center space-y-6 p-8 bg-white rounded-2xl shadow-lg border border-gray-200 max-w-md">
            <div className={`w-16 h-16 mx-auto bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center ${isGenerating ? 'animate-pulse' : ''}`}>
              {isGenerating ? (
                <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {isGenerating ? 'Generating Chart...' : 'AI-Powered Charts'}
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                {isGenerating
                  ? 'AI is analyzing your data and creating the perfect visualization'
                  : selectedDataset
                    ? 'Generate intelligent charts from your selected dataset'
                    : 'Select a dataset first, then generate AI-powered visualizations'
                }
              </p>
            </div>

            {/* Streaming Settings */}
            {onToggleStreaming && (
              <div className="flex items-center justify-center space-x-3 pt-4 border-t">
                <span className="text-xs text-gray-500">Streaming:</span>
                <button
                  onClick={onToggleStreaming}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    enableStreaming ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    enableStreaming ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
                <span className="text-xs text-gray-500">
                  {enableStreaming ? 'ON' : 'OFF'}
                </span>
              </div>
            )}

            {selectedDataset && (
              <div className="space-y-4">
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  Selected: {selectedDataset.original_filename} ({selectedDataset.row_count} rows)
                </div>

                <button
                  onClick={() => setShowInsightForm(!showInsightForm)}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  🤖 Generate AI Insights (Demo)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ChatGPT-style Streaming Status */}
        {(streamingThoughts.length > 0 || isGenerating) && (
          <div className="border-t border-gray-100 bg-white px-6 py-4">
            <div className="flex items-center space-x-3">
              {/* AI Avatar */}
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>

              {/* Status Content */}
              <div className="flex-1 min-w-0">
                {streamingThoughts.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-sm font-medium text-gray-900 transition-all duration-300 ease-in-out ${
                        isStatusFading ? 'opacity-0 transform translate-y-1' : 'opacity-100 transform translate-y-0'
                      }`}
                    >
                      {currentStatus}
                    </span>
                    {/* ChatGPT-style typing dots */}
                    <div className={`flex space-x-1 transition-opacity duration-300 ${
                      isStatusFading ? 'opacity-30' : 'opacity-100'
                    }`}>
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                    </div>
                  </div>
                )}

                {/* Initial connecting state */}
                {isGenerating && enableStreaming && streamingThoughts.length === 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">Connecting to AI agent</span>
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Chart Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Chart Preview</h2>
            {generationTime && (
              <p className="text-sm text-gray-600 mt-1">
                ⚡ Generated in {(generationTime / 1000).toFixed(2)}s
              </p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <div className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
              DEMO
            </div>
            <button
              onClick={() => setShowInsightForm(!showInsightForm)}
              className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
            >
              🤖 AI Insights
            </button>
            <button
              onClick={() => setShowSpec(!showSpec)}
              className="px-4 py-2 text-sm bg-white hover:bg-gray-50 text-gray-700 rounded-lg border border-gray-200 transition-colors shadow-sm"
            >
              {showSpec ? 'Hide Spec' : 'View Spec'}
            </button>
          </div>
        </div>
      </div>

      {/* Chart Content */}
      <div className="flex-1 relative">
        {/* Chart Visualization - Always full width */}
        <div className="w-full h-full p-6 bg-gradient-to-br from-white to-gray-50">
          <div
            ref={chartRef}
            className="w-full h-full min-h-[400px] border border-gray-200 rounded-xl shadow-sm bg-white"
          />
        </div>

        {/* Spec Panel Overlay */}
        {showSpec && (
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-br from-gray-50 to-gray-100 border-l border-gray-200 shadow-lg z-50">
            <div className="p-4 h-full flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900">Chart Specification</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(spec, null, 2));
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => setShowSpec(false)}
                    className="text-xs text-gray-600 hover:text-gray-800 px-2 py-1 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto">
                <pre className="text-xs bg-white p-3 rounded-lg border shadow-sm mb-4 text-gray-800">
                  {JSON.stringify(spec, null, 2)}
                </pre>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="text-xs font-bold text-blue-900">💡 Demo Mode:</h4>
                  <p className="text-xs text-blue-800">This chart is rendered using mock data. In the full version, this would show your actual dataset.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}