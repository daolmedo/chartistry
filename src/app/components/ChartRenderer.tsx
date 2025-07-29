'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import * as React from 'react';

interface ChartRendererProps {
  code: string;
}

export default function ChartRenderer({ code }: ChartRendererProps) {
  const [Component, setComponent] = useState<React.ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const executeCode = async () => {
      try {
        setError(null);
        
        // Import all visx modules for the sandbox
        const [scale, axis, shape, group, grid, curve, gradient, pattern, tooltip] = await Promise.all([
          import('@visx/scale'),
          import('@visx/axis'),
          import('@visx/shape'),
          import('@visx/group'),
          import('@visx/grid'),
          import('@visx/curve'),
          import('@visx/gradient'),
          import('@visx/pattern'),
          import('@visx/tooltip'),
        ]);

        const visx = {
          scale,
          axis,
          shape,
          group,
          grid,
          curve,
          gradient,
          pattern,
          tooltip,
        };

        // Create a safe execution environment
        const executeInSandbox = new Function(
          'React',
          'motion',
          'visx',
          `
          ${code}
          return ChartComponent;
          `
        );

        const GeneratedComponent = executeInSandbox(React, motion, visx);
        setComponent(() => GeneratedComponent);
      } catch (err) {
        console.error('Error executing chart code:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      }
    };

    if (code) {
      executeCode();
    }
  }, [code]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
          <div className="text-red-500 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Chart Rendering Error</h3>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!Component) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-full w-full flex items-center justify-center"
    >
      <Component />
    </motion.div>
  );
}