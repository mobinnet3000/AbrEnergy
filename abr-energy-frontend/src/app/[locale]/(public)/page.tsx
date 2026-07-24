'use client';
import { useRef } from 'react';
import { ArrowRight, Calculator, Phone, Building2, Sparkles, Sun } from 'lucide-react';
import {
  CursorGlow, Hero3D, HeroSection, StatsSection, AboutSection,
  FloatingParticles, MouseRipple, GradientMesh,
  ServicesSection, ProjectsSection, ArticlesSection,
  CalculatorSection, ContactSection,
} from '@/components/home';

export default function HomePage() {
  return (
    <div className="flex flex-col noise-overlay">
      <GradientMesh />
      <FloatingParticles />
      <MouseRipple />
      <CursorGlow />

      {/* 1. HERO */}
      <HeroSection />

      {/* 2. STATISTICS */}
      <StatsSection />

      {/* 3. ABOUT */}
      <AboutSection />

      {/* 4. SERVICES */}
      <ServicesSection />

      {/* 5. PROJECTS */}
      <ProjectsSection />

      {/* 6. CALCULATOR */}
      <CalculatorSection />

      {/* 7. ARTICLES */}
      <ArticlesSection />

      {/* 8. CONTACT */}
      <ContactSection />
    </div>
  );
}
