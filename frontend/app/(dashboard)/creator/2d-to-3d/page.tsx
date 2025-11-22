'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  Home,
  Box,
  Sparkles,
  Play,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import ImageUploader from '@/components/creator/ImageUploader';
import ConversionSettings, {
  ConversionSettingsData,
} from '@/components/creator/ConversionSettings';
import ModelViewer from '@/components/creator/ModelViewer';
import ConversionHistory, {
  ConversionHistoryItem,
} from '@/components/creator/ConversionHistory';

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
}

type ConversionStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

interface ConversionProgress {
  status: ConversionStatus;
  progress: number;
  message: string;
}

export default function TwoDToThreeDPage() {
  // State
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [settings, setSettings] = useState<ConversionSettingsData>({
    quality: 'medium',
    outputFormat: 'glb',
    withTexture: true,
    depthEstimation: 50,
    smoothness: 50,
    detailLevel: 50,
  });
  const [conversion, setConversion] = useState<ConversionProgress>({
    status: 'idle',
    progress: 0,
    message: '',
  });
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);

  // Mock history data
  const [history, setHistory] = useState<ConversionHistoryItem[]>([
    {
      id: '1',
      originalImage: '/placeholder-original.jpg',
      thumbnailUrl: '/placeholder-thumb.jpg',
      modelUrl: '/model-1.glb',
      fileName: 'character_sprite.png',
      format: 'glb',
      quality: 'high',
      createdAt: new Date(Date.now() - 3600000),
      fileSize: '2.4 MB',
    },
    {
      id: '2',
      originalImage: '/placeholder-original-2.jpg',
      thumbnailUrl: '/placeholder-thumb-2.jpg',
      modelUrl: '/model-2.glb',
      fileName: 'game_asset.jpg',
      format: 'obj',
      quality: 'medium',
      createdAt: new Date(Date.now() - 86400000),
      fileSize: '1.8 MB',
    },
  ]);

  // Handlers
  const handleFilesChange = useCallback((files: UploadedFile[]) => {
    setUploadedFiles(files);
    if (files.length > 0) {
      setSelectedFile(files[0]);
    } else {
      setSelectedFile(null);
    }
    // Reset conversion state when files change
    setConversion({ status: 'idle', progress: 0, message: '' });
    setModelUrl(null);
  }, []);

  const simulateConversion = async () => {
    if (!selectedFile) return;

    // Stage 1: Uploading
    setConversion({ status: 'uploading', progress: 0, message: 'Uploading image...' });
    await new Promise((r) => setTimeout(r, 800));
    setConversion({ status: 'uploading', progress: 30, message: 'Analyzing image...' });
    await new Promise((r) => setTimeout(r, 600));

    // Stage 2: Processing
    setConversion({
      status: 'processing',
      progress: 40,
      message: 'Estimating depth map...',
    });
    await new Promise((r) => setTimeout(r, 1000));
    setConversion({
      status: 'processing',
      progress: 60,
      message: 'Generating mesh geometry...',
    });
    await new Promise((r) => setTimeout(r, 1200));
    setConversion({
      status: 'processing',
      progress: 80,
      message: 'Applying textures...',
    });
    await new Promise((r) => setTimeout(r, 800));
    setConversion({
      status: 'processing',
      progress: 95,
      message: 'Finalizing model...',
    });
    await new Promise((r) => setTimeout(r, 500));

    // Stage 3: Completed
    setConversion({
      status: 'completed',
      progress: 100,
      message: 'Conversion complete!',
    });

    // Set mock model URL - in production this would come from the API
    setModelUrl('/models/sample.glb');

    // Add to history
    const newHistoryItem: ConversionHistoryItem = {
      id: `history-${Date.now()}`,
      originalImage: selectedFile.preview,
      thumbnailUrl: selectedFile.preview,
      modelUrl: '/models/sample.glb',
      fileName: selectedFile.file.name,
      format: settings.outputFormat,
      quality: settings.quality,
      createdAt: new Date(),
      fileSize: `${(Math.random() * 3 + 1).toFixed(1)} MB`,
    };
    setHistory((prev) => [newHistoryItem, ...prev]);
  };

  const handleConvert = () => {
    simulateConversion();
  };

  const handleDownload = () => {
    // In production, this would trigger actual file download
    console.log('Downloading model...');
  };

  const handleViewHistoryItem = (item: ConversionHistoryItem) => {
    setModelUrl(item.modelUrl);
    // Find and set the original file if available
  };

  const handleDownloadHistoryItem = (item: ConversionHistoryItem) => {
    console.log('Downloading:', item.fileName);
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const handleReset = () => {
    setConversion({ status: 'idle', progress: 0, message: '' });
    setModelUrl(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/creator"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Home className="h-4 w-4" />
              </Link>
              <ChevronRight className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900 font-medium">2D to 3D Conversion</span>
            </nav>

            {/* Page Title */}
            <div className="flex items-center gap-2">
              <Box className="h-5 w-5 text-blue-500" />
              <span className="font-semibold text-gray-900">Model Generator</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Upload & Settings */}
          <div className="lg:col-span-1 space-y-6">
            {/* Upload Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-900">Upload Images</h2>
              </div>
              <ImageUploader
                onFilesChange={handleFilesChange}
                maxFiles={5}
                maxSize={10}
              />
            </motion.div>

            {/* Settings Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Conversion Settings
              </h2>
              <ConversionSettings
                settings={settings}
                onChange={setSettings}
                disabled={conversion.status === 'processing' || conversion.status === 'uploading'}
              />
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4"
            >
              <Button
                onClick={handleConvert}
                disabled={
                  uploadedFiles.length === 0 ||
                  conversion.status === 'processing' ||
                  conversion.status === 'uploading'
                }
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium"
              >
                {conversion.status === 'uploading' || conversion.status === 'processing' ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Converting...
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-2" />
                    Convert to 3D
                  </>
                )}
              </Button>

              {conversion.status === 'completed' && (
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Convert Another
                </Button>
              )}
            </motion.div>
          </div>

          {/* Right Column - Preview & Progress */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Indicator */}
            <AnimatePresence>
              {(conversion.status === 'uploading' ||
                conversion.status === 'processing') && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                        <span className="font-medium text-gray-900">
                          {conversion.message}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {conversion.progress}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${conversion.progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success Message */}
            <AnimatePresence>
              {conversion.status === 'completed' && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-green-50 border border-green-200 rounded-2xl p-4"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-green-700 font-medium">
                      Conversion completed successfully!
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Message */}
            <AnimatePresence>
              {conversion.status === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-red-50 border border-red-200 rounded-2xl p-4"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <span className="text-red-700 font-medium">
                      {conversion.message || 'Conversion failed. Please try again.'}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Model Viewer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                3D Model Preview
              </h2>
              <ModelViewer
                modelUrl={conversion.status === 'completed' ? modelUrl : null}
                originalImage={selectedFile?.preview}
                onDownload={handleDownload}
                isLoading={
                  conversion.status === 'uploading' ||
                  conversion.status === 'processing'
                }
              />
            </motion.div>

            {/* Conversion History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
            >
              <ConversionHistory
                items={history}
                onView={handleViewHistoryItem}
                onDownload={handleDownloadHistoryItem}
                onDelete={handleDeleteHistoryItem}
              />
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
