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
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Powerful Features
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
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
                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 h-full">
                  {/* Icon with pulse effect */}
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="h-7 w-7 text-blue-600" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
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
