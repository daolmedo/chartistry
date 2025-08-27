'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import VChart, { registerMediaQuery } from '@visactor/vchart';

// Register media query plugin
if (typeof window !== 'undefined') {
  registerMediaQuery();
}

// Chart component wrapper
function ChartComponent({ spec, className }: { spec: any; className?: string }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const vchartInstance = useRef<any>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Clean up previous instance
    if (vchartInstance.current) {
      vchartInstance.current.release();
    }

    // Create responsive spec with media queries
    const responsiveSpec = {
      ...spec,
      autoFit: true,
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
  }, [spec]);

  return <div ref={chartRef} className={className} />;
}

export default function LandingPage() {
  // Hero animated line chart
  const heroChartSpec = {
    type: 'line',
    data: {
      values: [
        { month: 'Jan', value: 100, type: 'Manual Process' },
        { month: 'Feb', value: 120, type: 'Manual Process' },
        { month: 'Mar', value: 140, type: 'Manual Process' },
        { month: 'Apr', value: 160, type: 'Manual Process' },
        { month: 'May', value: 180, type: 'Manual Process' },
        { month: 'Jun', value: 200, type: 'Manual Process' },
        { month: 'Jan', value: 100, type: 'With chartz.ai' },
        { month: 'Feb', value: 300, type: 'With chartz.ai' },
        { month: 'Mar', value: 600, type: 'With chartz.ai' },
        { month: 'Apr', value: 1200, type: 'With chartz.ai' },
        { month: 'May', value: 2000, type: 'With chartz.ai' },
        { month: 'Jun', value: 3500, type: 'With chartz.ai' },
      ]
    },
    xField: 'month',
    yField: 'value',
    seriesField: 'type',
    color: ['#8b5cf6', '#3b82f6'],
    background: 'rgba(1,1,1,0)',
    line: {
      style: {
        lineWidth: 3
      }
    },
    point: {
      style: {
        size: 6
      }
    },
    animationAppear: {
      duration: 2000
    },
    axes: [
      {
        orient: 'bottom',
        type: 'band'
      },
      {
        orient: 'left',
        type: 'linear'
      }
    ],
    legends: {
      visible: true,
      orient: 'bottom'
    }
  };

  // Speed comparison bar chart
  const speedChartSpec = {
    type: 'bar',
    data: {
      values: [
        { method: 'Manual', time: 240, color: '#3b82f6' },
        { method: 'chartz.ai', time: 15, color: '#1d4ed8' }
      ]
    },
    xField: 'method',
    yField: 'time',
    background: 'rgba(1,1,1,0)',
    color: {
      field: 'color',
      scale: {
        range: ['#3b82f6', '#1d4ed8']
      }
    },
    axes: [
      {
        orient: 'left',
        title: {
          visible: true,
          text: 'Time (minutes)'
        }
      }
    ]
  };

  // Modern pie chart
  const pieChartSpec = {
    type: 'pie',
    data: {
      values: [
        { category: 'Time Saved', value: 85, color: '#8b5cf6' },
        { category: 'Manual Work', value: 15, color: '#a855f7' }
      ]
    },
    categoryField: 'category',
    valueField: 'value',
    background: 'rgba(1,1,1,0)',
    color: {
      field: 'color',
      scale: {
        range: ['#8b5cf6', '#a855f7']
      }
    },
    label: {
      visible: true,
      formatMethod: (text: any, datum: any) => `${datum.value}%`
    }
  };

  // Dashboard preview chart
  const dashboardChartSpec = {
    type: 'bar',
    data: {
      values: [
        { quarter: 'Q1', value: 2400, type: 'Revenue' },
        { quarter: 'Q2', value: 1398, type: 'Revenue' },
        { quarter: 'Q3', value: 9800, type: 'Revenue' },
        { quarter: 'Q4', value: 3908, type: 'Revenue' },
        { quarter: 'Q1', value: 1800, type: 'Costs' },
        { quarter: 'Q2', value: 1200, type: 'Costs' },
        { quarter: 'Q3', value: 3200, type: 'Costs' },
        { quarter: 'Q4', value: 2100, type: 'Costs' }
      ]
    },
    xField: 'quarter',
    yField: 'value',
    seriesField: 'type',
    background: 'rgba(1,1,1,0)',
    color: ['#10b981', '#059669']
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg"></div>
              <span className="text-2xl font-bold text-gray-900">chartz.ai</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900">How it Works</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
              <Link href="/app" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Best{' '}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  LookerStudio
                </span>{' '}
                Alternative
              </h1>
              <p className="text-xl text-gray-600 mt-6 leading-relaxed">
                Turn Data into Stunning Dashboards and Charts in Seconds. chartz.ai lets you create dashboards and beautiful data visualizations effortlessly with AI.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Link
                  href="/app"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Get Started Free
                </Link>
                <button className="border border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200">
                  See How It Works
                </button>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 flex items-center justify-center h-[300px] lg:h-[400px]">
              <ChartComponent spec={heroChartSpec} className="w-full h-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose chartz.ai?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transform your workflow with AI-powered data visualization that's faster, smarter, and more beautiful than traditional tools.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 mb-6 flex items-center justify-center h-[200px]">
                <ChartComponent spec={speedChartSpec} className="w-full h-full" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No Code. Just Data.</h3>
              <p className="text-gray-600 leading-relaxed">
                Simply upload your dataset or paste your numbers. Our AI instantly builds insightful charts.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 mb-6 flex items-center justify-center h-[200px]">
                <ChartComponent spec={pieChartSpec} className="w-full h-full max-w-[200px]" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Beautiful by Default</h3>
              <p className="text-gray-600 leading-relaxed">
                Every chart is optimized for clarity, design, and storytelling. No design skills needed.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 mb-6 flex items-center justify-center h-[200px]">
                <ChartComponent spec={dashboardChartSpec} className="w-full h-full" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Smart Dashboards</h3>
              <p className="text-gray-600 leading-relaxed">
                AI automatically groups charts into dashboards for better storytelling and reporting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How chartz.ai Works</h2>
            <p className="text-xl text-gray-600">Three simple steps to beautiful data visualization</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Upload</h3>
              <p className="text-gray-600 mb-6">Drag and drop a CSV, Excel, or paste raw data.</p>
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="w-16 h-16 bg-blue-100 rounded-lg mx-auto flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="bg-purple-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Generate</h3>
              <p className="text-gray-600 mb-6">AI analyzes and suggests the best charts for your data.</p>
              <div className="bg-gray-50 rounded-xl p-6 flex items-center justify-center h-[150px]">
                <ChartComponent spec={speedChartSpec} className="w-full h-full" />
              </div>
            </div>

            <div className="text-center">
              <div className="bg-green-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Customize</h3>
              <p className="text-gray-600 mb-6">Adjust colors, styles, and layouts instantly with AI assistance.</p>
              <div className="bg-gray-50 rounded-xl p-6 flex items-center justify-center h-[150px]">
                <ChartComponent spec={dashboardChartSpec} className="w-full h-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Who is chartz.ai for?</h2>
            <p className="text-xl text-gray-600">Trusted by professionals across industries</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Business Analysts</h3>
              <p className="text-gray-600 mb-6">Quickly create presentation-ready dashboards.</p>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 flex items-center justify-center h-[160px]">
                <ChartComponent spec={dashboardChartSpec} className="w-full h-full" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Researchers</h3>
              <p className="text-gray-600 mb-6">Explore data insights without wasting time on formatting.</p>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 flex items-center justify-center h-[160px]">
                <ChartComponent spec={pieChartSpec} className="w-full h-full max-w-[160px]" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Startups & Teams</h3>
              <p className="text-gray-600 mb-6">Impress investors with clean, data-driven visuals.</p>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 flex items-center justify-center h-[160px]">
                <ChartComponent spec={heroChartSpec} className="w-full h-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Loved by Data-Driven Teams</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  S
                </div>
                <div className="ml-4">
                  <h4 className="font-bold text-gray-900">Sophia R.</h4>
                  <p className="text-gray-600">Data Scientist</p>
                </div>
              </div>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                "chartz.ai cut my reporting time in half. I just drop in data, and the charts are presentation-ready."
              </p>
              <div className="flex items-center justify-center h-[120px]">
                <ChartComponent spec={speedChartSpec} className="w-full h-full" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  D
                </div>
                <div className="ml-4">
                  <h4 className="font-bold text-gray-900">David M.</h4>
                  <p className="text-gray-600">Startup Founder</p>
                </div>
              </div>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                "Our investor updates have never looked better. Clean visuals, zero effort."
              </p>
              <div className="flex items-center justify-center h-[120px]">
                <ChartComponent spec={heroChartSpec} className="w-full h-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600">Choose the plan that's right for you</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
              <div className="text-4xl font-bold text-gray-900 mb-6">$0<span className="text-lg text-gray-600">/month</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Up to 5 charts per month
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Basic customization
                </li>
              </ul>
              <Link href="/app" className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 py-3 px-6 rounded-lg font-semibold text-center block transition-colors">
                Get Started
              </Link>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 shadow-xl text-white relative">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-yellow-500 text-yellow-900 px-4 py-1 rounded-full text-sm font-bold">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <div className="text-4xl font-bold mb-6">$15<span className="text-lg opacity-80">/month</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-white mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Unlimited charts
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-white mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Advanced styling
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-white mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Team dashboards
                </li>
              </ul>
              <Link href="/app" className="w-full bg-white text-blue-600 py-3 px-6 rounded-lg font-semibold text-center block hover:bg-gray-50 transition-colors">
                Start Pro Trial
              </Link>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
              <div className="text-4xl font-bold text-gray-900 mb-6">Custom</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Dedicated support
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Custom branding
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Data security integrations
                </li>
              </ul>
              <button className="w-full border border-gray-300 hover:border-gray-400 text-gray-700 py-3 px-6 rounded-lg font-semibold transition-colors">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Start Creating Beautiful Charts with AI Today</h2>
          <p className="text-xl opacity-90 mb-8">Join thousands of professionals who trust chartz.ai for their data visualization needs</p>
          <Link
            href="/app"
            className="inline-flex items-center bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Try chartz.ai Free
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg"></div>
                <span className="text-2xl font-bold">chartz.ai</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Transform your data into beautiful, interactive charts with the power of AI. 
                The fastest way to create stunning data visualizations.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="/app" className="hover:text-white transition-colors">Get Started</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">© 2024 chartz.ai. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}