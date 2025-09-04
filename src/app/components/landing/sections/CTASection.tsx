'use client';

import Link from 'next/link';
import AnimatedSection from '../../shared/AnimatedSection';

export default function CTASection() {
  return (
    <AnimatedSection className="py-20 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl font-bold mb-6">Start Creating Beautiful Charts with AI Today</h2>
        <p className="text-xl opacity-90 mb-8">Join thousands of professionals who trust chartz.ai for their data visualization needs</p>
        <Link
          href="/login"
          className="inline-flex items-center bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Try chartz.ai Free
          <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    </AnimatedSection>
  );
}