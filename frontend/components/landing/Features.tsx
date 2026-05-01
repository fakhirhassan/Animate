'use client';

import { motion } from 'framer-motion';
import {
  Wand2,
  Layers,
  Zap,
  Users,
} from 'lucide-react';

export default function Features() {
  const features = [
    {
      icon: Wand2,
      title: 'Liquid Motion',
      description: 'Our proprietary engine treats every pixel as a fluid particle, reacting to your touch in real-time.',
      label: 'PHYSICS v2.0',
      hoverColor: 'hover:border-primary',
      iconHoverBg: 'group-hover:bg-primary',
      labelColor: 'text-primary',
    },
    {
      icon: Layers,
      title: 'Neural Nodes',
      description: 'Connect complex behaviors using our visual node-based editor designed for high-end cinematic workflows.',
      label: 'CONNECTIVE AI',
      hoverColor: 'hover:border-accent',
      iconHoverBg: 'group-hover:bg-accent',
      labelColor: 'text-accent',
    },
    {
      icon: Zap,
      title: 'Hyper Render',
      description: 'Export high-fidelity 8K motion graphics directly to the cloud in minutes, not hours.',
      label: 'CLOUD ENGINE',
      hoverColor: 'hover:border-highlight',
      iconHoverBg: 'group-hover:bg-highlight',
      labelColor: 'text-highlight',
    },
    {
      icon: Users,
      title: 'Void Sync',
      description: 'Collaborate with creators globally in a shared 3D canvas with zero latency and infinite undo.',
      label: 'MULTIVERSE',
      hoverColor: 'hover:border-foreground',
      iconHoverBg: 'group-hover:bg-foreground group-hover:text-background',
      labelColor: 'text-muted',
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
    <section id="features" className="py-24 bg-background relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Feature Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ scale: 1.03 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="group"
              >
                <div className={`bg-surface p-8 rounded-lg border border-border ${feature.hoverColor} transition-all duration-300 h-full`}>
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-lg bg-background flex items-center justify-center mb-6 border border-border ${feature.iconHoverBg} group-hover:text-white transition-colors duration-300`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Content */}
                  <h3 className="font-headline text-xl mb-4 text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted text-sm leading-relaxed mb-6">
                    {feature.description}
                  </p>

                  {/* Label */}
                  <div className={`font-label text-[10px] ${feature.labelColor} tracking-widest uppercase`}>
                    {feature.label}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
