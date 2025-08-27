'use client';

import { useEffect, useRef, useState } from 'react';
import VChart from '@visactor/vchart';

interface VChartSpec {
  type: string;
  data: any[];
  [key: string]: any;
}

interface ChartPreviewProps {
  spec: VChartSpec | null;
  generationTime?: number;
  error?: string | null;
}

export default function ChartPreview({ spec, generationTime, error }: ChartPreviewProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const vchartInstance = useRef<any>(null);
  const [showSpec, setShowSpec] = useState(false);

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
        const chartSpec = {
          ...spec,
          width,
          height,
          autoFit: false, // Disable auto-fit to prevent size changes
          animation: false, // Disable animations to prevent resize triggers
        };

        // Create new chart instance
        vchartInstance.current = new VChart(chartSpec, {
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
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Generation Failed</h3>
            <p className="text-sm text-gray-600 mt-2">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!spec) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-gray-200 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Ready to Generate</h3>
            <p className="text-sm text-gray-600 mt-2">
              Configure your data and prompt, then click Generate Chart to create a visualization.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Chart Header */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Chart Preview</h2>
            {generationTime && (
              <p className="text-sm text-gray-600 mt-1">
                Generated in {(generationTime / 1000).toFixed(2)}s
              </p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowSpec(!showSpec)}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            >
              {showSpec ? 'Hide Spec' : 'View Spec'}
            </button>
          </div>
        </div>
      </div>

      {/* Chart Content */}
      <div className="flex-1 flex">
        {/* Chart Visualization */}
        <div className={`${showSpec ? 'w-2/3' : 'w-full'} p-6 bg-white`}>
          <div 
            ref={chartRef} 
            className="w-full h-full min-h-[400px] border border-gray-200 rounded-lg"
          />
        </div>

        {/* Spec Panel */}
        {showSpec && (
          <div className="w-1/3 border-l border-gray-200 bg-gray-50">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900">Chart Specification</h3>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(spec, null, 2));
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Copy
                </button>
              </div>
              <pre className="text-xs bg-white p-3 rounded border overflow-auto h-96 text-gray-800">
                {JSON.stringify(spec, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}