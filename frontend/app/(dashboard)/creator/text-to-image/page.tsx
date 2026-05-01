'use client';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5001';
const HISTORY_LIMIT = 24;

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ImageIcon,
  Loader2,
  Download,
  RefreshCw,
  Settings2,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { imageAPI, conversionAPI } from '@/lib/api';

interface ImageHistoryItem {
  id: string;
  url: string;
  prompt: string;
  createdAt: string;
}

const EXAMPLE_PROMPTS = [
  'A majestic dragon perched on a crystal mountain at sunset, digital art',
  'Futuristic cyberpunk city street at night, neon lights reflecting on wet pavement',
  'A serene Japanese zen garden with cherry blossoms, watercolor style',
  'An astronaut floating in space with Earth in the background, photorealistic',
  'A cozy coffee shop interior with warm lighting, Studio Ghibli style',
];

const RESOLUTIONS = [
  { label: '1024x1024', width: 1024, height: 1024 },
  { label: '1280x720 (Landscape)', width: 1280, height: 720 },
  { label: '720x1280 (Portrait)', width: 720, height: 1280 },
  { label: '768x768', width: 768, height: 768 },
];

export default function TextToImagePage() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [resolution, setResolution] = useState(RESOLUTIONS[0]);
  const [steps, setSteps] = useState(25);
  const [imageHistory, setImageHistory] = useState<ImageHistoryItem[]>([]);

  useEffect(() => {
    checkAvailability();
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await conversionAPI.getHistory({ limit: HISTORY_LIMIT, type: 'image' });
      const rows = response?.data?.data?.conversions || [];
      setImageHistory(
        rows.map((r: any) => ({
          id: r.id,
          url: r.model_url?.startsWith('http') ? r.model_url : `${BACKEND_URL}${r.model_url}`,
          prompt: r.settings?.prompt || r.file_name || 'Untitled',
          createdAt: r.created_at,
        }))
      );
    } catch {
      setImageHistory([]);
    }
  };

  const checkAvailability = async () => {
    try {
      const response = await imageAPI.checkGenerator();
      const data = response?.data?.data;
      setIsAvailable(data?.available || false);
      setStatusMessage(data?.message || '');
    } catch {
      setIsAvailable(false);
      setStatusMessage('Cannot connect to server');
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || prompt.length < 3) {
      setError('Please enter a prompt (at least 3 characters)');
      return;
    }

    setIsGenerating(true);
    setError('');
    setGeneratedImage(null);

    try {
      const response = await imageAPI.generate({
        prompt: prompt.trim(),
        width: resolution.width,
        height: resolution.height,
        num_inference_steps: steps,
      });

      const result = response?.data?.data;
      if (result?.image_url) {
        const fullUrl = `${BACKEND_URL}${result.image_url}`;
        setGeneratedImage(fullUrl);
        // Backend persisted the row; refetch so the new item shows up with its DB id.
        loadHistory();
      } else {
        setError('No image returned from server');
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Image generation failed. Is cloud GPU configured?';
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const a = document.createElement('a');
    a.href = generatedImage;
    a.download = `mesh_image_${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="min-h-screen p-6 lg:p-8 bg-[#0a0a1f]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <ImageIcon className="h-5 w-5 text-primary-foreground" />
            </div>
            Text to Image
          </h1>
          <p className="text-gray-400 mt-2">
            Generate high-quality images from text descriptions using AI
          </p>
          {isAvailable === false && (
            <p className="text-amber-400 text-sm mt-1">
              {statusMessage || 'Cloud GPU not configured. Add RUNPOD_API_KEY to backend/.env'}
            </p>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Prompt Input */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Describe your image
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A beautiful sunset over mountains with a river flowing through the valley..."
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 resize-none"
              />

              {/* Settings Toggle */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mt-3 transition-colors"
              >
                <Settings2 className="h-4 w-4" />
                Advanced Settings
                <ChevronDown className={`h-4 w-4 transition-transform ${showSettings ? 'rotate-180' : ''}`} />
              </button>

              {showSettings && (
                <div className="mt-4 space-y-4 pt-4 border-t border-white/10">
                  {/* Resolution */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-2">Resolution</label>
                    <div className="grid grid-cols-2 gap-2">
                      {RESOLUTIONS.map((res) => (
                        <button
                          key={res.label}
                          onClick={() => setResolution(res)}
                          className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            resolution.label === res.label
                              ? 'bg-primary/20 text-primary border border-primary/50'
                              : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {res.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Steps */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-2">
                      Quality Steps: {steps}
                    </label>
                    <input
                      type="range"
                      min={10}
                      max={50}
                      value={steps}
                      onChange={(e) => setSteps(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full mt-4 py-3 rounded-xl"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    Generate Image
                  </>
                )}
              </Button>

              {error && (
                <p className="text-red-400 text-sm mt-3">{error}</p>
              )}
            </div>

            {/* Example Prompts */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Try an example</h3>
              <div className="space-y-2">
                {EXAMPLE_PROMPTS.map((example, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(example)}
                    className="w-full text-left px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Output Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Generated Image */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 min-h-[400px] flex items-center justify-center">
              {isGenerating ? (
                <div className="text-center">
                  <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
                  <p className="text-gray-400">Generating your image...</p>
                  <p className="text-gray-500 text-sm mt-1">This may take 10-30 seconds</p>
                </div>
              ) : generatedImage ? (
                <div className="w-full">
                  <img
                    src={generatedImage}
                    alt="Generated"
                    className="w-full rounded-xl shadow-2xl"
                  />
                  <div className="flex gap-3 mt-4">
                    <Button
                      onClick={handleDownload}
                      variant="outline"
                      className="flex-1 border-white/20 text-gray-300 hover:bg-white/10"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      onClick={handleGenerate}
                      variant="outline"
                      className="flex-1 border-white/20 text-gray-300 hover:bg-white/10"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Regenerate
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <ImageIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500">Your generated image will appear here</p>
                </div>
              )}
            </div>

            {/* History */}
            {imageHistory.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Recent Generations ({imageHistory.length})</h3>
                <div className="grid grid-cols-3 gap-3">
                  {imageHistory.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => { setGeneratedImage(item.url); setPrompt(item.prompt); }}
                      className="group aspect-square rounded-lg overflow-hidden border border-white/10 hover:border-primary/50 transition-colors relative"
                      title={item.prompt}
                    >
                      <img src={item.url} alt={item.prompt} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                        <p className="text-white text-[9px] line-clamp-2 leading-tight">{item.prompt}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
