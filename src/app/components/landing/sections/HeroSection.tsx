'use client';

import Link from 'next/link';
import ChartComponent from '../../shared/ChartComponent';
import { heroChartSpec } from '../chartSpecs';

export default function HeroSection() {
  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Best{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Tableau
              </span>{' '}
              Alternative
            </h1>
            <p className="text-xl text-gray-600 mt-6 leading-relaxed">
              Turn Data into Stunning Dashboards and Charts in Seconds. chartz.ai lets you create dashboards and beautiful data visualizations effortlessly with AI, no learning curve.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <button
                disabled
                className="bg-gray-400 text-white px-8 py-4 rounded-xl font-semibold text-lg cursor-not-allowed opacity-60"
              >
                Get Started Free (Coming Soon)
              </button>
              <button className="border border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200">
                See How It Works
              </button>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 flex items-center justify-center h-[300px] lg:h-[400px]">
            <ChartComponent spec={heroChartSpec} className="w-full h-full" shouldAnimate={false} />
          </div>
        </div>
      </div>
    </section>
  );
}