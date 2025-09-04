'use client';

import Link from 'next/link';
import AnimatedSection from '../../shared/AnimatedSection';

export default function PricingSection() {
  return (
    <AnimatedSection id="pricing" className="py-20 bg-gray-50">
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
            <Link href="/login" className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 py-3 px-6 rounded-lg font-semibold text-center block transition-colors">
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
            <Link href="/login" className="w-full bg-white text-blue-600 py-3 px-6 rounded-lg font-semibold text-center block hover:bg-gray-50 transition-colors">
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
    </AnimatedSection>
  );
}