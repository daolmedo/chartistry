'use client';

import { useEffect, useRef } from 'react';
import VChart, { registerMediaQuery } from '@visactor/vchart';
import { useIntersectionObserver } from '../landing/hooks';

// Register media query plugin
if (typeof window !== 'undefined') {
  registerMediaQuery();
}

// Chart component wrapper with animation support
export default function ChartComponent({ 
  spec, 
  className, 
  shouldAnimate = true 
}: { 
  spec: any; 
  className?: string; 
  shouldAnimate?: boolean 
}) {
  const chartRef = useRef<HTMLDivElement>(null);
  const vchartInstance = useRef<any>(null);
  const { elementRef, hasIntersected } = useIntersectionObserver();

  useEffect(() => {
    if (!chartRef.current) return;
    if (shouldAnimate && !hasIntersected) return; // Wait for intersection if animation is enabled

    // Clean up previous instance
    if (vchartInstance.current) {
      vchartInstance.current.release();
    }

    // Create responsive spec with media queries and animation
    const responsiveSpec = {
      ...spec,
      autoFit: true,
      animation: shouldAnimate && hasIntersected ? {
        appear: {
          duration: 1000,
          easing: 'cubicInOut'
        },
        update: {
          duration: 400,
          easing: 'cubicInOut'
        }
      } : false,
      media: [
        {
          query: { maxWidth: 600 },
          action: [
            {
              filterType: 'chart',
              spec: {
                padding: { left: 20, right: 20, top: 20, bottom: 20 }
              }
            }
          ]
        },
        {
          query: { maxHeight: 250 },
          action: [
            {
              filterType: 'legends',
              spec: {
                visible: false
              }
            }
          ]
        }
      ]
    };

    // Create new chart
    vchartInstance.current = new VChart(responsiveSpec, {
      dom: chartRef.current,
      mode: 'desktop-browser',
    });

    vchartInstance.current.renderAsync();

    return () => {
      if (vchartInstance.current) {
        vchartInstance.current.release();
      }
    };
  }, [spec, shouldAnimate, hasIntersected]);

  return (
    <div ref={elementRef} className={className}>
      <div ref={chartRef} className="w-full h-full" />
    </div>
  );
}