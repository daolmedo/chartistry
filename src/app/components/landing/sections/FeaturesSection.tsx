'use client';

import AnimatedSection from '../../shared/AnimatedSection';
import ChartComponent from '../../shared/ChartComponent';
import { speedChartSpec, pieChartSpec, dashboardChartSpec } from '../chartSpecs';

export default function FeaturesSection() {
  return (
    <AnimatedSection id="features" className="py-20 bg-gray-50">
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
    </AnimatedSection>
  );
}