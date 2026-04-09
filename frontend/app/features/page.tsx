'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import {
  FileText,
  Mic,
  Music,
  Smile,
  Users,
  Box,
  Film,
  Monitor,
  Clock,
  Zap,
  Award,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedBackground } from '@/components/ui/animated-background';

interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
  badge?: string;
}

const features: Feature[] = [
  {
    icon: FileText,
    title: 'Intelligent Script Analysis',
    description:
      'Upload your script and let AI automatically identify scenes, dialogues, and emotions using advanced NLP technology.',
  },
  {
    icon: Mic,
    title: 'Natural Voice Generation',
    description:
      'Generate realistic voice-overs with perfect lip-sync for all your characters automatically.',
  },
  {
    icon: Music,
    title: 'AI-Powered Soundtracks',
    description:
      'Create matching background music and sound effects that perfectly capture the mood of each scene.',
  },
  {
    icon: Smile,
    title: 'Emotion-Driven Animation',
    description:
      'Characters automatically express emotions through realistic facial expressions and body language.',
  },
  {
    icon: Users,
    title: 'Asset Generation',
    description:
      'Generate 2D/3D characters and environments from descriptions or templates in seconds.',
  },
  {
    icon: Box,
    title: '2D to 3D Converter',
    description:
      'Transform your 2D sketches into fully textured 3D models using AI-powered depth estimation.',
  },
  {
    icon: Film,
    title: 'Professional Rendering',
    description:
      'Seamlessly combine all assets into a polished, production-ready animated video.',
  },
  {
    icon: Monitor,
    title: 'Intuitive Platform',
    description:
      'User-friendly interface for creators and powerful dashboard for administrators.',
  },
];

interface Benefit {
  icon: React.ElementType;
  title: string;
  description: string;
}

const benefits: Benefit[] = [
  {
    icon: Clock,
    title: 'Save Time & Money',
    description: 'Reduce production time by 90% and cut costs significantly',
  },
  {
    icon: Zap,
    title: 'No Technical Skills Required',
    description: 'Easy-to-use interface designed for everyone',
  },
  {
    icon: Award,
    title: 'Professional Quality',
    description: 'Studio-grade output that rivals traditional animation',
  },
  {
    icon: Layers,
    title: 'All-in-One Solution',
    description: 'Complete animation pipeline in a single platform',
  },
];

const neonColors = [
  { border: 'hover:border-primary', icon: 'group-hover:bg-primary', label: 'text-primary' },
  { border: 'hover:border-accent', icon: 'group-hover:bg-accent', label: 'text-accent' },
  { border: 'hover:border-highlight', icon: 'group-hover:bg-highlight', label: 'text-highlight' },
  { border: 'hover:border-warning', icon: 'group-hover:bg-warning', label: 'text-warning' },
];

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const Icon = feature.icon;
  const color = neonColors[index % neonColors.length];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      whileHover={{ scale: 1.03 }}
      className="group relative"
    >
      <div className={`h-full bg-surface border border-border rounded-lg p-8 ${color.border} transition-all duration-300`}>
        {feature.badge && (
          <div className="absolute top-4 right-4">
            <span className="font-label text-[9px] uppercase tracking-widest bg-primary/10 text-primary px-2 py-1 rounded border border-primary/20">
              {feature.badge}
            </span>
          </div>
        )}

        <div className="mb-6">
          <div className={`w-12 h-12 rounded-lg bg-background border border-border flex items-center justify-center ${color.icon} group-hover:text-white transition-colors duration-300`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>

        <h3 className="font-headline text-lg font-bold text-foreground mb-3 uppercase tracking-tight">
          {feature.title}
        </h3>
        <p className="text-muted text-sm leading-relaxed">
          {feature.description}
        </p>
      </div>
    </motion.div>
  );
}

function BenefitCard({ benefit, index }: { benefit: Benefit; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const Icon = benefit.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ scale: 1.03 }}
      className="flex-1 min-w-[250px]"
    >
      <div className="bg-surface border border-border rounded-lg p-6 h-full border-t-2 border-t-accent hover:border-primary transition-all duration-300">
        <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mb-4">
          <Icon className="h-6 w-6 text-white" />
        </div>
        <h4 className="font-headline text-base font-bold text-foreground mb-2 uppercase tracking-tight">
          {benefit.title}
        </h4>
        <p className="text-muted text-sm">{benefit.description}</p>
      </div>
    </motion.div>
  );
}

export default function FeaturesPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background">
      <AnimatedBackground variant="subtle" />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="relative max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block px-4 py-1.5 mb-8 rounded-full bg-surface border border-border">
              <span className="font-label text-xs tracking-widest text-accent uppercase">
                AI-Powered Animation Platform
              </span>
            </div>

            <h1 className="font-headline text-5xl md:text-6xl lg:text-7xl font-black text-foreground mb-6 tracking-tighter uppercase">
              Powerful Features for
              <br />
              <span className="text-accent">Effortless Animation</span>
            </h1>

            <p className="text-xl text-muted max-w-3xl mx-auto mb-8 leading-relaxed">
              Everything you need to create professional animations with AI.
              From script to screen, ANIAD handles it all.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="font-headline text-3xl md:text-4xl font-black text-foreground mb-4 uppercase tracking-tight">
              Complete Animation <span className="text-accent">Pipeline</span>
            </h2>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              Eight powerful modules working together to bring your stories to life
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <FeatureCard key={index} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Key Benefits Section */}
      <section className="relative py-20 px-6">
        <div className="w-full h-px bg-border mb-20" />
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="font-headline text-3xl md:text-4xl font-black text-foreground mb-4 uppercase tracking-tight">
              Why Choose <span className="text-highlight">ANIAD?</span>
            </h2>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              The smartest way to create professional animations
            </p>
          </motion.div>

          <div className="flex flex-wrap gap-6 justify-center">
            {benefits.map((benefit, index) => (
              <BenefitCard key={index} benefit={benefit} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="bg-surface border border-border rounded-xl p-12 md:p-16 text-center relative overflow-hidden"
          >
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-neon-violet/[0.06] rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <h2 className="font-headline text-4xl md:text-5xl font-black text-foreground mb-6 uppercase tracking-tight">
                Ready to Create <span className="text-accent">Amazing Animations?</span>
              </h2>

              <p className="text-lg text-muted mb-10 max-w-2xl mx-auto">
                Join thousands of creators who are already using ANIAD to bring
                their stories to life.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/signup">
                  <Button size="xl" className="font-headline text-xs tracking-widest">
                    GET STARTED FREE
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>

                <Link href="/creator/2d-to-3d">
                  <Button size="xl" variant="outline" className="font-headline text-xs tracking-widest">
                    VIEW DEMO
                  </Button>
                </Link>
              </div>

              <p className="text-muted text-sm mt-6 font-label tracking-wider">
                No credit card required
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
