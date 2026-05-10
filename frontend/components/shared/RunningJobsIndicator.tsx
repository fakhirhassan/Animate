'use client';

/**
 * Floating indicator that shows any currently-running generation jobs
 * (Animate / Image / 3D). Lets the user navigate freely and still see
 * progress, plus jump back to the originating page in one click.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Film, Image as ImageIcon, Box } from 'lucide-react';
import { useGenerationStore, JobKind } from '@/store/generationStore';

const META: Record<JobKind, { Icon: any; label: string; href: string; accent: string }> = {
  animate: { Icon: Film, label: 'Animation', href: '/creator/animate', accent: 'text-neon-pink' },
  image: { Icon: ImageIcon, label: 'Image', href: '/creator/text-to-image', accent: 'text-neon-violet' },
  '3d': { Icon: Box, label: '3D Model', href: '/creator/2d-to-3d', accent: 'text-neon-cyan' },
};

function formatElapsed(startedAt: number | null): string {
  if (!startedAt) return '';
  const sec = Math.floor((Date.now() - startedAt) / 1000);
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

export default function RunningJobsIndicator() {
  const router = useRouter();
  const jobs = useGenerationStore((s) => s.jobs);
  // Tick every second so the elapsed counter ticks up live.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const running = (Object.keys(jobs) as JobKind[]).filter(
    (k) => jobs[k].status === 'running',
  );

  return (
    <AnimatePresence>
      {running.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-6 right-6 z-40 flex flex-col gap-2 max-w-xs"
        >
          {running.map((kind) => {
            const job = jobs[kind];
            const m = META[kind];
            return (
              <button
                key={kind}
                onClick={() => router.push(m.href)}
                className="group flex items-center gap-3 bg-surface border border-border rounded-lg px-3 py-2.5 shadow-2xl hover:border-primary transition-all bloom-shadow"
                title={`Click to view ${m.label} progress`}
              >
                <div className="relative shrink-0">
                  <m.Icon className={`h-4 w-4 ${m.accent}`} />
                  <Loader2 className="absolute -top-1 -right-1 h-3 w-3 animate-spin text-primary" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-label text-[10px] uppercase tracking-widest text-muted">
                    Generating {m.label}
                  </p>
                  <p className="text-xs text-foreground truncate">
                    {job.prompt || '…'}
                  </p>
                </div>
                <span className="font-label text-[10px] text-muted/60 shrink-0">
                  {formatElapsed(job.startedAt)}
                </span>
              </button>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
