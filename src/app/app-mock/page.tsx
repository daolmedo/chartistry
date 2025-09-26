'use client';

import { useState } from 'react';
import Link from 'next/link';
import ChartsSection from '../components/app-mock/ChartsSection';
import DashboardsSection from '../components/app-mock/DashboardsSection';

type Section = 'charts' | 'dashboards';

export default function ChartAppMock() {
  const [activeSection, setActiveSection] = useState<Section>('dashboards'); // Start with dashboards to show the new feature

  // Mock user data
  const mockUser = {
    displayName: 'Demo User',
    email: 'demo@chartz.ai'
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-2">
              <img src="/logo.png" alt="chartz.ai logo" className="w-8 h-8 rounded-lg" />
              <span className="text-2xl font-bold text-gray-900">chartz.ai</span>
            </Link>

            {/* Section Navigation */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveSection('charts')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  activeSection === 'charts'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📈 Charts
              </button>
              <button
                onClick={() => setActiveSection('dashboards')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  activeSection === 'dashboards'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📊 Dashboards
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {mockUser.displayName}
              </span>
              <button className="text-gray-600 hover:text-gray-900 transition-colors">
                Sign Out
              </button>
              <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main App Content */}
      <div className="h-[calc(100vh-80px)]">
        {activeSection === 'charts' && <ChartsSection />}
        {activeSection === 'dashboards' && <DashboardsSection />}
      </div>
    </div>
  );
}