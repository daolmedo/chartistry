'use client';

import { useState, useEffect } from 'react';
import { Dataset } from '../lib/api';

interface DatasetViewerProps {
  dataset: Dataset | null;
  onClose: () => void;
  onGenerateInsights?: (dataset: Dataset, userIntent: string) => void;
}

interface DatasetData {
  columns: string[];
  rows: any[][];
}

export default function DatasetViewer({ dataset, onClose }: DatasetViewerProps) {
  const [data, setData] = useState<DatasetData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!dataset || dataset.ingestion_status !== 'completed') {
      setData(null);
      return;
    }

    setLoading(true);
    setError('');

    // Fetch dataset data from the API
    fetch(`/api/datasets/data?datasetId=${dataset.dataset_id}&tableName=${dataset.table_name}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch dataset data');
        }
        return response.json();
      })
      .then((result) => {
        console.log('API response:', result); // Debug log
        setData(result);
      })
      .catch(err => {
        setError(err.message || 'Failed to load dataset');
        console.error('Error loading dataset:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [dataset]);

  if (!dataset) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-80 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-gray-900">
            {dataset.original_filename}
          </h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>{dataset.row_count} rows</span>
            <span>•</span>
            <span>{dataset.column_count} columns</span>
            <span>•</span>
            <span className={`px-2 py-1 rounded-full text-xs ${
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
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          aria-label="Close dataset viewer"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="h-48 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center space-x-3 text-gray-600">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading dataset...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-red-600 bg-red-50 p-6 rounded-lg m-6">
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-semibold">Failed to load dataset</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        ) : dataset.ingestion_status !== 'completed' ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-600 p-6">
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-semibold">Dataset not ready</p>
              <p className="text-sm mt-1">
                Status: {dataset.ingestion_status}
                {dataset.ingestion_status === 'processing' && ' - Please wait...'}
                {dataset.ingestion_status === 'failed' && ' - Upload failed'}
              </p>
            </div>
          </div>
        ) : !data ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500 p-6">
              <p>No data available</p>
            </div>
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="w-12 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r border-gray-200">
                    #
                  </th>
                  {data.columns?.map((column, index) => (
                    <th
                      key={index}
                      className="px-3 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider border-b border-r border-gray-200 min-w-32"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white">
                {data.rows?.map((row, rowIndex) => (
                  <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-2 text-sm text-gray-500 border-b border-r border-gray-200 font-mono">
                      {rowIndex + 1}
                    </td>
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="px-3 py-2 text-sm text-gray-900 border-b border-r border-gray-200 whitespace-nowrap overflow-hidden text-ellipsis max-w-xs"
                        title={String(cell)}
                      >
                        {cell === null || cell === undefined ? (
                          <span className="text-gray-400 italic">null</span>
                        ) : (
                          String(cell)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Show message if no data */}
            {(!data.rows || data.rows.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <p>No data rows found</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Footer with info */}
      {data && data.rows && data.rows.length > 0 && (
        <div className="px-6 py-2 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
          Showing {data.rows.length} of {dataset.row_count} rows
        </div>
      )}
    </div>
  );
}