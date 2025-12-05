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
    <section id="how-it-works" className="py-24 bg-[#0a0a1f] relative overflow-hidden">
      {/* Animated Grid Background - Same as Features page */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a3e_1px,transparent_1px),linear-gradient(to_bottom,#1a1a3e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 right-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Create professional animations in three simple steps
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          {/* Connection line - hidden on mobile */}
          <div className="hidden md:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500/30 via-emerald-500/30 to-blue-500/30"></div>

          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="relative"
              >
                <div className="flex flex-col items-center text-center">
                  {/* Number Badge */}
                  <div className="relative mb-6">
                    {/* Large number background */}
                    <div className="absolute -top-4 -left-4 text-8xl font-bold text-blue-500/10 select-none">
                      {step.number}
                    </div>

                    {/* Icon Container */}
                    <div className="relative w-20 h-20 rounded-2xl bg-white/5 backdrop-blur-sm shadow-lg flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-300 z-10">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-semibold text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed max-w-sm">
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
