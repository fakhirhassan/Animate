'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Film, ImageIcon, Printer, Gamepad2, Glasses, ShoppingBag, Sparkles, Music, Video, Megaphone, Palette } from 'lucide-react';
import dynamic from 'next/dynamic';

const ShowcaseModel = dynamic(() => import('@/components/showcase/ShowcaseModel'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-surface-high">
      <div className="text-muted text-sm font-label tracking-widest uppercase">Loading model…</div>
    </div>
  ),
});

type TabId = '3d' | 'animation' | 'images';

const tabs: { id: TabId; label: string; icon: typeof Box }[] = [
  { id: '3d', label: '2D → 3D', icon: Box },
  { id: 'animation', label: 'Animation', icon: Film },
  { id: 'images', label: 'AI Images', icon: ImageIcon },
];

const models = [
  { url: '/showcase/3d/animate_model_61ab3ff0.glb', title: 'Character Bust', tag: 'TRELLIS' },
  { url: '/showcase/3d/animate_model_92fba1c0.glb', title: 'Stylized Asset', tag: 'TRELLIS' },
  { url: '/showcase/3d/animate_model_e2757c70.glb', title: 'Detailed Mesh', tag: 'TRELLIS' },
];

const inputImages = [
  { src: '/showcase/inputs/goku.jpg', label: 'Anime Character' },
  { src: '/showcase/inputs/goju.jpg', label: 'Action Pose' },
  { src: '/showcase/inputs/super.jpg', label: 'Hero Subject' },
  { src: '/showcase/inputs/poki.webp', label: 'Game Character' },
];

const videos = [
  { src: '/showcase/videos/animation_3151f5b7.mp4', title: 'Cinematic Clip' },
  { src: '/showcase/videos/animation_409d854c.mp4', title: 'Motion Sequence' },
  { src: '/showcase/videos/animation_476452d2.mp4', title: 'Generated Scene' },
];

const aiImages = [
  { src: '/showcase/images/ai-render-01.png', title: 'AI Render 01' },
  { src: '/showcase/images/ai-render-02.png', title: 'AI Render 02' },
  { src: '/showcase/images/ai-render-03.png', title: 'AI Render 03' },
];

const useCases3D = [
  { icon: Printer, title: '3D Printing', body: 'Export GLBs to slicers and bring AI-generated models into the real world.' },
  { icon: Gamepad2, title: 'Game Assets', body: 'Drop textured meshes straight into Unity, Unreal, or Blender pipelines.' },
  { icon: Glasses, title: 'AR / VR', body: 'PBR-textured GLBs render natively in WebXR and mobile AR viewers.' },
  { icon: ShoppingBag, title: 'Product Visualization', body: 'Turn product photos into interactive 3D for e-commerce listings.' },
];

const useCasesAnim = [
  { icon: Music, title: 'TikTok Creators', body: 'Generate short vertical clips for trending sounds — script to MP4 in minutes.' },
  { icon: Megaphone, title: 'Instagram Reels', body: 'Hook-worthy visuals for influencer content without an editing team.' },
  { icon: Video, title: 'YouTube Shorts', body: 'Story-driven explainers, script-parsed scenes, voiceover, all in one pipeline.' },
  { icon: Palette, title: 'Indie Filmmakers', body: 'Storyboard rapidly: text → animatic clips with AI voice acting.' },
];

export default function ShowcasePage() {
  const [activeTab, setActiveTab] = useState<TabId>('3d');

  return (
    <main className="min-h-screen bg-background pt-24 pb-32">
      {/* Hero */}
      <section className="relative max-w-7xl mx-auto px-6 text-center mb-16">
        <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-surface border border-border">
          <span className="font-label text-xs tracking-widest text-accent uppercase">
            Live Showcase
          </span>
        </div>
        <h1 className="font-headline font-black text-5xl md:text-7xl tracking-tighter leading-none mb-6">
          <span className="block text-foreground">Built with</span>
          <span className="block text-accent mt-2">MESH</span>
        </h1>
        <p className="max-w-2xl mx-auto text-muted text-lg">
          Real outputs from the platform — interactive 3D models, generated videos, and AI imagery.
          Spin them, watch them, see what's possible.
        </p>
      </section>

      {/* Tabs */}
      <section className="max-w-7xl mx-auto px-6 mb-12">
        <div className="flex justify-center gap-2 flex-wrap">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-label text-xs tracking-widest uppercase transition-all duration-200 border ${
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-surface text-muted border-border hover:text-foreground hover:border-primary/50'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Tab content */}
      <section className="max-w-7xl mx-auto px-6">
        <AnimatePresence mode="wait">
          {activeTab === '3d' && (
            <motion.div
              key="3d"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="font-headline text-3xl font-black uppercase tracking-tight mb-2 text-foreground">
                Interactive 3D <span className="text-accent">Models</span>
              </h2>
              <p className="text-muted mb-8">Real GLB outputs from TRELLIS — auto-rotating live previews.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                {models.map((m) => (
                  <div
                    key={m.url}
                    className="group bg-surface border border-border rounded-lg overflow-hidden hover:border-primary transition-colors duration-300"
                  >
                    <div className="aspect-square bg-gradient-to-br from-surface-high to-background pointer-events-none">
                      <ShowcaseModel url={m.url} />
                    </div>
                    <div className="p-4 flex items-center justify-between">
                      <h3 className="font-headline text-sm font-bold uppercase tracking-tight text-foreground">{m.title}</h3>
                      <span className="font-label text-[10px] tracking-widest text-accent uppercase border border-border px-2 py-1 rounded">
                        {m.tag}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="font-headline text-2xl font-black uppercase tracking-tight mb-2 text-foreground">
                Source <span className="text-accent">Inputs</span>
              </h3>
              <p className="text-muted mb-6">The kind of 2D images MESH turns into 3D.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
                {inputImages.map((img) => (
                  <div key={img.src} className="group relative aspect-square bg-surface border border-border rounded-lg overflow-hidden hover:border-primary transition-colors">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.src} alt={img.label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-3">
                      <span className="font-label text-[10px] tracking-widest uppercase text-foreground">{img.label}</span>
                    </div>
                  </div>
                ))}
              </div>

              <UseCases title="What people build with it" items={useCases3D} accent="3D" />
            </motion.div>
          )}

          {activeTab === 'animation' && (
            <motion.div
              key="animation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="font-headline text-3xl font-black uppercase tracking-tight mb-2 text-foreground">
                AI <span className="text-accent">Animations</span>
              </h2>
              <p className="text-muted mb-8">Auto-playing samples generated end-to-end through the MESH pipeline.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                {videos.map((v) => (
                  <div key={v.src} className="group bg-surface border border-border rounded-lg overflow-hidden hover:border-primary transition-colors duration-300">
                    <div className="aspect-video bg-black">
                      <video
                        src={v.src}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4 flex items-center justify-between">
                      <h3 className="font-headline text-sm font-bold uppercase tracking-tight text-foreground">{v.title}</h3>
                      <span className="font-label text-[10px] tracking-widest text-accent uppercase border border-border px-2 py-1 rounded">
                        Wan2.1
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <UseCases title="Built for creators" items={useCasesAnim} accent="Reels" />
            </motion.div>
          )}

          {activeTab === 'images' && (
            <motion.div
              key="images"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="font-headline text-3xl font-black uppercase tracking-tight mb-2 text-foreground">
                Text → <span className="text-accent">Image</span>
              </h2>
              <p className="text-muted mb-8">SDXL generations through MESH's RunPod-backed image pipeline.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {aiImages.map((img) => (
                  <div key={img.src} className="group bg-surface border border-border rounded-lg overflow-hidden hover:border-primary transition-colors duration-300">
                    <div className="aspect-square bg-surface-high overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.src} alt={img.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                    <div className="p-4 flex items-center justify-between">
                      <h3 className="font-headline text-sm font-bold uppercase tracking-tight text-foreground">{img.title}</h3>
                      <span className="font-label text-[10px] tracking-widest text-accent uppercase border border-border px-2 py-1 rounded">
                        SDXL
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </main>
  );
}

function UseCases({ title, items, accent }: { title: string; items: typeof useCases3D; accent: string }) {
  return (
    <div className="mt-12">
      <div className="flex items-center gap-3 mb-8">
        <Sparkles className="h-5 w-5 text-accent" />
        <h3 className="font-headline text-2xl font-black uppercase tracking-tight text-foreground">
          {title} <span className="text-accent">/ {accent}</span>
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((u) => {
          const Icon = u.icon;
          return (
            <div key={u.title} className="bg-surface border border-border rounded-lg p-6 hover:border-primary transition-colors">
              <Icon className="h-8 w-8 text-accent mb-4" />
              <h4 className="font-headline text-base font-bold uppercase tracking-tight text-foreground mb-2">{u.title}</h4>
              <p className="text-muted text-sm leading-relaxed">{u.body}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
