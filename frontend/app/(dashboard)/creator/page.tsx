'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Upload,
  FileText,
  Video,
  Wand2,
  Download,
  Play,
  Plus,
  Trash2,
  Eye,
  Layers,
  Box,
  ArrowRight,
  TrendingUp,
  Clock,
  HardDrive,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { conversionAPI } from '@/lib/api';

export default function CreatorDashboard() {
  const { user } = useAuthStore();
  const [script, setScript] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stats, setStats] = useState({
    totalConversions: 0,
    thisMonth: 0,
    storageUsedMb: 0,
  });

  const projects = [
    { id: '1', name: 'AI Robot Animation', status: 'completed', thumbnail: null, duration: '0:45', createdAt: '2024-03-15' },
    { id: '2', name: 'Space Journey', status: 'processing', thumbnail: null, duration: '1:20', createdAt: '2024-03-14' },
    { id: '3', name: 'Character Walk Cycle', status: 'completed', thumbnail: null, duration: '0:30', createdAt: '2024-03-13' },
  ];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await conversionAPI.getStats();
        const data = response.data.data;
        setStats({
          totalConversions: data.total_conversions || 0,
          thisMonth: data.this_month || 0,
          storageUsedMb: data.storage_used_mb || 0,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleGenerate = async () => {
    if (!script) return;
    setIsGenerating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      alert('Animation generation started! Check your projects.');
      setScript('');
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConvert2Dto3D = async () => {
    if (!selectedFile) return;
    setIsConverting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      alert('2D to 3D conversion started! Check your projects.');
      setSelectedFile(null);
    } catch (error) {
      console.error('Conversion failed:', error);
    } finally {
      setIsConverting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-background relative">
      <div className="px-8 py-8 space-y-12">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-2"
        >
          <h2 className="text-4xl font-black font-headline tracking-tight text-foreground uppercase">
            Creator <span className="text-accent">Dashboard</span>
          </h2>
          <p className="text-muted font-medium max-w-xl">
            Welcome back, {user?.name || 'Designer'}. Your neural rendering clusters are primed and ready.
          </p>
        </motion.div>

        {/* Stat Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <motion.div variants={itemVariants} whileHover={{ scale: 1.03 }} className="bg-surface border border-border rounded-lg p-6 bloom-shadow">
            <p className="text-[10px] font-label uppercase tracking-widest text-muted mb-1">Total Renders</p>
            <h3 className="text-3xl font-headline font-bold text-accent">{stats.totalConversions}</h3>
            <div className="mt-4 flex items-center gap-2 text-accent text-xs font-label">
              <TrendingUp className="w-4 h-4" />
              <span>+12.4%</span>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} whileHover={{ scale: 1.03 }} className="bg-surface border border-border rounded-lg p-6 bloom-shadow">
            <p className="text-[10px] font-label uppercase tracking-widest text-muted mb-1">This Month</p>
            <h3 className="text-3xl font-headline font-bold text-accent">{stats.thisMonth}</h3>
            <div className="mt-4 flex items-center gap-2 text-highlight text-xs font-label">
              <Zap className="w-4 h-4" />
              <span>Active</span>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} whileHover={{ scale: 1.03 }} className="bg-surface border border-border rounded-lg p-6 bloom-shadow">
            <p className="text-[10px] font-label uppercase tracking-widest text-muted mb-1">Storage Used</p>
            <h3 className="text-3xl font-headline font-bold text-accent">
              {stats.storageUsedMb >= 1024 ? `${(stats.storageUsedMb / 1024).toFixed(1)}GB` : `${stats.storageUsedMb.toFixed(0)}MB`}
            </h3>
            <div className="mt-4 w-full h-1 bg-background rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((stats.storageUsedMb / 10240) * 100, 100)}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} whileHover={{ scale: 1.03 }} className="bg-surface border border-border rounded-lg p-6 bloom-shadow">
            <p className="text-[10px] font-label uppercase tracking-widest text-muted mb-1">Compute Hours</p>
            <h3 className="text-3xl font-headline font-bold text-accent">42.8h</h3>
            <div className="mt-4 flex items-center gap-2 text-primary text-xs font-label">
              <Clock className="w-4 h-4" />
              <span>Optimized</span>
            </div>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create Animation Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-surface border border-border rounded-lg bloom-shadow"
            >
              <div className="border-b border-border p-6">
                <h2 className="text-lg font-headline font-bold text-foreground flex items-center gap-2 uppercase tracking-tight">
                  <Wand2 className="h-5 w-5 text-primary" />
                  Create New Animation
                </h2>
              </div>
              <div className="p-6">
                <Tabs defaultValue="script" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-background border border-border">
                    <TabsTrigger value="script" className="data-[state=active]:bg-primary data-[state=active]:text-white font-label text-xs uppercase tracking-widest">
                      From Script
                    </TabsTrigger>
                    <TabsTrigger value="convert" className="data-[state=active]:bg-primary data-[state=active]:text-white font-label text-xs uppercase tracking-widest">
                      2D to 3D
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="script" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="script" className="font-label text-xs uppercase tracking-widest text-muted">
                        Animation Script
                      </Label>
                      <Textarea
                        id="script"
                        placeholder="Describe your animation... e.g., 'A robot walking through a futuristic city at sunset'"
                        className="bg-input border-border text-foreground placeholder:text-muted/40 min-h-[160px] resize-none focus:border-primary focus:ring-1 focus:ring-primary"
                        value={script}
                        onChange={(e) => setScript(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Button className="flex-1" onClick={handleGenerate} disabled={!script || isGenerating}>
                        {isGenerating ? (
                          <><Wand2 className="mr-2 h-4 w-4 animate-spin" />Generating...</>
                        ) : (
                          <><Wand2 className="mr-2 h-4 w-4" />Generate Animation</>
                        )}
                      </Button>
                      <Button variant="outline">
                        <FileText className="mr-2 h-4 w-4" />Upload
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="convert" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="file" className="font-label text-xs uppercase tracking-widest text-muted">
                        Upload 2D Image
                      </Label>
                      <div
                        className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all duration-300"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input ref={fileInputRef} type="file" className="hidden" accept="image/*,video/*" onChange={handleFileSelect} />
                        <Upload className="h-10 w-10 mx-auto mb-3 text-muted" />
                        {selectedFile ? (
                          <div>
                            <p className="text-foreground font-medium mb-1">{selectedFile.name}</p>
                            <p className="text-sm text-muted">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-foreground font-medium mb-1">Click to upload or drag and drop</p>
                            <p className="text-sm text-muted">PNG, JPG, GIF, MP4 (max. 100MB)</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button className="flex-1" onClick={handleConvert2Dto3D} disabled={!selectedFile || isConverting}>
                        {isConverting ? (
                          <><Layers className="mr-2 h-4 w-4 animate-spin" />Converting...</>
                        ) : (
                          <><Layers className="mr-2 h-4 w-4" />Quick Convert</>
                        )}
                      </Button>
                      <Link href="/creator/2d-to-3d">
                        <Button variant="outline"><Box className="mr-2 h-4 w-4" />Advanced</Button>
                      </Link>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </motion.div>

            {/* Recent Projects */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-surface border border-border rounded-lg bloom-shadow"
            >
              <div className="border-b border-border p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-headline font-bold text-foreground flex items-center gap-2 uppercase tracking-tight">
                    <Video className="h-5 w-5 text-accent" />
                    Recent Projects
                  </h2>
                  <Button variant="ghost" size="sm" className="font-label text-xs uppercase tracking-widest">
                    View All
                  </Button>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projects.map((project) => (
                    <motion.div
                      key={project.id}
                      whileHover={{ scale: 1.02 }}
                      className="bg-background border border-border rounded-lg p-4 hover:border-primary transition-all duration-300"
                    >
                      <div className="aspect-video bg-surface-high rounded-lg mb-3 flex items-center justify-center">
                        <Play className="h-10 w-10 text-primary" />
                      </div>
                      <h3 className="text-foreground font-semibold mb-2">{project.name}</h3>
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant={project.status === 'completed' ? 'success' : 'warning'}>
                          {project.status}
                        </Badge>
                        <span className="text-sm text-muted font-label">{project.duration}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" className="flex-1"><Eye className="mr-2 h-3 w-3" />View</Button>
                        <Button size="sm" variant="outline"><Download className="h-3 w-3" /></Button>
                        <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10"><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-surface border border-border rounded-lg bloom-shadow"
            >
              <div className="border-b border-border p-6">
                <h2 className="text-lg font-headline font-bold text-foreground uppercase tracking-tight">Quick Actions</h2>
              </div>
              <div className="p-6 space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="mr-2 h-4 w-4 text-primary" />New Project
                </Button>
                <Link href="/creator/2d-to-3d" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Box className="mr-2 h-4 w-4 text-accent" />2D to 3D Converter
                    <ArrowRight className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </Link>
                <Link href="/creator/animate" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Wand2 className="mr-2 h-4 w-4 text-highlight" />Text to Animation
                    <ArrowRight className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </Link>
                <Button variant="outline" className="w-full justify-start">
                  <Upload className="mr-2 h-4 w-4 text-primary" />Upload Files
                </Button>
              </div>
            </motion.div>

            {/* Tips Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-surface border-2 border-accent/30 rounded-lg p-6"
            >
              <h3 className="font-headline text-sm font-bold text-foreground mb-2 uppercase tracking-tight">Pro Tip</h3>
              <p className="text-sm text-muted mb-3">
                Use the advanced 2D to 3D converter for better control over depth estimation and mesh quality.
              </p>
              <Link href="/creator/2d-to-3d">
                <Button size="sm" className="font-label text-xs tracking-widest uppercase">
                  Try it now
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
