'use client';

import Navigation from './landing/Navigation';
import HeroSection from './landing/sections/HeroSection';
import AnimatedDemo from './landing/AnimatedDemo';
import DashboardSection from './landing/sections/DashboardSection';
// import FeaturesSection from './landing/sections/FeaturesSection';
// import HowItWorksSection from './landing/sections/HowItWorksSection';
import ComplexChartsSection from './landing/sections/ComplexChartsSection';
// import UseCasesSection from './landing/sections/UseCasesSection';
// import TestimonialsSection from './landing/sections/TestimonialsSection';
// import PricingSection from './landing/sections/PricingSection';
import WaitingListSection from './landing/sections/WaitingListSection';
// import CTASection from './landing/sections/CTASection';
import MentionsSection from './landing/sections/MentionsSection';
import Footer from './landing/sections/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <HeroSection />
      <AnimatedDemo />
      <DashboardSection />
      {/* <FeaturesSection /> */}
      {/* <HowItWorksSection /> */}
      <ComplexChartsSection />
      {/* <UseCasesSection /> */}
      {/* <TestimonialsSection /> */}
      {/* <PricingSection /> */}
      <WaitingListSection />
      {/* <CTASection /> */}
      <MentionsSection />
      <Footer />
    </div>
  );
}