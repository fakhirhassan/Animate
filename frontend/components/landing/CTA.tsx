'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function CTA() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="bg-surface border border-border p-16 rounded-xl text-center relative overflow-hidden"
        >
          {/* Ambient blob inside card */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-neon-violet/[0.06] rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-neon-cyan/[0.04] rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <h2 className="font-headline text-4xl md:text-5xl font-black mb-6 text-foreground tracking-tight uppercase">
              READY TO STEP INTO <br />
              <span className="text-accent">THE ELECTRIC VOID?</span>
            </h2>
            <p className="text-muted mb-10 max-w-xl mx-auto">
              Join over 50,000 creators defining the future of digital motion.
              No credit card required to start your first project.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <input
                className="px-6 py-4 rounded-lg bg-background border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none min-w-[300px] placeholder:text-muted/60"
                placeholder="Enter your email"
                type="email"
              />
              <Link href="/signup">
                <Button size="xl" className="font-headline text-xs tracking-widest w-full sm:w-auto">
                  SIGN UP FREE
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
