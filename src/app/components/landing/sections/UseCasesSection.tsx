'use client';

import AnimatedSection from '../../shared/AnimatedSection';
import ChartComponent from '../../shared/ChartComponent';
import { dashboardChartSpec, pieChartSpec, heroChartSpec } from '../chartSpecs';

export default function UseCasesSection() {
  return (
    <AnimatedSection className="py-20 bg-gray-50">
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
    </AnimatedSection>
  );
}