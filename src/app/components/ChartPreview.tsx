'use client';

import { useEffect, useRef, useState } from 'react';
import VChart from '@visactor/vchart';
import { Dataset } from '../lib/api';

interface VChartSpec {
  type: string;
  data: any[];
  [key: string]: any;
}

interface ChartPreviewProps {
  spec: VChartSpec | null;
  generationTime?: number;
  error?: string | null;
  selectedDataset?: Dataset | null;
}

export default function ChartPreview({ spec, generationTime, error, selectedDataset }: ChartPreviewProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const vchartInstance = useRef<any>(null);
  const [showSpec, setShowSpec] = useState(false);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [insightPrompt, setInsightPrompt] = useState('');
  const [showInsightForm, setShowInsightForm] = useState(false);
  const [workflowThoughts, setWorkflowThoughts] = useState<string[]>([]);
  const [insightResult, setInsightResult] = useState<any>(null);

  const generateInsights = async (userIntent: string) => {
    if (!selectedDataset) {
      alert('Please select a dataset first');
      return;
    }

    setIsGeneratingInsights(true);
    setWorkflowThoughts([]);
    setInsightResult(null);

    try {
      const response = await fetch('/api/generate-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_intent: userIntent,
          dataset_id: selectedDataset.dataset_id,
          table_name: selectedDataset.table_name
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setInsightResult(result);
      setWorkflowThoughts([
        '✅ Dataset structure analyzed',
        '✅ SQL query generated: ' + result.sql_query?.substring(0, 60) + '...',
        '✅ Insight extracted: ' + result.insight_explanation?.substring(0, 100) + '...',
        '✅ VChart specification created',
        '✅ Workflow completed successfully!'
      ]);

    } catch (error) {
      console.error('Error generating insights:', error);
      setWorkflowThoughts([
        '❌ Error generating insights: ' + (error instanceof Error ? error.message : 'Unknown error')
      ]);
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  // Effect to render chart from either spec or insightResult
  useEffect(() => {
    const renderChart = async () => {
      const chartSpec = spec || insightResult?.chart_spec;
      if (!chartSpec || !chartRef.current) return;

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
          ...chartSpec,
          width,
          height,
          autoFit: false, // Disable auto-fit to prevent size changes
          animation: false, // Disable animations to prevent resize triggers
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
  }, [spec, insightResult]);

  // Handle window resize with throttling
  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;
    
    const handleResize = () => {
      // Clear previous timeout
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      
      // Throttle resize calls to prevent infinite loops
      resizeTimeout = setTimeout(() => {
        if (vchartInstance.current && chartRef.current) {
          const container = chartRef.current;
          const containerRect = container.getBoundingClientRect();
          const width = Math.max(containerRect.width, 400);
          const height = Math.max(containerRect.height, 400);
          
          // Update chart size with explicit dimensions
          vchartInstance.current.updateSpec({
            width,
            height,
            autoFit: false,
          });
        }
      }, 150); // 150ms throttle
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

  if (!spec && !insightResult) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
          <div className="text-center space-y-6 p-8 bg-white rounded-2xl shadow-lg border border-gray-200 max-w-md">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">AI-Powered Insights</h3>
              <p className="text-sm text-gray-600 mt-2">
                {selectedDataset 
                  ? 'Generate intelligent insights and charts from your selected dataset'
                  : 'Select a dataset first, then generate AI-powered insights and visualizations'
                }
              </p>
            </div>
            
            {selectedDataset && (
              <div className="space-y-4">
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  Selected: {selectedDataset.original_filename} ({selectedDataset.row_count} rows)
                </div>
                
                {!showInsightForm ? (
                  <button
                    onClick={() => setShowInsightForm(true)}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    🤖 Generate AI Insights
                  </button>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={insightPrompt}
                      onChange={(e) => setInsightPrompt(e.target.value)}
                      placeholder="What insights would you like? e.g., 'Show me the distribution of categories'"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => generateInsights(insightPrompt)}
                        disabled={!insightPrompt.trim() || isGeneratingInsights}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {isGeneratingInsights ? '🧠 Thinking...' : '✨ Generate'}
                      </button>
                      <button
                        onClick={() => setShowInsightForm(false)}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Workflow Thoughts Panel */}
        {(workflowThoughts.length > 0 || isGeneratingInsights) && (
          <div className="border-t border-gray-200 bg-gray-50 p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">🧠 AI Workflow Progress</h4>
            <div className="space-y-1">
              {isGeneratingInsights && workflowThoughts.length === 0 && (
                <div className="text-sm text-blue-600 animate-pulse">🔍 Starting analysis...</div>
              )}
              {workflowThoughts.map((thought, index) => (
                <div key={index} className="text-sm text-gray-700">
                  {thought}
                </div>
              ))}
              {isGeneratingInsights && (
                <div className="text-sm text-blue-600 animate-pulse">⏳ Processing...</div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  const currentSpec = spec || insightResult?.chart_spec;
  
  return (
    <div className="flex-1 flex flex-col">
      {/* Chart Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {insightResult ? 'AI-Generated Insight' : 'Chart Preview'}
            </h2>
            {generationTime && (
              <p className="text-sm text-gray-600 mt-1">
                ⚡ Generated in {(generationTime / 1000).toFixed(2)}s
              </p>
            )}
            {insightResult && (
              <p className="text-sm text-blue-600 mt-1">
                🤖 AI Analysis: {insightResult.insight_explanation?.substring(0, 80)}...
              </p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {selectedDataset && !insightResult && (
              <button
                onClick={() => setShowInsightForm(true)}
                className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
              >
                🤖 AI Insights
              </button>
            )}
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
      <div className="flex-1 flex">
        {/* Chart Visualization */}
        <div className={`${showSpec ? 'w-2/3' : 'w-full'} p-6 bg-gradient-to-br from-white to-gray-50`}>
          <div 
            ref={chartRef} 
            className="w-full h-full min-h-[400px] border border-gray-200 rounded-xl shadow-sm bg-white"
          />
        </div>

        {/* Spec Panel */}
        {showSpec && (
          <div className="w-1/3 border-l border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900">Chart Specification</h3>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(spec, null, 2));
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                >
                  Copy
                </button>
              </div>
              <pre className="text-xs bg-white p-3 rounded-lg border shadow-sm overflow-auto h-96 text-gray-800">
                {JSON.stringify(currentSpec, null, 2)}
              </pre>
              
              {insightResult && (
                <div className="mt-4 space-y-2">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="text-xs font-bold text-blue-900">SQL Query:</h4>
                    <code className="text-xs text-blue-800 break-all">{insightResult.sql_query}</code>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <h4 className="text-xs font-bold text-green-900">Insight:</h4>
                    <p className="text-xs text-green-800">{insightResult.insight_explanation}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}