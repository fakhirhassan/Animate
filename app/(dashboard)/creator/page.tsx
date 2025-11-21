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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { projectsAPI } from '@/lib/api';

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
      // Simulate API call
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
      // Simulate API call
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
    <div className="min-h-screen pt-20 pb-12 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 gradient-mesh opacity-20"></div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Creator Dashboard
            </span>
          </h1>
          <p className="text-gray-400">
            Welcome back, {user?.name}! Let's create something amazing.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create Animation Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="glass-strong border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Wand2 className="h-5 w-5" />
                    Create New Animation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="script" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 glass">
                      <TabsTrigger value="script">From Script</TabsTrigger>
                      <TabsTrigger value="convert">2D to 3D</TabsTrigger>
                    </TabsList>

                    {/* Script to Animation */}
                    <TabsContent value="script" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="script" className="text-white">
                          Animation Script
                        </Label>
                        <Textarea
                          id="script"
                          placeholder="Describe your animation... e.g., 'A robot walking through a futuristic city at sunset'"
                          className="glass border-white/10 text-white min-h-[200px]"
                          value={script}
                          onChange={(e) => setScript(e.target.value)}
                        />
                      </div>

                      <div className="flex items-center gap-4">
                        <Button
                          className="gradient-primary flex-1"
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
                        <Button variant="outline" className="glass border-white/10">
                          <FileText className="mr-2 h-4 w-4" />
                          Upload Script
                        </Button>
                      </div>
                    </TabsContent>

                    {/* 2D to 3D Converter */}
                    <TabsContent value="convert" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="file" className="text-white">
                          Upload 2D Animation
                        </Label>
                        <div
                          className="glass border-2 border-dashed border-white/10 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500/50 transition-colors"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept="image/*,video/*"
                            onChange={handleFileSelect}
                          />
                          <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          {selectedFile ? (
                            <div>
                              <p className="text-white mb-2">{selectedFile.name}</p>
                              <p className="text-sm text-gray-400">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-white mb-2">
                                Click to upload or drag and drop
                              </p>
                              <p className="text-sm text-gray-400">
                                PNG, JPG, GIF, MP4 (max. 100MB)
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <Button
                        className="gradient-primary w-full"
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
                            Convert to 3D
                          </>
                        )}
                      </Button>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Projects */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="glass-strong border-white/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Video className="h-5 w-5" />
                      Recent Projects
                    </CardTitle>
                    <Button variant="outline" className="glass border-white/10">
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        className="glass rounded-lg p-4 border border-white/10 hover:border-purple-500/50 transition-colors"
                      >
                        <div className="aspect-video bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg mb-3 flex items-center justify-center">
                          <Play className="h-12 w-12 text-white/50" />
                        </div>
                        <h3 className="text-white font-semibold mb-2">
                          {project.name}
                        </h3>
                        <div className="flex items-center justify-between mb-3">
                          <Badge
                            className={
                              project.status === 'completed'
                                ? 'bg-green-500/20 text-green-400 border-0'
                                : 'bg-yellow-500/20 text-yellow-400 border-0'
                            }
                          >
                            {project.status}
                          </Badge>
                          <span className="text-sm text-gray-400">
                            {project.duration}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" className="flex-1 glass border-white/10">
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Button>
                          <Button size="sm" variant="outline" className="glass border-white/10">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="glass border-white/10 text-red-400">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="glass-strong border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Your Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Total Projects</span>
                    <span className="text-2xl font-bold text-white">24</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">This Month</span>
                    <span className="text-2xl font-bold text-purple-400">8</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Storage Used</span>
                    <span className="text-lg font-semibold text-white">
                      2.4 GB / 10 GB
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="gradient-primary h-2 rounded-full"
                      style={{ width: '24%' }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="glass-strong border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full justify-start glass border-white/10" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    New Project
                  </Button>
                  <Button className="w-full justify-start glass border-white/10" variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Files
                  </Button>
                  <Button className="w-full justify-start glass border-white/10" variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Templates
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
