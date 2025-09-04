'use client';

import { useEffect, useRef, useState } from 'react';
import { useIntersectionObserver } from './hooks';
import ChartComponent from '../shared/ChartComponent';
import { demoChartSpec } from './chartSpecs';

// Animated section wrapper
function AnimatedSection({ 
  children, 
  className = "", 
  id,
  ...props
}: { 
  children: React.ReactNode; 
  className?: string; 
  id?: string; 
  [key: string]: any;
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
      {...props}
    >
      {children}
    </section>
  );
}

// Animated Demo Component  
export default function AnimatedDemo() {
  const [step, setStep] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [showSpinner, setShowSpinner] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const demoRef = useRef<HTMLDivElement>(null);
  const { elementRef: observerRef, hasIntersected } = useIntersectionObserver();
  
  const fullText = "Build a timeline of this dataset.";

  // Start animation when section comes into view (with slight delay for fade-in)
  useEffect(() => {
    if (!hasIntersected || hasStarted) return;
    
    setHasStarted(true);
    
    // Run animation once only
    // Reset animation
    setStep(0);
    setTypedText('');
    setShowSpinner(false);
    
    // Step 1: Typing animation (delayed for fade-in)
    setTimeout(() => {
      setStep(1);
      let i = 0;
      const typingInterval = setInterval(() => {
        if (i <= fullText.length) {
          setTypedText(fullText.slice(0, i));
          i++;
        } else {
          clearInterval(typingInterval);
          // Step 2: Send button click
          setTimeout(() => {
            setStep(2);
            setShowSpinner(true);
            // Step 3: Show response and chart
            setTimeout(() => {
              setShowSpinner(false);
              setStep(3);
            }, 1000);
          }, 250);
        }
      }, 40);
    }, 750); // Reduced delay to allow fade-in to complete
  }, [hasIntersected, fullText]);

  return (
    <AnimatedSection className="py-12 sm:py-16 lg:py-20 bg-white" data-section="demo">
      <div ref={observerRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">See It In Action</h2>
          <p className="text-lg sm:text-xl text-gray-600">Watch how easy it is to create stunning visualizations</p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-stretch max-h-[600px] lg:max-h-[500px]">
          {/* Left Side - Chat Interface */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-lg flex flex-col h-full">
            <div className="mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Chat with your data</h3>
              
              {/* Dataset Bubble */}
              <div className="inline-flex items-center bg-blue-50 border border-blue-200 rounded-full px-3 py-1.5 mb-4">
                <svg className="w-3.5 h-3.5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-xs sm:text-sm font-medium text-blue-800">cigarette_sales_data.csv</span>
              </div>
            </div>
            
            {/* Chat Messages */}
            <div className="space-y-3 mb-4 flex-1 flex flex-col justify-end min-h-[140px] sm:min-h-[180px]">
              {/* User Input */}
              <div className="bg-white rounded-xl rounded-br-sm p-3 ml-4 sm:ml-8 shadow-sm border border-gray-100">
                <div className="text-gray-900 text-xs font-medium mb-1">You</div>
                <div className="text-gray-800 text-sm">
                  {typedText}
                  {step === 1 && <span className="animate-pulse">|</span>}
                </div>
              </div>
              
              {/* Loading Spinner */}
              {showSpinner && (
                <div className="bg-gray-100 rounded-xl rounded-bl-sm p-3 mr-4 sm:mr-8">
                  <div className="text-gray-600 text-xs font-medium mb-1">AI Assistant</div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-600 text-sm">Analyzing your data...</span>
                  </div>
                </div>
              )}
              
              {/* AI Response */}
              {step === 3 && (
                <div className="bg-gray-100 rounded-xl rounded-bl-sm p-3 mr-4 sm:mr-8 animate-fade-in">
                  <div className="text-gray-600 text-xs font-medium mb-1">AI Assistant</div>
                  <div className="text-gray-800 text-sm">I have successfully created the chart! 📈</div>
                </div>
              )}
            </div>
            
            {/* Input Field */}
            <div className="relative">
              <input
                type="text"
                value={step >= 2 ? fullText : typedText}
                readOnly
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 pr-10 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ask me anything about your data..."
              />
              <button
                className={`absolute right-2 top-2 p-1.5 rounded-md transition-colors ${
                  step >= 1 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300'
                }`}
                disabled={step < 1}
              >
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Right Side - Chart Result */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-lg flex flex-col h-full">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Your generated chart</h3>
            <div className="bg-white rounded-xl p-3 sm:p-4 flex-1 flex items-center justify-center min-h-[200px] sm:min-h-[250px]">
              {step === 3 ? (
                <div className="w-full h-full animate-fade-in">
                  <ChartComponent spec={demoChartSpec} className="w-full h-full" shouldAnimate={false} />
                </div>
              ) : (
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">AI-Powered Charts</h3>
                    <p className="text-sm text-gray-600 mt-2">AI is analyzing your data and creating the perfect visualization</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}