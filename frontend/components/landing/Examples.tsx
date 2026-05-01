'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const samples = [
  { kind: 'video' as const, src: '/showcase/videos/animation_3151f5b7.mp4', title: 'AI Animation', tag: 'Wan2.1' },
  { kind: 'image' as const, src: '/showcase/inputs/goku.jpg', title: '2D Input', tag: 'Source' },
  { kind: 'image' as const, src: '/showcase/images/ai-render-01.png', title: 'Text → Image', tag: 'SDXL' },
  { kind: 'video' as const, src: '/showcase/videos/animation_409d854c.mp4', title: 'Cinematic Clip', tag: 'Wan2.1' },
  { kind: 'image' as const, src: '/showcase/inputs/super.jpg', title: 'Hero Subject', tag: 'Source' },
  { kind: 'image' as const, src: '/showcase/images/ai-render-02.png', title: 'AI Render', tag: 'SDXL' },
];

export default function Examples() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <section ref={ref} className="py-24 px-6 bg-background relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-border" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-surface border border-border">
            <span className="font-label text-xs tracking-widest text-accent uppercase">
              Live Showcase
            </span>
          </div>
          <h2 className="font-headline text-4xl md:text-5xl font-black text-foreground mb-4 tracking-tight uppercase">
            Made With <span className="text-accent">MESH</span>
          </h2>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Real outputs from the platform — generated 3D, video, and imagery.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
          {samples.map((s, i) => (
            <motion.div
              key={s.src}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="group relative aspect-square bg-surface border border-border rounded-lg overflow-hidden hover:border-primary transition-colors duration-300"
            >
              {s.kind === 'video' ? (
                <video
                  src={s.src}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.src}
                  alt={s.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
              <div className="absolute top-3 left-3">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-surface/80 backdrop-blur-sm border border-border text-[10px] font-label tracking-widest text-accent uppercase">
                  <Sparkles className="h-3 w-3" />
                  {s.tag}
                </span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent p-4">
                <h3 className="font-headline text-sm font-bold uppercase tracking-tight text-foreground">
                  {s.title}
                </h3>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center"
        >
          <Link href="/showcase">
            <Button size="lg" variant="outline" className="font-headline text-sm tracking-widest gap-2">
              EXPLORE FULL SHOWCASE
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
