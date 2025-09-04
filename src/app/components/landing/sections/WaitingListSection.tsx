'use client';

import { useEffect, useRef, useState } from 'react';
import { useIntersectionObserver } from '../hooks';

// Animated section wrapper
function AnimatedSection({ 
  children, 
  className = "", 
  id 
}: { 
  children: React.ReactNode; 
  className?: string; 
  id?: string; 
}) {
  const { elementRef, hasIntersected } = useIntersectionObserver();
  
  return (
    <section
      ref={elementRef}
      id={id}
      className={`transition-all duration-1000 ${
        hasIntersected 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-8'
      } ${className}`}
    >
      {children}
    </section>
  );
}

export default function WaitingListSection() {
  const [isHovered, setIsHovered] = useState(false);

  const handleJoinWaitlist = () => {
    window.open('https://docs.google.com/forms/d/e/1FAIpQLSeEwhkaizkqAtdbbyV39yke7BV0kFOT1uaqpCodb61oDt-hpA/viewform?usp=dialog', '_blank');
  };

  return (
    <AnimatedSection className="py-16 lg:py-24 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 rounded-full px-6 py-3 text-sm font-medium mb-8">
            <span className="mr-2">🎯</span>
            Early Access
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Join Our 
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {' '}Exclusive Waitlist
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Be among the first to experience the future of data visualization. 
            Get priority access, exclusive updates, and special launch pricing.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12 max-w-2xl mx-auto">
          <div className="flex flex-col items-center p-6">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Early Access</h3>
            <p className="text-gray-600 text-center">Be the first to try our revolutionary AI-powered charting platform</p>
          </div>

          <div className="flex flex-col items-center p-6">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">VIP Updates</h3>
            <p className="text-gray-600 text-center">Get exclusive behind-the-scenes updates and feature previews</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100 max-w-2xl mx-auto">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Ready to Transform Your Data?
            </h3>
            <p className="text-gray-600">
              Join <span className="font-semibold text-indigo-600">2,847+</span> professionals already on the waitlist
            </p>
          </div>

          <button
            onClick={handleJoinWaitlist}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:shadow-2xl hover:scale-105 ${
              isHovered ? 'shadow-lg' : 'shadow-md'
            }`}
          >
            <span className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Join the Waitlist - It's Free
            </span>
          </button>

          <p className="text-sm text-gray-500 mt-4">
            No spam, ever. Unsubscribe with one click anytime.
          </p>
        </div>

        {/* Social proof */}
        <div className="mt-12 flex flex-wrap justify-center items-center gap-8 opacity-60">
          <div className="flex items-center space-x-2">
            <div className="flex -space-x-2">
              {['M', 'R', 'K', 'S'].map((letter, i) => (
                <div key={i} className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                  {letter}
                </div>
              ))}
              <div className="w-8 h-8 bg-gray-300 rounded-full border-2 border-white flex items-center justify-center text-gray-600 text-xs font-bold">
                +K
              </div>
            </div>
            <span className="text-sm text-gray-600 font-medium">Trusted by data professionals</span>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}