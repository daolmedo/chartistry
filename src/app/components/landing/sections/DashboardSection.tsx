'use client';

import { useEffect, useRef, useState } from 'react';
import { useIntersectionObserver } from '../hooks';
import ChartComponent from '../../shared/ChartComponent';

// Dashboard chart data and specs
const dashboardCharts = [
  {
    id: 'revenue',
    title: 'Revenue Growth',
    subtitle: '+12.5% from last quarter',
    icon: '📈',
    color: 'bg-green-50 border-green-200',
    spec: {
      type: 'line',
      data: {
        values: [
          { month: 'Jan', value: 85000 },
          { month: 'Feb', value: 92000 },
          { month: 'Mar', value: 78000 },
          { month: 'Apr', value: 105000 },
          { month: 'May', value: 118000 },
          { month: 'Jun', value: 125000 }
        ]
      },
      xField: 'month',
      yField: 'value',
      background: 'transparent',
      color: '#10b981',
      axes: [{ orient: 'bottom', visible: false }, { orient: 'left', visible: false }],
      point: { visible: false },
      line: { style: { lineWidth: 3 } }
    }
  },
  {
    id: 'customers',
    title: 'Active Customers',
    subtitle: '2,847 total customers',
    icon: '👥',
    color: 'bg-blue-50 border-blue-200',
    spec: {
      type: 'bar',
      data: {
        values: [
          { category: 'New', value: 847, color: '#3b82f6' },
          { category: 'Returning', value: 2000, color: '#1d4ed8' }
        ]
      },
      xField: 'category',
      yField: 'value',
      background: 'transparent',
      color: { field: 'color' },
      axes: [{ orient: 'bottom', visible: false }, { orient: 'left', visible: false }]
    }
  },
  {
    id: 'conversion',
    title: 'Conversion Rate',
    subtitle: '14.2% this month',
    icon: '🎯',
    color: 'bg-purple-50 border-purple-200',
    spec: {
      type: 'pie',
      data: {
        values: [
          { category: 'Converted', value: 14.2, color: '#8b5cf6' },
          { category: 'Visitors', value: 85.8, color: '#e5e7eb' }
        ]
      },
      categoryField: 'category',
      valueField: 'value',
      background: 'transparent',
      color: { field: 'color' },
      innerRadius: 0.6,
      outerRadius: 0.8,
      label: { visible: false },
      legends: { visible: false }
    }
  },
  {
    id: 'performance',
    title: 'Performance Score',
    subtitle: '94/100 rating',
    icon: '⚡',
    color: 'bg-orange-50 border-orange-200',
    spec: {
      type: 'area',
      data: {
        values: [
          { time: 0, score: 82 },
          { time: 1, score: 85 },
          { time: 2, score: 78 },
          { time: 3, score: 90 },
          { time: 4, score: 94 },
          { time: 5, score: 94 }
        ]
      },
      xField: 'time',
      yField: 'score',
      background: 'transparent',
      color: '#f97316',
      axes: [{ orient: 'bottom', visible: false }, { orient: 'left', visible: false }],
      point: { visible: false },
      area: { style: { fillOpacity: 0.3 } },
      line: { style: { lineWidth: 2 } }
    }
  }
];

// Animated section wrapper
function AnimatedSection({ 
  children, 
  className = "", 
  id 
}: { 
  children: React.ReactNode; 
  className?: string; 
  id?: string; 
}) {
  const { elementRef, hasIntersected } = useIntersectionObserver();
  
  return (
    <section
      ref={elementRef}
      id={id}
      className={`transition-all duration-1000 ${
        hasIntersected 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-8'
      } ${className}`}
    >
      {children}
    </section>
  );
}

// Individual chart card component
function DashboardCard({ 
  chart, 
  index, 
  isVisible 
}: { 
  chart: typeof dashboardCharts[0]; 
  index: number; 
  isVisible: boolean; 
}) {
  const [hasAnimated, setHasAnimated] = useState(false);
  
  useEffect(() => {
    if (isVisible && !hasAnimated) {
      const timer = setTimeout(() => {
        setHasAnimated(true);
      }, index * 200); // Stagger animations
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, hasAnimated, index]);

  return (
    <div
      className={`${chart.color} rounded-2xl p-6 border shadow-sm transition-all duration-700 ${
        hasAnimated 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 translate-y-8 scale-95'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{chart.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{chart.subtitle}</p>
        </div>
        <div className="text-2xl">{chart.icon}</div>
      </div>
      
      <div className="h-24 w-full">
        {hasAnimated && (
          <ChartComponent 
            spec={chart.spec} 
            className="w-full h-full" 
            shouldAnimate={true}
          />
        )}
      </div>
    </div>
  );
}

export default function DashboardSection() {
  const [hasStarted, setHasStarted] = useState(false);
  const { elementRef: observerRef, hasIntersected } = useIntersectionObserver();

  // Start animation when section comes into view
  useEffect(() => {
    if (hasIntersected && !hasStarted) {
      setHasStarted(true);
    }
  }, [hasIntersected, hasStarted]);

  return (
    <AnimatedSection className="py-16 lg:py-24 bg-gradient-to-br from-gray-50 to-white">
      <div ref={observerRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center bg-indigo-100 text-indigo-800 rounded-full px-4 py-2 text-sm font-medium mb-6">
            <span className="mr-2">🚀</span>
            Beyond Charts
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Share With Your Team
            </span>
            <span className="block">
              Business Dashboards
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transform your data into comprehensive dashboards with multiple charts, 
            KPIs, and insights - all from natural language prompts.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Side - Dashboard Preview */}
          <div className="relative">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-3xl blur-3xl transform rotate-6"></div>
            
            {/* Dashboard container */}
            <div className="relative bg-white rounded-2xl p-8 shadow-2xl border border-gray-100">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Business Overview</h3>
                  <p className="text-gray-600 mt-1">Real-time performance metrics</p>
                </div>
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
              </div>
              
              {/* Chart grid */}
              <div className="grid grid-cols-2 gap-6">
                {dashboardCharts.map((chart, index) => (
                  <DashboardCard
                    key={chart.id}
                    chart={chart}
                    index={index}
                    isVisible={hasStarted}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right Side - Features */}
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Multi-Chart Dashboards</h4>
                  <p className="text-gray-600">Create comprehensive dashboards with multiple visualizations, KPIs, and data sources in one unified view.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Real-time Updates</h4>
                  <p className="text-gray-600">Connect to live data sources and watch your dashboards update automatically as your data changes.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Natural Language</h4>
                  <p className="text-gray-600">Simply describe what you want: "Create a sales dashboard with revenue trends and customer metrics."</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Fully Customizable</h4>
                  <p className="text-gray-600">Adjust layouts, colors, and styling to match your brand. Export or embed anywhere you need.</p>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-4">
              <button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition-all duration-300 hover:scale-105">
                Try Dashboard Builder
              </button>
            </div>
          </div>
        </div>

        {/* Bottom stats */}
        <div className="mt-20 pt-12 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">50+</div>
              <div className="text-gray-600 mt-1">Chart Types</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">10s</div>
              <div className="text-gray-600 mt-1">Setup Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">∞</div>
              <div className="text-gray-600 mt-1">Data Sources</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">24/7</div>
              <div className="text-gray-600 mt-1">Live Updates</div>
            </div>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}