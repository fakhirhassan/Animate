'use client';

import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Play, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Example {
  id: string;
  title: string;
  category: string;
  description: string;
  thumbnail: string;
  videoUrl?: string;
}

const examples: Example[] = [
  {
    id: '1',
    title: 'Product Advertisement',
    category: 'Marketing Video',
    description: 'Created in 10 minutes',
    thumbnail: '/api/placeholder/600/400',
  },
  {
    id: '2',
    title: 'Science Explainer',
    category: 'Educational Content',
    description: 'From script to animation',
    thumbnail: '/api/placeholder/600/400',
  },
  {
    id: '3',
    title: 'Animated Story',
    category: 'Short Film',
    description: 'Professional quality',
    thumbnail: '/api/placeholder/600/400',
  },
];

function ExampleCard({ example, index }: { example: Example; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.5, delay: index * 0.2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative"
    >
      <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
          {/* Placeholder gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 opacity-50" />

          {/* Animated pattern overlay */}
          <motion.div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`,
              backgroundSize: '20px 20px',
            }}
            animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
            transition={{ duration: 0.3 }}
          />

          {/* Play button */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative">
              {/* Pulsing ring */}
              <motion.div
                className="absolute inset-0 rounded-full bg-white/30"
                animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />

              {/* Play button */}
              <div className="relative w-16 h-16 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:bg-white transition-colors duration-300">
                <Play className="h-7 w-7 text-blue-600 ml-1" fill="currentColor" />
              </div>
            </div>
          </motion.div>

          {/* Category badge */}
          <div className="absolute top-4 left-4">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700 shadow-sm">
              <Sparkles className="h-3 w-3 text-blue-500" />
              {example.category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {example.title}
          </h3>
          <p className="text-gray-600 text-sm mb-4">{example.description}</p>

          <Button
            variant="outline"
            className="w-full border-gray-200 hover:border-blue-500 hover:text-blue-600 transition-colors"
          >
            <Play className="h-4 w-4 mr-2" />
            Watch Demo
          </Button>
        </div>

        {/* Hover gradient overlay */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>
    </motion.div>
  );
}

export default function Examples() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <section
      ref={ref}
      className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 mb-6">
            <Play className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">
              Demo Gallery
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            See ANIAD in Action
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Watch how creators are using ANIAD to bring their ideas to life
          </p>
        </motion.div>

        {/* Examples Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {examples.map((example, index) => (
            <ExampleCard key={example.id} example={example} index={index} />
          ))}
        </div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center mt-12"
        >
          <Button
            variant="outline"
            size="lg"
            className="border-gray-300 hover:border-blue-500 hover:text-blue-600 transition-colors"
          >
            View All Examples
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
