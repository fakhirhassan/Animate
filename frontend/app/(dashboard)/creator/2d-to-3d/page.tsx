'use client';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5001';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
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
import ConversionHistory, {
  ConversionHistoryItem,
} from '@/components/creator/ConversionHistory';
import { conversionAPI } from '@/lib/api';

const ModelViewer = dynamic(() => import('@/components/creator/ModelViewer'), {
  ssr: false,
  loading: () => (
    <div className="aspect-square bg-surface-high rounded-lg overflow-hidden border border-border relative flex items-center justify-center">
      <Loader2 className="h-12 w-12 text-primary animate-spin" />
    </div>
  ),
});

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
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [settings, setSettings] = useState<ConversionSettingsData>({
    quality: 'medium',
    outputFormat: 'obj',
    withTexture: false,
  });
  const [conversion, setConversion] = useState<ConversionProgress>({
    status: 'idle',
    progress: 0,
    message: '',
  });
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [history, setHistory] = useState<ConversionHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await conversionAPI.getHistory({ limit: 10 });
        const conversions = response.data.data.conversions || [];
        const historyItems: ConversionHistoryItem[] = conversions.map((conv: any) => ({
          id: conv.id,
          originalImage: `${BACKEND_URL}${conv.original_image_url}`,
          thumbnailUrl: `${BACKEND_URL}${conv.thumbnail_url}`,
          modelUrl: `${BACKEND_URL}${conv.model_url}`,
          fileName: conv.file_name,
          format: conv.output_format,
          quality: conv.quality,
          createdAt: new Date(conv.created_at),
          fileSize: conv.file_size,
        }));
        setHistory(historyItems);
      } catch (error) {
        console.error('Failed to load conversion history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    fetchHistory();
  }, []);

  const handleFilesChange = useCallback((files: UploadedFile[]) => {
    setUploadedFiles(files);
    if (files.length > 0) {
      setSelectedFile(files[0]);
    } else {
      setSelectedFile(null);
    }
    setConversion({ status: 'idle', progress: 0, message: '' });
    setModelUrl(null);
  }, []);

  const performConversion = async () => {
    if (!selectedFile) return;
    try {
      const formData = new FormData();
      formData.append('file', selectedFile.file);
      formData.append('output_format', settings.outputFormat);
      formData.append('quality', settings.quality);

      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 30);
          setConversion({ status: 'uploading', progress: percentComplete, message: `Uploading image... ${percentComplete}%` });
        }
      });

      const response = await new Promise<Response>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setConversion({ status: 'uploading', progress: 30, message: 'Upload complete! Processing...' });
            resolve(new Response(xhr.responseText, { status: xhr.status, statusText: xhr.statusText, headers: new Headers({ 'Content-Type': 'application/json' }) }));
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.ontimeout = () => reject(new Error('Upload timed out'));
        xhr.open('POST', 'http://localhost:5001/api/convert/2d-to-3d');
        const token = localStorage.getItem('authToken');
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Conversion failed');
      }

      const result = await response.json();

      setConversion({ status: 'processing', progress: 50, message: 'Estimating depth map...' });
      await new Promise((r) => setTimeout(r, 500));
      setConversion({ status: 'processing', progress: 70, message: 'Generating 3D mesh...' });
      await new Promise((r) => setTimeout(r, 500));
      setConversion({ status: 'processing', progress: 90, message: 'Finalizing model...' });
      await new Promise((r) => setTimeout(r, 300));
      setConversion({ status: 'completed', progress: 100, message: 'Conversion complete!' });

      if (result.success && result.data.download_url) {
        const downloadUrl = `${BACKEND_URL}${result.data.download_url}`;
        setModelUrl(downloadUrl);
        try {
          const historyResponse = await conversionAPI.getHistory({ limit: 10 });
          const conversions = historyResponse.data.data.conversions || [];
          const historyItems: ConversionHistoryItem[] = conversions.map((conv: any) => ({
            id: conv.id, originalImage: `http://localhost:5001${conv.original_image_url}`,
            thumbnailUrl: `http://localhost:5001${conv.thumbnail_url}`, modelUrl: `http://localhost:5001${conv.model_url}`,
            fileName: conv.file_name, format: conv.output_format, quality: conv.quality,
            createdAt: new Date(conv.created_at), fileSize: conv.file_size,
          }));
          setHistory(historyItems);
        } catch (historyError) {
          console.error('Failed to reload history:', historyError);
        }
      }
    } catch (error) {
      console.error('Conversion error:', error);
      setConversion({ status: 'error', progress: 0, message: error instanceof Error ? error.message : 'Conversion failed. Please try again.' });
    }
  };

  const handleConvert = () => { performConversion(); };

  const handleDownload = () => {
    if (modelUrl) {
      const downloadUrl = modelUrl.includes('?') ? `${modelUrl}&download=true` : `${modelUrl}?download=true`;
      window.open(downloadUrl, '_blank');
    }
  };

  const handleViewHistoryItem = (item: ConversionHistoryItem) => {
    if (item.modelUrl && item.modelUrl.length > 0) {
      setModelUrl(item.modelUrl);
      setConversion({ status: 'completed', progress: 100, message: '' });
      setTimeout(() => {
        const viewerElement = document.getElementById('model-viewer-section');
        if (viewerElement) viewerElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  };

  const handleDownloadHistoryItem = (item: ConversionHistoryItem) => {
    if (item.modelUrl) {
      const downloadUrl = item.modelUrl.includes('?') ? `${item.modelUrl}&download=true` : `${item.modelUrl}?download=true`;
      window.open(downloadUrl, '_blank');
    }
  };

  const handleDeleteHistoryItem = async (id: string) => {
    try {
      await conversionAPI.deleteConversion(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Failed to delete conversion:', error);
      alert('Failed to delete conversion. Please try again.');
    }
  };

  const handleReset = () => {
    setConversion({ status: 'idle', progress: 0, message: '' });
    setModelUrl(null);
  };

  return (
    <div className="min-h-screen bg-background px-8 py-8 relative">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-headline font-black tracking-tight text-foreground uppercase">
          2D to 3D <span className="text-accent">Converter</span>
        </h1>
        <p className="text-muted mt-2">
          Transform your 2D images into stunning 3D models with AI
        </p>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Upload & Settings */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface border border-border rounded-lg p-6 bloom-shadow"
            >
              <h2 className="font-headline text-sm font-bold text-foreground mb-4 uppercase tracking-tight">
                Upload Images
              </h2>
              <ImageUploader onFilesChange={handleFilesChange} maxFiles={5} maxSize={10} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-surface border border-border rounded-lg p-6 bloom-shadow"
            >
              <h2 className="font-headline text-sm font-bold text-foreground mb-4 uppercase tracking-tight">
                Conversion Settings
              </h2>
              <ConversionSettings
                settings={settings}
                onChange={setSettings}
                disabled={conversion.status === 'processing' || conversion.status === 'uploading'}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-surface border border-border rounded-lg p-6 bloom-shadow space-y-4"
            >
              <Button
                onClick={handleConvert}
                disabled={uploadedFiles.length === 0 || conversion.status === 'processing' || conversion.status === 'uploading'}
                className="w-full h-12 font-headline font-bold uppercase tracking-widest"
              >
                {conversion.status === 'uploading' || conversion.status === 'processing' ? (
                  <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Converting...</>
                ) : (
                  <><Play className="h-5 w-5 mr-2" />Convert to 3D</>
                )}
              </Button>

              {conversion.status === 'completed' && (
                <Button onClick={handleReset} variant="outline" className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />Convert Another
                </Button>
              )}
            </motion.div>
          </div>

          {/* Right Column - Preview & Progress */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Indicator */}
            <AnimatePresence>
              {(conversion.status === 'uploading' || conversion.status === 'processing') && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-surface border border-border rounded-lg p-6 bloom-shadow"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 text-primary animate-spin" />
                        <span className="font-medium text-foreground">{conversion.message}</span>
                      </div>
                      <span className="text-sm text-muted font-label">{conversion.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary"
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
                  className="bg-success/10 border border-success/30 rounded-lg p-4"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <span className="text-success font-medium">Conversion completed successfully!</span>
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
                  className="bg-destructive/10 border border-destructive/30 rounded-lg p-4"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <span className="text-destructive font-medium">
                      {conversion.message || 'Conversion failed. Please try again.'}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Model Viewer */}
            <motion.div
              id="model-viewer-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-surface border border-border rounded-lg p-6 bloom-shadow"
            >
              <h2 className="font-headline text-sm font-bold text-foreground mb-4 uppercase tracking-tight">
                3D Model Preview
              </h2>
              <ModelViewer
                modelUrl={conversion.status === 'completed' ? modelUrl : null}
                originalImage={selectedFile?.preview}
                onDownload={handleDownload}
                isLoading={conversion.status === 'uploading' || conversion.status === 'processing'}
              />
            </motion.div>

            {/* Conversion History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-surface border border-border rounded-lg p-6 bloom-shadow"
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
