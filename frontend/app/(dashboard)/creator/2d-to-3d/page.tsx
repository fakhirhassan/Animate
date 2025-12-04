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
    outputFormat: 'obj',
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

  // History data - starts empty, populated after real conversions
  const [history, setHistory] = useState<ConversionHistoryItem[]>([]);

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

  const performConversion = async () => {
    if (!selectedFile) return;

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', selectedFile.file);
      formData.append('output_format', settings.outputFormat);
      formData.append('quality', settings.quality);

      // Stage 1: Uploading with real progress tracking
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 30); // 0-30%
          setConversion({
            status: 'uploading',
            progress: percentComplete,
            message: `Uploading image... ${percentComplete}%`,
          });
        }
      });

      // Handle completion
      const response = await new Promise<Response>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            // Upload complete, now processing
            setConversion({
              status: 'uploading',
              progress: 30,
              message: 'Upload complete! Processing...',
            });

            // Convert XHR response to fetch Response
            resolve(new Response(xhr.responseText, {
              status: xhr.status,
              statusText: xhr.statusText,
              headers: new Headers({
                'Content-Type': 'application/json',
              }),
            }));
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.ontimeout = () => reject(new Error('Upload timed out'));

        xhr.open('POST', 'http://localhost:5001/api/convert/2d-to-3d');
        xhr.send(formData);
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Conversion failed');
      }

      const result = await response.json();

      // Stage 2: Processing stages with visual feedback
      setConversion({
        status: 'processing',
        progress: 50,
        message: 'Estimating depth map...',
      });
      await new Promise((r) => setTimeout(r, 500));

      setConversion({
        status: 'processing',
        progress: 70,
        message: 'Generating 3D mesh...',
      });
      await new Promise((r) => setTimeout(r, 500));

      setConversion({
        status: 'processing',
        progress: 90,
        message: 'Finalizing model...',
      });
      await new Promise((r) => setTimeout(r, 300));

      // Stage 3: Completed
      setConversion({
        status: 'completed',
        progress: 100,
        message: 'Conversion complete!',
      });

      // Set the download URL for the model
      if (result.success && result.data.download_url) {
        const downloadUrl = `http://localhost:5001${result.data.download_url}`;
        setModelUrl(downloadUrl);

        // Add to history
        const newHistoryItem: ConversionHistoryItem = {
          id: result.data.job_id || `history-${Date.now()}`,
          originalImage: selectedFile.preview,
          thumbnailUrl: selectedFile.preview,
          modelUrl: downloadUrl,
          fileName: selectedFile.file.name,
          format: settings.outputFormat,
          quality: settings.quality,
          createdAt: new Date(),
          fileSize: `${(selectedFile.file.size / 1024 / 1024).toFixed(2)} MB`,
        };
        setHistory((prev) => [newHistoryItem, ...prev]);
      }
    } catch (error) {
      console.error('Conversion error:', error);
      setConversion({
        status: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Conversion failed. Please try again.',
      });
    }
  };

  const handleConvert = () => {
    performConversion();
  };

  const handleDownload = () => {
    if (modelUrl) {
      window.open(modelUrl, '_blank');
    }
  };

  const handleViewHistoryItem = (item: ConversionHistoryItem) => {
    // Only set modelUrl if the item has a valid model URL
    if (item.modelUrl && item.modelUrl.length > 0) {
      setModelUrl(item.modelUrl);
      setConversion({ status: 'completed', progress: 100, message: '' });
    }
  };

  const handleDownloadHistoryItem = (item: ConversionHistoryItem) => {
    if (item.modelUrl) {
      window.open(item.modelUrl, '_blank');
    }
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const handleReset = () => {
    setConversion({ status: 'idle', progress: 0, message: '' });
    setModelUrl(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/30 to-white p-6 lg:p-8 pt-6 lg:pt-8">
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
                className="w-full h-12 gradient-button text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
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
