'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Film, ImageIcon, X, ArrowRight } from 'lucide-react';

interface NewProjectModalProps {
  open: boolean;
  onClose: () => void;
}

const OPTIONS = [
  {
    href: '/creator/2d-to-3d',
    title: '2D to 3D',
    description: 'Turn a single image into a textured 3D model.',
    icon: Box,
  },
  {
    href: '/creator/animate',
    title: 'Animate from Text',
    description: 'Generate an animated video with AI voiceover.',
    icon: Film,
  },
  {
    href: '/creator/text-to-image',
    title: 'Generate Image',
    description: 'Create a still image from a text prompt.',
    icon: ImageIcon,
  },
];

export default function NewProjectModal({ open, onClose }: NewProjectModalProps) {
  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-void-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-surface border border-border rounded-lg p-6 max-w-2xl w-full bloom-shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h2 className="font-headline text-xl font-bold text-foreground uppercase tracking-tight">
                  New Project
                </h2>
                <p className="text-sm text-muted mt-1">Pick what you want to create.</p>
              </div>
              <button
                onClick={onClose}
                className="text-muted hover:text-foreground transition-colors p-1"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
              {OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <Link
                    key={option.href}
                    href={option.href}
                    onClick={onClose}
                    className="group flex flex-col gap-3 p-5 bg-surface-high border border-border rounded-lg hover:border-primary hover:bg-background transition-all duration-200"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-headline text-sm font-bold text-foreground uppercase tracking-tight">
                        {option.title}
                      </h3>
                      <p className="text-xs text-muted mt-1 leading-relaxed">
                        {option.description}
                      </p>
                    </div>
                    <div className="flex items-center text-[10px] font-label uppercase tracking-widest text-muted group-hover:text-primary transition-colors mt-auto">
                      Open
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
