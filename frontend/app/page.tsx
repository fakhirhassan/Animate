import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import HowItWorks from '@/components/landing/HowItWorks';
import Examples from '@/components/landing/Examples';
import CTA from '@/components/landing/CTA';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <HowItWorks />
      <Examples />
      <CTA />
    </main>
  );
}
