'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Hero() {
  const [text, setText] = useState('');
  const fullText = 'Transform Ideas Into Stunning Animations';
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    let index = 0;
    const typingInterval = setInterval(() => {
      if (index <= fullText.length) {
        setText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(typingInterval);
        setShowCursor(false);
      }
    }, 50);

    return () => clearInterval(typingInterval);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Ambient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-20 left-1/4 w-[500px] h-[500px] bg-neon-violet/[0.06] rounded-full blur-3xl"
          animate={{ x: [0, 30, -20, 0], y: [0, -50, 20, 0], scale: [1, 1.1, 0.9, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-cyan/[0.06] rounded-full blur-3xl"
          animate={{ x: [0, -30, 20, 0], y: [0, 30, -40, 0], scale: [1, 0.9, 1.1, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 5 }}
        />
        <motion.div
          className="absolute top-1/3 right-1/3 w-80 h-80 bg-neon-pink/[0.04] rounded-full blur-3xl"
          animate={{ x: [0, 40, -10, 0], y: [0, -20, 30, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: 10 }}
        />
        {/* Dot grid */}
        <div className="absolute inset-0 dot-grid opacity-40" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center pt-24 pb-32">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-block px-4 py-1.5 mb-8 rounded-full bg-surface border border-border"
        >
          <span className="font-label text-xs tracking-widest text-accent uppercase">
            Now Live: v4.0 Particle Burst
          </span>
        </motion.div>

        {/* Main Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <h1 className="font-headline font-black text-6xl md:text-8xl lg:text-9xl tracking-tighter leading-none mb-8">
            <span className="block text-foreground">
              {text || '\u00A0'}
              {showCursor && (
                <span className="inline-block w-1 h-[0.8em] bg-primary ml-1 animate-pulse" />
              )}
            </span>
            <span className="block text-accent mt-2">THE VOID</span>
          </h1>

          <p className="max-w-2xl mx-auto text-muted text-lg md:text-xl leading-relaxed mb-12">
            The next generation of creative physics. Harness liquid light, neon particles,
            and electric motion in a high-performance dark space environment.
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col md:flex-row gap-6 justify-center"
        >
          <Link href="/signup">
            <Button size="xl" className="font-headline text-sm tracking-widest">
              START CREATING
            </Button>
          </Link>
          <Link href="/showcase">
            <Button size="xl" variant="outline" className="font-headline text-sm tracking-widest">
              VIEW SHOWCASE
            </Button>
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-muted text-sm mt-8 font-label tracking-wider"
        >
          No credit card required
        </motion.p>
      </div>
    </section>
  );
}
