'use client';

import AnimatedSection from '../../shared/AnimatedSection';
import ChartComponent from '../../shared/ChartComponent';
import { speedChartSpec, heroChartSpec } from '../chartSpecs';

export default function TestimonialsSection() {
  return (
    <AnimatedSection className="py-20">
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
    </AnimatedSection>
  );
}