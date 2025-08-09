'use client';

import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

interface ChartDisplayProps {
  chartConfig: any;
  isLoading: boolean;
  error: string | null;
}

export default function ChartDisplay({ chartConfig, isLoading, error }: ChartDisplayProps) {
  const chartRef = useRef<ChartJS<"pie"> | null>(null);

  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Generating your chart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!chartConfig) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Create Charts</h3>
          <p className="text-gray-600">Use the sidebar to describe what kind of pie chart you'd like to create.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 p-8">
      <div className="bg-white rounded-lg shadow-sm p-6 h-full">
        <div className="max-w-2xl mx-auto h-full flex flex-col">
          {chartConfig.options?.plugins?.title?.text && (
            <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
              {chartConfig.options.plugins.title.text}
            </h3>
          )}
          
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-lg">
              <Pie
                ref={chartRef}
                data={chartConfig.data}
                options={{
                  ...chartConfig.options,
                  maintainAspectRatio: true,
                  responsive: true,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}