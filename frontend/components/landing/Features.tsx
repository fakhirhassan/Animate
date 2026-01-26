'use client';

import { motion } from 'framer-motion';
import {
  Wand2,
  Layers,
  Zap,
  Palette,
  Code,
  Globe,
  Sparkles,
  Video
} from 'lucide-react';

export default function Features() {
  const features = [
    {
      icon: Wand2,
      title: 'AI-Powered Generation',
      description: 'Transform text scripts into animated scenes using advanced AI models.',
    },
    {
      icon: Layers,
      title: '2D to 3D Conversion',
      description: 'Convert your 2D animations into stunning 3D models automatically.',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Generate professional animations in minutes, not hours or days.',
    },
    {
      icon: Palette,
      title: 'Style Customization',
      description: 'Choose from multiple animation styles or create your own unique look.',
    },
    {
      icon: Code,
      title: 'Script to Animation',
      description: 'Write natural language scripts and watch them come alive instantly.',
    },
    {
      icon: Globe,
      title: 'Export Anywhere',
      description: 'Export in multiple formats for web, mobile, or professional use.',
    },
    {
      icon: Sparkles,
      title: 'Smart Effects',
      description: 'AI-enhanced visual effects that adapt to your content automatically.',
    },
    {
      icon: Video,
      title: 'HD Quality Output',
      description: 'Professional-grade animations in full HD and 4K resolution.',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <section id="features" className="py-24 bg-[#0a0a1f] relative overflow-hidden">
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
            Powerful Features
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Everything you need to create stunning animations with AI
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                className="group"
              >
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-2xl hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-2 transition-all duration-300 h-full">
                  {/* Icon with pulse effect */}
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="h-7 w-7 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
