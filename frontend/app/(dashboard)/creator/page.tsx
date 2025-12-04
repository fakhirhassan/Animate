'use client';

import { useState, useRef } from 'react';
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

export default function CreatorDashboard() {
  const { user } = useAuthStore();
  const [script, setScript] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/30 to-white p-6 lg:p-8 pt-6 lg:pt-8">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name || 'Creator'}!
          </h1>
          <p className="text-gray-500">
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
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 h-full">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-7 w-7 text-blue-600" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <div className="flex items-end justify-between">
                  <p className="text-4xl font-bold text-gray-900">24</p>
                  <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                    +12%
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -8, transition: { duration: 0.3 } }}
            className="group"
          >
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 h-full">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-7 w-7 text-blue-600" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <div className="flex items-end justify-between">
                  <p className="text-4xl font-bold text-gray-900">8</p>
                  <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                    +25%
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -8, transition: { duration: 0.3 } }}
            className="group"
          >
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 h-full">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <HardDrive className="h-7 w-7 text-blue-600" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Storage Used</p>
                <p className="text-4xl font-bold text-gray-900">2.4 GB</p>
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                    style={{ width: '24%' }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">2.4 GB of 10 GB</p>
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
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300">
                <div className="border-b border-gray-100 p-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Wand2 className="h-5 w-5 text-blue-600" />
                    Create New Animation
                  </h2>
                </div>
                <div className="p-6">
                  <Tabs defaultValue="script" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-gray-50">
                      <TabsTrigger value="script">From Script</TabsTrigger>
                      <TabsTrigger value="convert">2D to 3D</TabsTrigger>
                    </TabsList>

                    {/* Script to Animation */}
                    <TabsContent value="script" className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="script" className="text-gray-700">
                          Animation Script
                        </Label>
                        <Textarea
                          id="script"
                          placeholder="Describe your animation... e.g., 'A robot walking through a futuristic city at sunset'"
                          className="border-gray-200 min-h-[160px] resize-none rounded-xl"
                          value={script}
                          onChange={(e) => setScript(e.target.value)}
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          className="flex-1 gradient-button text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
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
                        <Button variant="outline" className="border-gray-200 rounded-xl">
                          <FileText className="mr-2 h-4 w-4" />
                          Upload
                        </Button>
                      </div>
                    </TabsContent>

                    {/* 2D to 3D Converter */}
                    <TabsContent value="convert" className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="file" className="text-gray-700">
                          Upload 2D Animation
                        </Label>
                        <div
                          className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 transition-all"
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
                              <p className="text-gray-900 font-medium mb-1">
                                {selectedFile.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-gray-900 font-medium mb-1">
                                Click to upload or drag and drop
                              </p>
                              <p className="text-sm text-gray-500">
                                PNG, JPG, GIF, MP4 (max. 100MB)
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          className="flex-1 gradient-button text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
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
                          <Button variant="outline" className="border-gray-200 rounded-xl">
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
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300">
                <div className="border-b border-gray-100 p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Video className="h-5 w-5 text-blue-600" />
                      Recent Projects
                    </h2>
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:bg-gray-100 rounded-lg">
                      View All
                    </Button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all"
                      >
                        <div className="aspect-video bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl mb-3 flex items-center justify-center">
                          <Play className="h-10 w-10 text-blue-400" />
                        </div>
                        <h3 className="text-gray-900 font-semibold mb-2">
                          {project.name}
                        </h3>
                        <div className="flex items-center justify-between mb-3">
                          <Badge
                            className={
                              project.status === 'completed'
                                ? 'bg-green-50 text-green-600 border-0 font-medium'
                                : 'bg-yellow-50 text-yellow-600 border-0 font-medium'
                            }
                          >
                            {project.status}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {project.duration}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-gray-200 rounded-lg hover:bg-gray-100"
                          >
                            <Eye className="mr-2 h-3 w-3" />
                            View
                          </Button>
                          <Button size="sm" variant="outline" className="border-gray-200 rounded-lg hover:bg-gray-100">
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-200 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50"
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
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300">
                <div className="border-b border-gray-100 p-6">
                  <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
                </div>
                <div className="p-6 space-y-2">
                  <Button
                    className="w-full justify-start border-gray-200 hover:bg-gray-50 rounded-xl"
                    variant="outline"
                  >
                    <Plus className="mr-2 h-4 w-4 text-blue-600" />
                    New Project
                  </Button>
                  <Link href="/creator/2d-to-3d" className="block">
                    <Button
                      className="w-full justify-start border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl"
                      variant="outline"
                    >
                      <Box className="mr-2 h-4 w-4" />
                      2D to 3D Converter
                      <ArrowRight className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </Link>
                  <Button
                    className="w-full justify-start border-gray-200 hover:bg-gray-50 rounded-xl"
                    variant="outline"
                  >
                    <Upload className="mr-2 h-4 w-4 text-blue-600" />
                    Upload Files
                  </Button>
                  <Button
                    className="w-full justify-start border-gray-200 hover:bg-gray-50 rounded-xl"
                    variant="outline"
                  >
                    <FileText className="mr-2 h-4 w-4 text-blue-600" />
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
              <div className="border border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Pro Tip</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Use the advanced 2D to 3D converter for better control over
                  depth estimation and mesh quality.
                </p>
                <Link href="/creator/2d-to-3d">
                  <Button size="sm" className="gradient-button text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
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
