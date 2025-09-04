'use client';

import AnimatedSection from '../../shared/AnimatedSection';
import ChartComponent from '../../shared/ChartComponent';
import { speedChartSpec, dashboardChartSpec } from '../chartSpecs';

export default function HowItWorksSection() {
  return (
    <AnimatedSection id="how-it-works" className="py-20">
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
    </AnimatedSection>
  );
}