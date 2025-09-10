'use client';

import { useEffect, useRef, useState } from 'react';
import VChart from '@visactor/vchart';
import { Dataset } from '../../lib/api';


interface VChartSpec {
  type: string;
  data: any[] | { values: any[] } | any;
  [key: string]: any;
}


interface DataMapping {
  sql?: string;
  target?: string;
  queries?: {
    [key: string]: {
      sql: string;
      target: string;
    };
  };
}

// Utility function to set data at a specific path in the spec
function setDataAtPath(spec: any, path: string, data: any) {
  console.log(`Setting data at path: ${path}`, data);
  
  if (path === 'data.0.values' && spec.data && Array.isArray(spec.data) && spec.data[0]) {
    spec.data[0].values = data;
  } else if (path === 'data.1.values' && spec.data && Array.isArray(spec.data) && spec.data[1]) {
    spec.data[1].values = data;
  } else if (path === 'data.values') {
    if (typeof spec.data === 'object' && !Array.isArray(spec.data) && spec.data !== null) {
      spec.data.values = data;
    } else {
      spec.data = { values: data };
    }
  } else {
    console.warn(`Unsupported path: ${path}`);
  }
}

interface ChartPreviewProps {
  spec: VChartSpec | null;
  generationTime?: number;
  error?: string | null;
  selectedDataset?: Dataset | null;
  streamingThoughts?: string[];
  isGenerating?: boolean;
  enableStreaming?: boolean;
  onToggleStreaming?: () => void;
  generationResponse?: any; // Full response from chart generation API
}

export default function ChartPreview({ 
  spec, 
  generationTime, 
  error, 
  selectedDataset,
  streamingThoughts = [],
  isGenerating = false,
  enableStreaming = true,
  onToggleStreaming,
  generationResponse 
}: ChartPreviewProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const vchartInstance = useRef<any>(null);
  const [showSpec, setShowSpec] = useState(false);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [insightPrompt, setInsightPrompt] = useState('');
  const [showInsightForm, setShowInsightForm] = useState(false);
  const [workflowThoughts, setWorkflowThoughts] = useState<string[]>([]);
  const [insightResult, setInsightResult] = useState<any>(null);
  const [isStatusFading, setIsStatusFading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [finalSpec, setFinalSpec] = useState<VChartSpec | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

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
        }, 150); // Half of transition duration
      } else {
        // First status, no fade needed
        setCurrentStatus(latestThought);
      }
    }
  }, [streamingThoughts, currentStatus]);

  // Effect to handle dynamic data fetching and spec hydration
  useEffect(() => {
    async function handleDynamicData() {
      // Check if we have a dynamic spec with dataMapping
      if (spec && generationResponse?.dataMapping && selectedDataset) {
        const dataMapping: DataMapping = generationResponse.dataMapping;
        
        console.log('Detected dynamic spec, fetching data:', {
          sql: dataMapping.sql,
          target: dataMapping.target,
          dataset: selectedDataset.dataset_id
        });
        
        setIsLoadingData(true);
        
        try {
          const hydratedSpec = { ...spec };

          if (dataMapping.queries) {
            // Multi-query chart - execute each query separately
            console.log('Multi-query chart detected, executing queries:', Object.keys(dataMapping.queries));
            
            for (const [queryKey, queryInfo] of Object.entries(dataMapping.queries)) {
              console.log(`Executing query: ${queryKey}`, queryInfo.sql);
              
              const response = await fetch('/api/datasets/data', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  action: 'executeSQL',
                  datasetId: selectedDataset.dataset_id,
                  tableName: selectedDataset.table_name,
                  sql: queryInfo.sql
                }),
              });

              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }

              const sqlResult = await response.json();
              const chartData = sqlResult.data || sqlResult.rows || [];
              
              console.log(`Query ${queryKey} result:`, chartData);
              
              // Inject data using simple path resolution
              setDataAtPath(hydratedSpec, queryInfo.target, chartData);
            }
          } else if (dataMapping.sql && dataMapping.target) {
            // Single query chart - traditional approach
            console.log('Single-query chart detected, executing SQL');
            
            const response = await fetch('/api/datasets/data', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                action: 'executeSQL',
                datasetId: selectedDataset.dataset_id,
                tableName: selectedDataset.table_name,
                sql: dataMapping.sql
              }),
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const sqlResult = await response.json();
            const chartData = sqlResult.data || sqlResult.rows || [];
            
            console.log('Single query result:', chartData);
            
            // Inject data using simple path resolution  
            setDataAtPath(hydratedSpec, dataMapping.target, chartData);
          }
          
          console.log('Spec hydrated with dynamic data:', hydratedSpec);
          setFinalSpec(hydratedSpec);
          
        } catch (error) {
          console.error('Error fetching dynamic data:', error);
          // Fallback to original spec on error
          setFinalSpec(spec);
        } finally {
          setIsLoadingData(false);
        }
      } else {
        // For non-dynamic specs (hardcoded data or insight results)
        setFinalSpec(spec);
      }
    }

    handleDynamicData();
  }, [spec, generationResponse, selectedDataset]);


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

  // Effect to render chart from finalSpec or insightResult
  useEffect(() => {
    const renderChart = async () => {
      const chartSpec = finalSpec || insightResult?.chart_spec;
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
  }, [finalSpec, insightResult]);

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

  if ((!finalSpec && !insightResult) || isLoadingData) {
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
                {isLoadingData ? 'Loading Fresh Data...' : isGenerating ? 'Generating Chart...' : 'AI-Powered Charts'}
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                {isLoadingData 
                  ? 'Fetching latest data from your dataset and updating the chart'
                  : isGenerating 
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
        
        {/* ChatGPT-style Streaming Status */}
        {(streamingThoughts.length > 0 || isGenerating || workflowThoughts.length > 0 || isGeneratingInsights || isLoadingData) && (
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
                {/* Chart generation streaming thoughts */}
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
                
                {/* Data loading state */}
                {isLoadingData && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">🔄 Loading fresh data from dataset</span>
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                      <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                      <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                    </div>
                  </div>
                )}
                
                {/* Initial connecting state */}
                {isGenerating && enableStreaming && streamingThoughts.length === 0 && !isLoadingData && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">Connecting to AI agent</span>
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                    </div>
                  </div>
                )}
                
                {/* Legacy insights workflow */}
                {isGeneratingInsights && workflowThoughts.length === 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">Starting analysis</span>
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                    </div>
                  </div>
                )}
                
                {workflowThoughts.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">{workflowThoughts[workflowThoughts.length - 1]}</span>
                    {isGeneratingInsights && (
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
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
              
              {/* Dynamic Data Mapping Info */}
              {generationResponse?.dataMapping && (
                <div className="mt-4 space-y-2">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <h4 className="text-xs font-bold text-green-900">🔄 Dynamic Data Flow:</h4>
                    <div className="text-xs text-green-800 space-y-1">
                      <div><strong>Status:</strong> {isLoadingData ? 'Loading fresh data...' : 'Using live data from dataset'}</div>
                      <div><strong>Target:</strong> {generationResponse.dataMapping.target}</div>
                      <div><strong>SQL:</strong> <code className="bg-green-100 px-1 rounded">{generationResponse.dataMapping.sql}</code></div>
                    </div>
                  </div>
                </div>
              )}

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