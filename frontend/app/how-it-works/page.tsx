'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import {
  Upload,
  Cpu,
  Film,
  Download,
  Image as ImageIcon,
  Wand2,
  Box,
  Mic,
  Music,
  Smile,
  Mountain,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  Brain,
  Eye,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TimelineStep {
  number: number;
  icon: React.ElementType;
  title: string;
  description: string;
  subItems?: { icon: React.ElementType; text: string }[];
}

const timelineSteps: TimelineStep[] = [
  {
    number: 1,
    icon: Upload,
    title: 'Upload Your Script',
    description:
      'Simply upload your script in any format (.txt, .pdf, .docx). Our AI will automatically analyze the content, identify scenes, extract dialogues, and detect emotions.',
  },
  {
    number: 2,
    icon: Cpu,
    title: 'AI Does the Magic',
    description: 'Our advanced AI processes your script in parallel:',
    subItems: [
      { icon: Mic, text: 'Voice-over generation with lip-sync' },
      { icon: Music, text: 'Background music composition' },
      { icon: Smile, text: 'Character emotion mapping' },
      { icon: Mountain, text: 'Environment creation' },
    ],
  },
  {
    number: 3,
    icon: Film,
    title: 'Automatic Rendering',
    description:
      'All assets are seamlessly combined and synchronized. Characters are animated with emotions, voices are synced, music is balanced, and everything is rendered into a professional video.',
  },
  {
    number: 4,
    icon: Download,
    title: 'Download Your Animation',
    description:
      'Preview your completed animation, make any adjustments, and download in your preferred format (MP4, MOV, AVI). Share directly or export for further editing.',
  },
];

interface FAQ {
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    question: 'How long does the process take?',
    answer:
      'Processing time varies based on script length and complexity. Most animations are ready within 5-15 minutes. Longer scripts may take up to 30 minutes. You can track progress in real-time on your dashboard.',
  },
  {
    question: 'What script formats are supported?',
    answer:
      'We support .txt, .pdf, .docx, and .doc formats. The script can be in any standard screenplay or plain text format. Our AI is smart enough to understand various formatting styles.',
  },
  {
    question: 'Can I customize the output?',
    answer:
      'Yes! You can adjust voice styles, music genres, character designs, and animation settings before rendering. After rendering, you can also make edits and re-render specific scenes.',
  },
  {
    question: 'What video formats are available?',
    answer:
      'We support MP4 (recommended), MOV, AVI, and WebM formats. You can also choose resolution (720p, 1080p, 4K) and frame rate (24fps, 30fps, 60fps) based on your needs.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Absolutely. All uploads are encrypted, and your scripts are processed on secure servers. We never share your content with third parties. You can delete your data at any time from your dashboard.',
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

function TimelineStepComponent({ step, index }: { step: TimelineStep; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: '-200px' });
  const Icon = step.icon;

  return (
    <div ref={ref} className="relative">
      {/* Connecting Line */}
      {index < timelineSteps.length - 1 && (
        <motion.div
          className="absolute left-8 top-20 w-0.5 h-full bg-gradient-to-b from-blue-500 to-emerald-500"
          initial={{ scaleY: 0, opacity: 0 }}
          animate={isInView ? { scaleY: 1, opacity: 1 } : { scaleY: 0, opacity: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          style={{ transformOrigin: 'top' }}
        />
      )}

      <div className="flex gap-8 mb-16 md:mb-24">
        {/* Number Badge */}
        <div className="flex-shrink-0">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={isInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
            transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
            className={`relative w-16 h-16 rounded-full flex items-center justify-center ${
              isInView
                ? 'bg-gradient-to-br from-blue-500 to-emerald-500 shadow-lg shadow-blue-500/50'
                : 'bg-white/10'
            } transition-all duration-500`}
          >
            <span className="text-2xl font-bold text-white">{step.number}</span>
            {isInView && (
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </motion.div>
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex-1"
        >
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:shadow-xl hover:shadow-blue-500/20 transition-shadow duration-300">
            {/* Icon */}
            <motion.div
              animate={isInView ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center mb-6"
            >
              <Icon className="h-8 w-8 text-white" />
            </motion.div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-white mb-4">
              {step.title}
            </h3>

            {/* Description */}
            <p className="text-gray-400 leading-relaxed mb-4">
              {step.description}
            </p>

            {/* Sub-items */}
            {step.subItems && (
              <div className="space-y-3 mt-6">
                {step.subItems.map((item, idx) => {
                  const SubIcon = item.icon;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                      transition={{ duration: 0.4, delay: 0.4 + idx * 0.1 }}
                      className="flex items-center gap-3 text-gray-300"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <SubIcon className="h-4 w-4 text-blue-400" />
                      </div>
                      <span className="text-sm">{item.text}</span>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function TwoDToThreeDSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const steps = [
    {
      icon: ImageIcon,
      title: 'Upload 2D Image',
      description: 'Upload sketch or image',
    },
    {
      icon: Wand2,
      title: 'AI Conversion',
      description: 'Depth map → 3D mesh → Texture',
    },
    {
      icon: Box,
      title: 'Download 3D Model',
      description: 'Export as OBJ/FBX/GLB',
    },
  ];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6 }}
      className="relative bg-gradient-to-br from-blue-500/20 to-emerald-500/20 border-2 border-blue-500/30 rounded-3xl p-8 md:p-12"
    >
      <h3 className="text-3xl font-bold text-white mb-4">
        2D to 3D Conversion
      </h3>
      <p className="text-gray-400 mb-8 max-w-2xl">
        Transform your 2D sketches and images into fully-textured 3D models using
        cutting-edge AI depth estimation technology.
      </p>

      {/* Horizontal Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.4, delay: index * 0.2 }}
              className="relative"
            >
              {/* Arrow between steps */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                  <ArrowRight className="h-6 w-6 text-blue-400" />
                </div>
              )}

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center hover:shadow-lg hover:shadow-blue-500/20 transition-shadow duration-300">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center mx-auto mb-4">
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <h4 className="font-semibold text-white mb-2">{step.title}</h4>
                <p className="text-sm text-gray-400">{step.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="text-center">
        <Link href="/creator/2d-to-3d">
          <Button className="bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white px-8">
            Try Now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

function TechnicalSpecs() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const specs = [
    {
      icon: Brain,
      title: 'NLP Technology',
      description: 'Advanced natural language processing for script understanding and scene analysis',
    },
    {
      icon: Zap,
      title: 'Deep Learning',
      description: 'Neural networks for voice synthesis, music generation, and emotion detection',
    },
    {
      icon: Eye,
      title: 'Computer Vision',
      description: 'AI-powered depth estimation and 3D reconstruction from 2D images',
    },
  ];

  return (
    <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {specs.map((spec, index) => {
        const Icon = spec.icon;
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.5, delay: index * 0.15 }}
            className="text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center mx-auto mb-4">
              <Icon className="h-8 w-8 text-white" />
            </div>
            <h4 className="text-xl font-semibold text-white mb-2">
              {spec.title}
            </h4>
            <p className="text-gray-400 text-sm">{spec.description}</p>
          </motion.div>
        );
      })}
    </div>
  );
}

function FAQItem({ faq, index }: { faq: FAQ; index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="border border-white/10 rounded-xl overflow-hidden"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 flex items-center justify-between bg-white/5 hover:bg-white/10 transition-colors duration-200"
      >
        <span className="font-semibold text-white text-left">
          {faq.question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="h-5 w-5 text-gray-400" />
        </motion.div>
      </button>

      <motion.div
        initial={false}
        animate={{
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="px-6 py-4 bg-white/5 border-t border-white/10">
          <p className="text-gray-400 leading-relaxed">{faq.answer}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function HowItWorksPage() {
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

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-emerald-500/20 border border-blue-500/30 mb-6">
              <span className="text-sm font-medium text-gray-300">
                Simple & Powerful
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
              How ANIAD Works
            </h1>

            <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              From script to stunning animation in{' '}
              <span className="font-semibold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                4 simple steps
              </span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {timelineSteps.map((step, index) => (
            <TimelineStepComponent key={index} step={step} index={index} />
          ))}
        </div>
      </section>

      {/* 2D to 3D Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <TwoDToThreeDSection />
        </div>
      </section>

      {/* Technical Specs Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Powered by Advanced AI
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Cutting-edge technology that brings your animations to life
            </p>
          </motion.div>

          <TechnicalSpecs />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-400">
              Everything you need to know about ANIAD
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <FAQItem key={index} faq={faq} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 via-blue-700 to-emerald-600 overflow-hidden">
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
              Ready to Try ANIAD?
            </h2>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              Create your first animation in minutes. No credit card required.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-6 text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>

              <Link href="/features">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-lg font-semibold rounded-xl backdrop-blur-sm"
                >
                  View Examples
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
