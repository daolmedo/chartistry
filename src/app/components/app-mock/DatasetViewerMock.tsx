'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface Dataset {
  dataset_id: string;
  original_filename: string;
  row_count: number;
  column_count: number;
  ingestion_status: string;
  table_name: string;
}

interface DatasetViewerMockProps {
  dataset: Dataset | null;
  onClose: () => void;
}

interface DatasetData {
  columns: string[];
  rows: any[][];
}

// Mock dataset data
const mockDatasetData: DatasetData = {
  columns: ['Product', 'Category', 'Sales_Q1', 'Sales_Q2', 'Sales_Q3', 'Sales_Q4', 'Total_Sales', 'Region'],
  rows: [
    ['Product A', 'Electronics', 45000, 52000, 48000, 55000, 200000, 'North'],
    ['Product B', 'Electronics', 32000, 38000, 35000, 42000, 147000, 'South'],
    ['Product C', 'Clothing', 28000, 31000, 29000, 33000, 121000, 'East'],
    ['Product D', 'Clothing', 15000, 18000, 16000, 21000, 70000, 'West'],
    ['Product E', 'Home & Garden', 38000, 41000, 39000, 44000, 162000, 'North'],
    ['Product F', 'Home & Garden', 22000, 25000, 23000, 28000, 98000, 'South'],
    ['Product G', 'Sports', 35000, 39000, 37000, 42000, 153000, 'East'],
    ['Product H', 'Sports', 18000, 21000, 19000, 24000, 82000, 'West'],
    ['Product I', 'Books', 12000, 14000, 13000, 16000, 55000, 'North'],
    ['Product J', 'Books', 8000, 9000, 8500, 11000, 36500, 'South'],
    ['Product K', 'Electronics', 41000, 44000, 42000, 47000, 174000, 'East'],
    ['Product L', 'Clothing', 25000, 28000, 26000, 31000, 110000, 'West'],
    ['Product M', 'Home & Garden', 33000, 36000, 34000, 39000, 142000, 'North'],
    ['Product N', 'Sports', 29000, 32000, 30000, 35000, 126000, 'South'],
    ['Product O', 'Books', 15000, 17000, 16000, 19000, 67000, 'East']
  ]
};

export default function DatasetViewerMock({ dataset, onClose }: DatasetViewerMockProps) {
  const [data, setData] = useState<DatasetData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [height, setHeight] = useState(300); // Default height in pixels
  const [isMinimized, setIsMinimized] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dataset || dataset.ingestion_status !== 'completed') {
      setData(null);
      return;
    }

    setLoading(true);
    setError('');

    // Simulate API call with delay
    setTimeout(() => {
      setData(mockDatasetData);
      setLoading(false);
    }, 800);
  }, [dataset]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    setStartY(e.clientY);
    setStartHeight(height);
    e.preventDefault();
  }, [height]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    const deltaY = startY - e.clientY; // Inverted because we want dragging up to increase height
    const newHeight = Math.max(200, Math.min(600, startHeight + deltaY));
    setHeight(newHeight);
  }, [isResizing, startY, startHeight]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  if (!dataset) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg transition-all duration-300 ${
        isMinimized ? 'h-12' : ''
      }`}
      style={{ height: isMinimized ? '48px' : `${height}px` }}
    >
      {/* Resize Handle */}
      <div
        className="absolute top-0 left-0 right-0 h-1 bg-gray-300 hover:bg-blue-500 cursor-row-resize transition-colors"
        onMouseDown={handleMouseDown}
      />

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            {isMinimized ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
          <h3 className="text-sm font-bold text-gray-900">Dataset Preview</h3>
          <div className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
            DEMO
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">
            {dataset.original_filename} • {dataset.row_count} rows • {dataset.column_count} cols
          </span>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="h-full overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-600">Loading dataset preview...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          ) : data ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900">Data Preview</h4>
                <div className="text-xs text-gray-500">
                  Showing first 15 rows of {dataset.row_count} total rows
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          #
                        </th>
                        {data.columns.map((column, index) => (
                          <th
                            key={index}
                            className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.rows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-gray-50">
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                            {rowIndex + 1}
                          </td>
                          {row.map((cell, cellIndex) => (
                            <td
                              key={cellIndex}
                              className="px-3 py-2 whitespace-nowrap text-xs text-gray-900"
                            >
                              {cell !== null && cell !== undefined ? String(cell) : '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-xs text-blue-700">
                    <p className="font-medium">Demo Mode</p>
                    <p>This shows mock data for demonstration. In the full version, you'd see your actual uploaded dataset.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600">Dataset not ready for preview</p>
                <p className="text-xs text-gray-500 mt-1">
                  Status: {dataset.ingestion_status}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}