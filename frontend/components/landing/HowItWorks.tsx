'use client';

import { motion } from 'framer-motion';
import { FileText, Wand2, Download } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      icon: FileText,
      title: 'Write Your Script',
      description: 'Describe your animation idea in plain text or upload your script file.',
      number: '01',
    },
    {
      icon: Wand2,
      title: 'AI Generates',
      description: 'Our AI analyzes and creates your animation with professional quality.',
      number: '02',
    },
    {
      icon: Download,
      title: 'Export & Share',
      description: 'Download in your preferred format and share with the world.',
      number: '03',
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-background relative overflow-hidden">
      {/* Divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-border" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="font-headline text-4xl md:text-5xl font-black text-foreground mb-4 tracking-tight uppercase">
            How It <span className="text-accent">Works</span>
          </h2>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Create professional animations in three simple steps
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          {/* Connection line */}
          <div className="hidden md:block absolute top-16 left-[16.6%] right-[16.6%] h-px bg-border" />

          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="relative"
              >
                <div className="flex flex-col items-center text-center">
                  {/* Number + Icon */}
                  <div className="relative mb-8">
                    {/* Large watermark number */}
                    <div className="absolute -top-6 -left-6 font-headline text-8xl font-black text-primary/[0.08] select-none">
                      {step.number}
                    </div>

                    {/* Icon Container */}
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="relative w-20 h-20 rounded-lg bg-surface border border-border flex items-center justify-center z-10"
                    >
                      <div className="w-16 h-16 rounded-lg bg-primary flex items-center justify-center">
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                    </motion.div>
                  </div>

                  {/* Content */}
                  <h3 className="font-headline text-xl font-bold text-foreground mb-3 uppercase tracking-tight">
                    {step.title}
                  </h3>
                  <p className="text-muted leading-relaxed max-w-sm">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
