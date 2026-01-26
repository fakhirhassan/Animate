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
    {
      id: '1',
      name: 'AI Robot Animation',
      status: 'completed',
      thumbnail: null,
      duration: '0:45',
      createdAt: '2024-03-15',
    },
    {
      id: '2',
      name: 'Space Journey',
      status: 'processing',
      thumbnail: null,
      duration: '1:20',
      createdAt: '2024-03-14',
    },
    {
      id: '3',
      name: 'Character Walk Cycle',
      status: 'completed',
      thumbnail: null,
      duration: '0:30',
      createdAt: '2024-03-13',
    },
  ];

  useEffect(() => {
    // Fetch user stats on component mount
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

  return (
    <div className="min-h-screen bg-[#0a0a1f] p-6 lg:p-8 pt-6 lg:pt-8 relative overflow-hidden">
      {/* Animated Grid Background - Same as Features page */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1a1a3e_1px,transparent_1px),linear-gradient(to_bottom,#1a1a3e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 right-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user?.name || 'Creator'}!
          </h1>
          <p className="text-gray-400">
            Let's create something amazing today.
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12"
        >
          <motion.div
            whileHover={{ y: -8, transition: { duration: 0.3 } }}
            className="group"
          >
            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 shadow-lg hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-2 transition-all duration-300 h-full">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-400">Total Projects</p>
                <div className="flex items-end justify-between">
                  <p className="text-4xl font-bold text-white">{stats.totalConversions}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -8, transition: { duration: 0.3 } }}
            className="group"
          >
            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 shadow-lg hover:shadow-2xl hover:shadow-emerald-500/20 hover:-translate-y-2 transition-all duration-300 h-full">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-7 w-7 text-white" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-400">This Month</p>
                <div className="flex items-end justify-between">
                  <p className="text-4xl font-bold text-white">{stats.thisMonth}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -8, transition: { duration: 0.3 } }}
            className="group"
          >
            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 shadow-lg hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-2 transition-all duration-300 h-full">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <HardDrive className="h-7 w-7 text-white" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-400">Storage Used</p>
                <p className="text-4xl font-bold text-white">
                  {stats.storageUsedMb >= 1024
                    ? `${(stats.storageUsedMb / 1024).toFixed(1)} GB`
                    : `${stats.storageUsedMb.toFixed(0)} MB`}
                </p>
              </div>
              <div className="mt-4">
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full"
                    style={{ width: `${Math.min((stats.storageUsedMb / 10240) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {stats.storageUsedMb >= 1024
                    ? `${(stats.storageUsedMb / 1024).toFixed(1)} GB`
                    : `${stats.storageUsedMb.toFixed(0)} MB`} of 10 GB
                </p>
              </div>
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
            >
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-lg hover:shadow-2xl transition-all duration-300">
                <div className="border-b border-white/10 p-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Wand2 className="h-5 w-5 text-blue-400" />
                    Create New Animation
                  </h2>
                </div>
                <div className="p-6">
                  <Tabs defaultValue="script" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10">
                      <TabsTrigger value="script" className="text-gray-400 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white">From Script</TabsTrigger>
                      <TabsTrigger value="convert" className="text-gray-400 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white">2D to 3D</TabsTrigger>
                    </TabsList>

                    {/* Script to Animation */}
                    <TabsContent value="script" className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="script" className="text-gray-300">
                          Animation Script
                        </Label>
                        <Textarea
                          id="script"
                          placeholder="Describe your animation... e.g., 'A robot walking through a futuristic city at sunset'"
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 min-h-[160px] resize-none rounded-xl focus:border-blue-500"
                          value={script}
                          onChange={(e) => setScript(e.target.value)}
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          className="flex-1 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                          onClick={handleGenerate}
                          disabled={!script || isGenerating}
                        >
                          {isGenerating ? (
                            <>
                              <Wand2 className="mr-2 h-4 w-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Wand2 className="mr-2 h-4 w-4" />
                              Generate Animation
                            </>
                          )}
                        </Button>
                        <Button className="bg-white/10 hover:bg-white/20 text-white border-2 border-white/30 hover:border-white/50 rounded-xl transition-all duration-300">
                          <FileText className="mr-2 h-4 w-4" />
                          Upload
                        </Button>
                      </div>
                    </TabsContent>

                    {/* 2D to 3D Converter */}
                    <TabsContent value="convert" className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="file" className="text-gray-300">
                          Upload 2D Animation
                        </Label>
                        <div
                          className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500/50 hover:bg-white/5 transition-all"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept="image/*,video/*"
                            onChange={handleFileSelect}
                          />
                          <Upload className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                          {selectedFile ? (
                            <div>
                              <p className="text-white font-medium mb-1">
                                {selectedFile.name}
                              </p>
                              <p className="text-sm text-gray-400">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-white font-medium mb-1">
                                Click to upload or drag and drop
                              </p>
                              <p className="text-sm text-gray-400">
                                PNG, JPG, GIF, MP4 (max. 100MB)
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          className="flex-1 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                          onClick={handleConvert2Dto3D}
                          disabled={!selectedFile || isConverting}
                        >
                          {isConverting ? (
                            <>
                              <Layers className="mr-2 h-4 w-4 animate-spin" />
                              Converting...
                            </>
                          ) : (
                            <>
                              <Layers className="mr-2 h-4 w-4" />
                              Quick Convert
                            </>
                          )}
                        </Button>
                        <Link href="/creator/2d-to-3d">
                          <Button className="bg-white/10 hover:bg-white/20 text-white border-2 border-white/30 hover:border-white/50 rounded-xl transition-all duration-300">
                            <Box className="mr-2 h-4 w-4" />
                            Advanced
                          </Button>
                        </Link>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </motion.div>

            {/* Recent Projects */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-lg hover:shadow-2xl transition-all duration-300">
                <div className="border-b border-white/10 p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Video className="h-5 w-5 text-blue-400" />
                      Recent Projects
                    </h2>
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:bg-white/10 hover:text-white rounded-lg">
                      View All
                    </Button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-blue-500/30 hover:shadow-sm transition-all"
                      >
                        <div className="aspect-video bg-gradient-to-br from-blue-500/20 to-emerald-500/20 rounded-xl mb-3 flex items-center justify-center">
                          <Play className="h-10 w-10 text-blue-400" />
                        </div>
                        <h3 className="text-white font-semibold mb-2">
                          {project.name}
                        </h3>
                        <div className="flex items-center justify-between mb-3">
                          <Badge
                            className={
                              project.status === 'completed'
                                ? 'bg-green-500/20 text-green-400 border-0 font-medium'
                                : 'bg-yellow-500/20 text-yellow-400 border-0 font-medium'
                            }
                          >
                            {project.status}
                          </Badge>
                          <span className="text-sm text-gray-400">
                            {project.duration}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white rounded-lg shadow-md transition-all duration-300"
                          >
                            <Eye className="mr-2 h-3 w-3" />
                            View
                          </Button>
                          <Button size="sm" className="bg-white/10 hover:bg-white/20 text-white border-2 border-white/30 hover:border-white/50 rounded-lg transition-all duration-300">
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 border-2 border-red-500/30 hover:border-red-500/50 rounded-lg transition-all duration-300"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar - Quick Actions */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-lg hover:shadow-2xl transition-all duration-300">
                <div className="border-b border-white/10 p-6">
                  <h2 className="text-lg font-bold text-white">Quick Actions</h2>
                </div>
                <div className="p-6 space-y-2">
                  <Button
                    className="w-full justify-start bg-white/10 hover:bg-white/20 text-white border-2 border-white/30 hover:border-white/50 rounded-xl transition-all duration-300"
                  >
                    <Plus className="mr-2 h-4 w-4 text-blue-400" />
                    New Project
                  </Button>
                  <Link href="/creator/2d-to-3d" className="block">
                    <Button
                      className="w-full justify-start bg-gradient-to-r from-blue-500/20 to-emerald-500/20 hover:from-blue-500/30 hover:to-emerald-500/30 text-white border-2 border-blue-500/30 hover:border-blue-500/50 rounded-xl transition-all duration-300"
                    >
                      <Box className="mr-2 h-4 w-4 text-blue-400" />
                      2D to 3D Converter
                      <ArrowRight className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </Link>
                  <Button
                    className="w-full justify-start bg-white/10 hover:bg-white/20 text-white border-2 border-white/30 hover:border-white/50 rounded-xl transition-all duration-300"
                  >
                    <Upload className="mr-2 h-4 w-4 text-blue-400" />
                    Upload Files
                  </Button>
                  <Button
                    className="w-full justify-start bg-white/10 hover:bg-white/20 text-white border-2 border-white/30 hover:border-white/50 rounded-xl transition-all duration-300"
                  >
                    <FileText className="mr-2 h-4 w-4 text-blue-400" />
                    Templates
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Tips Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="border border-blue-500/30 bg-gradient-to-br from-blue-500/20 to-emerald-500/20 bg-white/5 backdrop-blur-sm rounded-2xl p-6">
                <h3 className="font-semibold text-white mb-2">Pro Tip</h3>
                <p className="text-sm text-gray-300 mb-3">
                  Use the advanced 2D to 3D converter for better control over
                  depth estimation and mesh quality.
                </p>
                <Link href="/creator/2d-to-3d">
                  <Button size="sm" className="bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                    Try it now
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
