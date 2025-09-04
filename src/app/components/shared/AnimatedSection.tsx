'use client';

import { useIntersectionObserver } from '../landing/hooks';

// Animated section wrapper
export default function AnimatedSection({ 
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