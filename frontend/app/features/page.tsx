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
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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

function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 right-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-500" />
    </div>
  );
}

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const Icon = feature.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative"
    >
      <div className="h-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-2 transition-all duration-300">
        {/* Badge */}
        {feature.badge && (
          <div className="absolute top-4 right-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-500 to-emerald-500 text-white">
              {feature.badge}
            </span>
          </div>
        )}

        {/* Icon */}
        <div className="mb-6">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Icon className="h-7 w-7 text-white" />
          </div>
        </div>

        {/* Content */}
        <h3 className="text-xl font-semibold text-white mb-3">
          {feature.title}
        </h3>
        <p className="text-gray-400 leading-relaxed mb-4">
          {feature.description}
        </p>

        {/* Hover effect gradient border */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 to-emerald-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none" />
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
      className="flex-1 min-w-[250px]"
    >
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 h-full hover:shadow-lg hover:shadow-blue-500/20 transition-shadow duration-300">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center mb-4">
          <Icon className="h-6 w-6 text-white" />
        </div>
        <h4 className="text-lg font-semibold text-white mb-2">
          {benefit.title}
        </h4>
        <p className="text-gray-400 text-sm">{benefit.description}</p>
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
    <div className="min-h-screen bg-[#0a0a1f]">
      {/* Animated Grid Background */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1a1a3e_1px,transparent_1px),linear-gradient(to_bottom,#1a1a3e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <AnimatedBackground />

        <div className="relative max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-emerald-500/20 border border-blue-500/30 mb-6">
              <span className="text-sm font-medium text-gray-300">
                AI-Powered Animation Platform
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
              Powerful Features for
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                Effortless Animation
              </span>
            </h1>

            <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8 leading-relaxed">
              Everything you need to create professional animations with AI.
              From script to screen, ANIAD handles it all.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Complete Animation Pipeline
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
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
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Why Choose ANIAD?
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
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
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-500 to-emerald-500 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Create Amazing Animations?
            </h2>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              Join thousands of creators who are already using ANIAD to bring
              their stories to life.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-6 text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>

              <Link href="/creator/2d-to-3d">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-lg font-semibold rounded-xl backdrop-blur-sm"
                >
                  View Demo
                </Button>
              </Link>
            </div>

            <p className="text-blue-100 text-sm mt-6">
              No credit card required • Free forever plan available
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
