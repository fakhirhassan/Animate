'use client';

import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Play, Sparkles } from 'lucide-react';
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
      <motion.div
        whileHover={{ scale: 1.03 }}
        transition={{ type: "spring", stiffness: 300 }}
        className="bg-surface border border-border rounded-lg overflow-hidden hover:border-primary transition-all duration-300"
      >
        {/* Thumbnail */}
        <div className="relative aspect-video bg-surface-high overflow-hidden">
          {/* Placeholder */}
          <div className="absolute inset-0 bg-primary/10" />

          {/* Pattern overlay */}
          <motion.div
            className="absolute inset-0 dot-grid opacity-30"
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
              <motion.div
                className="absolute inset-0 rounded-full bg-primary/30"
                animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <div className="relative w-16 h-16 rounded-full bg-surface/90 backdrop-blur-sm flex items-center justify-center border border-border group-hover:border-primary transition-colors duration-300">
                <Play className="h-7 w-7 text-primary ml-1" fill="currentColor" />
              </div>
            </div>
          </motion.div>

          {/* Category badge */}
          <div className="absolute top-4 left-4">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface/80 backdrop-blur-sm border border-border text-xs font-label tracking-wider text-accent uppercase">
              <Sparkles className="h-3 w-3" />
              {example.category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="font-headline text-lg font-bold text-foreground mb-2 uppercase tracking-tight">
            {example.title}
          </h3>
          <p className="text-muted text-sm mb-4 font-label tracking-wider uppercase">
            {example.description}
          </p>

          <Button className="w-full" variant="outline">
            <Play className="h-4 w-4 mr-2" />
            Watch Demo
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Examples() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <section
      ref={ref}
      className="py-24 px-6 bg-background relative overflow-hidden"
    >
      {/* Divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-border" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-surface border border-border">
            <span className="font-label text-xs tracking-widest text-accent uppercase">
              Demo Gallery
            </span>
          </div>

          <h2 className="font-headline text-4xl md:text-5xl font-black text-foreground mb-4 tracking-tight uppercase">
            See ANIAD in <span className="text-accent">Action</span>
          </h2>
          <p className="text-lg text-muted max-w-2xl mx-auto">
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
          <Button size="lg" variant="outline">
            View All Examples
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
