'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Play,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ImageUploader from '@/components/creator/ImageUploader';
import ConversionSettings, {
  ConversionSettingsData,
} from '@/components/creator/ConversionSettings';
import ModelViewer from '@/components/creator/ModelViewer';
import ConversionHistory, {
  ConversionHistoryItem,
} from '@/components/creator/ConversionHistory';
import { conversionAPI } from '@/lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

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

  const [jobId, setJobId] = useState<string | null>(null);

  const performConversion = async () => {
    if (!selectedFile) return;

    try {
      // Stage 1: Uploading
      setConversion({ status: 'uploading', progress: 10, message: 'Uploading image...' });

      // Call the Flask API
      const response = await conversionAPI.convert(selectedFile.file, {
        quality: settings.quality,
        outputFormat: 'obj', // Use OBJ for now as it's simpler
      });

      setConversion({ status: 'processing', progress: 50, message: 'Processing...' });

      if (response.data.success) {
        const resultJobId = response.data.data.job_id;
        setJobId(resultJobId);

        // Build the model URL
        const modelDownloadUrl = `${API_BASE_URL}/convert/download/${resultJobId}`;
        setModelUrl(modelDownloadUrl);

        setConversion({
          status: 'completed',
          progress: 100,
          message: 'Conversion complete!',
        });

        // Add to history
        const newHistoryItem: ConversionHistoryItem = {
          id: resultJobId,
          originalImage: selectedFile.preview,
          thumbnailUrl: selectedFile.preview,
          modelUrl: modelDownloadUrl,
          fileName: selectedFile.file.name,
          format: 'obj',
          quality: settings.quality,
          createdAt: new Date(),
          fileSize: response.data.data.metadata?.file_size || 'Unknown',
        };
        setHistory((prev) => [newHistoryItem, ...prev]);
      } else {
        throw new Error(response.data.message || 'Conversion failed');
      }
    } catch (error: any) {
      console.error('Conversion error:', error);
      setConversion({
        status: 'error',
        progress: 0,
        message: error.response?.data?.message || error.message || 'Conversion failed. Is the Flask server running?',
      });
    }
  };

  const handleConvert = () => {
    performConversion();
  };

  const handleDownload = async () => {
    if (!jobId) return;

    try {
      // Use the download URL with ?download=true query param
      const downloadUrl = `${API_BASE_URL}/convert/download/${jobId}?download=true`;
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `model_${jobId.slice(0, 8)}.obj`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
    }
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
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          2D to 3D Converter
        </h1>
        <p className="text-gray-500">
          Transform your 2D images into stunning 3D models with AI
        </p>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto">
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
      </div>
    </div>
  );
}
