'use client';

import AnimatedSection from '../../shared/AnimatedSection';
import ChartComponent from '../../shared/ChartComponent';
import { bubbleChartSpec, sankeyChartSpec } from '../chartSpecs';

export default function ComplexChartsSection() {
  return (
    <AnimatedSection className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Complex charts or data structures? No problem!</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We handle dozens of chart types, from simple bar charts to advanced visualizations like bubble plots and flow diagrams. 
            Whatever your data tells, we help you visualize it perfectly.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="bg-gradient-to-br from-orange-50 to-red-100 rounded-xl p-4 mb-6 flex items-center justify-center h-[300px]">
              <ChartComponent spec={bubbleChartSpec} className="w-full h-full" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Multi-Dimensional Analysis</h3>
            <p className="text-gray-600 leading-relaxed">
              Bubble scatter plots reveal relationships between three or more variables, perfect for exploring correlations 
              in complex datasets like economic indicators, scientific research, or market analysis.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="bg-gradient-to-br from-cyan-50 to-blue-100 rounded-xl p-4 mb-6 flex items-center justify-center h-[300px]">
              <ChartComponent spec={sankeyChartSpec} className="w-full h-full" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Flow & Process Visualization</h3>
            <p className="text-gray-600 leading-relaxed">
              Sankey diagrams excel at showing how quantities flow through systems - from energy consumption 
              and budget allocation to user journeys and supply chain optimization.
            </p>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}