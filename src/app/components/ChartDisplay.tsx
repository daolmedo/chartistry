'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

interface ChartDisplayProps {
  chartCode: string | null;
  isLoading: boolean;
  error: string | null;
}

const ChartRenderer = dynamic(() => import('./ChartRenderer'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full">Loading chart...</div>
});

export default function ChartDisplay({ chartCode, isLoading, error }: ChartDisplayProps) {
  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">Chart Visualization</h1>
        <p className="text-gray-600 mt-1">Your data brought to life with beautiful charts</p>
      </div>

      <div className="flex-1 p-6">
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full"
          >
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Generating your chart...</p>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full"
          >
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
              <div className="text-red-500 mb-2">
                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">Error generating chart</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </motion.div>
        )}

        {!isLoading && !error && !chartCode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full text-center"
          >
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Ready to visualize your data</h3>
            <p className="text-gray-500 max-w-md">
              Start a conversation in the sidebar to generate beautiful, animated charts from your data.
            </p>
          </motion.div>
        )}

        {!isLoading && !error && chartCode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <ChartRenderer code={chartCode} />
          </motion.div>
        )}
      </div>
    </div>
  );
}