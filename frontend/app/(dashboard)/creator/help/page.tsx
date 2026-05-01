'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/store/chatStore';

interface FAQ {
  q: string;
  a: string;
}

const FAQS: FAQ[] = [
  {
    q: 'What is MESH?',
    a: 'MESH is an AI-powered creative platform that lets you turn ideas into 3D models, animated videos, and AI-generated images. It combines several AI models — TRELLIS for 2D-to-3D, Wan2.1 for animation, SDXL for images, and Kokoro for voiceover — behind a single dashboard.',
  },
  {
    q: 'How do I convert a 2D image to a 3D model?',
    a: 'Open the 2D-to-3D page from the sidebar, drop in a clear image with a plain background, pick your output format (GLB, OBJ, or GLTF) and quality, then hit Convert. The result is saved to your Assets and stays there across server restarts.',
  },
  {
    q: 'How do I generate an animation?',
    a: 'Go to Animate, write a scene description, and choose a duration. Use Single mode for one prompt, or Multi-Scene mode to chain multiple clips with consistent characters. Voice narration is added automatically using Kokoro TTS.',
  },
  {
    q: 'How do I generate an image from text?',
    a: 'Open the Text-to-Image page, type your prompt, optionally tweak resolution and quality steps, then hit Generate. Stuck on a prompt? Click the assistant bubble in the bottom-right and switch to "Refine Prompt" mode — it will rewrite your prompt for better results.',
  },
  {
    q: 'Where do I find my generated content?',
    a: 'Everything you generate (3D models, images, videos) lives in the Assets page. You can filter by type, search by name or prompt, preview in a modal, download, or delete. Recent items also show on your dashboard.',
  },
  {
    q: 'What file formats are supported?',
    a: 'Input images: PNG, JPG, JPEG, GIF (max 100MB). Output 3D: GLB, OBJ, GLTF. Output images: PNG. Output videos: MP4. GLB is recommended for 3D — it bundles textures into a single file and works in most viewers.',
  },
  {
    q: 'Why is generation slow sometimes?',
    a: 'Heavy generation (video, high-res images) runs on RunPod cloud GPUs. The first request after idle has to wake up a GPU worker, which takes 30-60 seconds. Subsequent requests are fast. 2D-to-3D and voice generation run locally and are quick.',
  },
  {
    q: 'How do I delete or download my assets?',
    a: 'On the Assets page, hover any item to reveal preview, download, and delete buttons. Deletion removes the database record — file cleanup happens automatically. On the dashboard, each recent project also has inline download and delete actions.',
  },
];

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const setChatOpen = useChatStore((s) => s.setOpen);

  return (
    <div className="min-h-screen bg-background px-8 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-headline font-black tracking-tight text-foreground uppercase flex items-center gap-3">
            <HelpCircle className="h-8 w-8 text-accent" />
            Help <span className="text-accent">Center</span>
          </h1>
          <p className="text-muted mt-2">
            Quick answers to common questions. For anything else, ask the assistant.
          </p>
        </motion.div>

        {/* Ask Assistant CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface border-2 border-primary/30 rounded-lg p-6 mb-8 bloom-shadow"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <Bot className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h2 className="font-headline text-lg font-bold text-foreground uppercase tracking-tight mb-1">
                Ask the Assistant
              </h2>
              <p className="text-sm text-muted mb-4">
                Get instant, page-aware help. Use it to learn how features work or to refine your prompts before generating.
              </p>
              <Button onClick={() => setChatOpen(true)}>
                Open Assistant
              </Button>
            </div>
          </div>
        </motion.div>

        {/* FAQs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <h3 className="font-label text-xs uppercase tracking-widest text-muted mb-2">
            Frequently Asked
          </h3>
          {FAQS.map((faq, i) => {
            const open = openIndex === i;
            return (
              <div
                key={i}
                className="bg-surface border border-border rounded-lg overflow-hidden hover:border-primary/40 transition-colors"
              >
                <button
                  onClick={() => setOpenIndex(open ? null : i)}
                  className="w-full flex items-center justify-between text-left px-5 py-4 gap-4"
                >
                  <span className="font-medium text-foreground text-sm">{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-muted shrink-0 transition-transform duration-200 ${
                      open ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="text-sm text-muted leading-relaxed px-5 pb-4">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </motion.div>

        {/* Still stuck */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10 bg-surface-high border border-border rounded-lg p-6 text-center"
        >
          <h3 className="font-headline text-base font-bold text-foreground uppercase tracking-tight mb-2">
            Still stuck?
          </h3>
          <p className="text-sm text-muted mb-4">
            The assistant has full context on every page. Open it for personalised help.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button onClick={() => setChatOpen(true)}>
              Ask the Assistant
            </Button>
            <Link href="/creator">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
