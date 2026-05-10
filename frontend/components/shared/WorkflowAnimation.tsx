'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Film, Box, Mic2, Play, Wand2 } from 'lucide-react';

const ShowcaseModel = dynamic(() => import('@/components/showcase/ShowcaseModel'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-void-black/40" />,
});

type Stage = 'typing' | 'magic' | 'output';

type Example = {
  prompt: string;
  feature: 'video' | '3d' | 'image';
  label: string;
  asset: string;
};

const EXAMPLES: Example[] = [
  {
    prompt: 'A hero walks through a magical forest',
    feature: 'video',
    label: 'Text → Video',
    asset: '/showcase/videos/animation_3151f5b7.mp4',
  },
  {
    prompt: 'Convert this sketch into a 3D model',
    feature: '3d',
    label: '2D → 3D',
    asset: '/showcase/3d/animate_model_61ab3ff0.glb',
  },
  {
    prompt: 'A cinematic neon city at dusk',
    feature: 'image',
    label: 'Text → Image',
    asset: '/showcase/images/ai-render-01.png',
  },
];

const FEATURE_META = {
  video: { Icon: Film, accent: 'text-neon-pink', ring: 'border-neon-pink/40', glow: 'rgba(255, 0, 128, 0.35)' },
  '3d': { Icon: Box, accent: 'text-neon-cyan', ring: 'border-neon-cyan/40', glow: 'rgba(0, 255, 255, 0.35)' },
  image: { Icon: Sparkles, accent: 'text-neon-violet', ring: 'border-neon-violet/40', glow: 'rgba(139, 92, 246, 0.35)' },
} as const;

export default function WorkflowAnimation() {
  const [exampleIdx, setExampleIdx] = useState(0);
  const [stage, setStage] = useState<Stage>('typing');
  const [typed, setTyped] = useState('');

  const example = EXAMPLES[exampleIdx];
  const meta = FEATURE_META[example.feature];

  useEffect(() => {
    setTyped('');
    setStage('typing');

    let cancelled = false;
    const text = example.prompt;
    let i = 0;

    const type = () => {
      if (cancelled) return;
      if (i <= text.length) {
        setTyped(text.slice(0, i));
        i++;
        setTimeout(type, 45);
      } else {
        setTimeout(() => !cancelled && setStage('magic'), 700);
        setTimeout(() => !cancelled && setStage('output'), 700 + 1800);
        setTimeout(() => {
          if (!cancelled) setExampleIdx((idx) => (idx + 1) % EXAMPLES.length);
        }, 700 + 1800 + 5000);
      }
    };

    const start = setTimeout(type, 350);
    return () => {
      cancelled = true;
      clearTimeout(start);
    };
  }, [exampleIdx]);

  return (
    <div className="w-full max-w-md flex flex-col items-center gap-8">
      <div className="relative w-full h-[280px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          {stage === 'typing' && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="absolute inset-0 flex items-center"
            >
              <div className="w-full bg-void-elevated/80 backdrop-blur border border-neon-violet/30 rounded-xl p-6 shadow-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <motion.span
                    className="w-2 h-2 rounded-full bg-neon-violet"
                    animate={{ opacity: [1, 0.3, 1], scale: [1, 1.4, 1] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                  />
                  <span className="font-label text-[10px] uppercase tracking-widest text-void-muted">
                    Input Prompt
                  </span>
                </div>
                <p className="font-headline text-lg text-foreground leading-relaxed min-h-[3.5rem]">
                  {typed}
                  <motion.span
                    className="inline-block w-[2px] h-5 bg-neon-cyan ml-0.5 align-middle"
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                </p>
              </div>
            </motion.div>
          )}

          {stage === 'magic' && (
            <motion.div
              key="magic"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
              className="absolute inset-0 flex flex-col items-center justify-center"
            >
              <motion.div
                className="relative w-36 h-36"
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                {/* Outer expanding ring */}
                <motion.div
                  className="absolute -inset-6 rounded-full"
                  style={{ background: `radial-gradient(circle, ${meta.glow} 0%, transparent 70%)` }}
                  animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
                {/* Rotating orb */}
                <motion.div
                  className="w-full h-full rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6, #00ffff, #ff0080)',
                    boxShadow: `0 0 60px ${meta.glow}, inset 0 0 30px rgba(255,255,255,0.3)`,
                  }}
                  animate={{ rotate: 360, scale: [1, 1.08, 1] }}
                  transition={{
                    rotate: { duration: 3, repeat: Infinity, ease: 'linear' },
                    scale: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
                  }}
                />
                {/* Orbiting particles */}
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full bg-white"
                    style={{ boxShadow: '0 0 8px rgba(255,255,255,0.9)' }}
                    animate={{
                      x: [
                        Math.cos((i / 6) * Math.PI * 2) * 90,
                        Math.cos((i / 6) * Math.PI * 2 + Math.PI * 2) * 90,
                      ],
                      y: [
                        Math.sin((i / 6) * Math.PI * 2) * 90,
                        Math.sin((i / 6) * Math.PI * 2 + Math.PI * 2) * 90,
                      ],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: 'linear',
                      delay: i * 0.1,
                    }}
                  />
                ))}
                {/* Sparkles */}
                {[
                  { top: '5%', left: '15%', d: 0 },
                  { top: '70%', left: '80%', d: 0.4 },
                  { top: '20%', left: '85%', d: 0.8 },
                  { top: '85%', left: '25%', d: 1.2 },
                ].map((s, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full bg-white"
                    style={{ top: s.top, left: s.left, boxShadow: '0 0 6px white' }}
                    animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: s.d }}
                  />
                ))}
              </motion.div>

              <motion.div
                className="mt-6 flex items-center gap-2"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.6, repeat: Infinity }}
              >
                <Wand2 className="w-3.5 h-3.5 text-neon-cyan" />
                <span className="font-label text-[11px] uppercase tracking-[0.3em] bg-gradient-to-r from-neon-violet via-neon-cyan to-neon-pink bg-clip-text text-transparent font-bold">
                  MESH is generating
                </span>
              </motion.div>
            </motion.div>
          )}

          {stage === 'output' && (
            <motion.div
              key="output"
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: -20 }}
              transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
              className="absolute inset-0 flex items-center"
            >
              <div
                className={`w-full bg-void-elevated/80 backdrop-blur border ${meta.ring} rounded-xl p-4 shadow-2xl`}
                style={{ boxShadow: `0 8px 40px ${meta.glow}` }}
              >
                <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-gradient-to-br from-void-black via-void-elevated to-void-black">
                  {example.feature === 'video' && (
                    <video
                      key={example.asset}
                      src={example.asset}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                  {example.feature === 'image' && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={example.asset}
                      alt={example.label}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                  {example.feature === '3d' && (
                    <div className="absolute inset-0">
                      <ShowcaseModel url={example.asset} speed={0.6} />
                    </div>
                  )}

                  {/* Shimmer sweep on entry */}
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
                    }}
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 1.4, ease: 'easeOut' }}
                  />

                  {/* Corner play badge */}
                  <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded bg-black/50 backdrop-blur z-10">
                    <Play className="w-2.5 h-2.5 text-neon-cyan" fill="currentColor" />
                    <span className="font-label text-[9px] uppercase tracking-widest text-void-muted">
                      {example.feature === 'video' ? 'Playing' : example.feature === '3d' ? 'Live' : 'Preview'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 px-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className={`w-3 h-3 ${meta.accent}`} />
                    <span className="font-label text-[10px] uppercase tracking-widest text-void-muted">
                      {example.label}
                    </span>
                  </div>
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                    className="font-label text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-success/15 text-success border border-success/30"
                  >
                    Ready
                  </motion.span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Interactive feature pills — click to jump */}
      <div className="flex items-center gap-2">
        {EXAMPLES.map((ex, i) => {
          const m = FEATURE_META[ex.feature];
          const active = i === exampleIdx;
          return (
            <button
              key={ex.feature}
              onClick={() => setExampleIdx(i)}
              className={`group flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                active
                  ? `${m.ring} bg-void-elevated/80`
                  : 'border-void-border/40 bg-void-elevated/30 hover:bg-void-elevated/60'
              }`}
              aria-label={`Show ${ex.label} example`}
            >
              <m.Icon
                className={`w-3.5 h-3.5 transition-colors ${
                  active ? m.accent : 'text-void-muted group-hover:text-foreground'
                }`}
              />
              <span
                className={`font-label text-[9px] uppercase tracking-widest transition-colors ${
                  active ? 'text-foreground' : 'text-void-muted'
                }`}
              >
                {ex.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
