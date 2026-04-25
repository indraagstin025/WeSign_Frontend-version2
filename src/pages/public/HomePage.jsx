import React from 'react';
import Navbar from '../../components/Layout/Navbar';
import HeroSection from '@/components/HomePage/HeroSection';
import DashboardPreview from '@/components/HomePage/DashboardPreview';
import FeatureBento from '@/components/HomePage/FeatureBento';
import DetailedFeatures from '@/components/HomePage/DetailedFeatures';
import WorkflowSection from '@/components/HomePage/WorkflowSection';
import PricingSection from '@/components/HomePage/PricingSection';
import FAQSection from '@/components/HomePage/FAQSection';
import CTASection from '@/components/HomePage/CTASection';
import Footer from '@/components/Layout/Footer';

const HomePage = () => {
  return (
    <div className="min-h-screen relative font-sans bg-surface-light dark:bg-surface-black text-zinc-900 dark:text-zinc-100 selection:bg-primary/20">
      <Navbar />
      
      <HeroSection />
      
      <DashboardPreview />
      
      <FeatureBento />
      
      <DetailedFeatures />
      
      <WorkflowSection />
      
      <PricingSection />
      
      <FAQSection />
      
      <CTASection />
      
      <Footer />
    </div>
  );
};

export default HomePage;
