'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
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
  ChevronDown,
  Brain,
  Eye,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedBackground } from '@/components/ui/animated-background';

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

function TimelineStepComponent({ step, index }: { step: TimelineStep; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: '-200px' });
  const Icon = step.icon;

  return (
    <div ref={ref} className="relative">
      {/* Connecting Line */}
      {index < timelineSteps.length - 1 && (
        <motion.div
          className="absolute left-8 top-20 w-px h-full bg-border"
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
            className={`relative w-16 h-16 rounded-lg flex items-center justify-center ${
              isInView
                ? 'bg-primary neon-glow-primary'
                : 'bg-surface-high'
            } transition-all duration-500`}
          >
            <span className="text-2xl font-headline font-bold text-white">{step.number}</span>
            {isInView && (
              <motion.div
                className="absolute inset-0 rounded-lg bg-primary"
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
          <div className="bg-surface border border-border rounded-lg p-8 hover:border-accent transition-all duration-300">
            {/* Large watermark number */}
            <div className="absolute -top-4 right-4 font-headline text-[120px] font-black text-primary/[0.05] select-none leading-none hidden md:block">
              {step.number}
            </div>

            {/* Icon */}
            <motion.div
              animate={isInView ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              className="w-14 h-14 rounded-lg bg-primary flex items-center justify-center mb-6"
            >
              <Icon className="h-7 w-7 text-white" />
            </motion.div>

            <h3 className="font-headline text-xl font-bold text-foreground mb-4 uppercase tracking-tight">
              {step.title}
            </h3>

            <p className="text-muted leading-relaxed mb-4">
              {step.description}
            </p>

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
                      className="flex items-center gap-3 text-foreground"
                    >
                      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 border border-accent/20">
                        <SubIcon className="h-4 w-4 text-accent" />
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
      className="relative bg-surface border-2 border-accent/30 rounded-xl p-8 md:p-12"
    >
      <h3 className="font-headline text-3xl font-black text-foreground mb-4 uppercase tracking-tight">
        2D to 3D <span className="text-accent">Conversion</span>
      </h3>
      <p className="text-muted mb-8 max-w-2xl">
        Transform your 2D sketches and images into fully-textured 3D models using
        cutting-edge AI depth estimation technology.
      </p>

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
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                  <ArrowRight className="h-6 w-6 text-accent" />
                </div>
              )}

              <div className="bg-background border border-border rounded-lg p-6 text-center hover:border-accent transition-all duration-300">
                <div className="w-14 h-14 rounded-lg bg-primary flex items-center justify-center mx-auto mb-4">
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <h4 className="font-headline text-sm font-bold text-foreground mb-2 uppercase tracking-tight">{step.title}</h4>
                <p className="text-sm text-muted">{step.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="text-center">
        <Link href="/creator/2d-to-3d">
          <Button className="font-headline text-xs tracking-widest">
            TRY NOW
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
            whileHover={{ scale: 1.05 }}
            className="text-center"
          >
            <div className="w-16 h-16 rounded-lg bg-primary flex items-center justify-center mx-auto mb-4">
              <Icon className="h-8 w-8 text-white" />
            </div>
            <h4 className="font-headline text-lg font-bold text-foreground mb-2 uppercase tracking-tight">
              {spec.title}
            </h4>
            <p className="text-muted text-sm">{spec.description}</p>
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
      className={`border rounded-lg overflow-hidden transition-all duration-300 ${
        isOpen ? 'border-accent' : 'border-border'
      }`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 flex items-center justify-between bg-surface hover:bg-surface-high transition-colors duration-200"
      >
        <span className="font-semibold text-foreground text-left">
          {faq.question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="h-5 w-5 text-muted" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 py-4 bg-surface-high border-t border-border">
              <p className="text-muted leading-relaxed">{faq.answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
    <div className="min-h-screen bg-background">
      <AnimatedBackground variant="subtle" />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block px-4 py-1.5 mb-8 rounded-full bg-surface border border-border">
              <span className="font-label text-xs tracking-widest text-accent uppercase">
                Simple & Powerful
              </span>
            </div>

            <h1 className="font-headline text-5xl md:text-6xl lg:text-7xl font-black text-foreground mb-6 tracking-tighter uppercase">
              How ANIAD <span className="text-accent">Works</span>
            </h1>

            <p className="text-xl text-muted max-w-2xl mx-auto leading-relaxed">
              From script to stunning animation in{' '}
              <span className="font-semibold text-accent">
                4 simple steps
              </span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="relative py-20 px-6">
        <div className="max-w-4xl mx-auto">
          {timelineSteps.map((step, index) => (
            <TimelineStepComponent key={index} step={step} index={index} />
          ))}
        </div>
      </section>

      {/* 2D to 3D Section */}
      <section className="relative py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <TwoDToThreeDSection />
        </div>
      </section>

      {/* Technical Specs Section */}
      <section className="relative py-20 px-6">
        <div className="w-full h-px bg-border mb-20" />
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="font-headline text-3xl md:text-4xl font-black text-foreground mb-4 uppercase tracking-tight">
              Powered by <span className="text-highlight">Advanced AI</span>
            </h2>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              Cutting-edge technology that brings your animations to life
            </p>
          </motion.div>

          <TechnicalSpecs />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="font-headline text-3xl md:text-4xl font-black text-foreground mb-4 uppercase tracking-tight">
              Frequently Asked <span className="text-accent">Questions</span>
            </h2>
            <p className="text-lg text-muted">
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
      <section className="relative py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="bg-surface border border-border rounded-xl p-12 md:p-16 text-center"
          >
            <h2 className="font-headline text-4xl md:text-5xl font-black text-foreground mb-6 uppercase tracking-tight">
              Ready to Try <span className="text-accent">ANIAD?</span>
            </h2>
            <p className="text-lg text-muted mb-10 max-w-2xl mx-auto">
              Create your first animation in minutes. No credit card required.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/signup">
                <Button size="xl" className="font-headline text-xs tracking-widest">
                  GET STARTED
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>

              <Link href="/features">
                <Button size="xl" variant="outline" className="font-headline text-xs tracking-widest">
                  VIEW FEATURES
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
